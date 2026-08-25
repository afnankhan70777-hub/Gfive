import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Hardcoded for static export — ensures Supabase works without runtime env vars
const supabaseUrl = 'https://sunajwnkvkvwjpoquqni.supabase.co';
const supabaseKey = 'sb_publishable_hTbbhi_3NpALBvhFrRVriQ_BGqRyADu';

export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>) => {
  return createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) => cookieStore.set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
};
