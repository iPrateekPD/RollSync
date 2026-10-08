import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, CheckCircle2, Clock, CalendarDays } from 'lucide-react';
import { fetchStudentsFromDB, fetchTodayClasses } from '../../api/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [selectedSection, setSelectedSection] = useState('SEC A');
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
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
          // Process classes to determine status and continuous classes
          const processedClasses = data.classes.map((cls: any, index: number, arr: any[]) => {
            let status = 'UPCOMING';
            // Mocking status based on time (for demo purposes)
            // Real implementation would compare current time with cls.start_time
            if (index === 0) status = 'CONFIRMED';
            else if (index === 1) status = 'REVIEW';
            
            return {
              ...cls,
              status,
              present: 42,
              absent: 8,
              exceptions: status === 'REVIEW' ? 2 : 0,
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
          <div className="flex items-center gap-2 mt-4 text-[13px] font-medium text-[#EF4444] animate-pulse">
            <div className="w-2 h-2 rounded-full bg-[#EF4444]" /> LIVE
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
                  <div key={student.id} className="p-4 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors cursor-pointer group">
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

    </div>
  );
};
