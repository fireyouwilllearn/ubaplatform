import { mainLeagueTeams, nxtLeagueTeams, standingsWithTeams } from '../data/league';
import { PageHeader, Panel, SectionTitle, StatusPill } from '../components/Panel';
import type { Team } from '../types/domain';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

function standingForTeam(teamId: string) {
  return standingsWithTeams.find((standing) => standing.teamId === teamId);
}

function JerseyMockup({ team, variant }: { team: Team; variant: 'home' | 'away' }) {
  const jerseyImage = team.jerseyImages?.[variant];
  const base = variant === 'home' ? '#f8fafc' : team.primaryColor;
  const ink = variant === 'home' ? team.primaryColor : '#f8fafc';
  const trim = variant === 'home' ? '#f2d399' : '#111c26';

  if (jerseyImage) {
    return (
      <div className="relative h-44 min-w-[8.5rem] overflow-hidden rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-card-strong)] p-3 shadow-inner">
        <img src={jerseyImage} alt={`${team.name} ${variant} jersey`} className="h-full w-full rounded-[1.5rem] object-cover" />
      </div>
    );
  }

  return (
    <div className="relative h-44 min-w-[8.5rem] overflow-hidden rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-card-strong)] p-3 shadow-inner">
      <div
        className="absolute inset-x-4 bottom-3 top-5 rounded-b-[1.6rem] rounded-t-[2.4rem] border shadow-[0_18px_45px_var(--shadow-jersey)]"
        style={{
          background: `linear-gradient(145deg, ${base}, ${variant === 'home' ? '#dbeafe' : '#0b1220'})`,
          borderColor: `${trim}88`,
          color: ink,
        }}
      >
        <div className="absolute left-1/2 top-0 h-9 w-16 -translate-x-1/2 -translate-y-3 rounded-b-full border border-[var(--app-border)] bg-[var(--app-card-strong)]" />
        <div className="absolute left-2 top-6 h-14 w-5 rounded-full border border-[var(--app-border)]" style={{ backgroundColor: trim }} />
        <div className="absolute right-2 top-6 h-14 w-5 rounded-full border border-[var(--app-border)]" style={{ backgroundColor: trim }} />
        <div className="absolute inset-x-5 top-14 text-center">
          <p className="text-[0.6rem] font-black uppercase tracking-[0.28em] opacity-80">UBA</p>
          <p className="mt-2 text-3xl font-black tracking-[-0.08em]">{team.shortName}</p>
          <p className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.22em] opacity-70">{variant}</p>
        </div>
        <div className="absolute inset-x-3 bottom-4 h-2 rounded-full" style={{ backgroundColor: trim }} />
      </div>
    </div>
  );
}

function IdentityCard({ team }: { team: Team }) {
  const standing = standingForTeam(team.id);
  const city = team.market ?? team.name;
  const subtitle = [team.league, team.conference ? `${team.conference} Conference` : undefined].filter(Boolean).join(' / ');
  const logoUrl = team.logoUrl ?? '/logo.png';

  return (
    <Panel className="overflow-hidden p-0">
      <div className="relative grid gap-0 lg:grid-cols-[1fr_17rem]">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="premium-label">{subtitle}</p>
              <h3 className="mt-2 text-3xl font-black tracking-[-0.05em] text-[color:var(--app-text)]">{team.name}</h3>
              <p className="mt-1 text-sm font-bold text-app-muted">{city}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <div className="grid h-20 w-20 place-items-center rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-card-strong)] p-2">
                <img src={logoUrl} alt={`${team.name} logo`} className="h-full w-full rounded-[1.1rem] object-cover" />
              </div>
              <div className="grid h-20 w-20 place-items-center rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-card-strong)]" style={{ color: team.primaryColor }}>
                <span className="text-2xl font-black tracking-[-0.08em]">{team.shortName}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-strong)] p-4">
              <p className="premium-label">City</p>
              <p className="mt-2 text-lg font-black text-[var(--text)]">{city}</p>
            </div>
            <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-strong)] p-4">
              <p className="premium-label">Short code</p>
              <p className="mt-2 text-lg font-black text-uba-gold">{team.shortName}</p>
            </div>
            <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-strong)] p-4">
              <p className="premium-label">Status</p>
              <div className="mt-2">
                {standing ? <StatusPill tone={standing.status === 'clinched' ? 'green' : standing.status === 'eliminated' ? 'red' : 'gold'}>{standing.status}</StatusPill> : <StatusPill tone="blue">Development</StatusPill>}
              </div>
            </div>
          </div>

          {team.affiliateLocations && team.affiliateLocations.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {team.affiliateLocations.map((location) => (
                <span key={location} className="rounded-full border border-uba-blue/20 bg-uba-blue/10 px-3 py-1 text-xs font-bold text-uba-blue-light">
                  {location} affiliate
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="relative overflow-hidden border-t border-[var(--app-border)] bg-gradient-to-br from-[var(--navy4)] to-[var(--app-card-strong)] p-5 lg:border-l lg:border-t-0">
          <div className="absolute -right-16 -top-20 h-44 w-44 rounded-full opacity-25 blur-2xl" style={{ backgroundColor: team.primaryColor }} />
          <div className="relative grid grid-cols-2 gap-3 overflow-x-auto">
            <JerseyMockup team={team} variant="home" />
            <JerseyMockup team={team} variant="away" />
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function TeamIdentityPage() {
  useDocumentTitle('Team Identity');
  return (
    <div className="grid gap-5">
      <PageHeader
        kicker="Team identity"
        title="Club marks, cities, and uniform direction."
        description="A brand info page for team names, cities, league placement, logo lockups, and jersey visuals. It uses current team data and generated uniform art until official team-specific image files are supplied."
        meta={`${mainLeagueTeams.length} UBA clubs / ${nxtLeagueTeams.length} NXT clubs`}
      />

      <Panel className="p-6 sm:p-8">
        <SectionTitle
          eyebrow="Identity source of truth"
          title="What is real today"
          body="Team names, cities, conferences, statuses, NXT affiliations, and colors are static data. Team-specific logo and jersey image uploads should become backend-backed assets later."
        />
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {['Logo upload review', 'Home / away jersey assets', 'Public identity bucket'].map((item) => (
            <div key={item} className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-card-strong)] p-4">
              <p className="text-sm font-black text-[color:var(--app-text)]">{item}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-app-muted">Disabled until storage policies exist</p>
            </div>
          ))}
        </div>
      </Panel>

      <section className="grid gap-4">
        <SectionTitle eyebrow="Main League" title="UBA team identity" />
        {mainLeagueTeams.map((team) => (
          <IdentityCard key={team.id} team={team} />
        ))}
      </section>

      <section className="grid gap-4">
        <SectionTitle eyebrow="Development tier" title="NXT League identity" />
        <div className="grid gap-4 lg:grid-cols-2">
          {nxtLeagueTeams.map((team) => (
            <IdentityCard key={team.id} team={team} />
          ))}
        </div>
      </section>
    </div>
  );
}
