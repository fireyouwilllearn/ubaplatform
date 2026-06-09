import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader, MetricCard, SectionTitle } from '../components/Panel';
import { fetchTradeProposals } from '../lib/db';
import type { TradeProposal } from '../types/domain';
import { mainLeagueTeams } from '../data/league';

const statusStyles: Record<string, string> = {
  pending: 'border-[var(--c-amber)]/30 bg-[var(--c-amber)]/10 text-[var(--c-amber)]',
  approved: 'border-[var(--c-green)]/30 bg-[var(--c-green)]/10 text-[var(--c-green)]',
  declined: 'border-[var(--c-red)]/30 bg-[var(--c-red)]/10 text-[var(--c-red)]',
  withdrawn: 'border-[var(--app-border)] bg-[var(--navy4)] text-[var(--text3)]',
};

function TradeCard({ trade }: { trade: TradeProposal }) {
  const proposerTeam = mainLeagueTeams.find(t => t.id === trade.proposerTeamId);
  const receiverTeam = mainLeagueTeams.find(t => t.id === trade.receiverTeamId);

  return (
    <div className={`rounded-xl border p-4 ${statusStyles[trade.status] ?? ''}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded bg-[var(--navy4)] px-2 py-0.5 text-xs font-medium uppercase tracking-wider">
          {trade.status}
        </span>
        <span className="text-xs text-[var(--text3)]">
          {new Date(trade.proposedAt).toLocaleDateString()}
        </span>
      </div>

      <div className="space-y-3">
        <div className="rounded-lg bg-[var(--navy4)] p-3">
          <div className="mb-1 text-xs font-medium text-[var(--text3)]">PROPOSER</div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full" style={{ backgroundColor: proposerTeam?.primaryColor ?? '#666' }} />
            {proposerTeam ? (
              <Link to={`/teams/${proposerTeam.id}`} className="font-semibold hover:underline">
                {proposerTeam.name}
              </Link>
            ) : (
              <span className="font-semibold">Unknown Team</span>
            )}
          </div>
          <div className="mt-2 space-y-1 text-sm text-[var(--text)]">
            {trade.proposerSendsPlayerIds.length > 0 && (
              <div>Sends: {trade.proposerSendsPlayerIds.length} player(s)</div>
            )}
            {trade.proposerSendsUcAmount > 0 && (
              <div>Sends: {trade.proposerSendsUcAmount} UC</div>
            )}
          </div>
        </div>

        <div className="flex justify-center text-[var(--text3)]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
        </div>

        <div className="rounded-lg bg-[var(--navy4)] p-3">
          <div className="mb-1 text-xs font-medium text-[var(--text3)]">RECEIVER</div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full" style={{ backgroundColor: receiverTeam?.primaryColor ?? '#666' }} />
            {receiverTeam ? (
              <Link to={`/teams/${receiverTeam.id}`} className="font-semibold hover:underline">
                {receiverTeam.name}
              </Link>
            ) : (
              <span className="font-semibold">Unknown Team</span>
            )}
          </div>
          <div className="mt-2 space-y-1 text-sm text-[var(--text)]">
            {trade.receiverSendsPlayerIds.length > 0 && (
              <div>Sends: {trade.receiverSendsPlayerIds.length} player(s)</div>
            )}
            {trade.receiverSendsUcAmount > 0 && (
              <div>Sends: {trade.receiverSendsUcAmount} UC</div>
            )}
          </div>
        </div>
      </div>

      {trade.adminNotes && (
        <div className="mt-3 rounded bg-[var(--navy4)] p-2 text-xs text-[var(--text3)]">
          Note: {trade.adminNotes}
        </div>
      )}
    </div>
  );
}

export function TradesPage() {
  useDocumentTitle('Trade System');
  const [proposals, setProposals] = useState<TradeProposal[]>([]);

  useEffect(() => {
    fetchTradeProposals().then(setProposals);
  }, []);

  const pending = proposals.filter(t => t.status === 'pending');
  const approved = proposals.filter(t => t.status === 'approved');
  const declined = proposals.filter(t => t.status === 'declined');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trade System"
        kicker="Proposals & Approvals"
        description="Trade proposals require admin approval. GM accounts can view their team's proposals and submit new ones."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCard label="Pending" value={String(pending.length)} detail="Awaiting review" />
        <MetricCard label="Approved" value={String(approved.length)} detail="Completed trades" />
        <MetricCard label="Declined" value={String(declined.length)} detail="Rejected proposals" />
      </div>

      <SectionTitle eyebrow="Active" title="Pending Proposals" />
      <div className="grid gap-4">
        {pending.map(trade => (
          <TradeCard key={trade.id} trade={trade} />
        ))}
        {pending.length === 0 && (
          <output aria-live="polite" className="block py-8 text-center text-[var(--text3)]">No pending trade proposals.</output>
        )}
      </div>

      <SectionTitle eyebrow="History" title="Past Proposals" />
      <div className="grid gap-4">
        {[...approved, ...declined].map(trade => (
          <TradeCard key={trade.id} trade={trade} />
        ))}
      </div>
    </div>
  );
}
