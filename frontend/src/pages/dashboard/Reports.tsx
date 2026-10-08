import { FileText, Download, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockAttendanceData = [
  { name: 'Mon', present: 85, absent: 15 },
  { name: 'Tue', present: 88, absent: 12 },
  { name: 'Wed', present: 92, absent: 8 },
  { name: 'Thu', present: 86, absent: 14 },
  { name: 'Fri', present: 90, absent: 10 },
];

export const Reports = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-[48px] animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[32px] font-semibold tracking-tight text-[#111827]">Attendance Reports</h1>
          <p className="mt-1 text-[15px] text-[#667085]">
            {isAdmin ? "Institution-wide attendance analytics." : "Analytics for your assigned classes."}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] font-medium text-[#111827] hover:bg-[#FFFFFF] transition-colors">
            <Calendar className="w-4 h-4 text-[#667085]" />
            Last 30 Days
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-4 bg-[#0B65FE] hover:bg-[#004BCC] text-white rounded-[10px] font-medium text-[14px] transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[16px] border border-[#E5E7EB] shadow-subtle flex flex-col justify-between h-[140px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#667085]">
              <FileText className="w-4 h-4 text-[#0B65FE]" />
              <h3 className="text-[14px] font-medium">Average Attendance</h3>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-[40px] font-semibold text-[#111827] tracking-tight">88.5%</p>
            <span className="flex items-center text-[13px] font-medium text-[#10B981]">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              +2.1%
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[16px] border border-[#E5E7EB] shadow-subtle flex flex-col justify-between h-[140px]">
          <div className="flex items-center gap-2 text-[#667085]">
            <FileText className="w-4 h-4 text-[#0B65FE]" />
            <h3 className="text-[14px] font-medium">Total Absences</h3>
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-[40px] font-semibold text-[#111827] tracking-tight">142</p>
            <span className="flex items-center text-[13px] font-medium text-[#EF4444]">
              <TrendingDown className="w-3.5 h-3.5 mr-1" />
              -5.4%
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[16px] border border-[#E5E7EB] shadow-subtle flex flex-col justify-between h-[140px]">
          <div className="flex items-center gap-2 text-[#667085]">
            <FileText className="w-4 h-4 text-[#0B65FE]" />
            <h3 className="text-[14px] font-medium">Leave Requests</h3>
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-[40px] font-semibold text-[#111827] tracking-tight">28</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[20px] p-8 border border-[#E5E7EB] shadow-subtle min-h-[400px]">
        <h3 className="text-[16px] font-medium text-[#111827] mb-6">Attendance Trend Chart</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#667085', fontSize: 13 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#667085', fontSize: 13 }} />
              <Tooltip 
                cursor={{ fill: '#FFFFFF' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="present" name="Present" fill="#0B65FE" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="absent" name="Absent" fill="#FEE2E2" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
