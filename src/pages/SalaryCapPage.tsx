import { useEffect, useMemo, useState } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader, MetricCard, SectionTitle } from '../components/Panel';
import { fetchTeamSalarySummaries, fetchSalaryCapConfig } from '../lib/db';
import type { TeamSalarySummary } from '../lib/db';

const UC_PER_M = 1000;

function fmtM(uc: number): string {
  return `${(uc / UC_PER_M).toFixed(1)}M`;
}

function fmtCompact(uc: number): string {
  if (uc >= UC_PER_M) return fmtM(uc);
  return `${uc.toLocaleString()} UC`;
}

function CapBar({ summary, capAmount, luxuryThreshold }: { summary: TeamSalarySummary; capAmount: number; luxuryThreshold: number | null }) {
  const total = summary.totalContracts;
  const capPct = Math.min((total / capAmount) * 100, 100);
  const overCap = total > capAmount;
  const overLuxury = luxuryThreshold !== null && total > luxuryThreshold;

  return (
    <div className="rounded-xl border border-[var(--app-border)] bg-[var(--navy4)] p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: summary.team.primaryColor }} />
          <span className="font-semibold text-[var(--text)]">{summary.team.shortName}</span>
        </div>
        <div className="text-right text-xs">
          <div className="font-medium text-[var(--text)]">
            {fmtCompact(total)} / {fmtCompact(capAmount)}
          </div>
          <div className={overLuxury ? 'text-[var(--c-red)]' : overCap ? 'text-yellow-500' : 'text-[var(--text3)]'}>
            {overLuxury
              ? `LUXURY — ${fmtCompact(total - luxuryThreshold!)} over`
              : overCap
                ? `${fmtCompact(total - capAmount)} over cap`
                : `${fmtCompact(capAmount - total)} available`}
          </div>
        </div>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-[var(--navy4)]">
        <div
          className={`h-full rounded-full transition-all ${
            overLuxury ? 'bg-red-500' : overCap ? 'bg-yellow-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${capPct}%` }}
        />
        {luxuryThreshold !== null && (
          <div
            className="absolute top-0 h-full w-0.5 bg-red-300"
            style={{ left: `${Math.min((luxuryThreshold / capAmount) * 100, 100)}%` }}
            title={`Luxury tax threshold: ${fmtCompact(luxuryThreshold)}`}
          />
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-[var(--text3)]">
        <span>{summary.contractCount} contract(s)</span>
        <span>{summary.rosterSpots} / 11 UBA roster spots</span>
      </div>
    </div>
  );
}

export function SalaryCapPage() {
  useDocumentTitle('Salary Cap');
  const [selectedTier, setSelectedTier] = useState<'UBA' | 'NXT'>('UBA');
  const [config, setConfig] = useState<{ season: string; capAmount: number; luxuryTaxThreshold: number | null } | null>(null);
  const [summaries, setSummaries] = useState<TeamSalarySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [cfg, caps] = await Promise.all([
        fetchSalaryCapConfig('2026'),
        fetchTeamSalarySummaries(selectedTier),
      ]);
      if (cancelled) return;
      setConfig(cfg);
      setSummaries(caps);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [selectedTier]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Salary Cap" kicker="Team Finances" description="Loading cap data…" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="space-y-6">
        <PageHeader title="Salary Cap" kicker="Team Finances" description="No salary cap configured for current season." />
      </div>
    );
  }

  const capAmount = config.capAmount;
  const luxuryThreshold = config.luxuryTaxThreshold;
  const luxuryAmount = luxuryThreshold !== null ? luxuryThreshold - capAmount : null;

  const overCapTeams = summaries.filter(s => s.totalContracts > capAmount);
  const luxuryTeams = luxuryThreshold !== null ? summaries.filter(s => s.totalContracts > luxuryThreshold) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salary Cap"
        kicker="Team Finances"
        description="Track team salary cap usage across the league. Each team has a 150M cap (150,000 UC) with a 250M luxury tax threshold. Admin accounts can configure cap limits."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Season" value={config.season} detail="Current cap period" />
        <MetricCard label="Cap Amount" value={fmtCompact(capAmount)} detail={`${fmtCompact(capAmount)} per team`} />
        <MetricCard label="Luxury Threshold" value={luxuryThreshold !== null ? fmtCompact(luxuryThreshold) : 'N/A'} detail={luxuryAmount !== null ? `Cap + ${fmtCompact(luxuryAmount)}` : 'Not set'} />
        <MetricCard label="Roster Limit" value="11" detail="Max UBA players per team" />
      </div>

      <div className="rounded-xl border border-[var(--app-border)] bg-[var(--navy4)] p-4 text-sm text-[var(--text3)] space-y-1">
        <p><strong className="text-[var(--text)]">Roster structure:</strong> Up to 11 pro UBA players per team (including up to 3 two-way contracts) + 3 NXT-exclusive players.</p>
        <p><strong className="text-[var(--text)]">Rookie scale:</strong> FRPs: 15M/yr (2+1 TO). SRPs: 12M/yr (2+1 TO). UDFAs: 2–10M/yr base.</p>
        <p><strong className="text-[var(--text)]">Two-way:</strong> 2–5M/yr. <strong className="text-[var(--text)]">NXT affiliate:</strong> 1–3M/yr.</p>
        <p><strong className="text-[var(--text)]">Free agency:</strong> Contract offers based on career UC earnings (1M = 1000 UC), plus bonuses.</p>
        <p><strong className="text-[var(--text)]">Luxury tax:</strong> Teams exceeding {fmtCompact(luxuryAmount ?? 0)} over the cap ({fmtCompact(luxuryThreshold ?? 0)}) incur future-season roster restrictions.</p>
      </div>

      <div className="flex items-center gap-3">
        <SectionTitle eyebrow="Caps" title="Team Caps" />
        <div className="flex gap-1 rounded-lg border border-[var(--app-border)] p-0.5">
          <button
            type="button"
            onClick={() => setSelectedTier('UBA')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              selectedTier === 'UBA' ? 'bg-[var(--navy4)] text-[var(--text)]' : 'text-[var(--text3)] hover:text-[var(--text)]'
            }`}
          >
            UBA
          </button>
          <button
            type="button"
            onClick={() => setSelectedTier('NXT')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              selectedTier === 'NXT' ? 'bg-[var(--navy4)] text-[var(--text)]' : 'text-[var(--text3)] hover:text-[var(--text)]'
            }`}
          >
            NXT
          </button>
        </div>
      </div>

      {luxuryTeams.length > 0 && (
        <div className="rounded-xl border border-[var(--c-red)]/20 bg-[var(--c-red)]/5 p-3">
          <div className="mb-2 text-sm font-medium text-[var(--c-red)]">
            {luxuryTeams.length} team(s) in luxury tax territory — future roster restrictions apply
          </div>
          <div className="flex flex-wrap gap-2">
            {luxuryTeams.map(s => (
              <span key={s.team.id} className="rounded bg-[var(--c-red)]/10 px-2 py-0.5 text-xs text-[var(--c-red)]">
                {s.team.shortName} ({fmtCompact(s.totalContracts)})
              </span>
            ))}
          </div>
        </div>
      )}

      {overCapTeams.length > 0 && luxuryTeams.length === 0 && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3">
          <div className="mb-2 text-sm font-medium text-yellow-500">
            {overCapTeams.length} team(s) over the cap (below luxury threshold)
          </div>
          <div className="flex flex-wrap gap-2">
            {overCapTeams.map(s => (
              <span key={s.team.id} className="rounded bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-500">
                {s.team.shortName}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {summaries.map(summary => (
          <CapBar key={summary.team.id} summary={summary} capAmount={capAmount} luxuryThreshold={luxuryThreshold} />
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-[var(--app-border)] bg-[var(--navy4)] p-4">
        <p className="text-sm text-[var(--text3)]">
          Salary cap configuration is restricted to admin accounts. Adjust season caps, luxury tax thresholds, and team-specific values from the admin panel. All values displayed in UC (1M salary = 1,000 UC).
        </p>
      </div>
    </div>
  );
}
