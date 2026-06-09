import { createContext, use, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AccountProfile {
  role: 'admin' | 'gm' | 'player';
  display_name: string | null;
  player_id: string | null;
  gm_team_id: string | null;
}

interface AuthState {
  user: User | null;
  profile: AccountProfile | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(supabase !== null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchProfile(u.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchProfile(u.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription?.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    if (!supabase) return;
    const { data, error: err } = await supabase
      .from('account_profiles')
      .select('role, display_name, player_id, gm_team_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (err) {
      console.error('[auth] failed to fetch profile:', err);
    }
    setProfile((data ?? null) as AccountProfile | null);
    setLoading(false);
  }

  const signIn = useCallback(async () => {
    if (!supabase) return;
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
    });
    if (signInError) {
      console.error('[auth] signIn failed:', signInError);
      setError(signInError.message);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    setError(null);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error('[auth] signOut failed:', signOutError);
      setError(signOutError.message);
    }
  }, []);

  const value = useMemo(() => ({ user, profile, loading, error, signIn, signOut }), [user, profile, loading, error, signIn, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => use(AuthContext);
