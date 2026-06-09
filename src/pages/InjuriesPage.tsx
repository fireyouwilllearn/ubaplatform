import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Panel, PageHeader, MetricCard, SectionTitle } from '../components/Panel';
import { fetchInjuries } from '../lib/db';
import type { Injury } from '../types/domain';

const severityStyles: Record<string, string> = {
  'day-to-day': 'bg-[var(--c-blue)]/15 text-[var(--c-blue)]',
  questionable: 'bg-[var(--c-amber)]/15 text-[var(--c-amber)]',
  out: 'bg-[var(--c-red)]/15 text-[var(--c-red)]',
  'season-ending': 'bg-[var(--c-red)]/30 text-[var(--c-red)]',
};

function InjuryCard({ injury }: { injury: Injury }) {
  return (
    <div className={`rounded-xl border p-4 ${
      injury.status === 'active'
        ? 'border-[var(--app-border)] bg-[var(--navy4)]'
        : 'border-[var(--c-green)]/20 bg-[var(--c-green)]/5'
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${severityStyles[injury.severity] ?? ''}`}>
              {injury.severity}
            </span>
            <span className="text-xs text-[var(--text3)]">{injury.bodyPart}</span>
          </div>
          <div className="font-semibold">
            {injury.player ? (
              <Link to={`/player-profile/${injury.player.id}`} className="hover:underline text-[var(--text1)]">
                {injury.player.gamertag}
              </Link>
            ) : (
              <span className="text-[var(--text1)]">Unknown Player</span>
            )}
          </div>
          <div className="mt-1 text-sm text-[var(--text3)]">{injury.injuryType}</div>
          {injury.description && (
            <div className="mt-1 text-sm text-[var(--text3)]">{injury.description}</div>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-[var(--text3)]">
        <span>Reported: {new Date(injury.injuredAt).toLocaleDateString()}</span>
        {injury.expectedReturn && (
          <span>Est. return: {new Date(injury.expectedReturn).toLocaleDateString()}</span>
        )}
        {injury.recoveredAt && (
          <span className="text-[var(--c-green)]">Recovered: {new Date(injury.recoveredAt).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
}

export function InjuriesPage() {
  useDocumentTitle('Injury Report');
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecovered, setShowRecovered] = useState(false);

  useEffect(() => {
    fetchInjuries().then(data => {
      setInjuries(data);
      setLoading(false);
    });
  }, []);

  const active = useMemo(() => injuries.filter(i => i.status === 'active'), [injuries]);
  const recovered = useMemo(() => injuries.filter(i => i.status === 'recovered'), [injuries]);
  const displayed = showRecovered ? recovered : active;
  const severityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    active.forEach(i => { counts[i.severity] = (counts[i.severity] ?? 0) + 1; });
    return counts;
  }, [active]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Injury Report"
          kicker="Player Health Status"
          description="Track player injuries across the league."
        />
        <div className="py-12 text-center text-[var(--text3)]">Loading injuries...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Injury Report"
        kicker="Player Health Status"
        description="Track player injuries across the league. Severity levels: day-to-day, questionable, out, season-ending."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Active Injuries" value={String(active.length)} detail="Currently out" />
        <MetricCard label="Day-to-Day" value={String(severityCounts['day-to-day'] ?? 0)} detail="Minor" />
        <MetricCard label="Questionable" value={String(severityCounts['questionable'] ?? 0)} detail="Uncertain" />
        <MetricCard label="Out" value={String((severityCounts['out'] ?? 0) + (severityCounts['season-ending'] ?? 0))} detail="Definitely out" />
      </div>

      <div className="flex items-center gap-2">
        <SectionTitle eyebrow="Status" title={showRecovered ? 'Recovered Injuries' : 'Active Injuries'} />
        <button
          type="button"
          onClick={() => setShowRecovered(!showRecovered)}
          className="rounded-full border border-[var(--app-border)] px-3 py-1 text-xs text-[var(--text3)] transition hover:border-[var(--app-border)]"
        >
          {showRecovered ? 'Show Active' : 'Show Recovered'}
        </button>
      </div>

      <div className="grid gap-3">
        {displayed.map(injury => (
          <InjuryCard key={injury.id} injury={injury} />
        ))}
        {displayed.length === 0 && (
          <output aria-live="polite" className="block py-12 text-center text-[var(--text3)]">
            {showRecovered ? 'No recovered injuries recorded.' : 'No active injuries.'}
          </output>
        )}
      </div>
    </div>
  );
}
