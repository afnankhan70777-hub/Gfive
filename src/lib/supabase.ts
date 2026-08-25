import { createClient } from '@supabase/supabase-js';

// Hardcoded for static export — ensures Supabase works without runtime env vars
const supabaseUrl = 'https://sunajwnkvkvwjpoquqni.supabase.co';
const supabaseAnonKey = 'sb_publishable_hTbbhi_3NpALBvhFrRVriQ_BGqRyADu';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
