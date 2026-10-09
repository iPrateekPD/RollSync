import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../api/client';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, Calendar, AlertCircle, ScanFace, FileText, ChevronRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardData {
  faceRegistered: boolean;
  attendanceSummary: {
    percentage: number;
    total: number;
    attended: number;
  };
  classesToday: {
    id: string;
    subject: string;
    teacher: string;
    room: string;
    startTime: string;
    endTime: string;
  }[];
  recentAttendance: {
    id: string;
    date: string;
    subject: string;
    method: string;
    status: string;
    teacher: string;
  }[];
  alerts: number;
}

export const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      apiClient.get(`/students/${user.id}/dashboard`)
        .then(res => {
          setData(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load dashboard', err);
          setError('We couldn\'t connect to RollSync. Please try again.');
          setLoading(false);
        });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0B65FE]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight text-[#111827]">
          {getGreeting()}, {user?.firstName}
        </h1>
        <p className="mt-1 text-[15px] text-[#667085]">
          Track your attendance and manage your RollSync profile.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Overall Attendance */}
        <div 
          onClick={() => navigate('/student/attendance')}
          className="bg-white p-6 rounded-[20px] shadow-sm border border-[#E5E7EB] cursor-pointer hover:border-[#0B65FE] transition-colors group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-[10px] bg-[#E5F0FF] text-[#0B65FE] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            {data?.attendanceSummary && (
              <span className={`text-2xl font-bold ${data.attendanceSummary.percentage >= 75 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {data.attendanceSummary.percentage}%
              </span>
            )}
          </div>
          <h3 className="text-[#111827] font-medium mb-1">Overall Attendance</h3>
          <p className="text-[13px] text-[#667085]">
            {data?.attendanceSummary?.total === 0 
              ? 'No attendance data yet'
              : `${data?.attendanceSummary?.attended} attended / ${data?.attendanceSummary?.total} classes held`}
          </p>
        </div>

        {/* Card 2: Classes Today */}
        <div 
          className="bg-white p-6 rounded-[20px] shadow-sm border border-[#E5E7EB]"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-[10px] bg-[#F3F4F6] text-[#4B5563] flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-[#111827]">
              {data?.classesToday.length || 0}
            </span>
          </div>
          <h3 className="text-[#111827] font-medium mb-1">Classes Today</h3>
          {data?.classesToday && data.classesToday.length > 0 ? (
            <p className="text-[13px] text-[#667085] truncate">
              Next: {data.classesToday[0].subject} at {data.classesToday[0].startTime}
            </p>
          ) : (
            <p className="text-[13px] text-[#667085]">No classes scheduled today.</p>
          )}
        </div>

        {/* Card 3: Face Registration */}
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-[#E5E7EB]">
          <div className="flex justify-between items-start mb-4">
            <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${data?.faceRegistered ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#FFFBEB] text-[#F59E0B]'}`}>
              <ScanFace className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-[#111827] font-medium mb-1">Face Registration</h3>
          <p className="text-[13px] text-[#667085] mb-4 h-[40px]">
            {data?.faceRegistered 
              ? 'Status: Registered' 
              : 'Register your face to enable camera-based attendance verification.'}
          </p>
          <Link 
            to="/student/face-registration"
            className="text-[13px] font-medium text-[#0B65FE] hover:text-[#004BCC] flex items-center gap-1"
          >
            {data?.faceRegistered ? 'View Face Profile' : 'Register Face'} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Card 4: Attendance Alerts */}
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-[#E5E7EB]">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-[10px] bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-[#EF4444]">
              {data?.alerts || 0}
            </span>
          </div>
          <h3 className="text-[#111827] font-medium mb-1">Attendance Alerts</h3>
          <p className="text-[13px] text-[#667085] mb-4">
            Action needed on your records.
          </p>
          <Link 
            to="/student/notifications"
            className="text-[13px] font-medium text-[#0B65FE] hover:text-[#004BCC] flex items-center gap-1"
          >
            View Alerts <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Face Registration Reminder (if not registered) */}
      {data && !data.faceRegistered && (
        <div className="bg-[#E5F0FF] border border-[#0B65FE]/20 p-6 rounded-[20px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-[16px] font-semibold text-[#0B65FE] flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Complete your face registration
            </h3>
            <p className="text-[14px] text-[#004BCC] mt-1">
              Register a reference face profile for future classroom camera verification.
            </p>
          </div>
          <button 
            onClick={() => navigate('/student/face-registration')}
            className="whitespace-nowrap px-6 py-2.5 bg-[#0B65FE] text-white text-[14px] font-medium rounded-xl hover:bg-[#004BCC] transition-colors shadow-sm"
          >
            Register My Face
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Schedule */}
        <div className="bg-white rounded-[20px] shadow-sm border border-[#E5E7EB] flex flex-col">
          <div className="p-6 border-b border-[#E5E7EB]">
            <h3 className="text-[18px] font-semibold text-[#111827]">Today's Schedule</h3>
          </div>
          <div className="p-6 flex-1 overflow-y-auto">
            {data?.classesToday && data.classesToday.length > 0 ? (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#E5E7EB] before:to-transparent">
                {data.classesToday.map((cls) => (
                  <div key={cls.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white bg-[#F3F4F6] text-[#4B5563] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-[16px] border border-[#E5E7EB] bg-white shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-[#111827] text-[15px]">{cls.subject}</span>
                        <span className="text-[12px] font-medium px-2 py-1 bg-[#F3F4F6] text-[#4B5563] rounded-md">
                          {cls.startTime} - {cls.endTime}
                        </span>
                      </div>
                      <div className="text-[13px] text-[#667085] mt-2 flex justify-between">
                        <span>{cls.teacher}</span>
                        <span>{cls.room}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <Calendar className="w-12 h-12 text-[#D1D5DB] mb-3" />
                <p className="text-[#667085] text-[15px]">No classes scheduled for today.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="bg-white rounded-[20px] shadow-sm border border-[#E5E7EB] flex flex-col">
          <div className="p-6 border-b border-[#E5E7EB] flex justify-between items-center">
            <h3 className="text-[18px] font-semibold text-[#111827]">Recent Attendance</h3>
            <Link to="/student/attendance" className="text-[14px] font-medium text-[#0B65FE] hover:text-[#004BCC]">
              View All
            </Link>
          </div>
          <div className="p-0 flex-1">
            {data?.recentAttendance && data.recentAttendance.length > 0 ? (
              <ul className="divide-y divide-[#E5E7EB]">
                {data.recentAttendance.map((record) => (
                  <li key={record.id} className="p-4 sm:px-6 hover:bg-[#F9FAFB] transition-colors cursor-pointer" onClick={() => navigate('/student/attendance')}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[15px] font-medium text-[#111827]">{record.subject}</p>
                        <p className="text-[13px] text-[#667085] mt-0.5">
                          {format(new Date(record.date), 'MMM d, yyyy • h:mm a')} | {record.teacher}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.status.toLowerCase() === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                        <span className="text-[11px] text-[#667085] flex items-center gap-1">
                          {record.method === 'camera' ? <ScanFace className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          {record.method}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <FileText className="w-12 h-12 text-[#D1D5DB] mb-3" />
                <p className="text-[#667085] text-[15px]">No attendance records are available yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
