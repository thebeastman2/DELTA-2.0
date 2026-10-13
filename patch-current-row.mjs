/* DELTA 2.0 — "Current" strategy row for the Backtest tab.
 *
 * Run with:  bun patch-current-row.mjs        (from the mirror/ directory)
 * NOTE: run patch-minweight.mjs first — edit 2 anchors on its output.
 *
 * Adds a "Current" row at the TOP of the out-of-sample comparison table that
 * evaluates the portfolio exactly as the user currently holds it (live
 * constituent weights, held constant) over the same test window as every
 * walk-forward strategy, with the same metric set (return, volatility, Sharpe,
 * Sortino, Max DD, Calmar, turnover 0%, effective holdings).
 *
 * Edits (each anchored on a unique string of the minified bundle):
 *   1. wr() analysis hook: pass Ie(portfolio).weights as params.currentWeights
 *   2. jr() params whitelist: keep currentWeights
 *   3. jr(): build the Current row (dot of weights with each test day's asset
 *      returns; equity via Te; metrics via He) right after the backtest runs
 *   4. jr(): prepend the row to backtest (skipped when unavailable)
 *   5. chart color map Ke: dedicated series color for "Current"
 *   6. $e label map: expose "Current" in the Rolling Risk selector
 *
 * Aborts WITHOUT writing if any anchor is missing or ambiguous.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const target = join(here, "assets", "Dashboard-CTKqEs0Z.js");

let src = readFileSync(target, "utf8");

if (src.includes("currentWeights:s.currentWeights")) {
  console.log("Current-row patch already applied.");
  process.exit(0);
}

const edits = [];
const edit = (name, anchor, replacement) => edits.push({ name, anchor, replacement });

edit(
  "wr() passes current weights",
  "const{assets:o}=Ie(t);return o.length<2?null:jr(o,{...s,rfAnnual:t.riskFreeRate},a)",
  "const{assets:o,weights:cw}=Ie(t);return o.length<2?null:jr(o,{...s,rfAnnual:t.riskFreeRate,currentWeights:cw},a)",
);

edit(
  "jr() params whitelist",
  "minWeight:s.minWeight}",
  "minWeight:s.minWeight,currentWeights:s.currentWeights}",
);

edit(
  "jr() builds Current row",
  "Ct=Mt[0]?.netReturns.length??0,qs=Ce.dates.slice(",
  'Ct=Mt[0]?.netReturns.length??0,Cv=(()=>{const w=a.currentWeights;if(!(Array.isArray(w)&&w.length===r.length&&Ct>0))return null;const cr=o.returns.slice(a.backtestLookback,a.backtestLookback+Ct).map(v=>O(v,w)),ce=Te(cr),cm=He(cr,a.rfAnnual,R.periodsPerYear,ce);return{name:"Current",grossReturns:cr,netReturns:cr,equity:ce,grossEquity:ce,averageTurnover:0,metrics:cm,grossMetrics:cm,finalWeights:w.slice(),weightsHistory:[]}})(),qs=Ce.dates.slice(',
);

edit(
  "jr() prepends Current to backtest",
  "backtest:Mt,benchmarkEquity:At",
  "backtest:Cv?[Cv,...Mt]:Mt,benchmarkEquity:At",
);

edit(
  "chart color for Current",
  '"Benchmark (SPY)":"#fbbf24"}',
  '"Benchmark (SPY)":"#fbbf24","Current":"#e2e8f0"}',
);

edit(
  "Rolling Risk selector option",
  'blackLitterman:"Black-Litterman",hrp:"HRP"}',
  'blackLitterman:"Black-Litterman",hrp:"HRP",current:"Current"}',
);

const problems = [];
for (const e of edits) {
  const count = src.split(e.anchor).length - 1;
  if (count !== 1) problems.push(`  ${e.name}: matched ${count} times`);
}
if (problems.length) {
  console.error("ABORT - anchors not unique, nothing written:\n" + problems.join("\n"));
  process.exit(1);
}

for (const e of edits) src = src.replace(e.anchor, e.replacement);

writeFileSync(target, src);
console.log(`Applied ${edits.length} edits to ${target}`);
console.log(`New size: ${src.length} chars.`);
