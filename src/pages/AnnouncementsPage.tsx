import { announcements } from '../data/league';
import { PageHeader, Panel, SectionTitle, StatusPill } from '../components/Panel';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function AnnouncementsPage() {
  useDocumentTitle('Announcements');
  return (
    <div className="grid gap-5">
      <PageHeader
        kicker="Admin wire"
        title="League updates need publish rules."
        description="League announcements and updates from the UBA league office."
        meta="No frontend-only admin publishing"
      />

      <div className="grid gap-5">
        {announcements.map((announcement) => (
          <Panel key={announcement.id} className="p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-uba-gold/80">{announcement.kicker}</p>
                <h3 className="mt-3 break-words text-3xl font-black tracking-[-0.04em] text-[var(--text)]">{announcement.title}</h3>
                <p className="mt-3 text-sm font-semibold text-[var(--text3)]">{announcement.date}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusPill tone="blue">{announcement.category}</StatusPill>
                {announcement.pinned ? <StatusPill tone="gold">Pinned</StatusPill> : null}
              </div>
            </div>
            <p className="mt-5 max-w-4xl text-base leading-8 text-[var(--text2)]">{announcement.body}</p>
          </Panel>
        ))}
      </div>

      <Panel className="p-6 sm:p-8">
        <SectionTitle eyebrow="Publishing contract" title="Announcement permissions" body="Published announcements are visible to everyone. Drafts and edits are restricted to admin accounts." />
      </Panel>
    </div>
  );
}
