import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { fetchStudentsFromDB } from '../../api/supabase';

export const TeacherAttendance = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const loadStudents = async () => {
      const { data } = await fetchStudentsFromDB();
      if (data) {
        // Filter only SEC B for this mock review page since DSP SEC B is the one in "REVIEW" state
        setStudents(data.filter((s: any) => s.section === 'SEC B'));
      }
    };
    loadStudents();
  }, []);

  // Mock attendance state for the students
  const [attendanceState, setAttendanceState] = useState<Record<string, 'present' | 'absent' | 'exception'>>({});

  useEffect(() => {
    if (students.length > 0 && Object.keys(attendanceState).length === 0) {
      const newState: Record<string, 'present' | 'absent' | 'exception'> = {};
      students.forEach((s, i) => {
        if (i === 3 || i === 7) newState[s.id] = 'exception';
        else if (i % 5 === 0) newState[s.id] = 'absent';
        else newState[s.id] = 'present';
      });
      setAttendanceState(newState);
    }
  }, [students]);

  const stats = {
    total: students.length,
    present: Object.values(attendanceState).filter(s => s === 'present').length,
    absent: Object.values(attendanceState).filter(s => s === 'absent').length,
    exceptions: Object.values(attendanceState).filter(s => s === 'exception').length,
  };

  const handleConfirm = () => {
    // In a real app, send attendance to DB here
    setConfirmed(true);
    setTimeout(() => {
      navigate('/teacher');
    }, 2000);
  };

  const updateStatus = (id: string, status: 'present' | 'absent') => {
    setAttendanceState(prev => ({ ...prev, [id]: status }));
  };

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
      <div className="bg-white p-6 rounded-[16px] border border-[#E5E7EB] shadow-sm">
        <h2 className="text-[20px] font-semibold text-[#111827]">Digital Signal Processing</h2>
        <div className="flex flex-wrap items-center gap-2 text-[14px] text-[#667085] mt-2">
          <span className="font-medium text-[#111827]">Section B</span>
          <span className="w-1 h-1 rounded-full bg-[#E5E7EB]"></span>
          <span>RDB-06</span>
          <span className="w-1 h-1 rounded-full bg-[#E5E7EB]"></span>
          <span>10:20 AM – 12:20 PM</span>
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

    </div>
  );
};
