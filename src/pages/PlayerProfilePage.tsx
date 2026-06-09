import { useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { useParams } from 'react-router';
import { HalfCourtHotZones } from '../components/HalfCourtHotZones';
import { MetricCard, PageHeader, Panel, SectionTitle, StatusPill } from '../components/Panel';
import { UbaPlayerScoreBadge } from '../components/UbaPlayerScoreBadge';
import { fetchPlayerBySlug } from '../lib/db';
import { useAuth } from '../lib/auth';
import type { Player } from '../types/domain';
import { allTendencyNames } from '../types/domain';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const buckets = [
  { key: 'finishing', label: 'Finishing', color: 'from-uba-blue to-teal-400' },
  { key: 'shooting', label: 'Shooting', color: 'from-uba-gold to-amber-400' },
  { key: 'playmaking', label: 'Playmaking', color: 'from-uba-blue-light to-uba-gold' },
  { key: 'defense', label: 'Defense', color: 'from-red-400 to-rose-400' },
  { key: 'physicals', label: 'Physicals', color: 'from-emerald-400 to-green-400' },
] as const;

type PlayerState = { tag: 'loading' } | { tag: 'loaded'; player: Player } | { tag: 'empty' };

function playerReducer(_state: PlayerState, action: { type: 'load' } | { type: 'done'; player: Player | null } | { type: 'error' }): PlayerState {
  switch (action.type) {
    case 'load': return { tag: 'loading' };
    case 'done': return action.player ? { tag: 'loaded', player: action.player } : { tag: 'empty' };
    case 'error': return { tag: 'empty' };
  }
}

function formatHeight(inches: number) {
  return `${Math.floor(inches / 12)}'${inches % 12}"`;
}

function gradeLabel(value: number) {
  if (value >= 90) return 'Elite';
  if (value >= 80) return 'High impact';
  if (value >= 70) return 'Reliable';
  if (value >= 60) return 'Developing';
  return 'Raw';
}

function badgeRole(badge: string): 'scoring' | 'shooting' | 'defense' | 'playmaking' | 'physical' {
  const b = badge.toLowerCase();
  if (/(wall|menace|rebound|boxout|enforcer|lockdown|challenger|denier|marksman)/.test(b)) return 'defense';
  if (/(range|shooter|fade|post|hook|poster|finisher|dunk|layup|aerial|paint)/.test(b)) return 'scoring';
  if (/(handle|dodger|off-ball|unpluckable|launch|game)/.test(b)) return 'playmaking';
  if (/(physical|pogo|immovable|slippery|high-flying)/.test(b)) return 'physical';
  return 'shooting';
}

const badgeRoleLabels = {
  scoring: 'Scoring',
  shooting: 'Shooting',
  defense: 'Defense',
  playmaking: 'Playmaking',
  physical: 'Physical',
} as const;

const hiddenTendencies = new Set(['Shot', 'Touches']);

function attributeGroup(name: string) {
  const n = name.toLowerCase();
  if (/(layup|dunk|post|close|standing|draw foul|offensive rebound)/.test(n)) return 'Finishing';
  if (/(mid|3pt|free throw|shot iq|offensive consistency)/.test(n)) return 'Shooting';
  if (/(ball handle|pass|hands)/.test(n)) return 'Playmaking';
  if (/(defense|block|steal|perception|help)/.test(n)) return 'Defense';
  if (/(speed|vertical|strength|stamina|hustle|agility)/.test(n)) return 'Physicals';
  return 'Other';
}

function tendencyGroup(name: string) {
  const n = name.toLowerCase();
  if (/(shot|jumper|three|mid|glass|fade|hook|floater)/.test(n)) return 'Shooting';
  if (/(layup|dunk|crash|putback|drive)/.test(n)) return 'Rim Pressure';
  if (/(post|back down|drop step|shimmy)/.test(n)) return 'Post';
  if (/(pass|dish|alley-oop pass)/.test(n)) return 'Passing';
  if (/(steal|contest|block|charge|interception|foul)/.test(n)) return 'Defense';
  if (/(triple threat|setup|dribble|iso)/.test(n)) return 'Creation';
  return 'Other';
}

function tendencyTone(value: number) {
  if (value >= 80) return {
    label: 'Prime signal',
    text: 'text-uba-gold',
    rail: 'from-uba-gold via-amber-300 to-emerald-300',
    fill: 'bg-uba-gold/10 border-uba-gold/30',
  };
  if (value >= 65) return {
    label: 'Strong lean',
    text: 'text-uba-blue-light',
    rail: 'from-uba-blue via-uba-blue-light to-uba-gold',
    fill: 'bg-uba-blue/10 border-uba-blue/30',
  };
  if (value <= 25) return {
    label: 'Avoids',
    text: 'text-rose-300',
    rail: 'from-rose-400 via-red-300 to-amber-300',
    fill: 'bg-rose-500/10 border-rose-300/30',
  };
  return {
    label: 'Balanced',
    text: 'text-[var(--text3)]',
    rail: 'from-slate-500 via-uba-blue to-uba-gold',
    fill: 'bg-[var(--navy4)] border-[var(--app-border)]',
  };
}

function DataBoard({ eyebrow, title, body, children, defaultOpen = true }: { eyebrow: string; title: string; body: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="panel-surface overflow-hidden p-0">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-5 border-b border-[var(--app-border)] bg-[var(--navy4)] p-5 transition hover:bg-[var(--app-card-strong)] [&::-webkit-details-marker]:hidden">
        <div>
          <p className="premium-label text-uba-gold">{eyebrow}</p>
          <h2 className="section-heading mt-2 text-3xl font-bold text-[var(--text)]">{title}</h2>
          <p className="mt-2 text-sm text-app-muted">{body}</p>
        </div>
        <span className="mt-1 rounded-full border border-[var(--app-border)] bg-[var(--background)] px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.16em] text-[var(--text3)]">
          Toggle
        </span>
      </summary>
      {children}
    </details>
  );
}

function BadgeTable({ badges }: { badges: string[] }) {
  const [sortKey, setSortKey] = useState<'badge' | 'role' | 'slot'>('slot');
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc');
  const counts = badges.reduce<Record<keyof typeof badgeRoleLabels, number>>((acc, badge) => {
    const role = badgeRole(badge);
    acc[role] += 1;
    return acc;
  }, { scoring: 0, shooting: 0, defense: 0, playmaking: 0, physical: 0 });

  const rows = useMemo(() => badges.map((badge, index) => ({
    badge,
    role: badgeRoleLabels[badgeRole(badge)],
    slot: index + 1,
  })), [badges]);

  const sorted = useMemo(() => rows.toSorted((a, b) => {
    const result = sortKey === 'slot' ? a.slot - b.slot : String(a[sortKey]).localeCompare(String(b[sortKey]));
    return direction === 'desc' ? -result : result;
  }), [rows, sortKey, direction]);

  function selectSort(next: typeof sortKey) {
    setDirection(current => (sortKey === next ? (current === 'asc' ? 'desc' : 'asc') : 'asc'));
    setSortKey(next);
  }

  return (
    <DataBoard eyebrow="Private badges" title="Badge table" body="Sortable equipped badge list with quick category totals.">
      <div className="grid gap-0 xl:grid-cols-[260px_1fr]">
        <div className="grid grid-cols-2 gap-0 border-b border-[var(--app-border)] xl:block xl:border-b-0 xl:border-r">
          {Object.entries(counts).map(([role, count]) => (
            <div key={role} className="border-r border-b border-[var(--app-border)] p-4 even:border-r-0 xl:border-r-0 xl:last:border-b-0">
              <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-app-muted">{badgeRoleLabels[role as keyof typeof badgeRoleLabels]}</p>
              <p className="mt-2 text-2xl font-black text-uba-gold">{count}</p>
            </div>
          ))}
        </div>
        <div className="max-h-[460px] overflow-auto">
          <table className="w-full min-w-[500px] table-fixed border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-[var(--navy4)] text-xs uppercase tracking-[0.18em] text-[var(--text3)]">
              <tr>
                {[
                  ['slot', '#'],
                  ['badge', 'Badge'],
                  ['role', 'Type'],
                ].map(([key, label]) => (
                  <th key={key} className={`${key === 'slot' ? 'w-[15%]' : key === 'badge' ? 'w-[55%]' : 'w-[30%]'} px-4 py-3`}>
                    <button type="button" onClick={() => selectSort(key as typeof sortKey)} className="inline-flex items-center gap-2 transition hover:text-[var(--text)]">
                      {label}
                      {sortKey === key && <span className="text-[0.55rem] uppercase text-uba-gold">{direction}</span>}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--app-border)]">
            {sorted.map((row: { badge: string; role: string; slot: number }) => (
                <tr key={row.badge} className="bg-[var(--app-card-strong)]">
                  <td className="px-4 py-3 text-sm font-black text-uba-gold">{String(row.slot).padStart(2, '0')}</td>
                  <td className="truncate px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-[var(--text)]" title={row.badge}>{row.badge}</td>
                  <td className="truncate px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text3)]" title={row.role}>{row.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DataBoard>
  );
}

function AttributeTable({ player }: { player: Player }) {
  const [sortKey, setSortKey] = useState<'name' | 'group' | 'value'>('value');
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc');
  const rows = useMemo(() => Object.entries(player.rawAttributes ?? {}).map(([name, value]) => ({
    name,
    value: Number(value ?? 0),
    group: attributeGroup(name),
  })), [player.rawAttributes]);

  const sorted = useMemo(() => rows.toSorted((a, b) => {
    const result = sortKey === 'value'
      ? b.value - a.value
      : String(a[sortKey]).localeCompare(String(b[sortKey]));
    return direction === 'desc' ? result : -result;
  }), [rows, sortKey, direction]);

  function selectSort(next: typeof sortKey) {
    setDirection(current => (sortKey === next ? (current === 'desc' ? 'asc' : 'desc') : next === 'value' ? 'desc' : 'asc'));
    setSortKey(next);
  }

  return (
    <DataBoard eyebrow="Private attributes" title="Current build table" body="Sortable detailed attributes. Visible only to this player, their current GM, and admins.">
      <div className="max-h-[520px] overflow-auto">
        <table className="w-full min-w-[520px] table-fixed border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-[var(--navy4)] text-xs uppercase tracking-[0.18em] text-[var(--text3)]">
            <tr>
              {[
                ['name', 'Attribute'],
                ['group', 'Group'],
                ['value', 'Rating'],
              ].map(([key, label]) => (
                  <th key={key} className={`${key === 'name' ? 'w-[44%]' : key === 'group' ? 'w-[24%]' : 'w-[32%]'} px-4 py-3`}>
                  <button type="button" onClick={() => selectSort(key as typeof sortKey)} className="inline-flex items-center gap-2 transition hover:text-[var(--text)]">
                    {label}
                    {sortKey === key && <span className="text-[0.55rem] uppercase text-uba-gold">{direction}</span>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--app-border)]">
            {sorted.map(row => (
              <tr key={row.name} className="bg-[var(--app-card-strong)]">
                <td className="truncate px-4 py-3 text-sm font-black text-[var(--text)]" title={row.name}>{row.name}</td>
                <td className="truncate px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text3)]" title={row.group}>{row.group}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-right text-sm font-black text-uba-gold">{row.value}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--navy4)]">
                      <div className="h-full rounded-full bg-gradient-to-r from-uba-blue via-uba-gold to-emerald-400" style={{ width: `${Math.min(row.value, 99)}%` }} />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DataBoard>
  );
}

function TendencyPanel({ player, canView, authLoading, isLoggedIn, onSignIn }: { player: Player; canView: boolean; authLoading: boolean; isLoggedIn: boolean; onSignIn: () => void }) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const entries = useMemo(() => allTendencyNames.reduce<{ name: string; group: string; value: number }[]>((acc, name) => {
    if (hiddenTendencies.has(name)) return acc;
    acc.push({ name, group: tendencyGroup(name), value: Number(player.tendencies?.[name] ?? 0) });
    return acc;
  }, []), [player.tendencies]);
  const loaded = canView && entries.some(entry => entry.value > 0);
  const average = loaded ? Math.round(entries.reduce((sum, entry) => sum + entry.value, 0) / entries.length) : 0;
  const signalEntries = useMemo(() => [...entries]
    .filter(entry => entry.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3), [entries]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof entries>();
    for (const entry of entries) {
      const list = map.get(entry.group) ?? [];
      list.push(entry);
      map.set(entry.group, list);
    }
    return [...map.entries()]
      .map(([group, list]) => ({
        group,
        entries: list.toSorted((a, b) => b.value - a.value),
        max: Math.max(...list.map(entry => entry.value)),
        average: Math.round(list.reduce((sum, entry) => sum + entry.value, 0) / list.length),
      }))
      .sort((a, b) => b.max - a.max || a.group.localeCompare(b.group));
  }, [entries]);
  const activeGroup = expandedGroup ?? groups[0]?.group ?? '';

  if (!canView) {
    return (
      <Panel className="p-6 sm:p-8">
        <SectionTitle eyebrow="Private tendencies" title="Locked scouting profile" body="Tendencies are only visible to this player, their current GM, and admins." />
        <div className="mt-6 rounded-3xl border border-[var(--app-border)] bg-[var(--navy4)] p-5">
          <p className="text-sm leading-7 text-app-muted">
            {authLoading ? 'Checking account access...' : isLoggedIn ? 'Your account is signed in, but it is not linked to this player or their team.' : 'Sign in with the linked Discord account to view private tendencies.'}
          </p>
          {!authLoading && !isLoggedIn && (
            <button type="button" onClick={onSignIn} className="mt-4 rounded-xl bg-uba-gold px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-uba-gold-text transition hover:opacity-90">
              Sign in
            </button>
          )}
        </div>
      </Panel>
    );
  }

  return (
    <DataBoard eyebrow="Private tendencies" title={loaded ? 'Scout tendency stack' : 'No tendency values found'} body="Private scouting signals by category. Shot and Touches are omitted because GMs can adjust them game to game.">
      {loaded && (
        <div className="grid gap-0 xl:grid-cols-[210px_1fr]">
          <div className="grid grid-cols-3 gap-0 border-b border-[var(--app-border)] xl:block xl:border-b-0 xl:border-r">
            {[
              ['Avg', average],
              ['High', entries.filter(e => e.value >= 75).length],
              ['Low', entries.filter(e => e.value <= 25).length],
            ].map(([label, value]) => (
              <div key={label} className="border-r border-[var(--app-border)] p-4 last:border-r-0 xl:border-b xl:border-r-0 xl:last:border-b-0">
                <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-app-muted">{label}</p>
                <p className="mt-2 text-3xl font-black text-uba-gold">{value}</p>
              </div>
            ))}
          </div>
          <div className="max-h-[660px] overflow-auto p-4 sm:p-5">
            <div className="overflow-hidden rounded-[1.75rem] border border-uba-gold/20 bg-[linear-gradient(145deg,var(--app-card-strong),var(--navy4))] shadow-[var(--shadow-menu)]">
              <div className="h-1 bg-gradient-to-r from-uba-gold via-uba-blue-light to-transparent" />
              <div className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-uba-gold">Scout view</p>
                    <h3 className="mt-1 text-2xl font-black uppercase tracking-[0.08em] text-[var(--text)]">Strongest Signals</h3>
                  </div>
                  <span className="rounded-full border border-[var(--app-border)] bg-[var(--background)] px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.14em] text-[var(--text3)]">
                    {entries.length} tracked
                  </span>
                </div>

                <div className="mt-5 grid gap-3 min-[980px]:grid-cols-3">
                  {signalEntries.map(entry => {
                    const tone = tendencyTone(entry.value);
                    return (
                      <article key={entry.name} className={`relative overflow-hidden rounded-2xl border p-4 ${tone.fill}`}>
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-[var(--background)]">
                          <div className={`h-full rounded-r-full bg-gradient-to-r ${tone.rail}`} style={{ width: `${Math.min(entry.value, 100)}%` }} />
                        </div>
                        <p className="text-[0.6rem] font-black uppercase tracking-[0.16em] text-app-muted">{tone.label}</p>
                        <div className="mt-2 flex items-end justify-between gap-3">
                          <p className="min-w-0 text-sm font-black uppercase tracking-[0.08em] text-[var(--text)]">{entry.name}</p>
                          <p className={`shrink-0 text-3xl font-black ${tone.text}`}>{entry.value}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>

              <div className="divide-y divide-[var(--app-border)] border-t border-[var(--app-border)]">
                {groups.map(group => {
                  const open = activeGroup === group.group;
                  return (
                    <section key={group.group}>
                      <button type="button" onClick={() => setExpandedGroup(open ? '' : group.group)} className="flex w-full items-center justify-between gap-4 bg-[var(--navy4)] px-4 py-4 text-left transition hover:bg-uba-gold/5 sm:px-5">
                        <div className="min-w-0">
                          <p className="text-base font-black uppercase tracking-[0.08em] text-[var(--text)]">{group.group}</p>
                          <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-app-muted">Avg {group.average} / Max {group.max} / {group.entries.length} signals</p>
                        </div>
                        <span className="shrink-0 rounded-full border border-[var(--app-border)] bg-[var(--background)] px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.14em] text-[var(--text3)]">
                          {open ? 'Hide' : 'Open'}
                        </span>
                      </button>
                      {open && (
                        <div className="grid gap-3 bg-[var(--app-card)] p-4 sm:p-5">
                          {group.entries.map((entry: { name: string; value: number; group: string }) => {
                            const tone = tendencyTone(entry.value);
                            return (
                              <div key={entry.name} className="rounded-2xl border border-[var(--app-border)] bg-[var(--background)] p-3">
                                <div className="flex items-start justify-between gap-4">
                                  <p className="min-w-0 text-sm font-black leading-5 text-[var(--text)]">{entry.name}</p>
                                  <p className={`w-10 shrink-0 text-right text-lg font-black ${tone.text}`}>{entry.value}</p>
                                </div>
                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--navy4)]">
                                  <div className={`h-full rounded-r-full bg-gradient-to-r ${tone.rail}`} style={{ width: `${Math.min(entry.value, 100)}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </DataBoard>
  );
}

export function PlayerProfilePage() {
  useDocumentTitle('Player Profile');
  const { slug } = useParams();
  const { profile, user, loading: authLoading, signIn } = useAuth();

  const [state, dispatch] = useReducer(playerReducer, { tag: 'loading' });

  useEffect(() => {
    if (!slug) { dispatch({ type: 'done', player: null }); return; }
    dispatch({ type: 'load' });
    fetchPlayerBySlug(slug, false)
      .then(found => dispatch({ type: 'done', player: found ?? null }))
      .catch(() => dispatch({ type: 'error' }));
  }, [slug]);

  const loadedPlayer = state.tag === 'loaded' ? state.player : null;
  const canViewPrivate = Boolean(
    loadedPlayer?.dbId && profile && (
      profile.role === 'admin'
      || profile.player_id === loadedPlayer.dbId
      || (profile.role === 'gm' && profile.gm_team_id && profile.gm_team_id === loadedPlayer.teamDbId)
    )
  );

  useEffect(() => {
    if (!slug || !loadedPlayer || !canViewPrivate || (loadedPlayer.tendencies && loadedPlayer.rawAttributes)) return;
    fetchPlayerBySlug(slug, true)
      .then(found => { if (found) dispatch({ type: 'done', player: found }); })
      .catch(() => {});
  }, [slug, loadedPlayer, canViewPrivate]);

  if (state.tag === 'loading') {
    return (
      <Panel className="p-6 sm:p-8">
        <SectionTitle eyebrow="Player lookup" title="Loading player profile..." />
      </Panel>
    );
  }

  if (state.tag === 'empty') {
    return (
      <div className="grid gap-5">
        <PageHeader
          kicker="Player dossier"
          title="Player profile."
          description="No matching player profile was found for this link. Check the slug or use the roster pages."
          meta="No player found"
        />
      </div>
    );
  }

  const p = state.player;
  const attrs = p.attributes;
  const showPrivateData = canViewPrivate && Boolean(p.rawAttributes);

  return (
    <div className="grid gap-5">
      <PageHeader
        kicker="Player dossier"
        title={p.gamertag}
        description={`${p.position} - ${formatHeight(p.heightInches)} - ${p.teamId || 'Free agent'} - #${p.id}`}
        meta={`Status: ${p.status}`}
      />

      {showPrivateData ? <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Overall" value={String(p.overall)} detail={p.archetype || 'Build profile'} tone="gold" />
        <MetricCard label="Finishing" value={String(attrs.finishing)} detail={gradeLabel(attrs.finishing)} tone="blue" />
        <MetricCard label="Shooting" value={String(attrs.shooting)} detail={gradeLabel(attrs.shooting)} tone="gold" />
        <MetricCard label="Playmaking" value={String(attrs.playmaking)} detail={gradeLabel(attrs.playmaking)} tone="blue" />
        <MetricCard label="Defense" value={String(attrs.defense)} detail={gradeLabel(attrs.defense)} tone="gold" />
      </section> : null}

      <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <Panel className="overflow-hidden p-0">
          <div className="relative min-h-[310px] overflow-hidden bg-[linear-gradient(135deg,var(--navy4),var(--app-card-strong)_45%,rgba(194,136,42,0.22))] p-6">
            <div className="absolute right-[-80px] top-[-80px] h-56 w-56 rounded-full bg-uba-gold/20 blur-3xl" />
            <div className="absolute bottom-[-110px] left-[-70px] h-64 w-64 rounded-full bg-uba-blue/25 blur-3xl" />
            <div className="relative">
              <p className="premium-label text-uba-gold">Player card</p>
              <h2 className="mt-3 text-4xl font-black uppercase leading-none tracking-[0.08em] text-[var(--text)]">{p.gamertag}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusPill tone="gold">{p.position}</StatusPill>
                {p.teamId && <StatusPill tone="blue">{p.teamId}</StatusPill>}
                {showPrivateData && <StatusPill tone="green">{p.overall} OVR</StatusPill>}
                {showPrivateData && p.dbId && <UbaPlayerScoreBadge playerId={p.dbId} position={p.position} />}
              </div>
              <div className="mt-10 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--background)]/80 p-4 text-center shadow-[var(--shadow-menu)]">
                  <p className="premium-label">Height</p>
                  <p className="mt-2 text-3xl font-black text-[var(--text)]">{formatHeight(p.heightInches)}</p>
                </div>
                <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--background)]/80 p-4 text-center shadow-[var(--shadow-menu)]">
                  <p className="premium-label">Wingspan</p>
                  <p className="mt-2 text-3xl font-black text-uba-gold">{p.wingspan}"</p>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        {showPrivateData ? <Panel className="p-6 sm:p-8">
          <SectionTitle eyebrow="Attribute profile" title={`${p.gamertag}'s game`} />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {buckets.map(({ key, label, color }) => {
              const val = attrs[key];
              return (
                <div key={key} className="rounded-3xl border border-[var(--app-border)] bg-[var(--navy4)] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-black text-[var(--text)]">{label}</p>
                    <p className="text-sm font-black text-uba-gold">{val}</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--app-card-strong)]">
                    <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${Math.min(val, 99)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel> : (
          <Panel className="p-6 sm:p-8">
            <SectionTitle eyebrow="Private build" title="Attributes locked" body="Attributes, badges, and tendencies are only visible to this player, their current GM, and admins." />
            {!authLoading && !user && (
              <button type="button" onClick={() => { void signIn(); }} className="mt-5 rounded-xl bg-uba-gold px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-uba-gold-text transition hover:opacity-90">
                Sign in
              </button>
            )}
          </Panel>
        )}
      </section>

      {showPrivateData && p.badges.length > 0 && <BadgeTable badges={p.badges} />}
      {showPrivateData && <AttributeTable player={p} />}

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel className="p-6 sm:p-8">
          <SectionTitle
            eyebrow={`${p.hotZones?.length ?? 0} zone${(p.hotZones?.length ?? 0) === 1 ? '' : 's'} active`}
            title="Shot map"
          />
          <div className="mt-6">
            <HalfCourtHotZones zones={p.hotZones ?? []} />
          </div>
        </Panel>

        <TendencyPanel
          player={p}
          canView={showPrivateData}
          authLoading={authLoading}
          isLoggedIn={Boolean(user)}
          onSignIn={() => { void signIn(); }}
        />
      </section>
    </div>
  );
}
