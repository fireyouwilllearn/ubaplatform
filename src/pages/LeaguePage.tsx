import { leagueRules } from '../data/league';
import { PageHeader, Panel, SectionTitle } from '../components/Panel';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const buildOrder = [
  'League data import and validation',
  'Player attribute pipeline',
  'Admin workflows',
  'Discord auth and profile ownership',
  'Calculator module integration',
  'UC ledger and economy features',
];

export function LeaguePage() {
  useDocumentTitle('League');
  return (
    <div className="grid gap-5">
      <PageHeader
        kicker="League office"
        title="League rules and build order."
        description="UBA league operating rules and the development roadmap for league management features."
        meta="16 teams · 2 conferences"
      />

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Panel className="p-6 sm:p-8">
          <SectionTitle eyebrow="Operating rules" title="Non-negotiables" />
          <div className="mt-6 grid gap-4">
            {leagueRules.map((rule) => (
              <article key={rule.title} className="rounded-3xl border border-[var(--app-border)] bg-[var(--navy4)] p-5">
                <h3 className="text-xl font-black text-[var(--text)]">{rule.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--text2)]">{rule.body}</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel className="p-6">
          <SectionTitle eyebrow="Build order" title="Best path forward" />
          <div className="mt-5 grid gap-3">
            {buildOrder.map((item, index) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--navy4)] p-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-uba-gold/15 text-sm font-black text-uba-gold">{index + 1}</span>
                <p className="text-sm leading-6 text-[var(--text2)]">{item}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}
