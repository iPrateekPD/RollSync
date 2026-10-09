import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, CheckCircle2, Clock, CalendarDays } from 'lucide-react';
import { fetchStudentsFromDB, fetchTodayClasses } from '../../api/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from '../../components/ui/Modal';
import { QRCodeSVG } from 'qrcode.react';

export const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [selectedSection, setSelectedSection] = useState('SEC A');
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoSession, setDemoSession] = useState<any>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    const loadStudents = async () => {
      const { data } = await fetchStudentsFromDB();
      if (data) setStudents(data);
    };
    loadStudents();
  }, []);

  useEffect(() => {
    const loadClasses = async () => {
      if (user) {
        setIsLoadingClasses(true);
        const teacherName = user.firstName ? `${user.firstName} ${user.lastName}` : (user.email || 'Dr. Jitendra Kumar');
        const { data } = await fetchTodayClasses(teacherName);
        if (data && data.classes) {
          // Process classes to determine continuous classes
          const processedClasses = data.classes.map((cls: any, index: number, arr: any[]) => {
            return {
              ...cls,
              continuous: arr[index + 1]?.subject_id === cls.subject_id
            };
          });
          
          // Filter out the second half of continuous classes so they don't appear twice
          const filteredClasses = processedClasses.filter((cls: any, index: number, arr: any[]) => {
            if (index > 0 && arr[index - 1].subject_id === cls.subject_id && arr[index - 1].continuous) {
              return false;
            }
            return true;
          });
          
          // Fix end_time for continuous classes
          filteredClasses.forEach((cls: any) => {
            if (cls.continuous) {
              const originalIndex = processedClasses.findIndex((p: any) => p.id === cls.id);
              if (processedClasses[originalIndex + 1]) {
                cls.end_time = processedClasses[originalIndex + 1].end_time;
              }
            }
          });
          
          setClasses(filteredClasses);
        }
        setIsLoadingClasses(false);
      }
    };
    loadClasses();
  }, [user]);

  const filteredStudents = students.filter(s => {
    const matchesSection = s.section === selectedSection;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.roll_number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSection && matchesSearch;
  });

  const getAttendancePercent = (roll: string) => {
    const num = parseInt(roll.replace(/[^0-9]/g, '') || '0');
    return (75 + (num % 25)).toFixed(1);
  };

  const startDemo = async (cls: any) => {
    setDemoLoading(true);
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
      if (res.ok) {
        setDemoSession(data);
        setDemoModalOpen(true);
      } else {
        console.error("Failed to start demo", data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDemoLoading(false);
    }
  };

  const getStatusDisplay = (cls: any) => {
    switch (cls.status) {
      case 'UPCOMING':
        return (
          <div className="flex items-center gap-2 mt-4 text-[13px] font-medium text-[#667085]">
            <Clock className="w-4 h-4" /> UPCOMING
          </div>
        );
      case 'LIVE':
        return (
          <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
            <div className="flex items-center gap-2 text-[13px] font-medium text-[#EF4444] animate-pulse mb-3">
              <div className="w-2 h-2 rounded-full bg-[#EF4444]" /> LIVE
            </div>
            <button 
              onClick={() => startDemo(cls)}
              disabled={demoLoading}
              className="w-full flex items-center justify-center gap-2 h-10 bg-[#0B65FE] text-white rounded-[8px] text-[13px] font-medium hover:bg-[#004BCC] transition-colors disabled:opacity-50"
            >
              START AI CAMERA DEMO
            </button>
          </div>
        );
      case 'REVIEW':
        return (
          <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
            <div className="flex items-center justify-between text-[13px] mb-3">
              <span className="text-[#065F46] font-medium">{cls.present} Present</span>
              <span className="text-[#991B1B] font-medium">{cls.absent} Absent</span>
            </div>
            <button 
              onClick={() => navigate('/teacher/attendance', { state: { class: cls } })}
              className="w-full flex items-center justify-center gap-2 h-10 bg-[#0B65FE] text-white rounded-[8px] text-[13px] font-medium hover:bg-[#004BCC] transition-colors"
            >
              REVIEW ATTENDANCE <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        );
      case 'CONFIRMED':
        return (
          <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
            <div className="flex items-center justify-between text-[13px] mb-3">
              <span className="text-[#065F46] font-medium">{cls.present} Present</span>
              <span className="text-[#991B1B] font-medium">{cls.absent} Absent</span>
            </div>
            <div className="flex items-center justify-center gap-2 h-10 text-[13px] font-medium text-[#10B981]">
              <CheckCircle2 className="w-4 h-4" /> CONFIRMED
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-semibold text-[#111827] tracking-tight">Today's Classes</h1>
        <p className="mt-2 text-[15px] text-[#667085]">{currentDate}</p>
      </div>

      {/* Classes Row */}
      {isLoadingClasses ? (
        <div className="h-40 flex items-center justify-center bg-white rounded-[16px] border border-[#E5E7EB]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B65FE]"></div>
        </div>
      ) : classes.length === 0 ? (
        <div className="h-40 flex flex-col items-center justify-center bg-white rounded-[16px] border border-[#E5E7EB] text-[#667085]">
          <CalendarDays className="w-8 h-8 mb-2 opacity-50" />
          <p>No classes assigned for you today.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white p-6 rounded-[16px] border border-[#E5E7EB] shadow-sm flex flex-col">
              <div className="text-[13px] font-medium text-[#0B65FE] mb-2">{cls.start_time} – {cls.end_time}</div>
              <h2 className="text-[18px] font-semibold text-[#111827] leading-tight mb-1">{cls.subjects?.subject_name}</h2>
              
              {cls.continuous && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F3F4F6] text-[11px] font-medium text-[#667085] mb-3 self-start">
                  <Clock className="w-3 h-3" /> Continuous Class
                </div>
              )}
              
              <div className="flex items-center gap-2 text-[13px] text-[#667085] mt-auto">
                <span className="font-medium text-[#111827]">{cls.section}</span>
                <span className="w-1 h-1 rounded-full bg-[#E5E7EB]"></span>
                <span>{cls.room}</span>
              </div>

              {getStatusDisplay(cls)}
            </div>
          ))}
        </div>
      )}

      {/* Students Section */}
      <div className="pt-6 border-t border-[#E5E7EB]">
        <h2 className="text-[20px] font-semibold text-[#111827] mb-6">Students</h2>
        
        {/* Section Switcher */}
        <div className="flex items-center gap-2 p-1 bg-[#F3F4F6] rounded-[10px] w-fit mb-6">
          {['SEC A', 'SEC B'].map(sec => (
            <button
              key={sec}
              onClick={() => setSelectedSection(sec)}
              className={`px-6 py-2 rounded-[8px] text-[14px] font-medium transition-all ${
                selectedSection === sec 
                  ? 'bg-white text-[#111827] shadow-sm' 
                  : 'text-[#667085] hover:text-[#111827]'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        {/* Search & List */}
        <div className="bg-white rounded-[16px] border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E5E7EB]">
            <div className="relative">
              <Search className="w-5 h-5 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search student or roll number..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-transparent border-none text-[14px] text-[#111827] placeholder:text-[#667085] focus:outline-none focus:ring-0"
              />
            </div>
          </div>
          
          <div className="divide-y divide-[#E5E7EB]">
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-[#667085] text-[14px]">No students found for {selectedSection}.</div>
            ) : (
              filteredStudents.map(student => {
                const nameParts = student.name.split(' ');
                const initials = nameParts.length > 1 
                  ? `${nameParts[0][0]}${nameParts[1][0]}`
                  : student.name.substring(0, 2).toUpperCase();
                  
                return (
                  <div 
                    key={student.id} 
                    onClick={() => setSelectedStudent(student)}
                    className="p-4 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-[10px] bg-[#E5E7EB] flex items-center justify-center text-[14px] font-medium text-[#111827]">
                        {initials}
                      </div>
                      <div>
                        <div className="text-[14px] font-semibold text-[#111827]">{student.name}</div>
                        <div className="text-[13px] text-[#667085] mt-0.5 font-mono">{student.roll_number}</div>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <div className="text-[14px] font-semibold text-[#111827]">{getAttendancePercent(student.roll_number)}%</div>
                        <div className="text-[11px] text-[#667085] uppercase tracking-wide">Attendance</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#D1D5DB] group-hover:text-[#0B65FE] transition-colors" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Student Attendance Modal */}
      <Modal 
        isOpen={selectedStudent !== null} 
        onClose={() => setSelectedStudent(null)} 
        title="Student Attendance Profile"
      >
        {selectedStudent && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-[#F9FAFB] rounded-[12px] border border-[#E5E7EB]">
              <div className="w-12 h-12 rounded-[12px] bg-[#E5E7EB] flex items-center justify-center text-[16px] font-medium text-[#111827]">
                {selectedStudent.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-[16px] font-semibold text-[#111827]">{selectedStudent.name}</div>
                <div className="text-[14px] text-[#667085] mt-0.5 font-mono">{selectedStudent.roll_number} • {selectedStudent.section}</div>
              </div>
            </div>

            <div>
              <h4 className="text-[14px] font-semibold text-[#111827] mb-3">Overall Attendance</h4>
              <div className="flex items-center justify-between p-4 rounded-[12px] border border-[#E5E7EB]">
                <div className="text-[14px] font-medium text-[#667085]">Total Classes Attended</div>
                <div className="text-[16px] font-bold text-[#0B65FE]">
                  {getAttendancePercent(selectedStudent.roll_number)}%
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-[14px] font-semibold text-[#111827] mb-3">Recent Classes</h4>
              <div className="space-y-2">
                {[
                  { name: 'Digital Signal Processing', status: 'Present', date: 'Today, 10:20 AM' },
                  { name: 'Microcontrollers', status: 'Present', date: 'Yesterday, 09:00 AM' },
                  { name: 'Digital VLSI Design', status: 'Absent', date: 'Monday, 08:00 AM' },
                ].map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-[10px] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors">
                    <div>
                      <div className="text-[14px] font-medium text-[#111827]">{c.name}</div>
                      <div className="text-[12px] text-[#667085] mt-0.5">{c.date}</div>
                    </div>
                    <div className={`text-[13px] font-medium ${c.status === 'Present' ? 'text-[#065F46]' : 'text-[#991B1B]'}`}>
                      {c.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <button
              onClick={() => setSelectedStudent(null)}
              className="w-full flex justify-center items-center h-11 px-4 border border-transparent rounded-[10px] shadow-sm text-[15px] font-medium text-white bg-[#111827] hover:bg-[#374151] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#111827] transition-colors"
            >
              Close Profile
            </button>
          </div>
        )}
      </Modal>

      {/* AI Demo Modal */}
      <Modal 
        isOpen={demoModalOpen} 
        onClose={() => setDemoModalOpen(false)} 
        title="AI Camera Demo Session"
      >
        {demoSession && (
          <div className="space-y-6 flex flex-col items-center">
            <p className="text-[14px] text-center text-[#667085]">
              Scan this QR code with a smartphone to start the 5-minute local AI attendance tracking demo.
            </p>
            <div className="p-4 bg-white border border-[#E5E7EB] rounded-[16px] shadow-sm">
              <QRCodeSVG 
                value={`${window.location.origin}/camera/${demoSession.token}`}
                size={200} 
              />
            </div>
            <div className="w-full">
              <label className="text-[12px] font-medium text-[#111827] mb-1 block">Smartphone Link</label>
              <div className="flex w-full items-center">
                <input 
                  type="text" 
                  readOnly 
                  value={`${window.location.origin}/camera/${demoSession.token}`}
                  className="flex-1 h-10 px-3 border border-[#E5E7EB] rounded-l-[8px] bg-[#F9FAFB] text-[13px] text-[#667085] focus:outline-none"
                />
                <button 
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/camera/${demoSession.token}`)}
                  className="h-10 px-4 bg-[#0B65FE] text-white text-[13px] font-medium rounded-r-[8px] hover:bg-[#004BCC]"
                >
                  Copy
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                // Here we could navigate to a dashboard to track the session progress
                window.open(`${window.location.origin}/camera/${demoSession.token}`, '_blank');
              }}
              className="w-full flex justify-center items-center h-11 px-4 border border-transparent rounded-[10px] shadow-sm text-[14px] font-medium text-white bg-[#111827] hover:bg-[#374151]"
            >
              Open in Browser Instead
            </button>
          </div>
        )}
      </Modal>

    </div>
  );
};
