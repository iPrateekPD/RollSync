import { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { Loader2, TrendingUp, Calendar as CalendarIcon, CheckCircle, XCircle, ScanFace, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format } from 'date-fns';

interface AttendanceData {
  stats: { percentage: number; total: number; present: number; absent: number };
  chartData: any[];
  records: any[];
}

export const StudentAttendance = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AttendanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      apiClient.get(`/students/${user.id}/attendance`)
        .then(res => {
          setData(res.data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Failed to load attendance', err);
          setError('We couldn\'t load your attendance records.');
          setIsLoading(false);
        });
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B65FE]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error || "Failed to load data"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight text-[#111827]">Attendance History</h1>
        <p className="mt-1 text-[15px] text-[#667085]">Track your attendance across all registered subjects.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-[#E5E7EB] flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] bg-[#E5F0FF] flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-[#0B65FE]" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#667085]">Overall</p>
            <p className={`text-2xl font-bold mt-0.5 ${data.stats.percentage >= 75 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
              {data.stats.percentage}%
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-[#E5E7EB] flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] bg-[#ECFDF5] flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6 text-[#10B981]" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#667085]">Attended</p>
            <p className="text-2xl font-bold text-[#111827] mt-0.5">{data.stats.present}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-[#E5E7EB] flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] bg-[#FEF2F2] flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6 text-[#EF4444]" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#667085]">Missed</p>
            <p className="text-2xl font-bold text-[#111827] mt-0.5">{data.stats.absent}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-[#E5E7EB] flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] bg-[#F3F4F6] flex items-center justify-center shrink-0">
            <CalendarIcon className="w-6 h-6 text-[#4B5563]" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#667085]">Total Sessions</p>
            <p className="text-2xl font-bold text-[#111827] mt-0.5">{data.stats.total}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[24px] shadow-sm border border-[#E5E7EB]">
          <h3 className="font-semibold text-[#111827] text-[18px] mb-6">Subject Breakdown</h3>
          <div className="h-72">
            {data.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#667085' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#667085' }} />
                  <Tooltip 
                    cursor={{ fill: '#F9FAFB' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                  <Bar dataKey="Present" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Absent" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-[#667085]">
                No class data available to display chart.
              </div>
            )}
          </div>
        </div>

        {/* History List */}
        <div className="lg:col-span-1 bg-white rounded-[24px] shadow-sm border border-[#E5E7EB] flex flex-col h-[500px] lg:h-auto overflow-hidden">
          <div className="p-6 border-b border-[#E5E7EB]">
            <h3 className="font-semibold text-[#111827] text-[18px]">Detailed History</h3>
          </div>
          <div className="overflow-y-auto flex-1 p-0">
            {data.records.length > 0 ? (
              <ul className="divide-y divide-[#E5E7EB]">
                {data.records.map((record) => (
                  <li key={record.id} className="p-4 sm:px-6 hover:bg-[#F9FAFB] transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[15px] font-medium text-[#111827]">{record.subject}</p>
                        <p className="text-[13px] text-[#667085] mt-0.5">
                          {format(new Date(record.date), 'MMM d, yyyy • h:mm a')}
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
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <p className="text-[#667085] text-[15px]">No attendance records found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
