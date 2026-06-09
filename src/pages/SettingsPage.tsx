import { useEffect, useState } from 'react';
import { PageHeader, Panel, SectionTitle, StatusPill } from '../components/Panel';
import { RequireRole } from '../components/RequireRole';
import { appEnv, isSupabaseConfigured } from '../lib/env';
import { isSupabaseReady, supabase } from '../lib/supabase';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const envRows = [
  { key: 'VITE_APP_NAME', value: appEnv.appName, detail: 'Safe public app label' },
  { key: 'VITE_SUPABASE_URL', value: appEnv.supabaseUrl ? 'configured' : 'missing', detail: 'Safe public project URL' },
  { key: 'VITE_SUPABASE_ANON_KEY', value: appEnv.supabaseAnonKey ? 'configured' : 'missing', detail: 'Safe anon key, never service role' },
];

type DbStatus = 'checking' | 'connected' | 'error';

export function SettingsPage() {
  useDocumentTitle('Settings');
  const [dbStatus, setDbStatus] = useState<DbStatus>(isSupabaseReady ? 'checking' : 'error');
  const [teamCount, setTeamCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isSupabaseReady) {
      return;
    }
    let cancelled = false;
    supabase!
      .from('teams')
      .select('id', { count: 'exact', head: true })
      .then(({ count, error }) => {
        if (cancelled) return;
        if (error) {
          setDbStatus('error');
        } else {
          setDbStatus('connected');
          setTeamCount(count);
        }
      }, () => {
        if (!cancelled) setDbStatus('error');
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <RequireRole requiredRole="admin">
    <div className="grid gap-5">
      <PageHeader
        kicker="Account and environment"
        title="Account and environment settings."
        description="View connection status and environment configuration for the UBA Platform."
        meta={isSupabaseConfigured ? 'Supabase connected' : 'Supabase not configured'}
      />

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Panel className="p-6 sm:p-8">
          <SectionTitle eyebrow="Environment" title="Client configuration" body="Environment variables exposed to the client. Service keys are kept server-side." />
          <div className="mt-6 grid gap-3">
            {envRows.map((row) => (
              <div key={row.key} className="grid gap-2 rounded-3xl border border-[var(--app-border)] bg-[var(--navy4)] p-4 md:grid-cols-[220px_1fr_auto] md:items-center">
                <p className="font-mono text-sm font-bold text-[var(--c-blue)]">{row.key}</p>
                <p className="text-sm text-[var(--text2)]">{row.detail}</p>
                <StatusPill tone={row.value === 'missing' ? 'red' : 'green'}>{row.value}</StatusPill>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-[var(--app-border)] pt-6">
            <SectionTitle eyebrow="Connection" title="Supabase live status" body="Live connection status to the Supabase backend." />
            <div className="mt-4 flex items-center gap-4">
              <StatusPill tone={dbStatus === 'checking' ? 'gold' : dbStatus === 'connected' ? 'green' : 'red'}>
                {dbStatus === 'checking' ? 'Checking...' : dbStatus === 'connected' ? 'Connected' : 'Unreachable'}
              </StatusPill>
              {teamCount !== null && (
                <span className="text-sm text-[var(--text3)]">
                  {teamCount} team{teamCount === 1 ? '' : 's'} seeded
                </span>
              )}
            </div>
          </div>
        </Panel>

        <Panel className="p-6">
          <SectionTitle eyebrow="Preferences" title="Display settings" body="Display and account preferences require backend auth to be fully configured. Theme toggles and Discord account linking will appear here once available." />
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-[var(--app-border)] bg-[var(--navy4)] px-3 py-1 text-xs font-semibold text-[var(--text3)]">
              Theme: Dark
            </span>
            <span className="rounded-full border border-[var(--app-border)] bg-[var(--navy4)] px-3 py-1 text-xs font-semibold text-[var(--text3)]">
              Auth: Discord
            </span>
          </div>
        </Panel>
      </section>
    </div>
    </RequireRole>
  );
}
