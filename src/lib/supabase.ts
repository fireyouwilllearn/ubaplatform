import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { appEnv, isSupabaseConfigured } from './env';

let client: ReturnType<typeof createClient<Database>> | null = null;

if (isSupabaseConfigured) {
  client = createClient<Database>(appEnv.supabaseUrl!, appEnv.supabaseAnonKey!, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });
}

export const supabase = client;
export const isSupabaseReady = client !== null;
