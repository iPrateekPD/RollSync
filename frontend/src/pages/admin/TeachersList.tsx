import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { Mail, Loader2, RefreshCw, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';

interface TeacherRecord {
  id: string;
  name: string;
  email: string | null;
  department: string | null;
  auth_id: string | null;
  accountStatus: 'INVITED' | 'NOT_INVITED';
}

export const TeachersList = () => {
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<TeacherRecord[]>('/auth/teachers');
      setTeachers(response.data);
    } catch (error: any) {
      setNotice({ type: 'error', text: error.response?.data?.message || 'Unable to load teacher records.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadTeachers(); }, []);

  const inviteTeacher = async (teacher: TeacherRecord) => {
    const email = (emails[teacher.id] || teacher.email || '').trim().toLowerCase();
    if (!email) {
      setNotice({ type: 'error', text: `Enter an institutional email for ${teacher.name}.` });
      return;
    }
    setInviting(teacher.id);
    setNotice(null);
    try {
      const response = await apiClient.post(`/auth/teachers/${teacher.id}/invite`, { email });
      setNotice({ type: 'success', text: response.data.message || `Invitation sent to ${email}.` });
      await loadTeachers();
    } catch (error: any) {
      setNotice({ type: 'error', text: error.response?.data?.message || 'Unable to send invitation.' });
    } finally {
      setInviting(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-display font-semibold tracking-tight text-foreground">Teacher Access</h1>
          <p className="mt-1 text-muted-foreground">Invite existing timetable teachers to sign in to RollSync.</p>
        </div>
        <button onClick={() => void loadTeachers()} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {notice && (
        <div className={`flex items-start gap-2 rounded-xl p-4 text-sm ${notice.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
          {notice.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          {notice.text}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-4 text-sm text-muted-foreground">
          Existing teacher and timetable records are preserved. Invitations create Auth accounts and link them to the selected teacher record.
        </div>
        {loading ? (
          <div className="flex h-48 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>
        ) : (
          <div className="divide-y divide-border">
            {teachers.map(teacher => (
              <div key={teacher.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="font-medium text-foreground">{teacher.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{teacher.department || 'ECE'} · {teacher.email || 'No email assigned'}</div>
                  <div className="mt-2 inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs">
                    {teacher.accountStatus === 'INVITED' ? 'Login linked' : 'No login yet'}
                  </div>
                </div>
                {teacher.accountStatus === 'NOT_INVITED' ? (
                  <div className="flex w-full gap-2 sm:w-auto">
                    <input
                      type="email"
                      value={emails[teacher.id] ?? teacher.email ?? ''}
                      onChange={event => setEmails(current => ({ ...current, [teacher.id]: event.target.value }))}
                      placeholder="institutional email"
                      className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm sm:w-64"
                    />
                    <button
                      onClick={() => void inviteTeacher(teacher)}
                      disabled={inviting === teacher.id}
                      className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                    >
                      {inviting === teacher.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                      Invite
                    </button>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 text-sm text-emerald-700"><Mail className="h-4 w-4" /> Invitation account linked</div>
                )}
              </div>
            ))}
            {teachers.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No teacher records found.</div>}
          </div>
        )}
      </div>
    </div>
  );
};
