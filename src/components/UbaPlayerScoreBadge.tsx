import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

interface UbaScoreResult {
  score: number;
  pillars: {
    inside: number;
    rebounding: number;
    interior_defense: number;
    perimeter_defense: number;
    playmaking: number;
    physical: number;
    intangibles: number;
  };
  elite_bonus: number;
  weakness_penalty: number;
}

const positionWeights: Record<string, string> = {
  PG: 'Playmaking (40%) · Perimeter (25%) · Physical (10%) · Intangibles (10%) · Inside (5%) · Rebounding (5%) · Interior D (5%)',
  SG: 'Playmaking (25%) · Perimeter (25%) · Physical (15%) · Intangibles (15%) · Inside (10%) · Rebounding (5%) · Interior D (5%)',
  SF: 'Inside (15%) · Playmaking (15%) · Physical (15%) · Intangibles (15%) · Perimeter (20%) · Rebounding (10%) · Interior D (10%)',
  PF: 'Inside (30%) · Rebounding (15%) · Interior D (15%) · Intangibles (15%) · Perimeter (10%) · Physical (10%) · Playmaking (5%)',
  C: 'Inside (30%) · Rebounding (20%) · Interior D (20%) · Physical (10%) · Intangibles (10%) · Perimeter (5%) · Playmaking (5%)',
};

const pillarLabels: Record<string, string> = {
  inside: 'Inside Scoring',
  rebounding: 'Rebounding',
  interior_defense: 'Interior Defense',
  perimeter_defense: 'Perimeter Defense',
  playmaking: 'Playmaking',
  physical: 'Physicals',
  intangibles: 'Intangibles',
};

function getTier(score: number): { label: string; className: string } {
  if (score >= 90) return { label: 'Elite', className: 'text-emerald-400' };
  if (score >= 80) return { label: 'All-Star', className: 'text-uba-blue-light' };
  if (score >= 70) return { label: 'Starter', className: 'text-uba-gold-light' };
  if (score >= 60) return { label: 'Rotation', className: 'text-amber-400' };
  return { label: 'Developing', className: 'text-[var(--text3)]' };
}

export function UbaPlayerScoreBadge({ playerId, position }: { playerId: string; position: string }) {
  const [result, setResult] = useState<UbaScoreResult | null>(null);
  const [showTip, setShowTip] = useState(false);
  const tipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supabase || !playerId) return;
    (supabase.rpc as any)('get_uba_player_score', { p_player_id: playerId })
      .then((res: any) => { if (res?.data) setResult(res.data as UbaScoreResult); })
      .catch(() => {});
  }, [playerId]);

  useEffect(() => {
    if (!showTip) return;
    const handler = (e: MouseEvent) => {
      if (tipRef.current && !tipRef.current.contains(e.target as Node)) setShowTip(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showTip]);

  if (!result) return null;

  const tier = getTier(result.score);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setShowTip(prev => !prev)}
        className="group flex items-center gap-1.5 rounded-lg border border-[var(--app-border)] bg-[var(--navy4)] px-2.5 py-1 text-xs transition hover:border-uba-gold/40"
        aria-label="UBA Player Score — click for details"
      >
        <span className="text-[0.55rem] font-black uppercase tracking-[0.1em] text-[var(--text3)]">UBA</span>
        <span className={`text-sm font-black ${tier.className}`}>{result.score}</span>
        <span className={`text-[0.5rem] font-bold uppercase tracking-[0.08em] ${tier.className}`}>{tier.label}</span>
        <svg className="ml-0.5 h-3 w-3 text-[var(--text3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
      </button>

      {showTip && (
        <div
          ref={tipRef}
          className="fixed left-1/2 top-20 z-[90] max-h-[min(78vh,620px)] w-[min(92vw,420px)] -translate-x-1/2 overflow-auto rounded-2xl border border-[var(--app-border)] bg-[var(--background)] p-4 shadow-[var(--shadow-dropdown)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.55rem] font-black uppercase tracking-[0.12em] text-uba-gold-light">UBA Player Score</p>
              <p className="mt-1 text-2xl font-black text-[var(--text)]">{result.score} <span className={`text-xs uppercase tracking-[0.12em] ${tier.className}`}>{tier.label}</span></p>
            </div>
            <button type="button" onClick={() => setShowTip(false)} className="rounded-lg border border-[var(--app-border)] px-2 py-1 text-xs font-black text-[var(--text3)] transition hover:text-[var(--text)]">
              Close
            </button>
          </div>
          <p className="mt-3 text-xs leading-6 text-[var(--text2)]">
            Think of it like a report card for basketball skills. We group all 31 attributes into 7 categories, then weight each category by what matters most for the player's position.
          </p>

          <div className="mt-4 grid gap-2">
            {Object.entries(result.pillars).map(([key, val]) => (
              <div key={key} className="rounded-xl border border-[var(--app-border)] bg-[var(--navy4)] p-2.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-[var(--text)]">{pillarLabels[key]}</span>
                  <span className="text-xs font-black text-uba-gold">{val}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--background)]">
                    <div className={`h-full rounded-full ${val >= 85 ? 'bg-emerald-400' : val >= 70 ? 'bg-uba-gold' : val >= 55 ? 'bg-amber-500' : 'bg-red-400'}`} style={{ width: `${val}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--text3)]">
            {result.elite_bonus > 0 && <span>+{result.elite_bonus} elite bonus</span>}
            {result.weakness_penalty > 0 && <span>-{result.weakness_penalty} weakness penalty</span>}
          </div>

          <p className="mt-3 border-t border-[var(--app-border)] pt-3 text-xs leading-6 text-[var(--text3)]">
            <strong>How it works:</strong> Elite categories (90+) get a bonus. Weak categories (-50) get a penalty. Then we apply position weights:
            <span className="mt-1 block text-[0.65rem] opacity-80">{positionWeights[position] ?? 'Standard'}</span>
          </p>
          <p className="mt-2 text-[0.65rem] leading-5 text-[var(--text3)]">
            <strong>Why it&apos;s not Overall:</strong> 2K&apos;s Overall is their secret formula. This is our own transparent rating — UBA&apos;s way of measuring what makes a player effective in our league.
          </p>
        </div>
      )}
    </div>
  );
}
