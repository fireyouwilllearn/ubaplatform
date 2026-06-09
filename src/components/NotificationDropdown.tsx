import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useNotifications } from '../context/NotificationContext';

const iconMap: Record<string, string> = {
  trade_proposal: '\u21C4',
  trade_approved: '\u2713',
  trade_declined: '\u2717',
  roster_change: '\u21BB',
  injury_update: '\u26A0',
  free_agency: '\u2605',
  free_agency_bid: '\u2605',
  free_agency_signed: '\u2713',
  check_in_approved: '\u2713',
  check_in_pending: '\u23F3',
  system: '\u25CF',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }, [onClose]);

  const recent = notifications.filter(n => !n.read).slice(0, 5);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right animate-dropdown rounded-2xl border border-[var(--app-border)] bg-[var(--navy)] p-2 shadow-2xl shadow-[color:var(--shadow-dropdown)] backdrop-blur-2xl"
    >
      {recent.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-[var(--text3)]">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="text-sm font-bold">All clear</span>
          <span className="text-xs">No new notifications</span>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[var(--text3)]">New ({unreadCount})</span>
          </div>
          {recent.map(n => (
            <button
              type="button"
              key={n.id}
              onClick={() => { markAsRead(n.id); }}
              className="flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-[var(--navy4)]"
            >
              <span className="mt-0.5 shrink-0 text-base" aria-hidden>{iconMap[n.type] ?? '\u25CB'}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-xs font-bold text-[var(--text)]">{n.title}</span>
                  <span className="shrink-0 text-[0.55rem] text-[var(--text3)]">{timeAgo(n.createdAt)}</span>
                </div>
                <p className="mt-0.5 truncate text-[0.6rem] leading-tight text-[var(--text3)]">{n.body}</p>
              </div>
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-uba-blue-light" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-1 flex items-center justify-between border-t border-[var(--app-border)] px-2 pt-2">
        <button
          type="button"
          onClick={markAllAsRead}
          className="text-[0.55rem] font-bold uppercase tracking-[0.1em] text-[var(--text3)] transition hover:text-[var(--text)]"
        >
          Mark all read
        </button>
        <button
          type="button"
          onClick={() => { navigate('/notifications'); onClose(); }}
          className="text-[0.55rem] font-bold uppercase tracking-[0.1em] text-uba-blue-light transition hover:text-uba-blue-light/80"
        >
          View all →
        </button>
      </div>
    </div>
  );
}
