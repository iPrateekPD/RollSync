import { Router } from 'express';
import { supabase } from '../supabase';

const router = Router();

// GET /api/sessions
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('attendance_sessions').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/sessions/active
router.get('/active', async (req, res) => {
  const { data, error } = await supabase.from('attendance_sessions').select('*').eq('active', true);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/sessions
router.post('/', async (req, res) => {
  const { subject_id, classroom, start_time, end_time } = req.body;
  if (!subject_id || !classroom || !start_time || !end_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data, error } = await supabase
    .from('attendance_sessions')
    .insert({
      subject_id,
      classroom,
      start_time,
      end_time,
      active: false
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// POST /api/sessions/:id/start
router.post('/:id/start', async (req, res) => {
  const { id } = req.params;
  
  // Optional: Prevent conflicting active sessions for the same classroom
  const { data: session } = await supabase.from('attendance_sessions').select('classroom').eq('id', id).single();
  
  if (session) {
    // End any currently active sessions for this classroom
    await supabase.from('attendance_sessions').update({ active: false }).eq('classroom', session.classroom).eq('active', true);
  }

  const { data, error } = await supabase
    .from('attendance_sessions')
    .update({ active: true })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/sessions/:id/end
router.post('/:id/end', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('attendance_sessions')
    .update({ active: false })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
// POST /api/sessions/:id/confirm
router.post('/:id/confirm', async (req, res) => {
  const { id } = req.params;
  const { records, teacher_id } = req.body; // records: { student_id, status }[]
  
  if (!records || !teacher_id) {
    return res.status(400).json({ error: 'Missing records or teacher_id' });
  }

  try {
    // End session if not ended, and set confirmed
    await supabase.from('attendance_sessions').update({ 
      active: false, 
      status: 'completed',
      confirmed: true,
      confirmed_by: teacher_id,
      confirmed_at: new Date().toISOString()
    }).eq('id', id);

    // Get existing records
    const { data: existingRecords } = await supabase.from('attendance_records').select('id, student_id').eq('session_id', id);
    const existingMap = new Map(existingRecords?.map(r => [r.student_id, r.id]) || []);

    const now = new Date().toISOString();

    for (const record of records) {
      if (existingMap.has(record.student_id)) {
        await supabase.from('attendance_records').update({
          status: record.status,
          teacher_confirmed: true,
          confirmed_by: teacher_id,
          confirmed_at: now,
          updated_at: now
        }).eq('id', existingMap.get(record.student_id));
      } else {
        await supabase.from('attendance_records').insert({
          session_id: id,
          student_id: record.student_id,
          status: record.status,
          source: 'manual',
          timestamp: now,
          teacher_confirmed: true,
          confirmed_by: teacher_id,
          confirmed_at: now
        });
      }
    }

    // TODO: Write to audit_logs

    res.json({ success: true });
  } catch (err: any) {
    console.error('Confirmation error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
