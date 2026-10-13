import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const directory = JSON.parse(await fs.readFile(new URL('./assets/asset-directory.json', import.meta.url), 'utf8'));
const report = JSON.parse(await fs.readFile(new URL('./asset-coverage-report.json', import.meta.url), 'utf8'));
const moduleSource = await fs.readFile(new URL('./assets/asset-directory.js', import.meta.url), 'utf8');
const dashboard = await fs.readFile(new URL('./assets/Dashboard-CTKqEs0Z.js', import.meta.url), 'utf8');
const landing = await fs.readFile(new URL('./assets/Landing-C4mphqqp.js', import.meta.url), 'utf8');
const logo = await fs.readFile(new URL('./assets/DeltaLogo3D-qcLWtha6.js', import.meta.url), 'utf8');
// Load pure functions from the actual browser module; the React import is not needed here.
const source = moduleSource.replace(/^import .*?;\n/, '').replace(/export /g, '').replace(/import\.meta\.url/g, '"http://localhost/assets/asset-directory.js"');
const { validateDirectory, validQuote, recordQuotes, quoteSnapshot, removeUnavailable } =
  new Function(source + ';return {validateDirectory,validQuote,recordQuotes,quoteSnapshot,removeUnavailable};')();
let checks = 0;
function check(name, fn) { fn(); checks++; console.log('ok', name); }
check('directory validates every delivered asset', () => assert.equal(validateDirectory(directory).length, directory.entries.length));
check('at least 500 actual ETFs', () => assert.ok(directory.counts.ETF >= 500));
check('expanded crypto coverage uses provider-resolvable USD pairs', () => {
  assert.ok(directory.counts.Crypto > 4);
  assert.ok(directory.entries.filter(row => row.assetClass === 'Crypto').every(row => row.ticker.endsWith('-USD')));
});
check('no mutual funds masquerade as ETFs', () => assert.ok(directory.entries.filter(row => row.assetClass === 'ETF').every(row => row.identityVerified === true && row.providerType === 'ETF')));
check('all instruments have sufficient actual daily history and positive USD quotes', () => assert.ok(directory.entries.every(row => row.historyPoints >= 1009 && row.historyStart < row.historyEnd && row.quote.source === 'yahoo' && row.quote.price > 0 && Number.isFinite(row.quote.price))));
check('every instrument identity and class is confirmed by the price provider', () => {
  for (const row of directory.entries) {
    assert.equal(row.identityVerified, true);
    assert.equal(row.providerType, { ETF: 'ETF', Commodities: 'ETF', Equities: 'EQUITY', Crypto: 'CRYPTOCURRENCY' }[row.assetClass]);
  }
  assert.equal(directory.entries.find(row => row.ticker === 'A').name, 'Agilent Technologies, Inc.');
});
check('commodity funds cover metals, energy, agriculture and broad baskets with verified histories', () => {
  const rows = directory.entries.filter(row => row.assetClass === 'Commodities');
  assert.ok(rows.length >= 10);
  const symbols = new Set(rows.map(row => row.ticker));
  for (const ticker of ['GLD','SLV','CPER','USO','UNG','CORN','WEAT','SOYB','DBC']) assert.ok(symbols.has(ticker), ticker);
  assert.ok(rows.every(row => row.sector && row.providerType === 'ETF' && row.identityVerified && row.historyPoints >= 1009));
});
check('Fixed Income filter is removed without removing bond ETFs from existing holdings', () => {
  assert.ok(dashboard.includes('const Tn=["All","Equities","ETF","Commodities","Crypto"]'));
  assert.ok(!directory.entries.some(row => row.assetClass === 'Fixed Income'));
  assert.ok(directory.entries.some(row => row.ticker === 'BND' && row.assetClass === 'ETF'));
});
check('counts agree with delivered unique instruments', () => {
  assert.equal(new Set(directory.entries.map(row => row.ticker)).size, directory.entries.length);
  for (const [kind, count] of Object.entries(directory.counts)) assert.equal(directory.entries.filter(row => row.assetClass === kind).length, count);
});
check('all reference candidates checked without unresolved network errors', () => {
  assert.equal(report.checked, report.candidates);
  assert.equal(report.transportFailures.length, 0);
  assert.equal(report.excluded.length + directory.entries.length, report.candidates);
});
check('excluded symbols are not selectable', () => {
  const included = new Set(directory.entries.map(row => row.ticker));
  assert.ok(report.excluded.every(row => !included.has(row.ticker)));
});
check('benchmark, common stocks, ETFs, and crypto are retained', () => {
  const tickers = new Set(directory.entries.map(row => row.ticker));
  for (const ticker of ['SPY','QQQ','VTI','BND','AAPL','MSFT','BTC-USD','ETH-USD','ADA-USD','SOL-USD']) assert.ok(tickers.has(ticker), ticker);
});
check('stale, invalid, zero, negative and future quotes are rejected', () => {
  const now = Date.now();
  assert.equal(validQuote({price: 1, fetchedAt: now}, now), true);
  for (const price of [0,-1,NaN,Infinity,null]) assert.equal(validQuote({price, fetchedAt: now}, now), false);
  assert.equal(validQuote({price: 1, fetchedAt: now - 7200000}, now), false);
  assert.equal(validQuote({price: 1, fetchedAt: now + 120000}, now), false);
});
check('real snapshot quotes are available and removed on confirmed failure', () => {
  const sample = directory.entries.find(row => row.ticker === 'SPY').quote;
  recordQuotes([sample]); assert.equal(quoteSnapshot('SPY')?.price, sample.price);
  removeUnavailable(['SPY']); assert.equal(quoteSnapshot('SPY'), null);
});
check('duplicate or insufficient-history directory rows are rejected', () => {
  assert.throws(() => validateDirectory({...directory,entries:[directory.entries[0],directory.entries[0]]}));
  assert.throws(() => validateDirectory({...directory,entries:[{...directory.entries[0],historyPoints:1008}]}));
  assert.throws(() => validateDirectory({...directory,entries:[{...directory.entries[0],providerType:'MUTUALFUND'}]}));
  assert.throws(() => validateDirectory({...directory,entries:[{...directory.entries[0],identityVerified:false}]}));
});
check('all catalogue consumers use the verified directory rather than old cached lists', () => assert.ok(dashboard.includes('function bt(){return useVerifiedDirectory(Ze)}')));
check('asset table cannot render unpriced rows and supports all pages', () => {
  assert.ok(dashboard.includes('m.filter(b=>p.has(b.ticker))'));
  assert.ok(dashboard.includes('c.slice(pageIndex*tt,(pageIndex+1)*tt)'));
  assert.ok(dashboard.includes('children:"Next"') && dashboard.includes('children:"Previous"'));
});
check('unknown ticker cannot be added through keyboard or Add button', () => {
  assert.ok(dashboard.includes('if(!w||!p.includes(w))return;'));
  assert.ok(dashboard.includes('disabled:!p.includes(l.trim().toUpperCase())'));
});
check('logo reads the existing theme accent and releases its observer', () => {
  assert.ok(logo.includes('getPropertyValue("--accent")'));
  assert.ok(logo.includes('p.color.set(hex),p.emissive.set(hex)'));
  assert.ok(logo.includes('d.color.set(hex),R.color.set(hex),b.color.set(hex)'));
  assert.ok(logo.includes('accentObserver.disconnect()'));
  assert.ok(logo.includes('var(--accent, #4a6cf7) 32%'));
});
check('requested footer copy is gone; prior hero copy remains', () => {
  assert.ok(!landing.includes('DELTA · Modern Portfolio Theory · Black-Litterman'));
  assert.ok(landing.includes("We can't predict the future, but we can prepare for it"));
  assert.ok(landing.includes('From uncertainty to allocation.'));
});
console.log(`\n${checks} checks passed; ${directory.entries.length} data-backed instruments: ${JSON.stringify(directory.counts)}`);
