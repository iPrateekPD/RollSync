import { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { Loader2, TrendingUp, Calendar as CalendarIcon, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export const StudentAttendance = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, total: 0, percentage: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMyAttendance = async () => {
      try {
        const response = await apiClient.get(`/attendance/student/${user?.profileId}`);
        const attendanceData = response.data;
        
        // Sort newest first
        attendanceData.sort((a: any, b: any) => 
          new Date(b.classSession.date).getTime() - new Date(a.classSession.date).getTime()
        );
        
        setRecords(attendanceData);

        // Calculate stats
        const total = attendanceData.length;
        const present = attendanceData.filter((r: any) => r.status === 'PRESENT').length;
        const absent = total - present;
        const percentage = total === 0 ? 0 : Math.round((present / total) * 100);
        
        setStats({ present, absent, total, percentage });

        // Generate chart data (group by course code)
        const courseMap = new Map();
        attendanceData.forEach((r: any) => {
          const courseCode = r.classSession.course.code;
          if (!courseMap.has(courseCode)) {
            courseMap.set(courseCode, { name: courseCode, Present: 0, Absent: 0 });
          }
          const courseStats = courseMap.get(courseCode);
          if (r.status === 'PRESENT') courseStats.Present += 1;
          else courseStats.Absent += 1;
        });

        setChartData(Array.from(courseMap.values()));
      } catch (error) {
        console.error('Failed to fetch attendance', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.profileId) {
      fetchMyAttendance();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-semibold tracking-tight text-foreground">My Attendance</h1>
        <p className="mt-1 text-muted-foreground">Track your attendance across all registered courses.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border flex items-center">
          <div className="p-3 rounded-xl bg-zinc-100 mr-5">
            <TrendingUp className="w-6 h-6 text-zinc-900" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Overall</p>
            <p className="text-3xl font-display font-bold text-foreground mt-0.5">{stats.percentage}%</p>
          </div>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border flex items-center">
          <div className="p-3 rounded-xl bg-green-100/50 mr-5">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Attended</p>
            <p className="text-3xl font-display font-bold text-foreground mt-0.5">{stats.present}</p>
          </div>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border flex items-center">
          <div className="p-3 rounded-xl bg-destructive/10 mr-5">
            <XCircle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Missed</p>
            <p className="text-3xl font-display font-bold text-foreground mt-0.5">{stats.absent}</p>
          </div>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border flex items-center">
          <div className="p-3 rounded-xl bg-zinc-100 mr-5">
            <CalendarIcon className="w-6 h-6 text-zinc-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
            <p className="text-3xl font-display font-bold text-foreground mt-0.5">{stats.total}</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart */}
        <div className="lg:col-span-2 bg-card p-8 rounded-2xl shadow-sm border border-border">
          <h3 className="font-semibold text-foreground text-sm tracking-wide uppercase mb-8">Attendance by Course</h3>
          <div className="h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} />
                  <Tooltip 
                    cursor={{ fill: '#f4f4f5' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }} 
                  />
                  <Bar dataKey="Present" fill="#09090b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Recent Records */}
        <div className="lg:col-span-1 bg-card rounded-2xl shadow-sm border border-border flex flex-col h-[400px] lg:h-auto overflow-hidden">
          <div className="p-5 border-b border-border bg-card/50">
            <h3 className="font-semibold text-foreground text-sm tracking-wide uppercase">Recent Sessions</h3>
          </div>
          <div className="overflow-y-auto flex-1 p-3 space-y-2">
            {records.slice(0, 20).map(record => (
              <div key={record.id} className="flex justify-between items-center p-3 border border-border rounded-xl bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                <div>
                  <p className="font-medium text-sm text-foreground">{record.classSession?.course?.code}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(record.classSession?.date).toLocaleDateString()}</p>
                </div>
                <div>
                  {record.status === 'PRESENT' ? (
                    <span className="inline-flex items-center bg-green-100/50 text-green-700 text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-md border border-green-200">
                      Present
                    </span>
                  ) : (
                    <span className="inline-flex items-center bg-destructive/10 text-destructive text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-md border border-destructive/20">
                      Absent
                    </span>
                  )}
                </div>
              </div>
            ))}
            {records.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">No recent attendance records.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
