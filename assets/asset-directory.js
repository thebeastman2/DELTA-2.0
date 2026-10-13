import { r as React } from './react-vendor-BuDGsmEW.js';

export const QUOTE_TTL = 2 * 60 * 60 * 1000;
let state = { entries: [], loading: true, error: null, verifiedAt: null };
let request;
const listeners = new Set();
const quotes = new Map();
const unavailable = new Set();

function notify() {
  for (const listener of listeners) listener();
}
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function validQuote(quote, now = Date.now()) {
  return !!quote && Number.isFinite(quote.price) && quote.price > 0 &&
    Number.isFinite(quote.fetchedAt) && now - quote.fetchedAt < QUOTE_TTL &&
    quote.fetchedAt <= now + 60000;
}
export function quoteSnapshot(ticker) {
  const quote = quotes.get(ticker);
  return validQuote(quote) ? quote : null;
}
export function recordQuotes(rows) {
  for (const quote of rows) if (validQuote(quote)) quotes.set(quote.ticker, quote);
}
export function removeUnavailable(tickers) {
  let changed = false;
  for (const ticker of tickers) {
    const symbol = typeof ticker === 'string' ? ticker : ticker?.ticker;
    if (symbol && !unavailable.has(symbol)) {
      unavailable.add(symbol); quotes.delete(symbol); changed = true;
    }
  }
  if (changed) {
    state = { ...state, entries: state.entries.filter(row => !unavailable.has(row.ticker)) };
    notify();
  }
}
export function validateDirectory(directory) {
  if (directory?.schemaVersion !== 2 || !Array.isArray(directory.entries))
    throw new Error('Invalid verified asset directory');
  const seen = new Set();
  for (const row of directory.entries) {
    const expectedType = { ETF: 'ETF', Commodities: 'ETF', Equities: 'EQUITY', Crypto: 'CRYPTOCURRENCY' }[row.assetClass];
    if (!row.ticker || !row.name || seen.has(row.ticker) || row.historyPoints < 1009 ||
        !row.identityVerified || !expectedType || row.providerType !== expectedType ||
        !Number.isFinite(row.quote?.price) || row.quote.price <= 0 || !row.quote.fetchedAt)
      throw new Error(`Invalid or unverified asset: ${row.ticker || '(missing ticker)'}`);
    seen.add(row.ticker);
  }
  return directory.entries;
}
export async function loadDirectory() {
  if (!request) {
    request = (async () => {
      try {
        const response = await fetch(new URL('./asset-directory.json', import.meta.url), { cache: 'no-store' });
        if (!response.ok) throw new Error(`Asset directory HTTP ${response.status}`);
        const directory = await response.json();
        const entries = validateDirectory(directory).filter(row => !unavailable.has(row.ticker));
        recordQuotes(entries.map(row => row.quote));
        state = { entries, loading: false, error: null, verifiedAt: directory.verifiedAt };
      } catch (error) {
        state = { ...state, loading: false, error: error.message };
        request = null;
      }
      notify();
    })();
  }
  return request;
}
export function useVerifiedDirectory(register) {
  const snapshot = React.useSyncExternalStore(subscribe, () => state);
  React.useEffect(() => { loadDirectory(); }, []);
  React.useEffect(() => { register(snapshot.entries); }, [snapshot.entries, register]);
  const tickers = React.useMemo(() => snapshot.entries.map(row => row.ticker), [snapshot.entries]);
  return { ...snapshot, tickers };
}
