import { useEffect, useReducer, useState } from 'react';
import { Link } from 'react-router';
import { MetricCard, PageHeader, Panel, SectionTitle, StatusPill } from '../components/Panel';
import { RequireRole } from '../components/RequireRole';
import { clearTeamCache, fetchBankReviewRows, fetchSheetImportReviewRows, promoteBankToUcLedger, promoteSheetImportPlayerRow, setSheetImportPlayerTendencies, type SheetImportReviewRow } from '../lib/db';
import { attributeSheetHeaders, badgeSheetHeaders, bankSheetHeaders, teamSheetTabs } from '../lib/teamSheetTemplate';
import type { BankReviewRow } from '../types/domain';
import { allTendencyNames } from '../types/domain';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

function pillTone(status: string): 'blue' | 'gold' | 'green' | 'red' | 'slate' {
  if (status === 'promoted' || status === 'complete' || status === 'succeeded') return 'green';
  if (status === 'needs_manual' || status === 'needs_review' || status === 'running') return 'gold';
  if (status === 'invalid' || status === 'failed' || status === 'ignored') return 'red';
  return 'blue';
}

function formatRowNumbers(row: SheetImportReviewRow): string {
  const raw = row.sourceRowNumbers;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return 'No source row map';

  const pairs = Object.entries(raw)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([key, value]) => `${key}: ${String(value)}`);

  return pairs.length ? pairs.join(' / ') : 'No source row map';
}

function parseTendencyInput(raw: string): Record<string, number> {
  const trimmed = raw.trim();

  if (!trimmed) {
    throw new Error('Paste either 99 numeric tendency values or a JSON object of tendency names to values.');
  }

  if (trimmed.startsWith('{')) {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    const values = Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, Number(value)]));
    validateTendencyValues(values);
    return values;
  }

  const values = trimmed.split(/[\s,\t]+/).filter(Boolean).map((value) => Number(value));

  if (values.length !== allTendencyNames.length) {
    throw new Error(`Expected ${allTendencyNames.length} tendency values, received ${values.length}.`);
  }

  const mapped = Object.fromEntries(allTendencyNames.map((name, index) => [name, values[index] ?? 0]));
  validateTendencyValues(mapped);
  return mapped;
}

const tendencyNamesSet = new Set(allTendencyNames);

function validateTendencyValues(values: Record<string, number>) {
  if (Object.keys(values).length !== allTendencyNames.length) {
    throw new Error(`Reviewed tendencies must include exactly ${allTendencyNames.length} values.`);
  }

  for (const [key, value] of Object.entries(values)) {
    if (!tendencyNamesSet.has(key as (typeof allTendencyNames)[number])) {
      throw new Error(`Unknown tendency name: ${key}`);
    }

    if (!Number.isInteger(value) || value < 0 || value > 100) {
      throw new Error(`Invalid tendency value for ${key}: ${String(value)}`);
    }
  }
}

function ManualTendencyForm({ row, busy, onSave }: { row: SheetImportReviewRow; busy: boolean; onSave: (rowId: string, tendencies: Record<string, number>) => Promise<void> }) {
  const [draft, setDraft] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit() {
    setLocalError(null);
    try {
      await onSave(row.id, parseTendencyInput(draft));
      setDraft('');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Unable to save manual tendencies.');
    }
  }

  return (
    <div className="xl:col-span-5 rounded-2xl border border-uba-gold/20 bg-uba-gold/[0.06] p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-uba-gold-light">Manual tendency entry</p>
      <p className="mt-2 text-xs leading-5 text-app-muted">
        Paste exactly {allTendencyNames.length} numeric values in sheet order, or a JSON object keyed by tendency name. The database RPC validates the same shape before this row can become promotable.
      </p>
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        rows={3}
        placeholder="Paste 99 values here..."
        aria-label="Manual tendency entry"
        className="mt-3 w-full rounded-2xl border border-[var(--app-border)] bg-[var(--navy4)] p-3 text-sm text-[color:var(--app-text)] outline-none transition placeholder:text-app-muted focus:border-uba-gold/50"
      />
      {localError ? <p className="mt-2 text-xs font-bold text-uba-danger">{localError}</p> : null}
      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={busy || !draft.trim()}
        className="mt-3 rounded-2xl border border-uba-gold/30 bg-uba-gold/15 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-uba-gold-light transition hover:bg-uba-gold/25 disabled:cursor-not-allowed disabled:border-[var(--app-border)] disabled:bg-[var(--navy4)] disabled:text-app-muted"
      >
        {busy ? 'Saving' : 'Save tendencies'}
      </button>
    </div>
  );
}

