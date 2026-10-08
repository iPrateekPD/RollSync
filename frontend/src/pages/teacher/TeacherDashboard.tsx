import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ArrowRight, UserCheck, UserX, UserMinus, Users } from 'lucide-react';
import { fetchStudentsFromDB } from '../../api/supabase';

export const TeacherDashboard = () => {
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecent = async () => {
      const { data } = await fetchStudentsFromDB(4);
      if (data) setRecentActivity(data);
    };
    fetchRecent();
  }, []);

  return (
    <div className="space-y-[48px] animate-in fade-in duration-500">
      
      {/* Dashboard Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-[32px] font-semibold text-[#111827] tracking-tight">Good morning, Reema Angelin</h1>
          <div className="flex items-center gap-2 mt-2 text-[15px] text-[#667085]">
            <span>Teacher</span>
            <span className="w-1 h-1 rounded-full bg-[#E5E7EB]"></span>
            <span>Class VIII-B</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[14px] font-medium text-[#111827]">Thursday, 28 Aug 2025</div>
            <div className="text-[13px] text-[#667085]">9:02 AM</div>
          </div>
          <div className="h-10 w-[1px] bg-[#E5E7EB]"></div>
          <button className="flex items-center gap-2 h-10 px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] font-medium text-[#111827] hover:bg-[#FFFFFF] transition-colors">
            VIII-B
            <ChevronDown className="w-4 h-4 text-[#667085]" />
          </button>
        </div>
      </div>

      {/* Attendance Summary */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-semibold text-[#111827]">Today's Attendance</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Students */}
          <div className="bg-white p-6 rounded-[16px] border border-[#E5E7EB] shadow-subtle flex flex-col justify-between h-[140px]">
            <div className="flex items-center gap-2 text-[#667085]">
              <Users className="w-4 h-4" />
              <span className="text-[14px] font-medium">Total Students</span>
            </div>
            <div className="text-[40px] font-semibold text-[#111827] tracking-tight">55</div>
          </div>

          {/* Present */}
          <div className="bg-white p-6 rounded-[16px] border border-[#E5E7EB] shadow-subtle flex flex-col justify-between h-[140px]">
            <div className="flex items-center gap-2 text-[#667085]">
              <UserCheck className="w-4 h-4 text-[#10B981]" />
              <span className="text-[14px] font-medium">Present</span>
            </div>
            <div className="text-[40px] font-semibold text-[#111827] tracking-tight">50</div>
          </div>

          {/* Absent */}
          <div className="bg-white p-6 rounded-[16px] border border-[#E5E7EB] shadow-subtle flex flex-col justify-between h-[140px]">
            <div className="flex items-center gap-2 text-[#667085]">
              <UserX className="w-4 h-4 text-[#EF4444]" />
              <span className="text-[14px] font-medium">Absent</span>
            </div>
            <div className="text-[40px] font-semibold text-[#111827] tracking-tight">2</div>
          </div>

          {/* On Leave */}
          <div className="bg-white p-6 rounded-[16px] border border-[#E5E7EB] shadow-subtle flex flex-col justify-between h-[140px]">
            <div className="flex items-center gap-2 text-[#667085]">
              <UserMinus className="w-4 h-4 text-[#F59E0B]" />
              <span className="text-[14px] font-medium">On Leave</span>
            </div>
            <div className="text-[40px] font-semibold text-[#111827] tracking-tight">3</div>
          </div>
        </div>
      </section>

      {/* Main Action Area */}
      <section className="bg-white rounded-[20px] p-8 border border-[#E5E7EB] shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-[20px] font-semibold text-[#111827]">Ready to begin class?</h2>
          <p className="mt-2 text-[15px] text-[#667085]">Start scanning RFID cards or mark attendance manually.</p>
        </div>
        <Link 
          to="/teacher/attendance" 
          className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-[#0B65FE] hover:bg-[#004BCC] text-white rounded-[12px] font-medium text-[15px] transition-colors shrink-0"
        >
          Take Attendance
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Recent Activity */}
      <section className="space-y-6">
        <h2 className="text-[20px] font-semibold text-[#111827]">Recent Activity</h2>
        <div className="bg-white rounded-[16px] border border-[#E5E7EB] shadow-subtle overflow-hidden">
          <div className="divide-y divide-[#E5E7EB]">
            {recentActivity.map((student, i) => {
              const statuses = ['Present', 'Present', 'Absent', 'Present'];
              const colors = ['bg-[#D1FAE5] text-[#065F46]', 'bg-[#D1FAE5] text-[#065F46]', 'bg-[#FEE2E2] text-[#991B1B]', 'bg-[#D1FAE5] text-[#065F46]'];
              const times = ['9:02 AM', '9:01 AM', '8:58 AM', '8:57 AM'];
              
              const status = statuses[i % 4];
              const color = colors[i % 4];
              const time = times[i % 4];
              
              // Get initials from first and last name (or second word)
              const nameParts = student.name.split(' ');
              const initials = nameParts.length > 1 
                ? `${nameParts[0][0]}${nameParts[1][0]}`
                : student.name.substring(0, 2).toUpperCase();

              return (
                <div key={student.id} className="p-4 flex items-center justify-between hover:bg-[#FFFFFF] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[14px] font-medium text-[#111827]">
                      {initials}
                    </div>
                    <div>
                      <div className="text-[15px] font-medium text-[#111827]">{student.name}</div>
                      <div className="text-[13px] text-[#667085]">Roll No. {student.roll_number}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium ${color}`}>
                      {status}
                    </span>
                    <span className="text-[12px] text-[#667085]">{time}</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="p-4 border-t border-[#E5E7EB] bg-[#F9FAFB] text-center">
            <Link to="/teacher/reports" className="text-[14px] font-medium text-[#0B65FE] hover:text-[#004BCC] transition-colors">
              View full activity
            </Link>
          </div>
        </div>
      </section>
      
    </div>
  );
};
