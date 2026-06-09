import type { ReactNode } from 'react';

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export function Panel({ children, className = '' }: PanelProps) {
  return <section className={`panel-surface ${className}`}>{children}</section>;
}

type PageHeaderProps = {
  kicker: string;
  title: string;
  description: string;
  meta?: string;
};

export function PageHeader({ kicker, title, description, meta }: PageHeaderProps) {
  return (
    <section className="page-header">
      <div className="max-w-4xl">
        <p className="premium-label text-uba-gold">{kicker}</p>
        <h1 className="page-title mt-2 text-4xl font-extrabold leading-none text-[color:var(--app-text)] sm:text-6xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-app-muted sm:text-base">{description}</p>
        {meta ? <p className="mt-4 text-sm font-semibold text-uba-blue-light">{meta}</p> : null}
      </div>
    </section>
  );
}

type MetricCardProps = {
  label: string;
  value: string | ReactNode;
  detail: string;
  tone?: 'blue' | 'gold' | 'green' | 'red' | 'slate';
};

const toneClasses = {
  blue: 'text-uba-blue-light',
  gold: 'text-uba-gold-light',
  green: 'text-uba-success',
  red: 'text-uba-danger',
  slate: 'text-app-muted',
};

export function MetricCard({ label, value, detail, tone = 'blue' }: MetricCardProps) {
  return (
    <div className="stat-cell">
      <p className="premium-label">{label}</p>
      <p className={`mt-2 text-3xl font-bold tracking-[-0.03em] sm:text-4xl ${toneClasses[tone]}`}>{value}</p>
      <p className="mt-2 text-sm leading-6 text-app-muted">{detail}</p>
    </div>
  );
}

type StatusPillProps = {
  children: ReactNode;
  tone?: 'blue' | 'gold' | 'green' | 'red' | 'slate';
};

export function StatusPill({ children, tone = 'blue' }: StatusPillProps) {
  return <span className={`status-pill status-${tone}`}>{children}</span>;
}

type SectionTitleProps = {
  eyebrow: string;
  title: string;
  body?: string;
};

export function SectionTitle({ eyebrow, title, body }: SectionTitleProps) {
  return (
    <div>
      <p className="premium-label text-uba-gold">{eyebrow}</p>
      <h2 className="section-heading mt-2 text-2xl font-bold text-[color:var(--app-text)] sm:text-3xl">{title}</h2>
      {body ? <p className="mt-3 max-w-2xl text-sm leading-7 text-app-muted">{body}</p> : null}
    </div>
  );
}
