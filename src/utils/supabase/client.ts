import { createBrowserClient } from "@supabase/ssr";

// Hardcoded for static export — ensures Supabase works without runtime env vars
const supabaseUrl = 'https://sunajwnkvkvwjpoquqni.supabase.co';
const supabaseKey = 'sb_publishable_hTbbhi_3NpALBvhFrRVriQ_BGqRyADu';

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
