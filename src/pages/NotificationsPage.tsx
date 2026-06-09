import { useMemo, useState } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Panel, PageHeader, MetricCard, SectionTitle } from '../components/Panel';
import { useNotifications } from '../context/NotificationContext';
import type { AppNotification } from '../types/domain';

const typeStyles: Record<string, string> = {
  trade_proposal: 'border-orange-500/20 bg-orange-500/5',
  trade_approved: 'border-[var(--c-green)]/20 bg-[var(--c-green)]/5',
  trade_declined: 'border-[var(--c-red)]/20 bg-[var(--c-red)]/5',
  roster_change: 'border-[var(--c-blue)]/20 bg-[var(--c-blue)]/5',
  injury_update: 'border-uba-gold/20 bg-uba-gold/5',
  free_agency: 'border-lime-500/20 bg-lime-500/5',
  system: 'border-[var(--app-border)] bg-[var(--navy4)]',
};

const typeIcons: Record<string, string> = {
  trade_proposal: '\u21C4',
  trade_approved: '\u2713',
  trade_declined: '\u2717',
  roster_change: '\u21BB',
  injury_update: '\u26A0',
  free_agency: '\u2605',
  system: '\u25CF',
};

function NotificationCard({ notif }: { notif: AppNotification }) {
  const style = typeStyles[notif.type] ?? 'border-[var(--app-border)] bg-[var(--navy4)]';

  return (
    <div className={`rounded-xl border p-4 transition ${style} ${!notif.read ? 'ring-1 ring-[var(--app-border)]' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-lg">{typeIcons[notif.type] ?? '\u25CB'}</div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold">{notif.title}</div>
              <div className="mt-1 text-sm text-[var(--text2)]">{notif.body}</div>
            </div>
            <div className="flex items-center gap-2">
              {!notif.read && <span className="h-2 w-2 rounded-full bg-uba-blue-light" />}
              <span className="whitespace-nowrap text-xs text-[var(--text3)]">
                {new Date(notif.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationsPage() {
  useDocumentTitle('Notifications');
  const [filterRead, setFilterRead] = useState<boolean | null>(null);
  const { notifications, unreadCount } = useNotifications();

  const filtered = useMemo(
    () => filterRead === null ? notifications : notifications.filter(n => n.read === filterRead),
    [notifications, filterRead]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        kicker="Activity Feed"
        description="Stay updated on league activity — trades, roster changes, free agency, and system announcements."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCard label="Total" value={String(notifications.length)} detail="All time" />
        <MetricCard label="Unread" value={String(unreadCount)} detail="New" />
        <MetricCard label="Read" value={String(notifications.length - unreadCount)} detail="Dismissed" />
      </div>

      <div className="flex gap-2">
        {[
          { label: 'All', value: null },
          { label: 'Unread', value: false },
          { label: 'Read', value: true },
        ].map(opt => (
          <button
            type="button"
            key={opt.label}
            onClick={() => setFilterRead(opt.value)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              filterRead === opt.value
                ? 'border-[var(--app-border)] bg-[var(--navy4)] text-[var(--text)]'
                : 'border-[var(--app-border)] text-[var(--text2)] hover:border-[var(--app-border)]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <SectionTitle eyebrow="Feed" title="Notifications" />
      <div className="grid gap-3">
        {filtered.map(notif => (
          <NotificationCard key={notif.id} notif={notif} />
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-[var(--text3)]">No notifications.</div>
        )}
      </div>
    </div>
  );
}
