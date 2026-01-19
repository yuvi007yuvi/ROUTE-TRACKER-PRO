import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Use service role for backend admin tasks

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials missing in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
