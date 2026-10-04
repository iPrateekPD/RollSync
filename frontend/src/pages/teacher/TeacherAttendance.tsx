import { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { Loader2, Search, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const TeacherAttendance = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await apiClient.get('/class-sessions');
        const teacherSessions = response.data
          .filter((s: any) => s.teacherId === user?.profileId && s.status === 'COMPLETED')
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setSessions(teacherSessions);
        
        if (teacherSessions.length > 0) {
          setSelectedSession(teacherSessions[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch sessions', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [user]);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedSession) return;
      setIsLoadingRecords(true);
      try {
        // Assume an endpoint exists to fetch attendance by session ID.
        // For Phase 5 we built attendance/session/:id
        const response = await apiClient.get(`/attendance/session/${selectedSession}`);
        setAttendanceRecords(response.data);
      } catch (error) {
        console.error('Failed to fetch attendance', error);
      } finally {
        setIsLoadingRecords(false);
      }
    };

    fetchAttendance();
  }, [selectedSession]);

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
        <h1 className="text-3xl font-display font-semibold tracking-tight text-foreground">Attendance Reports</h1>
        <p className="mt-1 text-muted-foreground">View attendance records for your completed classes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Session Selector */}
        <div className="lg:col-span-1 bg-card rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-border bg-card/50">
            <h3 className="font-semibold text-foreground text-sm tracking-wide uppercase">Past Sessions</h3>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {sessions.map(session => (
              <button
                key={session.id}
                onClick={() => setSelectedSession(session.id)}
                className={`w-full text-left p-3 rounded-xl transition-all ${selectedSession === session.id ? 'bg-zinc-100 dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700' : 'hover:bg-zinc-50 border border-transparent'}`}
              >
                <div className="font-medium text-foreground">{session.course?.code}</div>
                <div className="text-xs text-muted-foreground mt-1">{new Date(session.date).toLocaleDateString()}</div>
              </button>
            ))}
            {sessions.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground text-center">No completed sessions found.</div>
            )}
          </div>
        </div>

        {/* Attendance Table */}
        <div className="lg:col-span-3 bg-card rounded-2xl shadow-sm border border-border overflow-hidden h-[600px] flex flex-col">
          <div className="p-4 border-b border-border bg-card/50 flex justify-between items-center">
            <h3 className="font-semibold text-foreground text-sm tracking-wide uppercase">Student Attendance</h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search students..."
                className="w-64 pl-9 pr-4 py-1.5 text-sm bg-transparent border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring outline-none transition-all placeholder:text-muted-foreground text-foreground"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            {isLoadingRecords ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-foreground" />
              </div>
            ) : (
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-zinc-50/50 sticky top-0">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Student ID</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Dwell Time</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {attendanceRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{record.student?.studentId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{record.student?.firstName} {record.student?.lastName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {record.status === 'PRESENT' ? (
                          <span className="inline-flex items-center bg-green-100/50 text-green-700 text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-md border border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1.5" /> Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center bg-destructive/10 text-destructive text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-md border border-destructive/20">
                            <XCircle className="w-3 h-3 mr-1.5" /> Absent
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {record.dwellTimeMinutes || 0} mins
                      </td>
                    </tr>
                  ))}
                  {attendanceRecords.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-sm text-muted-foreground">
                        Select a session to view attendance, or no records exist for this session.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
