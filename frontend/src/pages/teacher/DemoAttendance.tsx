import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const DemoAttendance = ({ demoSessionId }: { demoSessionId: string }) => {
  const navigate = useNavigate();
  
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceState, setAttendanceState] = useState<Record<string, 'present' | 'absent' | 'exception'>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const loadDemoData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Load session
        await fetch(`/api/demo/session/${demoSessionId}/stats`, { headers });

        // Load roster
        const rosterRes = await fetch(`/api/demo/session/${demoSessionId}/roster`, { headers });
        const rosterData = await rosterRes.json();
        
        // Load demo attendance decisions
        const attRes = await fetch(`/api/demo/session/${demoSessionId}/attendance`, { headers });
        const attData = await attRes.json();

        setStudents(rosterData.roster.map((r: any) => r.students));
        
        const newState: Record<string, 'present' | 'absent' | 'exception'> = {};
        attData.attendance.forEach((a: any) => {
          if (a.ai_decision === 'PRESENT') newState[a.student_id] = 'present';
          else if (a.ai_decision === 'MAYBE') newState[a.student_id] = 'exception';
          else newState[a.student_id] = 'absent';
        });

        // Set missing to absent
        rosterData.roster.forEach((r: any) => {
          if (!newState[r.student_id]) newState[r.student_id] = 'absent';
        });
        
        setAttendanceState(newState);

      } catch (err) {
        console.error(err);
      }
    };
    loadDemoData();
  }, [demoSessionId]);

  const stats = {
    total: students.length,
    present: Object.values(attendanceState).filter(s => s === 'present').length,
    absent: Object.values(attendanceState).filter(s => s === 'absent').length,
    exceptions: Object.values(attendanceState).filter(s => s === 'exception').length,
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        decisions: Object.keys(attendanceState).map(student_id => ({
          student_id,
          decision: attendanceState[student_id].toUpperCase()
        }))
      };
      
      const res = await fetch(`/api/demo/session/${demoSessionId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setConfirmed(true);
        setTimeout(() => {
          navigate('/teacher');
        }, 2000);
      } else {
        alert('Failed to confirm demo attendance');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStatus = (id: string, status: 'present' | 'absent') => {
    setAttendanceState(prev => ({ ...prev, [id]: status }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <button 
          onClick={() => navigate('/teacher')}
          className="flex items-center gap-2 text-[14px] font-medium text-[#667085] hover:text-[#111827] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <h1 className="text-[32px] font-semibold text-[#111827] tracking-tight">Review AI Demo Attendance</h1>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 flex items-center justify-between shadow-sm">
        <div>
          <h2 className="text-[20px] font-semibold text-[#111827] mb-1">SEC B</h2>
          <div className="flex items-center gap-2 text-[14px] text-[#667085]">
            <span>RDB 6</span>
            <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" />
            <span>AI Camera Demo</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-900', bg: 'bg-gray-50' },
          { label: 'Present', value: stats.present, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Absent', value: stats.absent, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Needs Review', value: stats.exceptions, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} p-4 rounded-2xl border border-transparent`}>
            <div className="text-[13px] font-medium text-[#667085] mb-1">{stat.label}</div>
            <div className={`text-[24px] font-semibold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[#E5E7EB] bg-[#F9FAFB]">
          <h3 className="text-[14px] font-semibold text-[#111827]">Student Roster</h3>
        </div>
        
        <div className="divide-y divide-[#E5E7EB]">
          {students.map((student) => {
            const status = attendanceState[student.id];
            
            return (
              <div key={student.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F9FAFB] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#F3F4F6] text-[#4B5563] flex items-center justify-center text-[14px] font-medium border border-[#E5E7EB]">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-[15px] font-medium text-[#111827]">{student.name}</div>
                    <div className="text-[13px] text-[#667085]">{student.roll_number}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {status === 'exception' ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl border border-amber-200">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="text-[13px] font-medium text-amber-700 mr-2">Low Confidence</span>
                      <button 
                        onClick={() => updateStatus(student.id, 'present')}
                        className="px-3 py-1.5 bg-white border border-amber-200 text-emerald-700 text-[13px] font-medium rounded-lg hover:bg-emerald-50 transition-colors"
                      >
                        Mark Present
                      </button>
                      <button 
                        onClick={() => updateStatus(student.id, 'absent')}
                        className="px-3 py-1.5 bg-white border border-amber-200 text-red-700 text-[13px] font-medium rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Mark Absent
                      </button>
                    </div>
                  ) : (
                    <div className="flex bg-[#F3F4F6] p-1 rounded-xl">
                      <button
                        onClick={() => updateStatus(student.id, 'present')}
                        className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-[10px] transition-all ${
                          status === 'present' 
                            ? 'bg-white text-emerald-700 shadow-sm border border-[#E5E7EB]' 
                            : 'text-[#667085] hover:text-[#111827]'
                        }`}
                      >
                        {status === 'present' && <Check className="w-4 h-4" />}
                        Present
                      </button>
                      <button
                        onClick={() => updateStatus(student.id, 'absent')}
                        className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-[10px] transition-all ${
                          status === 'absent' 
                            ? 'bg-white text-red-700 shadow-sm border border-[#E5E7EB]' 
                            : 'text-[#667085] hover:text-[#111827]'
                        }`}
                      >
                        {status === 'absent' && <X className="w-4 h-4" />}
                        Absent
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleConfirm}
          disabled={stats.exceptions > 0 || isSubmitting || confirmed}
          className="flex items-center gap-2 px-6 py-3 bg-[#0B65FE] text-white rounded-xl text-[14px] font-medium hover:bg-[#004BCC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {confirmed ? (
            <><CheckCircle2 className="w-5 h-5" /> Confirmed Successfully</>
          ) : (
            <>{stats.exceptions > 0 ? 'Resolve exceptions first' : 'Confirm Demo Attendance'}</>
          )}
        </button>
      </div>
    </div>
  );
};
