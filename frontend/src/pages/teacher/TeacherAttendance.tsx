import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Check, X, AlertTriangle, CheckCircle2, Camera } from 'lucide-react';
import { fetchStudentsFromDB, confirmAttendance } from '../../api/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from '../../components/ui/Modal';
import { QRCodeSVG } from 'qrcode.react';
import { DemoAttendance } from './DemoAttendance';

export const TeacherAttendance = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [students, setStudents] = useState<any[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraSession, setCameraSession] = useState<{ token: string, status: string } | null>(null);
  const [polling, setPolling] = useState(false);
  
  const demoSessionId = location.state?.demoSessionId;
  const cls = location.state?.class;

  if (demoSessionId) {
    return <DemoAttendance demoSessionId={demoSessionId} />;
  }

  useEffect(() => {
    if (!cls) {
      navigate('/teacher');
      return;
    }

    const loadStudents = async () => {
      const { data } = await fetchStudentsFromDB();
      if (data) {
        setStudents(data.filter((s: any) => s.section === cls.section));
      }
    };
    loadStudents();
  }, [cls, navigate]);

  const { user } = useAuth();
  
  // Real attendance state
  const [attendanceState, setAttendanceState] = useState<Record<string, 'present' | 'absent' | 'exception'>>({});
  const [, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (students.length > 0 && Object.keys(attendanceState).length === 0) {
      const newState: Record<string, 'present' | 'absent' | 'exception'> = {};
      const session = cls?.attendance_sessions?.[0];
      const records = session?.attendance_records || [];

      students.forEach((s) => {
        const record = records.find((r: any) => r.student_id === s.id);
        if (record) {
          if (record.status === 'present') newState[s.id] = 'present';
          else if (record.status === 'needs_review') newState[s.id] = 'exception';
          else newState[s.id] = 'absent';
        } else {
          // Default to absent pending confirmation
          newState[s.id] = 'absent';
        }
      });
      setAttendanceState(newState);
    }
  }, [students, cls]);

  const stats = {
    total: students.length,
    present: Object.values(attendanceState).filter(s => s === 'present').length,
    absent: Object.values(attendanceState).filter(s => s === 'absent').length,
    exceptions: Object.values(attendanceState).filter(s => s === 'exception').length,
  };

  const handleConfirm = async () => {
    if (!cls?.attendance_sessions?.[0]?.id || !user?.id) return;
    setIsSubmitting(true);
    const records = Object.keys(attendanceState).map(student_id => ({
      student_id,
      status: attendanceState[student_id]
    }));
    
    const { error } = await confirmAttendance(cls.attendance_sessions[0].id, records, user.id);
    setIsSubmitting(false);
    
    if (!error) {
      setConfirmed(true);
      setTimeout(() => {
        navigate('/teacher');
      }, 2000);
    } else {
      console.error(error);
      alert('Failed to confirm attendance');
    }
  };

  const updateStatus = (id: string, status: 'present' | 'absent') => {
    setAttendanceState(prev => ({ ...prev, [id]: status }));
  };

  const startCameraAttendance = async () => {
    setCameraModalOpen(true);
    setCameraSession(null);
    try {
      const API_BASE = import.meta.env.VITE_CAMERA_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_BASE}/api/camera/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          timetable_id: cls.id,
          subject_id: cls.subject_id 
        })
      });
      const data = await res.json();
      if (data.token) {
        setCameraSession({ token: data.token, status: 'active' });
        setPolling(true);
      }
    } catch (err) {
      console.error("Failed to start camera session", err);
    }
  };

  useEffect(() => {
    let interval: any;
    if (polling && cameraSession?.token) {
      interval = setInterval(async () => {
        try {
          const API_BASE = import.meta.env.VITE_CAMERA_API_URL || 'http://localhost:8000';
          const res = await fetch(`${API_BASE}/api/camera/session/${cameraSession.token}/status`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'completed') {
              setPolling(false);
              setCameraSession(prev => prev ? { ...prev, status: 'completed' } : null);
              
              // Update local state based on camera observations
              if (data.camera_observations && data.camera_observations.length > 0) {
                const newState = { ...attendanceState };
                data.camera_observations.forEach((obs: any) => {
                  if (obs.student_id && obs.status === 'verified') {
                    newState[obs.student_id] = 'present';
                  }
                });
                setAttendanceState(newState);
              }
            }
          }
        } catch (err) {
          console.error(err);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [polling, cameraSession?.token, attendanceState]);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Back & Header */}
      <div>
        <button 
          onClick={() => navigate('/teacher')}
          className="flex items-center gap-2 text-[14px] font-medium text-[#667085] hover:text-[#111827] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <h1 className="text-[32px] font-semibold text-[#111827] tracking-tight">Review Attendance</h1>
      </div>

      {/* Class Details */}
      {cls && (
        <div className="bg-white p-6 rounded-[16px] border border-[#E5E7EB] shadow-sm">
          <h2 className="text-[20px] font-semibold text-[#111827]">{cls.subjects?.subject_name}</h2>
          <div className="flex flex-wrap items-center gap-2 text-[14px] text-[#667085] mt-2">
            <span className="font-medium text-[#111827]">{cls.section}</span>
            <span className="w-1 h-1 rounded-full bg-[#E5E7EB]"></span>
            <span>{cls.room}</span>
            <span className="w-1 h-1 rounded-full bg-[#E5E7EB]"></span>
            <span>{cls.start_time} – {cls.end_time}</span>
          </div>

        <div className="flex gap-6 mt-6 pt-6 border-t border-[#E5E7EB]">
          <div>
            <div className="text-[24px] font-semibold text-[#111827] leading-none">{stats.total}</div>
            <div className="text-[12px] font-medium text-[#667085] uppercase tracking-wider mt-1">Students</div>
          </div>
          <div className="w-[1px] bg-[#E5E7EB]"></div>
          <div>
            <div className="text-[24px] font-semibold text-[#065F46] leading-none">{stats.present}</div>
            <div className="text-[12px] font-medium text-[#667085] uppercase tracking-wider mt-1">Present</div>
          </div>
          <div className="w-[1px] bg-[#E5E7EB]"></div>
          <div>
            <div className="text-[24px] font-semibold text-[#991B1B] leading-none">{stats.absent}</div>
            <div className="text-[12px] font-medium text-[#667085] uppercase tracking-wider mt-1">Absent</div>
          </div>
          {stats.exceptions > 0 && (
            <>
              <div className="w-[1px] bg-[#E5E7EB]"></div>
              <div>
                <div className="text-[24px] font-semibold text-[#D97706] leading-none">{stats.exceptions}</div>
                <div className="text-[12px] font-medium text-[#667085] uppercase tracking-wider mt-1">Exceptions</div>
              </div>
            </>
          )}
        </div>
        
      </div>
      )}

      {/* Student List */}
      <div className="bg-white rounded-[16px] border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="divide-y divide-[#E5E7EB]">
          {students.map(student => {
            const status = attendanceState[student.id];
            
            return (
              <div key={student.id} className={`p-4 flex items-center justify-between transition-colors ${status === 'exception' ? 'bg-[#FFFBEB]' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="w-8 flex justify-center">
                    {status === 'present' && <Check className="w-5 h-5 text-[#10B981]" strokeWidth={3} />}
                    {status === 'absent' && <X className="w-5 h-5 text-[#EF4444]" strokeWidth={3} />}
                    {status === 'exception' && <AlertTriangle className="w-5 h-5 text-[#F59E0B]" strokeWidth={2.5} />}
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-[#111827] uppercase">{student.name}</div>
                    <div className="text-[13px] text-[#667085] font-mono">{student.roll_number}</div>
                  </div>
                </div>

                {status === 'exception' && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => updateStatus(student.id, 'present')}
                      className="px-3 py-1.5 bg-[#D1FAE5] text-[#065F46] rounded-[6px] text-[12px] font-medium hover:bg-[#A7F3D0] transition-colors"
                    >
                      Mark Present
                    </button>
                    <button 
                      onClick={() => updateStatus(student.id, 'absent')}
                      className="px-3 py-1.5 bg-[#FEE2E2] text-[#991B1B] rounded-[6px] text-[12px] font-medium hover:bg-[#FECACA] transition-colors"
                    >
                      Mark Absent
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation */}
      <div className="pt-4">
        {confirmed ? (
          <div className="flex items-center justify-center gap-3 h-12 bg-[#D1FAE5] text-[#065F46] rounded-[10px] font-medium text-[15px] animate-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-5 h-5" /> Attendance confirmed successfully. Redirecting...
          </div>
        ) : (
          <button 
            onClick={handleConfirm}
            disabled={stats.exceptions > 0}
            className={`w-full h-12 rounded-[10px] font-medium text-[15px] transition-colors ${
              stats.exceptions > 0 
                ? 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed' 
                : 'bg-[#0B65FE] text-white hover:bg-[#004BCC]'
            }`}
          >
            {stats.exceptions > 0 ? 'Resolve exceptions before confirming' : 'Confirm Attendance'}
          </button>
        )}
      </div>

      {/* Camera Modal */}
      <Modal 
        isOpen={cameraModalOpen} 
        onClose={() => {
          setCameraModalOpen(false);
          setPolling(false);
        }}
        title="Live Camera Attendance"
      >
        <div className="flex flex-col items-center justify-center p-4">
          {!cameraSession ? (
            <div className="py-12 flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-[#0B65FE] border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-[#667085] font-medium">Initializing camera session...</p>
            </div>
          ) : cameraSession.status === 'completed' ? (
            <div className="py-12 flex flex-col items-center text-center animate-in zoom-in-95">
              <div className="w-16 h-16 bg-[#D1FAE5] rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
              </div>
              <h3 className="text-[20px] font-bold text-[#111827]">Scan Complete</h3>
              <p className="text-[#667085] mt-2">The camera has processed the classroom.</p>
              <button 
                onClick={() => setCameraModalOpen(false)}
                className="mt-6 px-6 py-2 bg-[#0B65FE] text-white rounded-[8px] font-medium"
              >
                Review Attendance
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <p className="text-center text-[#667085] mb-6 max-w-sm">
                Scan this QR code with the classroom phone to temporarily turn it into a smart attendance camera.
              </p>
              
              <div className="p-4 bg-white rounded-[16px] shadow-sm border border-[#E5E7EB]">
                <QRCodeSVG 
                  value={`${window.location.origin}/camera/${cameraSession.token}`}
                  size={200}
                  level="H"
                />
              </div>
              
              <div className="mt-6 px-4 py-3 bg-[#F3F4F6] rounded-[8px] flex items-center gap-3 w-full">
                <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></div>
                <span className="text-[14px] font-medium text-[#111827]">Waiting for camera feed...</span>
              </div>
              
              <div className="mt-4 text-[12px] text-center text-[#667085]">
                <p>Or open this link on the phone:</p>
                <a href={`${window.location.origin}/camera/${cameraSession.token}`} target="_blank" rel="noreferrer" className="text-[#0B65FE] break-all hover:underline mt-1 block">
                  {window.location.origin}/camera/{cameraSession.token}
                </a>
              </div>
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
};