function ReviewRow({ row, busy, tendencyBusy, onPromote, onSaveTendencies }: {
  row: SheetImportReviewRow;
  busy: boolean;
  tendencyBusy: boolean;
  onPromote: (id: string) => void;
  onSaveTendencies: (rowId: string, tendencies: Record<string, number>) => Promise<void>;
}) {
  const blockedReasons = [
    ...row.validationErrors,
    row.matchedTeamSlug ? null : 'unmatched_team',
    row.tendencyReviewStatus === 'needs_manual' ? 'manual_tendencies_required' : null,
    row.tendencyReviewStatus === 'invalid' ? 'invalid_tendencies' : null,
  ].filter(Boolean);

  return (
    <div className="grid gap-4 border-b border-[var(--app-border)] px-4 py-4 last:border-b-0 xl:grid-cols-[1.1fr_0.9fr_0.8fr_1fr_auto] xl:items-center">
      <div>
        <p className="text-base font-black text-[color:var(--app-text)]">{row.playerName}</p>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-app-muted">{row.discordHandle ?? 'No Discord handle'}</p>
        <p className="mt-2 text-xs text-app-muted">{formatRowNumbers(row)}</p>
      </div>

      <div>
        <p className="premium-label">Matched team</p>
        {row.matchedTeamSlug ? (
          <Link to={`/teams/${row.matchedTeamSlug}`} className="mt-1 inline-flex text-sm font-black text-uba-gold-light hover:text-uba-gold">
            {row.matchedTeamName ?? row.matchedTeamSlug}
          </Link>
        ) : <p className="mt-1 text-sm font-bold text-uba-danger">No canonical team</p>}
        <p className="mt-1 text-xs text-app-muted">{row.sourceName ?? 'Unknown sheet source'}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusPill tone="blue">{row.primaryPosition ?? 'No pos'}</StatusPill>
        <StatusPill tone={row.heightInches ? 'green' : 'red'}>{row.heightText ?? 'No height'}</StatusPill>
        <StatusPill tone={pillTone(row.rosterStatus)}>{row.rosterStatus}</StatusPill>
        {row.twoWayUbanxtLabel ? <StatusPill tone="gold">{row.twoWayUbanxtLabel}</StatusPill> : null}
      </div>

      <div>
        <div className="flex flex-wrap gap-2">
          <StatusPill tone={pillTone(row.tendencyReviewStatus)}>{row.tendencyReviewStatus}</StatusPill>
          <StatusPill tone={pillTone(row.reviewStatus)}>{row.reviewStatus}</StatusPill>
          {row.runStatus ? <StatusPill tone={pillTone(row.runStatus)}>{row.runStatus}</StatusPill> : null}
        </div>
        {blockedReasons.length ? <p className="mt-2 text-xs leading-5 text-app-muted">Blocked: {blockedReasons.join(', ')}</p> : <p className="mt-2 text-xs text-uba-success">Clean row. Ready for admin promotion.</p>}
        {row.tendencySourceLabel ? <p className="mt-2 text-xs leading-5 text-uba-gold-light">Manual tendency source: {row.tendencySourceLabel}</p> : null}
      </div>

      <button
        type="button"
        onClick={() => onPromote(row.id)}
        disabled={!row.canPromote || busy}
        className="rounded-2xl border border-uba-gold/30 bg-uba-gold/15 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-uba-gold-light transition hover:bg-uba-gold/25 disabled:cursor-not-allowed disabled:border-[var(--app-border)] disabled:bg-[var(--navy4)] disabled:text-app-muted"
      >
        {busy ? 'Promoting' : row.reviewStatus === 'promoted' ? 'Promoted' : 'Promote'}
      </button>

      {['needs_manual', 'invalid'].includes(row.tendencyReviewStatus) && row.reviewStatus !== 'promoted' ? (
        <ManualTendencyForm row={row} busy={tendencyBusy} onSave={onSaveTendencies} />
      ) : null}
    </div>
  );
}

