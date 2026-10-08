import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://myeykshozowozsjapokt.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseKey) {
  console.warn('[DB] SUPABASE_SERVICE_ROLE_KEY is missing. Database operations will fail.');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey || 'dummy', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
