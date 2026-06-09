import { hotZoneCourtLabels, hotZoneNames } from '../types/domain';
import type { HotZone, HotZoneName, HotZoneStatus } from '../types/domain';

type HalfCourtHotZonesProps = {
  zones?: HotZone[];
};

type ZoneShape = {
  zone: HotZoneName;
  d: string;
  labelX: number;
  labelY: number;
  short: string;
};

const zoneShapes: ZoneShape[] = [
  { zone: 'three_left', d: 'M24 34H120V164H24Z', labelX: 72, labelY: 102, short: '3L' },
  { zone: 'three_left_center', d: 'M124 34H218V164H124Z', labelX: 171, labelY: 102, short: '3LC' },
  { zone: 'three_center', d: 'M222 34H278V164H222Z', labelX: 250, labelY: 102, short: '3C' },
  { zone: 'three_right_center', d: 'M282 34H376V164H282Z', labelX: 329, labelY: 102, short: '3RC' },
  { zone: 'three_right', d: 'M380 34H476V164H380Z', labelX: 428, labelY: 102, short: '3R' },
  { zone: 'mid_range_left', d: 'M38 174H120V278H38Z', labelX: 79, labelY: 229, short: 'ML' },
  { zone: 'mid_range_left_center', d: 'M124 174H208V278H124Z', labelX: 166, labelY: 229, short: 'MLC' },
  { zone: 'mid_range_center', d: 'M212 174H288V278H212Z', labelX: 250, labelY: 229, short: 'MC' },
  { zone: 'mid_range_right_center', d: 'M292 174H376V278H292Z', labelX: 334, labelY: 229, short: 'MRC' },
  { zone: 'mid_range_right', d: 'M380 174H462V278H380Z', labelX: 421, labelY: 229, short: 'MR' },
  { zone: 'close_left', d: 'M112 288H204V376H112Z', labelX: 158, labelY: 334, short: 'CL' },
  { zone: 'close_middle', d: 'M208 288H292V376H208Z', labelX: 250, labelY: 334, short: 'CM' },
  { zone: 'close_right', d: 'M296 288H388V376H296Z', labelX: 342, labelY: 334, short: 'CR' },
  { zone: 'under_basket', d: 'M202 386H298V440H202Z', labelX: 250, labelY: 419, short: 'RIM' },
];

const statusStyles: Record<HotZoneStatus, { fill: string; stroke: string; text: string; label: string; glow: string }> = {
  hot: {
    fill: 'rgba(255, 70, 88, 0.76)',
    stroke: 'rgba(255, 188, 194, 0.96)',
    text: '#fff1f3',
    label: 'Hot',
    glow: '0 0 24px rgba(255,70,88,0.38)',
  },
  lethal: {
    fill: 'rgba(226, 182, 93, 0.82)',
    stroke: 'rgba(246, 217, 149, 0.98)',
    text: '#08111f',
    label: 'Lethal',
    glow: '0 0 22px rgba(226,182,93,0.38)',
  },
  neutral: {
    fill: 'rgba(255, 255, 255, 0.075)',
    stroke: 'rgba(176, 211, 244, 0.24)',
    text: 'rgba(241, 251, 255, 0.62)',
    label: 'Neutral',
    glow: 'none',
  },
};

function statusFor(zoneName: HotZoneName, zones?: HotZone[]): HotZoneStatus {
  return zones?.find((zone) => zone.zone === zoneName)?.status ?? 'neutral';
}

export function HalfCourtHotZones({ zones }: HalfCourtHotZonesProps) {
  const zoneStatus = new Map(hotZoneNames.map((zone) => [zone, statusFor(zone, zones)]));
  const activeZones = hotZoneNames.filter((zone) => zoneStatus.get(zone) !== 'neutral');

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-start">
      <div className="court-glass overflow-hidden rounded-[2rem] border border-[var(--app-border)] p-3 shadow-inner sm:p-4">
        <svg viewBox="0 0 500 470" role="img" aria-labelledby="hotzone-title hotzone-desc" className="h-auto w-full drop-shadow-2xl">
          <title id="hotzone-title">Half-court hot zone chart</title>
          <desc id="hotzone-desc">Red zones are hot. Gold zones are lethal. Unfilled zones are neutral.</desc>
          <defs>
            <linearGradient id="courtSurface" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(88,167,255,0.2)" />
              <stop offset="50%" stopColor="rgba(15,27,43,0.9)" />
              <stop offset="100%" stopColor="rgba(242,211,153,0.14)" />
            </linearGradient>
            <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect x="14" y="14" width="472" height="442" rx="30" fill="url(#courtSurface)" stroke="rgba(255,255,255,0.16)" strokeWidth="2" />
          <path d="M30 34H470M30 456H470M30 34V456M470 34V456" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
          <path d="M84 34C94 136 140 210 250 210C360 210 406 136 416 34" fill="none" stroke="rgba(242,211,153,0.34)" strokeWidth="3" strokeDasharray="8 10" />
          <path d="M160 292H340V456H160Z" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
          <path d="M190 292A60 60 0 0 1 310 292" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
          <circle cx="250" cy="386" r="17" fill="none" stroke="rgba(242,211,153,0.72)" strokeWidth="3" />
          <path d="M218 401H282" stroke="rgba(242,211,153,0.62)" strokeWidth="6" strokeLinecap="round" />

          {zoneShapes.map((shape) => {
            const status = zoneStatus.get(shape.zone) ?? 'neutral';
            const style = statusStyles[status];

            return (
              <g key={shape.zone} tabIndex={0} className="court-zone-button" style={{ color: style.stroke }} aria-label={`${hotZoneCourtLabels[shape.zone]}: ${style.label}`}>
                <path
                  d={shape.d}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={status === 'neutral' ? 1.4 : 2.3}
                  filter={status === 'neutral' ? undefined : 'url(#softGlow)'}
                  style={{ filter: status === 'neutral' ? undefined : `drop-shadow(${style.glow})` }}
                />
                <text x={shape.labelX} y={shape.labelY} textAnchor="middle" dominantBaseline="middle" fill={style.text} fontSize="18" fontWeight="900" letterSpacing="1.5">
                  {shape.short}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid gap-3">
        <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--navy4)] p-4">
          <p className="premium-label text-uba-blue-light">Legend</p>
          <div className="mt-4 grid gap-3 text-sm font-bold text-app-muted">
            <span className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-[var(--app-hot)] shadow-[0_0_16px_rgba(255,70,88,0.6)]" /> Red = Hot</span>
            <span className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-[var(--app-lethal)] shadow-[0_0_14px_rgba(226,182,93,0.55)]" /> Gold = Lethal</span>
            <span className="flex items-center gap-3"><span className="h-3 w-3 rounded-full border border-[var(--app-border)] bg-[var(--navy4)]" /> Clear = Neutral</span>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--navy4)] p-4">
          <p className="premium-label text-uba-gold">Active zones</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {activeZones.length ? activeZones.map((zone) => {
              const status = zoneStatus.get(zone) ?? 'neutral';
              return (
                <span key={zone} className={`rounded-full border px-3 py-1 text-[0.66rem] font-black uppercase tracking-[0.12em] ${status === 'lethal' ? 'border-uba-gold/35 bg-uba-gold/14 text-uba-gold-light' : 'border-[var(--c-red)]/30 bg-[var(--c-red)]/18 text-[var(--c-red)]'}`}>
                  {hotZoneCourtLabels[zone]}
                </span>
              );
            }) : <span className="text-sm font-bold text-app-dim">No active zones yet.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
