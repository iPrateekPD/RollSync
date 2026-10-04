import { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { Loader2, PlayCircle, StopCircle, Users, Clock, BookOpen, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const TeacherClasses = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      // In a real app, you might pass dates to filter today's sessions
      // We will assume the backend returns sessions related to this teacher
      const response = await apiClient.get('/class-sessions');
      
      // Filter sessions for this teacher
      const teacherSessions = response.data.filter((s: any) => s.teacherId === user?.profileId);
      
      // Sort by date (descending for now)
      teacherSessions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setSessions(teacherSessions);
    } catch (error) {
      console.error('Failed to fetch sessions', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  const endSession = async (sessionId: string) => {
    try {
      await apiClient.post(`/class-sessions/${sessionId}/end`);
      fetchSessions();
    } catch (error) {
      console.error('Failed to end session', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return <span className="bg-zinc-100 text-zinc-700 text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-md border border-zinc-200">Scheduled</span>;
      case 'IN_PROGRESS': return <span className="bg-primary/10 text-primary text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-md border border-primary/20 animate-pulse">In Progress</span>;
      case 'COMPLETED': return <span className="bg-green-100/50 text-green-700 text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-md border border-green-200">Completed</span>;
      case 'CANCELLED': return <span className="bg-destructive/10 text-destructive text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-md border border-destructive/20">Cancelled</span>;
      default: return null;
    }
  };

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
        <h1 className="text-3xl font-display font-semibold tracking-tight text-foreground">My Classes</h1>
        <p className="mt-1 text-muted-foreground">Manage your daily class sessions and attendance tracking.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((session) => (
          <div key={session.id} className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col group hover:shadow-md transition-all">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-display font-semibold text-foreground tracking-tight">{session.course?.code}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{session.course?.name}</p>
                </div>
                {getStatusBadge(session.status)}
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="flex items-center text-sm text-muted-foreground bg-zinc-50/50 rounded-lg p-2 border border-zinc-100">
                  <Clock className="w-4 h-4 mr-3 text-zinc-400" />
                  {new Date(session.date).toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-muted-foreground bg-zinc-50/50 rounded-lg p-2 border border-zinc-100">
                  <Users className="w-4 h-4 mr-3 text-zinc-400" />
                  {session.classroom?.name}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-border bg-zinc-50/30">
              {session.status === 'IN_PROGRESS' ? (
                <button
                  onClick={() => endSession(session.id)}
                  className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-xl text-destructive-foreground bg-destructive hover:opacity-90 transition-opacity"
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  End Class Session
                </button>
              ) : session.status === 'SCHEDULED' ? (
                <button
                  disabled
                  className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-xl text-muted-foreground bg-zinc-100 cursor-not-allowed"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Starts automatically
                </button>
              ) : (
                <button
                  className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-border text-sm font-medium rounded-xl text-foreground bg-transparent hover:bg-zinc-50 transition-colors"
                >
                  <BarChart3 className="w-4 h-4 mr-2 text-muted-foreground" />
                  View Report
                </button>
              )}
            </div>
          </div>
        ))}

        {sessions.length === 0 && (
          <div className="col-span-full py-20 text-center bg-card rounded-2xl border border-border border-dashed flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-zinc-400" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No classes</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">You don't have any class sessions scheduled for this period.</p>
          </div>
        )}
      </div>
    </div>
  );
};


