function assertEnv<T>(value: T | undefined, name: string, hint?: string): asserts value is T {
  if (!value) {
    throw new Error(`Missing required env var: ${name}${hint ? ` (${hint})` : ''}`);
  }
}

export const appEnv = {
  appName: import.meta.env.VITE_APP_NAME ?? 'UBA Platform',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

export const isSupabaseConfigured = Boolean(appEnv.supabaseUrl && appEnv.supabaseAnonKey);

function ensureSupabaseEnv() {
  assertEnv(appEnv.supabaseUrl, 'VITE_SUPABASE_URL', 'from project settings > API');
  assertEnv(appEnv.supabaseAnonKey, 'VITE_SUPABASE_ANON_KEY', 'anon public key, not service_role');
  return { url: appEnv.supabaseUrl, anonKey: appEnv.supabaseAnonKey };
}
