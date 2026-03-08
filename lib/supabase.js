import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Singleton Supabase client — safe to import from both client and server
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Returns true if Supabase is configured and reachable.
 */
export const isSupabaseConfigured = () => !!supabase;

/**
 * Get or create an anonymous session ID for authorship tracking.
 * Stored in localStorage so the same browser always gets credit.
 */
export const getSessionId = () => {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem('phasethru_session_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('phasethru_session_id', id);
  }
  return id;
};
