import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader, MetricCard, SectionTitle } from '../components/Panel';
import { fetchFreeAgentListings } from '../lib/db';
import type { FreeAgencyListing } from '../types/domain';
import { mainLeagueTeams } from '../data/league';

const statusStyles: Record<string, string> = {
  available: 'border-[var(--c-blue)]/30 bg-[var(--c-blue)]/10 text-[var(--c-blue)]',
  bidding: 'border-[var(--c-amber)]/30 bg-[var(--c-amber)]/10 text-[var(--c-amber)]',
  signed: 'border-[var(--c-green)]/30 bg-[var(--c-green)]/10 text-[var(--c-green)]',
  withdrawn: 'border-[var(--app-border)] bg-[var(--navy4)] text-[var(--text3)]',
};

function ListingCard({ listing }: { listing: FreeAgencyListing }) {
  const bidTeam = listing.currentBidTeamId
    ? mainLeagueTeams.find(t => t.id === listing.currentBidTeamId)
    : null;
  const signedTeam = listing.signedTeamId
    ? mainLeagueTeams.find(t => t.id === listing.signedTeamId)
    : null;

  return (
    <div className={`rounded-xl border p-4 ${statusStyles[listing.status] ?? ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded bg-[var(--navy4)] px-2 py-0.5 text-xs font-medium uppercase tracking-wider">
              {listing.status}
            </span>
            {listing.askingUcBalance && (
              <span className="text-xs text-[var(--text3)]">
                Asking: {listing.askingUcBalance} UC
              </span>
            )}
          </div>
          <div className="mt-2 space-y-1 text-sm">
            {listing.status === 'bidding' && (
              <div className="text-[var(--c-amber)]">
                Current Bid: {listing.currentBidUc} UC
                {bidTeam && (
                  <span className="ml-1 text-[var(--text3)]">
                    by{' '}
                    <Link to={`/teams/${bidTeam.id}`} className="hover:underline">
                      {bidTeam.shortName}
                    </Link>
                  </span>
                )}
              </div>
            )}
            {listing.status === 'signed' && signedTeam && (
              <div className="text-[var(--c-green)]">
                Signed with{' '}
                <Link to={`/teams/${signedTeam.id}`} className="hover:underline">
                  {signedTeam.name}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-[var(--text3)]">
        <span>Listed: {new Date(listing.listedAt).toLocaleDateString()}</span>
        {listing.expiresAt && (
          <span>Expires: {new Date(listing.expiresAt).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
}

export function FreeAgencyPage() {
  useDocumentTitle('Free Agency');
  const [listings, setListings] = useState<FreeAgencyListing[]>([]);

  useEffect(() => {
    fetchFreeAgentListings().then(setListings);
  }, []);

  const available = useMemo(() => listings.filter(fa => fa.status === 'available' || fa.status === 'bidding'), [listings]);
  const signed = useMemo(() => listings.filter(fa => fa.status === 'signed'), [listings]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Free Agency"
        kicker="Player Market"
        description="Browse available free agents. GM accounts can place bids using UC balance. Admin approval required to finalize signings."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCard label="Available" value={String(available.length)} detail="Seeking contracts" />
        <MetricCard label="Signed" value={String(signed.length)} detail="Recently signed" />
        <MetricCard label="Bidding" value={String(listings.filter(fa => fa.status === 'bidding').length)} detail="Active auctions" />
      </div>

      <SectionTitle eyebrow="Market" title="Available Free Agents" />
      <div className="grid gap-3 sm:grid-cols-2">
        {available.map(listing => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
        {available.length === 0 && (
          <output aria-live="polite" className="col-span-full block py-8 text-center text-[var(--text3)]">
            No free agents currently available.
          </output>
        )}
      </div>

      {signed.length > 0 && (
        <>
          <SectionTitle eyebrow="Done Deals" title="Recently Signed" />
          <div className="grid gap-3 sm:grid-cols-2">
            {signed.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
