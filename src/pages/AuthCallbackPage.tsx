import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { supabase, isSupabaseReady } from '../lib/supabase';

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabase || !isSupabaseReady) {
      navigate('/', { replace: true });
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/', { replace: true });
      }
    }).catch(() => { navigate('/', { replace: true }); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        navigate('/', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-uba-gold)] border-t-transparent" />
        <p className="text-sm text-[var(--text3)]">Completing sign in…</p>
      </div>
    </div>
  );
}
