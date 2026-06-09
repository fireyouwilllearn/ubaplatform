import type { ReactNode } from 'react';
import { useAuth } from '../lib/auth';
import { Panel, SectionTitle } from './Panel';

export function RequireRole({ requiredRole, children }: { requiredRole: 'admin' | 'gm'; children: ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <Panel className="p-6 sm:p-8">
        <SectionTitle eyebrow="Access check" title="Verifying permissions…" />
      </Panel>
    );
  }

  if (!user) {
    return (
      <Panel className="p-6 sm:p-8">
        <SectionTitle eyebrow="Access denied" title="Sign in required." />
        <p className="mt-2 text-sm text-[var(--text2)]">You need to sign in with Discord to access this page.</p>
      </Panel>
    );
  }

  if (!profile || profile.role !== requiredRole) {
    return (
      <Panel className="p-6 sm:p-8">
        <SectionTitle eyebrow="Access denied" title="Not authorized." />
        <p className="mt-2 text-sm text-[var(--text2)]">This area requires the <strong>{requiredRole}</strong> role.</p>
      </Panel>
    );
  }

  return children;
}
