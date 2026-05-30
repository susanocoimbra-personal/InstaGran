import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Single browser client. In the browser, supabase-js persists the session in
// localStorage and auto-refreshes the token — no custom storage adapter needed.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/** Resolve a Storage object path into a public URL. */
export function publicPhotoUrl(path: string): string {
  return supabase.storage.from('photos').getPublicUrl(path).data.publicUrl;
}
