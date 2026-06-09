import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { PageHeader, Panel, SectionTitle, StatusPill } from '../components/Panel';
import { RequireRole } from '../components/RequireRole';
import { fetchAuditEvents } from '../lib/db';
import { permissionMatrix } from '../data/league';
import type { AuditEvent } from '../types/domain';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { supabase } from '../lib/supabase';
import { isSupabaseReady } from '../lib/supabase';

const workflows = [
  {
    title: 'Roster import approval',
    body: 'Review staged sheet rows, validate player data, and promote to canonical tables.',
    route: '/import-review',
    status: 'live' as const,
  },
  {
    title: 'Bank to UC Ledger',
    body: 'Promote imported bank values (check-ins, contracts, purchases) into the append-only UC ledger.',
    route: '/import-review',
    status: 'live' as const,
  },
  {
    title: 'Manual tendencies',
    body: 'Set 99 tendency values for players whose sheets have missing or placeholder tendency data.',
    route: '/import-review',
    status: 'live' as const,
  },
  {
    title: 'UC ledger adjustment',
    body: 'Grant, spend, refund, and weekly check-in approvals must write append-only ledger events.',
    gate: 'Needs admin grant/spend UI',
    status: 'planned' as const,
  },
  {
    title: 'Team assets and private files',
    body: 'Approve logos, jerseys, GM playbooks, images, and player media through storage buckets with role-scoped policies.',
    gate: 'Needs storage policy UI',
    status: 'planned' as const,
  },
];

export function AdminPage() {
  useDocumentTitle('Admin');
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    fetchAuditEvents()
      .then(setEvents)
      .finally(() => setEventsLoading(false));
  }, []);

  return (
    <RequireRole requiredRole="admin">
    <div className="grid gap-5">
      <PageHeader
        kicker="Admin control"
        title="Admin controls."
        description="Administrative tools for league operations, permissions, and audit logs."
        meta="Admin access required"
      />

      <section className="grid gap-4 lg:grid-cols-3">
        {workflows.map((wf) => (
          <Panel key={wf.title} className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <SectionTitle
                eyebrow={wf.status === 'live' ? 'Live workflow' : 'Disabled workflow'}
                title={wf.title}
                body={wf.body}
              />
              <StatusPill tone={wf.status === 'live' ? 'green' : 'red'}>{wf.status === 'live' ? 'Live' : 'Locked'}</StatusPill>
            </div>
            {wf.status === 'live' ? (
              <Link
                to={wf.route}
                className="mt-6 flex w-full items-center justify-center rounded-full border border-uba-gold/30 bg-uba-gold/15 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-uba-gold-light transition hover:bg-uba-gold/25"
              >
                Open import review
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="mt-6 w-full cursor-not-allowed rounded-full border border-[var(--app-border)] bg-[var(--navy4)] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-app-muted"
              >
                {wf.gate}
              </button>
            )}
          </Panel>
        ))}
      </section>

      <Panel className="p-6 sm:p-8">
        <SectionTitle
          eyebrow="Data Import"
          title="Re-import tools"
          body="Trigger data re-imports from Google Sheets. Results appear in the audit log."
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--navy4)] p-5">
            <p className="font-black text-[var(--text)]">S3 Player Stats</p>
            <p className="mt-1 text-sm text-[var(--text3)]">Re-import 218 player stat lines from the S3 sheet.</p>
            <button
              type="button"
              onClick={async () => {
                if (!isSupabaseReady) return;
                const res = await fetch(
                  'https://xxtunagxgsznhijrodfa.supabase.co/functions/v1/sync-s3-stats',
                  { headers: { Authorization: `Bearer ${(await supabase!.auth.getSession()).data.session?.access_token ?? ''}` } }
                );
                const data = await res.json();
                alert(`Stats import: ${data.inserted} inserted, ${data.updated} updated, ${data.errors} errors`);
              }}
              className="mt-4 w-full rounded-full border border-uba-gold/30 bg-uba-gold/15 px-4 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-uba-gold-light transition hover:bg-uba-gold/25"
            >
              Re-import stats
            </button>
          </div>
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--navy4)] p-5">
            <p className="font-black text-[var(--text)]">S3 Standings</p>
            <p className="mt-1 text-sm text-[var(--text3)]">Refresh S3 conference standings from the master sheet.</p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText('npm run sheets:sync -- --source "S3 standings" --write');
                alert('Command copied to clipboard. Run it from the project root.');
              }}
              className="mt-4 w-full rounded-full border border-[var(--app-border)] bg-[var(--navy4)] px-4 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-[var(--text3)] transition hover:text-[var(--text)]"
            >
              Copy CLI command
            </button>
          </div>
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--navy4)] p-5">
            <p className="font-black text-[var(--text)]">Team Sheets</p>
            <p className="mt-1 text-sm text-[var(--text3)]">Re-sync all active team-owned Google Sheets.</p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText('npm run sheets:sync:write');
                alert('Command copied to clipboard. Run it from the project root.');
              }}
              className="mt-4 w-full rounded-full border border-[var(--app-border)] bg-[var(--navy4)] px-4 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-[var(--text3)] transition hover:text-[var(--text)]"
            >
              Copy CLI command
            </button>
          </div>
        </div>
      </Panel>

      <Panel className="overflow-hidden p-0">
        <div className="border-b border-[var(--app-border)] p-6 sm:p-8">
          <SectionTitle eyebrow="Permission model" title="Minimum access matrix" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className="bg-[var(--navy4)] text-xs uppercase tracking-[0.22em] text-[var(--text3)]">
              <tr>
                <th className="px-6 py-4">Area</th>
                <th className="px-6 py-4">Player</th>
                <th className="px-6 py-4">GM</th>
                <th className="px-6 py-4">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--app-border)]">
              {permissionMatrix.map((row) => (
                <tr key={row.area} className="bg-[var(--navy4)]/50">
                  <td className="px-6 py-5 font-black text-[var(--text)]">{row.area}</td>
                  <td className="px-6 py-5 text-[var(--text2)]">{row.player}</td>
                  <td className="px-6 py-5 text-[var(--text2)]">{row.gm}</td>
                  <td className="px-6 py-5 text-[var(--text2)]">{row.admin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel className="p-6 sm:p-8">
        <SectionTitle
          eyebrow="Audit trail"
          title="Recent events"
          body={eventsLoading ? 'Loading...' : `${events.length} most recent audit events`}
        />
        {eventsLoading ? (
          <p className="mt-6 text-sm text-app-muted">Loading audit events...</p>
        ) : events.length === 0 ? (
          <p role="status" aria-live="polite" className="mt-6 text-sm leading-6 text-app-muted">
            No audit events found. Events are created when admins promote players, process bank data, or perform other actions via RPCs.
          </p>
        ) : (
          <div className="mt-6 grid gap-3">
            {events.map((event) => (
              <div key={event.id} className="grid gap-3 rounded-3xl border border-[var(--app-border)] bg-[var(--navy4)] p-4 md:grid-cols-[140px_1fr_auto] md:items-center">
                <p className="text-sm font-bold text-[var(--text3)]">{event.date}</p>
                <div>
                  <p className="font-black text-[var(--text)]">{event.action}</p>
                  <p className="mt-1 text-sm text-[var(--text3)]">{event.actor} / {event.target}</p>
                </div>
                <StatusPill tone={event.severity === 'locked' ? 'red' : event.severity === 'review' ? 'gold' : 'blue'}>{event.severity}</StatusPill>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
    </RequireRole>
  );
}
