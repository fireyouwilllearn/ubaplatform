import { PageHeader, Panel, SectionTitle } from '../components/Panel';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function CalculatorPage() {
  useDocumentTitle('Calculator');
  return (
    <div className="grid gap-5">
      <PageHeader
        kicker="Build lab"
        title="UBA Calculator."
        description="Plan your attribute upgrades, compare builds, and simulate your player's cap distribution."
        meta="External tool"
      />

      <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Panel className="p-6 sm:p-8">
          <SectionTitle eyebrow="External tool" title="UBA Calculator" body="The UBA Calculator runs as a standalone app. Use it to plan upgrades, test attribute allocations, and visualize your build before spending UC." />
          <a
            href="https://ubacalc.pages.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-uba-gold px-6 py-3 text-sm font-bold text-uba-gold-text transition-opacity hover:opacity-90"
          >
            Open UBA Calculator
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <div className="mt-4 rounded-2xl border border-[var(--app-border)] bg-[var(--navy4)] p-4 text-sm leading-6 text-[var(--text2)]">
            <span className="font-semibold text-[var(--text)]">Note:</span> The calculator is a separate application hosted on Cloudflare Pages. Opening it will take you to a new tab.
          </div>
        </Panel>

        <Panel className="p-6">
          <SectionTitle eyebrow="Integration status" title="Standalone" body="The calculator operates independently. Integration into the platform dashboard is planned once player records, auth, and UC transactions are live." />
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-[var(--app-border)] bg-[var(--navy4)] px-3 py-1 text-xs font-semibold text-[var(--text3)]">
              External link
            </span>
          </div>
        </Panel>
      </section>
    </div>
  );
}
