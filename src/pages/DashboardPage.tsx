import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { cssProps } from '../lib/cssProps';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { fetchDashboardStats, fetchStandingsWithTeams } from '../lib/db';
import type { DashboardStats } from '../lib/db';
import type { StandingWithTeam, Team } from '../types/domain';

type BadgeTone = 'gold' | 'green' | 'blue' | 'red' | 'amber';

const badgeTones: Record<string, BadgeTone> = {
  'Clinched': 'green',
  'Admin': 'red',
  'Locked': 'amber',
  'Next': 'green',
  'Pending': 'amber',
  'Ready': 'gold',
  'Read only': 'amber',
  'Hunt': 'blue',
};

function badgeFor(label: string) {
  const tone = badgeTones[label] || 'gold';
  return { tone, class: `badge badge-${tone}` };
}

function statusIconClass(status: string) {
  if (status === 'Admin') return 'queue-icon-admin';
  if (status === 'Locked') return 'queue-icon-locked';
  return 'queue-icon-next';
}

function CountUp({ target, active }: { target: number; active: boolean }) {
  const [value, setValue] = useState(active ? 0 : target);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!active || target === 0) {
      setValue(target);
      return;
    }
    const startTime = performance.now();
    const duration = 800;

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 2);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    }

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [active, target]);

  return <>{value}</>;
}

function ShimmerStat({ show }: { show: boolean }) {
  if (show) {
    return <div className="shimmer" />;
  }
  return null;
}