type State = {
  rows: SheetImportReviewRow[];
  loading: boolean;
  error: string | null;
  promotingId: string | null;
  savingTendenciesId: string | null;
};

type Action =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; rows: SheetImportReviewRow[] }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'PROMOTE_START'; rowId: string }
  | { type: 'PROMOTE_END' }
  | { type: 'SAVE_TENDENCIES_START'; rowId: string }
  | { type: 'SAVE_TENDENCIES_END' }
  | { type: 'SET_ERROR'; error: string };

const initialState: State = {
  rows: [],
  loading: true,
  error: null,
  promotingId: null,
  savingTendenciesId: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true, error: null };
    case 'LOAD_SUCCESS':
      return { ...state, loading: false, rows: action.rows };
    case 'LOAD_ERROR':
      return { ...state, loading: false, error: action.error };
    case 'PROMOTE_START':
      return { ...state, promotingId: action.rowId, error: null };
    case 'PROMOTE_END':
      return { ...state, promotingId: null };
    case 'SAVE_TENDENCIES_START':
      return { ...state, savingTendenciesId: action.rowId, error: null };
    case 'SAVE_TENDENCIES_END':
      return { ...state, savingTendenciesId: null };
    case 'SET_ERROR':
      return { ...state, error: action.error };
  }
}

const PROMOTABLE_BANK_FIELDS = ['Weekly check in', 'Stream Check in', 'Point Tasks', 'Pro Contract', 'Signing Bonus', 'Pro Incentives', 'UC carried over'];
const SPEND_BANK_FIELDS = ['Fines', 'Upgrade Purchases'];

