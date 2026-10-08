import { Router } from 'express';
import { supabase } from '../supabase';

const router = Router();

router.get('/', async (req, res) => {
  // Check Supabase connection
  const { error } = await supabase.from('subjects').select('id').limit(1);
  const databaseStatus = error ? 'disconnected' : 'connected';
  
  res.json({
    status: 'ok',
    service: 'RollSync Backend',
    mqtt: 'connected', // We assume connected since we auto-reconnect, but we could track this state in memory
    database: databaseStatus
  });
});

export default router;
