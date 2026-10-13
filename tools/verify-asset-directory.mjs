import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const output = new URL('assets/asset-directory.json', root);
const checkpoint = new URL('../.freebuff/asset-coverage-checkpoint.json', root);
const reportPath = new URL('asset-coverage-report.json', root);
const MIN_HISTORY = 1009; // Existing 1008-return window needs estimation AND out-of-sample history.
const BATCH_SIZE = 20;
const CONCURRENCY = 3;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getJson(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
      return await response.json();
    } catch (error) {
      if (attempt === 2) throw error;
      await pause(1000 * 2 ** attempt);
    }
  }
}

function security(row, assetClass) {
  return { ticker: row.symbol.trim().toUpperCase().replace(/\./g, '-'), name: row.name,
    assetClass, exchange: row.exchange || '', sector: assetClass === 'Crypto' ? 'Crypto' : '' };
}

const [stocks, funds, crypto] = await Promise.all([
  getJson('https://api.twelvedata.com/stocks?country=United%20States&format=json'),
  getJson('https://api.twelvedata.com/etf?country=United%20States&format=json'),
  getJson('https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=all_cryptocurrencies_us&count=250')
]);
const byTicker = new Map();
for (const row of stocks.data || []) {
  if (['Common Stock', 'REIT'].includes(row.type) && row.currency === 'USD' && row.symbol && row.name)
    byTicker.set(security(row, 'Equities').ticker, security(row, 'Equities'));
}
// The reference ETF feed also contains mutual funds. Do not inflate ETF coverage.
const establishedFunds = new Set(['QQQ', 'DIA', 'IWM', 'VTI', 'ACWI', 'VOO', 'IVV', 'GLD', 'SLV', 'USO', 'DBC', 'UNG', 'TLT', 'IEF', 'SHY', 'BND', 'LQD', 'HYG', 'TIP']);
for (const row of funds.data || []) {
  if (row.currency === 'USD' && row.symbol && row.name &&
      (/\bETF\b|exchange.traded/i.test(row.name) || establishedFunds.has(row.symbol)))
    byTicker.set(security(row, 'ETF').ticker, security(row, 'ETF'));
}
for (const row of crypto.finance?.result?.[0]?.quotes || []) {
  if (row.symbol?.endsWith('-USD') && row.quoteType === 'CRYPTOCURRENCY') {
    byTicker.set(row.symbol, { ticker: row.symbol, name: row.longName || row.shortName || row.symbol,
      assetClass: 'Crypto', exchange: 'CCC', sector: 'Crypto' });
  }
}
if (![...byTicker.values()].some(row => row.assetClass === 'Crypto')) throw new Error('Crypto directory returned no USD instruments');
// Commodity exposure through exchange-traded funds, not spot/futures contracts.
const commodityFunds = {
  GLD: ['SPDR Gold Shares', 'Gold'], IAU: ['iShares Gold Trust', 'Gold'],
  SGOL: ['abrdn Physical Gold Shares ETF', 'Gold'], BAR: ['GraniteShares Gold Trust', 'Gold'],
  GLDM: ['SPDR Gold MiniShares Trust', 'Gold'], SLV: ['iShares Silver Trust', 'Silver'],
  SIVR: ['abrdn Physical Silver Shares ETF', 'Silver'], PPLT: ['abrdn Physical Platinum Shares ETF', 'Platinum'],
  PALL: ['abrdn Physical Palladium Shares ETF', 'Palladium'], DBP: ['Invesco DB Precious Metals Fund', 'Precious Metals'],
  USO: ['United States Oil Fund', 'Crude Oil'], BNO: ['United States Brent Oil Fund', 'Brent Oil'],
  UNG: ['United States Natural Gas Fund', 'Natural Gas'], UGA: ['United States Gasoline Fund', 'Gasoline'],
  DBO: ['Invesco DB Oil Fund', 'Crude Oil'], DBE: ['Invesco DB Energy Fund', 'Energy'],
  USL: ['United States 12 Month Oil Fund', 'Crude Oil'], DBC: ['Invesco DB Commodity Index Tracking Fund', 'Broad Commodities'],
  PDBC: ['Invesco Optimum Yield Diversified Commodity Strategy No K-1 ETF', 'Broad Commodities'],
  GSG: ['iShares S&P GSCI Commodity-Indexed Trust', 'Broad Commodities'],
  COMT: ['iShares GSCI Commodity Dynamic Roll Strategy ETF', 'Broad Commodities'],
  BCI: ['abrdn Bloomberg All Commodity Strategy K-1 Free ETF', 'Broad Commodities'],
  CORN: ['Teucrium Corn Fund', 'Corn'], WEAT: ['Teucrium Wheat Fund', 'Wheat'],
  SOYB: ['Teucrium Soybean Fund', 'Soybeans'], CANE: ['Teucrium Sugar Fund', 'Sugar'],
  TAGS: ['Teucrium Agricultural Fund', 'Agriculture'], DBA: ['Invesco DB Agriculture Fund', 'Agriculture'],
  CPER: ['United States Copper Index Fund', 'Copper']
};
for (const [ticker, [name, sector]] of Object.entries(commodityFunds)) {
  const reference = byTicker.get(ticker);
  byTicker.set(ticker, { ...reference, ticker, name: reference?.name || name,
    assetClass: 'Commodities', sector, exchange: reference?.exchange || 'US' });
}
const all = [...byTicker.values()].sort((a, b) => {
  const rank = { Commodities: 0, ETF: 1, Crypto: 2, Equities: 3 };
  return rank[a.assetClass] - rank[b.assetClass] || a.ticker.localeCompare(b.ticker);
});
let saved = { checked: {}, entries: [] };
try { saved = JSON.parse(await fs.readFile(checkpoint, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const accepted = new Map(saved.entries.filter(row => byTicker.has(row.ticker) && row.historyPoints >= MIN_HISTORY)
  .map(row => [row.ticker, commodityFunds[row.ticker] ? { ...row, assetClass: 'Commodities', sector: commodityFunds[row.ticker][1] } : row]));
const checked = Object.fromEntries(Object.entries(saved.checked).filter(([ticker, result]) => byTicker.has(ticker) && result.status !== 'error'));
if (process.argv.includes('--refresh')) {
  accepted.clear();
  for (const ticker of Object.keys(checked)) delete checked[ticker];
}
for (const row of process.argv.includes('--refresh') ? [] : saved.entries) {
  if (byTicker.has(row.ticker) && row.historyPoints < MIN_HISTORY)
    checked[row.ticker] = { status: 'unavailable', reason: `Only ${row.historyPoints} valid daily history points (need ${MIN_HISTORY})` };
}
const pending = all.filter(row => !checked[row.ticker]);
let cursor = 0, completed = Object.keys(checked).length;
let writeQueue = Promise.resolve();

function save() {
  const entries = [...accepted.values()].sort((a, b) => a.ticker.localeCompare(b.ticker));
  const counts = entries.reduce((result, row) => {
    result[row.assetClass] = (result[row.assetClass] || 0) + 1; return result;
  }, {});
  const metadata = { schemaVersion: 2, verifiedAt: Date.now(), source: 'Yahoo Finance',
    referenceSources: ['Twelve Data US stocks/ETFs', 'Yahoo USD crypto screener'],
    minimumHistoryPoints: MIN_HISTORY, counts, entries };
  const checkpointText = JSON.stringify({ checked, entries });
  const directoryText = JSON.stringify(metadata);
  const reportText = JSON.stringify({ ...metadata, entries: undefined, candidates: all.length,
    checked: completed, excluded: Object.entries(checked).filter(([, v]) => v.status === 'unavailable')
      .map(([ticker, v]) => ({ ticker, reason: v.reason })),
    transportFailures: Object.entries(checked).filter(([, v]) => v.status === 'error')
      .map(([ticker, v]) => ({ ticker, reason: v.reason })) }, null, 2);
  writeQueue = writeQueue.then(async () => {
    await fs.writeFile(checkpoint, checkpointText);
    await fs.writeFile(output, directoryText);
    await fs.writeFile(reportPath, reportText);
  });
  return writeQueue;
}

async function worker() {
  while (cursor < pending.length) {
    const batch = pending.slice(cursor, cursor += BATCH_SIZE);
    const symbols = batch.map(row => row.ticker).join(',');
    try {
      const [history, quotes] = await Promise.all([
        getJson(`https://query1.finance.yahoo.com/v8/finance/spark?symbols=${encodeURIComponent(symbols)}&range=5y&interval=1d`),
        getJson(`https://query1.finance.yahoo.com/v8/finance/spark?symbols=${encodeURIComponent(symbols)}&range=5d&interval=1d`)
      ]);
      for (const row of batch) {
        const series = history[row.ticker], quote = quotes[row.ticker];
        const points = (series?.close || []).filter((value, i) => Number.isFinite(value) && value > 0 && Number.isFinite(series.timestamp?.[i])).length;
        const price = quote?.fulldayPrice ?? quote?.close?.filter(value => Number.isFinite(value) && value > 0).at(-1);
        const quoteTime = quote?.timestamp?.at(-1);
        if (points >= MIN_HISTORY && Number.isFinite(price) && price > 0 && quoteTime && Date.now() / 1000 - quoteTime < 7 * 86400) {
          const previous = quote.previousClose ?? quote.chartPreviousClose;
          const changePercent = Number.isFinite(quote.fulldayChangePercent) ? quote.fulldayChangePercent / 100 :
            Number.isFinite(previous) && previous > 0 ? price / previous - 1 : null;
          accepted.set(row.ticker, { ...row, historyPoints: points,
            historyStart: series.timestamp[0], historyEnd: series.timestamp.at(-1),
            quote: { ticker: row.ticker, price, changePercent, source: 'yahoo', fetchedAt: Date.now() } });
          checked[row.ticker] = { status: 'available' };
        } else {
          accepted.delete(row.ticker);
          checked[row.ticker] = { status: 'unavailable', reason: points < MIN_HISTORY ? `Only ${points} valid daily history points (need ${MIN_HISTORY})` : 'No recent valid USD quote' };
        }
      }
    } catch (error) {
      // A transport error is not evidence that a listed asset has no data.
      for (const row of batch) checked[row.ticker] = { status: 'error', reason: error.message };
      console.error('Batch transport failure', symbols, error.message);
    }
    completed += batch.length;
    if (completed % 100 === 0 || cursor >= pending.length) {
      await save();
      console.log(JSON.stringify({ checked: completed, total: all.length,
        available: accepted.size, counts: [...accepted.values()].reduce((x, row) => { x[row.assetClass] = (x[row.assetClass] || 0) + 1; return x; }, {}) }));
    }
    await pause(200);
  }
}
console.log(`Verifying ${pending.length} pending of ${all.length} instruments; ${CONCURRENCY} workers, ${BATCH_SIZE} symbols/batch`);
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
await save();
// Reference names can be stale or reused after delistings. Confirm identity and
// instrument class with the same provider that supplies the actual prices.
const identities = [...accepted.values()].filter(row => !row.identityVerified);
let identityCursor = 0, identityCompleted = 0;
async function identityWorker() {
  while (identityCursor < identities.length) {
    const row = identities[identityCursor++];
    try {
      const chart = await getJson(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(row.ticker)}?range=1mo&interval=1d`);
      const meta = chart.chart?.result?.[0]?.meta;
      const expected = { ETF: 'ETF', Commodities: 'ETF', Equities: 'EQUITY', Crypto: 'CRYPTOCURRENCY' }[row.assetClass];
      if (!meta || meta.instrumentType !== expected || meta.currency !== 'USD') {
        accepted.delete(row.ticker);
        checked[row.ticker] = { status: 'unavailable', reason: `Price-provider instrument class/currency mismatch: ${meta?.instrumentType || 'missing'}/${meta?.currency || 'missing'}` };
      } else {
        accepted.set(row.ticker, { ...row, name: meta.longName || meta.shortName || row.name,
          providerType: meta.instrumentType, identityVerified: true });
      }
    } catch (error) {
      accepted.delete(row.ticker);
      checked[row.ticker] = { status: 'error', reason: error.message };
      console.error('Identity check transport failure', row.ticker, error.message);
    }
    identityCompleted++;
    if (identityCompleted % 250 === 0 || identityCursor >= identities.length) {
      await save();
      console.log(`Provider identities verified ${identityCompleted}/${identities.length}`);
    }
    await pause(100);
  }
}
console.log(`Confirming ${identities.length} provider instrument identities`);
await Promise.all(Array.from({ length: 4 }, identityWorker));
await save();
const final = JSON.parse(await fs.readFile(output, 'utf8'));
if ((final.counts.ETF || 0) < 500) throw new Error(`Only ${final.counts.ETF || 0} ETFs verified; need at least 500`);
if ((final.counts.Crypto || 0) <= 4) throw new Error('Crypto coverage did not grow');
if ((final.counts.Commodities || 0) < 10) throw new Error('Insufficient verified commodity fund coverage');
console.log(`Saved verified directory: ${fileURLToPath(output)}`);