function BankRowCard({ row, onPromote, busy }: { row: BankReviewRow; onPromote: (id: string) => void; busy: boolean }) {
  const entries = Object.entries(row.bank ?? {}).filter(([k]) => !['Total UC', 'Total Spent'].includes(k));

  return (
    <div className="grid gap-3 border-b border-[var(--app-border)] px-4 py-4 last:border-b-0 xl:grid-cols-[1.2fr_1fr_auto] xl:items-start">
      <div>
        <p className="text-base font-black text-[var(--app-text)]">{row.player_name}</p>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-app-muted">
          {row.team_name ?? 'Unmatched'} · {row.promoted_player_id ? 'Player promoted' : 'Player NOT promoted'}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {entries.map(([field, value]) => {
          const isSpend = SPEND_BANK_FIELDS.includes(field);
          return (
            <span key={field} className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[0.6rem] font-bold tracking-[0.04em] ${isSpend ? 'border-[var(--c-red)]/30 text-[var(--c-red)]' : 'border-[var(--c-green)]/30 text-[var(--c-green)]'}`}>
              <span className="uppercase opacity-70">{field}</span>
              <span className="tabular-nums">{isSpend ? '-' : '+'}{value.toLocaleString()}</span>
            </span>
          );
        })}
      </div>
      <div className="flex flex-col items-end gap-2">
        {row.bank_promoted_at ? (
          <StatusPill tone="green">Promoted {new Date(row.bank_promoted_at).toLocaleDateString()}</StatusPill>
        ) : (
          <button
            type="button"
            onClick={() => onPromote(row.id)}
            disabled={busy || !row.promoted_player_id}
            className="rounded-2xl border border-uba-gold/30 bg-uba-gold/15 px-4 py-2.5 text-[0.65rem] font-black uppercase tracking-[0.16em] text-uba-gold-light transition hover:bg-uba-gold/25 disabled:cursor-not-allowed disabled:border-[var(--app-border)] disabled:bg-[var(--navy4)] disabled:text-app-muted"
          >
            {busy ? 'Promoting' : 'Promote to UC Ledger'}
          </button>
        )}
        {!row.promoted_player_id && !row.bank_promoted_at ? (
          <p className="text-[0.6rem] text-app-muted">Promote player first</p>
        ) : null}
      </div>
    </div>
  );
}

export function ImportReviewPage() {
  useDocumentTitle('Import Review');
  const [state, dispatch] = useReducer(reducer, initialState);
  const { rows, loading, error, promotingId, savingTendenciesId } = state;
  const [bankRows, setBankRows] = useState<BankReviewRow[]>([]);
  const [bankLoading, setBankLoading] = useState(true);
  const [promotingBankId, setPromotingBankId] = useState<string | null>(null);
  const [bankResult, setBankResult] = useState<string | null>(null);

  async function loadBankRows() {
    setBankLoading(true);
    try {
      setBankRows(await fetchBankReviewRows());
    } catch {
      // fail silently
    } finally {
      setBankLoading(false);
    }
  }

  async function handlePromoteBank(rowId: string) {
    setPromotingBankId(rowId);
    setBankResult(null);
    try {
      const result = await promoteBankToUcLedger(rowId);
      if (result) {
        setBankResult(`Created ${result.created} UC events, skipped ${result.skipped}.`);
      } else {
        setBankResult('Promotion returned no result — check console.');
      }
      await loadBankRows();
    } catch (err) {
      setBankResult(err instanceof Error ? err.message : 'Bank promotion failed.');
    } finally {
      setPromotingBankId(null);
    }
  }

  async function loadRows() {
    dispatch({ type: 'LOAD_START' });
    try {
      dispatch({ type: 'LOAD_SUCCESS', rows: await fetchSheetImportReviewRows() });
    } catch (err) {
      dispatch({ type: 'LOAD_ERROR', error: err instanceof Error ? err.message : 'Unable to load sheet import rows.' });
    }
  }

  useEffect(() => {
    void loadRows();
    void loadBankRows();
  }, []);

  async function handlePromote(rowId: string) {
    dispatch({ type: 'PROMOTE_START', rowId });
    try {
      await promoteSheetImportPlayerRow(rowId);
      await clearTeamCache();
      await loadRows();
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Unable to promote sheet import row.' });
    } finally {
      dispatch({ type: 'PROMOTE_END' });
    }
  }

  async function handleSaveTendencies(rowId: string, tendencies: Record<string, number>) {
    dispatch({ type: 'SAVE_TENDENCIES_START', rowId });
    try {
      await setSheetImportPlayerTendencies(rowId, tendencies);
      await clearTeamCache();
      await loadRows();
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Unable to save manual tendencies.' });
    } finally {
      dispatch({ type: 'SAVE_TENDENCIES_END' });
    }
  }

  const readyRows = rows.filter((row) => row.canPromote);
  const manualRows = rows.filter((row) => row.tendencyReviewStatus === 'needs_manual');
  const promotedRows = rows.filter((row) => row.reviewStatus === 'promoted');
  const blockedRows = rows.filter((row) => row.validationErrors.length > 0 || !row.matchedTeamSlug || ['needs_manual', 'invalid'].includes(row.tendencyReviewStatus));
  const unpromotedBankRows = bankRows.filter(r => !r.bank_promoted_at);
  const promotedBankRows = bankRows.filter(r => r.bank_promoted_at);

  return (
    <RequireRole requiredRole="admin">
    <div className="grid gap-5">
      <PageHeader
        kicker="Roster QA"
        title="Import review board."
        description="Review and promote imported player data from team sheets. Each row must pass validation before becoming a live player record."
        meta="Admin-only import queue"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Staged rows" value={loading ? '...' : String(rows.length)} detail="Latest visible sheet-import player rows. Admin RLS controls access." tone="blue" />
        <MetricCard label="Ready" value={loading ? '...' : String(readyRows.length)} detail="Clean rows that satisfy promotion guardrails." tone="green" />
        <MetricCard label="Manual tends" value={loading ? '...' : String(manualRows.length)} detail="Rows with tendency links/placeholders that must be entered manually." tone="gold" />
        <MetricCard label="Promoted" value={loading ? '...' : String(promotedRows.length)} detail="Rows already moved into canonical players/rosters/hotzones." tone="slate" />
      </section>

      <Panel className="p-5 sm:p-6">
        <SectionTitle
          eyebrow="Team sheet template"
          title="Importer contract"
          body="All team sheets follow the same tab structure. The importer validates every row and flags anything that needs manual review."
        />
        <div className="mt-5 grid gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--navy4)] p-4 lg:col-span-2">
            <p className="premium-label">Required tabs</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {teamSheetTabs.map((tab) => <StatusPill key={tab} tone="blue">{tab}</StatusPill>)}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--navy4)] p-4">
            <p className="premium-label">Attribute columns</p>
            <p className="mt-2 text-3xl font-black text-[color:var(--app-text)]">{attributeSheetHeaders.length}</p>
            <p className="mt-1 text-xs text-app-muted">Detailed ratings before aggregate buckets.</p>
          </div>
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--navy4)] p-4">
            <p className="premium-label">Badge columns</p>
            <p className="mt-2 text-3xl font-black text-[color:var(--app-text)]">{badgeSheetHeaders.length}</p>
            <p className="mt-1 text-xs text-app-muted">Blank, Bronze, Silver, Gold, HOF, Legend.</p>
          </div>
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--navy4)] p-4 lg:col-span-4">
            <p className="premium-label">Bank import note</p>
            <p className="mt-2 text-sm leading-6 text-app-muted">
              Bank values like {bankSheetHeaders.slice(0, 4).join(', ')} and totals are staged for audit and must be reviewed before committing to the UC ledger.
            </p>
          </div>
        </div>
      </Panel>

      <Panel className="overflow-hidden p-0">
        <div className="border-b border-[var(--app-border)] p-5 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <SectionTitle eyebrow="Staged sheet rows" title="Admin promotion queue" body={`${readyRows.length} ready / ${blockedRows.length} blocked / ${promotedRows.length} promoted`} />
            <button
              type="button"
              onClick={() => void loadRows()}
              className="rounded-2xl border border-[var(--app-border)] bg-[var(--navy4)] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-app-muted transition hover:border-uba-blue-light/40 hover:text-uba-blue-light"
            >
              Refresh
            </button>
          </div>
          {error ? <p className="mt-4 rounded-2xl border border-[var(--c-red)]/20 bg-[var(--c-red)]/10 p-4 text-sm font-bold text-[var(--c-red)]">{error}</p> : null}
        </div>

        {loading ? <p className="p-5 text-sm text-app-muted">Loading staged sheet rows...</p> : null}
        {!loading && rows.length === 0 ? (
          <p role="status" aria-live="polite" className="p-5 text-sm leading-6 text-app-muted">
            No staged sheet rows are visible yet. Run `npm run sheets:sync:write` with server-only credentials to populate staging, then sign in as an admin to review and promote rows here.
          </p>
        ) : null}
        {!loading && rows.map((row) => (
          <ReviewRow
            key={row.id}
            row={row}
            busy={promotingId === row.id}
            tendencyBusy={savingTendenciesId === row.id}
            onPromote={handlePromote}
            onSaveTendencies={handleSaveTendencies}
          />
        ))}
      </Panel>

      <Panel className="overflow-hidden p-0">
        <div className="border-b border-[var(--app-border)] p-5 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <SectionTitle eyebrow="Bank data" title="UC Ledger promotion" body="Promote staged bank values from team sheets into the append-only UC ledger. Player must be promoted first." />
            <button
              type="button"
              onClick={() => void loadBankRows()}
              className="rounded-2xl border border-[var(--app-border)] bg-[var(--navy4)] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-app-muted transition hover:border-uba-blue-light/40 hover:text-uba-blue-light"
            >
              Refresh
            </button>
          </div>
          {bankResult ? <p className="mx-4 mt-4 rounded-2xl border border-uba-gold/20 bg-uba-gold/[0.06] p-3 text-sm text-uba-gold-light">{bankResult}</p> : null}
        </div>

        {bankLoading ? <p className="p-5 text-sm text-app-muted">Loading bank data...</p> : null}
        {!bankLoading && bankRows.length === 0 ? (
          <p role="status" aria-live="polite" className="p-5 text-sm leading-6 text-app-muted">No bank data found in staged sheet import rows.</p>
        ) : null}
        {!bankLoading && unpromotedBankRows.map((row) => (
          <BankRowCard key={row.id} row={row} onPromote={handlePromoteBank} busy={promotingBankId === row.id} />
        ))}
        {!bankLoading && promotedBankRows.length > 0 ? (
          <details className="border-t border-[var(--app-border)]">
            <summary className="cursor-pointer px-5 py-3 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-app-muted transition hover:text-[var(--app-text)]">
              Previously promoted ({promotedBankRows.length})
            </summary>
            <div className="border-t border-[var(--app-border)]">
              {promotedBankRows.map((row) => (
                <BankRowCard key={row.id} row={row} onPromote={handlePromoteBank} busy={false} />
              ))}
            </div>
          </details>
        ) : null}
      </Panel>
    </div>
    </RequireRole>
  );
}
