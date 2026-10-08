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

export default router;
