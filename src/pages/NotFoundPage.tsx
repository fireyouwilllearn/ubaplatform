import { Link } from 'react-router';
import { PageHeader, Panel } from '../components/Panel';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Not Found');
  return (
    <div className="grid gap-5">
      <PageHeader kicker="Dead ball" title="Route not found." description="The page you are looking for does not exist." />
      <Panel className="p-6">
        <Link className="inline-flex rounded-2xl border border-uba-gold/30 bg-uba-gold/15 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-[var(--c-amber)] transition hover:bg-uba-gold/25" to="/">
          Back to dashboard
        </Link>
      </Panel>
    </div>
  );
}