export function DashboardPage() {
  useDocumentTitle('Home');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [standings, setStandings] = useState<StandingWithTeam[]>([]);
  const [alert, setAlert] = useState<{ icon: string; label: string; desc: string; href: string } | null>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [s, standingData] = await Promise.all([
        fetchDashboardStats(),
        fetchStandingsWithTeams(),
      ]);
      if (cancelled) return;
      setStats(s);
      setStandings(standingData);

      if (s.pendingTrades > 0) {
        setAlert({ icon: 'ti ti-arrows-exchange', label: 'Trade Proposal', desc: `from ${s.pendingTrades} team${s.pendingTrades > 1 ? 's' : ''} · Pending review`, href: '/trades' });
      } else if (s.pendingImportCount > 0) {
        setAlert({ icon: 'ti ti-file-import', label: 'Pending Imports', desc: `${s.pendingImportCount} row${s.pendingImportCount > 1 ? 's' : ''} waiting for review`, href: '/import-review' });
      }

      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (loading) return;
    const entranceCards = cardsRef.current?.querySelectorAll<HTMLElement>('.entrance-card');
    if (!entranceCards) return;
    entranceCards.forEach((card, i) => {
      card.style.setProperty('--entrance-delay', `${i * 50}ms`);
      requestAnimationFrame(() => card.classList.add('animate-in'));
    });
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    const container = cardsRef.current;
    if (!container) return;

    function handleMouseMove(e: MouseEvent) {
      const card = (e.target as HTMLElement).closest<HTMLElement>('.cmd-card');
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mx', `${x}%`);
      card.style.setProperty('--my', `${y}%`);
    }

    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, [loading]);

  const topTeams = standings
    .filter(s => s.conferenceRank <= 4)
    .slice()
    .sort((a, b) => {
      const order = { West: 0, East: 1 };
      const ac = order[a.team.conference ?? 'East'];
      const bc = order[b.team.conference ?? 'East'];
      return ac - bc || a.conferenceRank - b.conferenceRank;
    });

  const statCards = stats ? [
    { label: 'Sheets linked', value: stats.sheetsLinked, sub: 'All UBA clubs have registered sources.', countup: true },
    { label: 'Player profiles', value: stats.playerCount, sub: 'Live profiles from promoted rows.', countup: true },
    { label: 'Active roster spots', value: stats.activeRosterCount, sub: `${stats.nxtTeamCount} NXT teams affiliated.`, countup: true },
  ] : [];

  const workQueue = [
    { label: 'Roster promotion', value: stats?.pendingImportCount ?? '—', detail: 'Promote only rows that pass validation and tendency checks.', href: '/import-review', status: (stats?.pendingImportCount ?? 0) > 0 ? 'Pending' : 'Ready', icon: 'ti ti-file-import' },
    { label: 'Roster control', value: 'Club sheets', detail: 'Inspect team membership before any roster write opens.', href: '/roster-management', status: 'Locked', icon: 'ti ti-shield-check' },
    { label: 'UC guardrails', value: 'Ledger first', detail: 'Rewards and upgrades wait for audited UC events.', href: '/calculator', status: 'Next', icon: 'ti ti-activity' },
  ];

  return (
    <div ref={cardsRef}>
      <section className="hero-section px-6 sm:px-6">
        <p className="hero-kicker">Command center</p>
        <h1 className="hero-title">Command Board</h1>
        <p className="hero-sub">
          Run the UBA from a clear operations view: seed races, sheet imports, admin gates, and league notes without fake roster data.
        </p>
        <div className="hero-bottom">
          <span />
          <Link to="/standings" className="hero-rebuild">Full standings →</Link>
        </div>
      </section>

      {alert && (
        <div className="px-6 sm:px-6 section-gap">
          <Link to={alert.href} className="alert-banner entrance-card" style={cssProps({ '--entrance-delay': '0ms' })}>
            <span className="alert-dot" />
            <i className={alert.icon} style={{ fontSize: '14px', color: 'var(--color-uba-gold)' }} />
            <span className="alert-label">{alert.label}</span>
            <span className="alert-desc">{alert.desc}</span>
            <span className="alert-cta">View ›</span>
          </Link>
        </div>
      )}

      <div className="stats-grid section-gap">
        {statCards.map((stat, i) => (
          <div key={stat.label} className="cmd-card entrance-card" style={cssProps({ '--entrance-delay': `${i * 50}ms` })}>
            <p className="card-section-label">{stat.label}</p>
            <div className="stat-value" data-countup={stat.countup ? stat.value : undefined}>
              {loading ? (
                <ShimmerStat show />
              ) : (
                <span>
                  <CountUp target={stat.value} active={!loading && stat.countup} />
                </span>
              )}
            </div>
            <p className="stat-label">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="main-grid section-gap">
        <div className="cmd-card entrance-card" style={cssProps({ '--entrance-delay': '150ms' })}>
          <p className="card-section-label">Seed control</p>
          <h2 className="card-title">Conference Leaders</h2>
          <div className="gold-divider" />
          <div>
            {loading ? (
              <div className="px-4 py-6 text-center text-sm text-[var(--text3)]">Loading standings…</div>
            ) : topTeams.length === 0 ? (
              <output aria-live="polite" className="block px-4 py-6 text-center text-sm text-[var(--text3)]">No standings data yet.</output>
            ) : (
              topTeams.map((standing) => {
                const badge = badgeFor(standing.status === 'clinched' ? 'Clinched' : standing.status === 'eliminated' ? 'Locked' : 'Hunt');
                return (
                  <div key={standing.teamId} className="standings-row">
                    <span className={`seed-num ${standing.conferenceRank === 1 ? 'first' : ''}`}>#{standing.conferenceRank}</span>
                    <span className="team-name">{standing.team.name}</span>
                    <span className="team-conf">{standing.team.conference ?? 'UBA'}</span>
                    <span className={badge.class}>
                      <span className="badge-dot" />
                      {standing.status === 'clinched' ? 'Clinched' : standing.status === 'eliminated' ? 'Locked' : 'Hunt'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          <div className="gold-divider" />
          <Link to="/standings" className="btn-outline w-full justify-center">
            All standings
          </Link>
        </div>

        <div className="cmd-card entrance-card" style={cssProps({ '--entrance-delay': '200ms' })}>
          <p className="card-section-label">Admin runway</p>
          <h2 className="card-title">Work Queue</h2>
          <div className="gold-divider" />
          <div>
            {workQueue.map((item) => {
              const badge = badgeFor(item.status);
              return (
                <Link key={item.label} to={item.href} className="queue-item">
                  <span className={`queue-icon ${statusIconClass(item.status)}`}><i className={item.icon} /></span>
                  <div className="min-w-0">
                    <p className="queue-name">{item.label}</p>
                    <p className="queue-sub">{item.detail}</p>
                  </div>
                  <div className="queue-right">
                    <span className={badge.class}>
                      <span className="badge-dot" />
                      {item.status === 'Pending' ? `${item.value} pending` : item.status}
                    </span>
                    <span className="text-[var(--text3)] text-xs">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="gold-divider" />
          <Link to="/import-review" className="btn-primary w-full justify-center">
            Open import room
          </Link>
        </div>
      </div>

      <div className="main-grid section-gap" style={{ paddingBottom: '2rem' }}>
        <div className="cmd-card entrance-card" style={cssProps({ '--entrance-delay': '250ms' })}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="card-section-label">League wire</p>
              <h2 className="card-title">Pinned Office Notes</h2>
            </div>
            <span className="badge badge-amber">
              <span className="badge-dot" />
              Read only
            </span>
          </div>
          <div className="gold-divider" />
          <output aria-live="polite" className="block px-4 py-6 text-center text-sm text-[var(--text3)]">
            No announcements yet. Check back later.
          </output>
        </div>

        <div className="cmd-card entrance-card" style={cssProps({ '--entrance-delay': '300ms' })}>
          <p className="card-section-label">Quick actions</p>
          <h2 className="card-title">Launch Pad</h2>
          <div className="gold-divider" />
          <div>
            <Link to="/schedule" className="launch-row">
              <span className="launch-icon"><i className="ti ti-calendar" /></span>
              <div>
                <p className="queue-name">Schedule</p>
                <p className="queue-sub">Match calendar</p>
              </div>
              <span className="launch-arrow">→</span>
            </Link>
            <Link to="/standings" className="launch-row">
              <span className="launch-icon"><i className="ti ti-trophy" /></span>
              <div>
                <p className="queue-name">Standings</p>
                <p className="queue-sub">Seed races</p>
              </div>
              <span className="launch-arrow">→</span>
            </Link>
            <Link to="/teams" className="launch-row">
              <span className="launch-icon"><i className="ti ti-users" /></span>
              <div>
                <p className="queue-name">Teams</p>
                <p className="queue-sub">Club rosters</p>
              </div>
              <span className="launch-arrow">→</span>
            </Link>
            <Link to="/trades" className="launch-row">
              <span className="launch-icon"><i className="ti ti-arrows-exchange" /></span>
              <div>
                <p className="queue-name">Trades</p>
                <p className="queue-sub">Proposals</p>
              </div>
              <span className="launch-arrow">→</span>
            </Link>
          </div>
          <div className="gold-divider" />
          <p className="card-sub text-center">Season 2026 is live</p>
        </div>
      </div>
    </div>
  );
}
