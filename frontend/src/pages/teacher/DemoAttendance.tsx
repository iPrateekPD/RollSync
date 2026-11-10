import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

type Decision = 'Present' | 'Absent' | 'Review';
type StudentResult = {
  id: string; name: string; roll_number: string; frames_recognized: number;
  valid_frames: number; ai_classification: string; teacher_decision: string | null;
  review_status: string; rfid_taps: number;
  evidence: 'RFID + face' | 'RFID only' | 'Face only' | 'No evidence';
};

export const DemoAttendance = ({ demoSessionId }: { demoSessionId: string }) => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentResult[]>([]);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/demo/session/' + demoSessionId + '/attendance', {
          headers: { Authorization: 'Bearer ' + token }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load attendance.');
        if (cancelled) return;
        const rows: StudentResult[] = Array.isArray(data) ? data : [];
        setStudents(rows);
        const initial: Record<string, Decision> = {};
        rows.forEach(student => {
          initial[student.id] = (student.teacher_decision as Decision) ||
            (student.ai_classification === 'Present' ? 'Present' : 'Review');
        });
        setDecisions(initial);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Unable to load attendance.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [demoSessionId]);

  const stats = useMemo(() => ({
    total: students.length,
    present: Object.values(decisions).filter(value => value === 'Present').length,
    absent: Object.values(decisions).filter(value => value === 'Absent').length,
    review: Object.values(decisions).filter(value => value === 'Review').length
  }), [students.length, decisions]);

  const setDecision = (id: string, value: Decision) =>
    setDecisions(current => ({ ...current, [id]: value }));

  const confirmAttendance = async () => {
    if (stats.review > 0) return;
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/demo/session/' + demoSessionId + '/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ decisions: Object.entries(decisions).map(([student_id, decision]) => ({ student_id, decision })) })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to confirm attendance.');
      setConfirmed(true);
      window.setTimeout(() => navigate('/teacher'), 1500);
    } catch (err: any) {
      setError(err.message || 'Unable to save attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-7 pb-20">
      <div>
        <button onClick={() => navigate('/teacher')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Review attendance</h1>
        <p className="text-sm text-slate-500 mt-2">AI and RFID provide evidence. The teacher makes the final decision.</p>
      </div>
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {loading ? <div className="flex justify-center p-16"><Loader2 className="w-7 h-7 animate-spin text-blue-600" /></div> : <>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['Students', stats.total], ['Present', stats.present],
            ['Absent', stats.absent], ['Needs decision', stats.review]
          ].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="text-2xl font-semibold mt-1 text-slate-900">{value}</div>
          </div>)}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Student evidence</h2>
            <p className="text-xs text-slate-500 mt-1">No camera detection is treated as proof of absence.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {students.map(student => {
              const decision = decisions[student.id] || 'Review';
              return <div key={student.id} className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium text-slate-900">{student.name}</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">{student.roll_number}</div>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{student.evidence}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{student.rfid_taps} RFID tap(s)</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{student.frames_recognized}/{student.valid_frames} face frames</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 self-start lg:self-auto">
                  {(['Present', 'Absent', 'Review'] as Decision[]).map(value =>
                    <button key={value} onClick={() => setDecision(student.id, value)}
                      className={'px-3 py-2 rounded-lg text-xs font-medium transition-colors ' +
                        (decision === value ? (value === 'Present' ? 'bg-white text-emerald-700 shadow-sm' :
                        value === 'Absent' ? 'bg-white text-rose-700 shadow-sm' : 'bg-white text-amber-700 shadow-sm') :
                        'text-slate-500 hover:text-slate-900')}>{value}</button>
                  )}
                </div>
              </div>;
            })}
            {students.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No students found in this class roster.</p>}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Resolve every Review item before final confirmation.
          </div>
          <button onClick={confirmAttendance} disabled={stats.review > 0 || submitting || confirmed || students.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40">
            {confirmed ? <><CheckCircle2 className="w-4 h-4" /> Attendance confirmed</> :
              submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> :
              <><Check className="w-4 h-4" /> Confirm final attendance</>}
          </button>
        </div>
      </>}
    </div>
  );
};
