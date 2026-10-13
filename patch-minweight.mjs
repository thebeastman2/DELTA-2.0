/* DELTA 2.0 — Min Weight constraint patch for the compiled Dashboard bundle.
 *
 * Run with:  bun patch-minweight.mjs        (from the mirror/ directory)
 *
 * Applies the "Min Weight Limit" feature on the Optimize tab:
 *   - new applyMinW() waterline projection (floor + rescale to Σw = 1)
 *   - fr()  (backtest per-rebalance dispatch) routes every method's weights
 *     through the floor
 *   - jr()  (one-shot analysis) floors all 7 portfolios before metrics are
 *     computed, floors the efficient-frontier points, and passes minWeight
 *     through the params whitelist and the backtest config
 *   - UI: live "Min Weight Limit" switch + "% per position" input + feasibility
 *     hint, honest footnote, Math Process bullet
 *
 * Every edit is anchored on a unique string of the minified bundle; the script
 * aborts WITHOUT writing if any anchor is missing or ambiguous, so it is safe
 * to re-run against a fresh re-mirror (restore/replace the bundle first).
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const target = join(here, "assets", "Dashboard-CTKqEs0Z.js");
const backup = target + ".orig";

let src = readFileSync(target, "utf8");

if (src.includes("applyMinW")) {
  console.log(
    "applyMinW already present — patch already applied. " +
      "Restore assets/Dashboard-CTKqEs0Z.js from .orig (or a fresh mirror) to re-apply.",
  );
  process.exit(0);
}
if (src.includes("_fw")) {
  console.error("Unexpected: identifier _fw already exists in bundle — aborting.");
  process.exit(1);
}

/* applyMinW(weights, minWeight, maxWeight):
 * waterline projection — names below the floor are pinned at the floor, the
 * rest are rescaled so the weights still sum to 1. The effective floor is
 * clamped to min(minWeight, maxWeight, 1/N) so contradictory caps degrade
 * gracefully; infeasible budgets fall back to equal weight. Returns the input
 * untouched when minWeight is null/<= 0 (constraint off). */
const APPLY_MIN_W =
  "function applyMinW(t,s,n){const a=t.length;if(a===0)return t;" +
  "const o=Math.min(s??0,n??1,1/a);if(!(o>0))return t;" +
  "let r=Es(t);const p=new Array(a).fill(!1);" +
  "for(let i=0;i<a+5;i++){let l=!1;" +
  "for(let m=0;m<a;m++)!p[m]&&r[m]<o-1e-12&&(p[m]=!0,r[m]=o,l=!0);" +
  "let c=0;for(let m=0;m<a;m++)p[m]||(c+=r[m]);" +
  "const u=p.reduce((x,y)=>x+(y?1:0),0),d=1-o*u;" +
  "if(d<=1e-12||c<=1e-12){r=new Array(a).fill(1/a);break}" +
  "const h=d/c;for(let m=0;m<a;m++)p[m]||(r[m]*=h);" +
  "if(!l&&Math.abs(h-1)<1e-12)break}" +
  "return Es(r)}";

const edits = [];
const edit = (name, anchor, replacement) => edits.push({ name, anchor, replacement });
const editRe = (name, regex, fn) => edits.push({ name, regex, fn });

/* 1 — helper, inserted right before the be() metrics helper */
edit(
  "applyMinW helper",
  "function be(t,s,n,a){",
  APPLY_MIN_W + "function be(t,s,n,a){",
);

/* 2/3 — fr(): wrap the method switch so every returned weight vector is floored */
edit(
  "fr() wrap open",
  ':void 0;switch(s){case"equalWeight":return he(a);',
  ':void 0;const _fw=(()=>{switch(s){case"equalWeight":return he(a);',
);
edit(
  "fr() wrap close",
  'case"hrp":return zs(r,i,n.linkage).weights}}',
  'case"hrp":return zs(r,i,n.linkage).weights}})();return applyMinW(_fw,n.minWeight,n.maxWeight)}',
);

/* 4 — jr() params whitelist (unknown fields are stripped, so add minWeight) */
edit(
  "jr() params whitelist",
  "transactionCost:s.transactionCost??R.transactionCost,maxWeight:s.maxWeight}",
  "transactionCost:s.transactionCost??R.transactionCost,maxWeight:s.maxWeight,minWeight:s.minWeight}",
);

/* 5 — jr() backtest config carries minWeight into every rebalance */
edit(
  "jr() backtest config",
  "maxWeight:a.maxWeight},Mt=pr(Ce,gr)",
  "maxWeight:a.maxWeight,minWeight:a.minWeight},Mt=pr(Ce,gr)",
);

/* 6 — jr(): floor each method's weights BEFORE ie() computes metrics */
edit(
  "jr() equalWeight",
  'ie("equalWeight","Equal Weight",new Array(m).fill(1/m),h,f,a.rfAnnual,r)',
  'ie("equalWeight","Equal Weight",applyMinW(new Array(m).fill(1/m),a.minWeight,a.maxWeight),h,f,a.rfAnnual,r)',
);
edit(
  "jr() minVar",
  "const V=ce(h,f,a.rfAnnual,D)?.weights??new Array(m).fill(1/m);",
  "const V=applyMinW(ce(h,f,a.rfAnnual,D)?.weights??new Array(m).fill(1/m),a.minWeight,a.maxWeight);",
);
edit(
  "jr() maxSharpe",
  "const V=Ue(h,f,a.rfAnnual,D)?.weights??ce(h,f,a.rfAnnual,D)?.weights??new Array(m).fill(1/m);",
  "const V=applyMinW(Ue(h,f,a.rfAnnual,D)?.weights??ce(h,f,a.rfAnnual,D)?.weights??new Array(m).fill(1/m),a.minWeight,a.maxWeight);",
);
edit(
  "jr() maxReturn",
  "const V=Ps(h,f,a.rfAnnual,D)?.weights??new Array(m).fill(1/m);",
  "const V=applyMinW(Ps(h,f,a.rfAnnual,D)?.weights??new Array(m).fill(1/m),a.minWeight,a.maxWeight);",
);
edit(
  "jr() maxSortino",
  "const V=Fs(h,f,a.rfAnnual,d,D)?.weights??new Array(m).fill(1/m);",
  "const V=applyMinW(Fs(h,f,a.rfAnnual,d,D)?.weights??new Array(m).fill(1/m),a.minWeight,a.maxWeight);",
);
edit(
  "jr() blackLitterman",
  'ie("blackLitterman","Black-Litterman",Ue(S,N,a.rfAnnual,D)?.weights??ce(S,N,a.rfAnnual,D)?.weights??new Array(m).fill(1/m),S,N,a.rfAnnual,r)',
  'ie("blackLitterman","Black-Litterman",applyMinW(Ue(S,N,a.rfAnnual,D)?.weights??ce(S,N,a.rfAnnual,D)?.weights??new Array(m).fill(1/m),a.minWeight,a.maxWeight),S,N,a.rfAnnual,r)',
);
edit(
  "jr() hrp",
  'ie("hrp","HRP",_.weights,h,f,a.rfAnnual,r)',
  'ie("hrp","HRP",applyMinW(_.weights,a.minWeight,a.maxWeight),h,f,a.rfAnnual,r)',
);

/* 7 — jr(): floor frontier points too (metrics recomputed via be()) */
edit(
  "jr() frontier",
  "E=Nt(h,f,a.rfAnnual,64)",
  "E=Nt(h,f,a.rfAnnual,64).map(p=>({...be(applyMinW(p.weights,a.minWeight,a.maxWeight),h,f,a.rfAnnual),target:p.target}))",
);

/* 8 — UI: replace the dead Min Weight Limit switch with a live control */
edit(
  "UI min weight switch",
  'e.jsx(Le,{label:"Min Weight Limit",checked:!1,onChange:()=>{}})',
  'e.jsxs("div",{className:"flex items-center justify-between gap-3 py-0.5",children:[e.jsx("span",{className:"text-xs text-foreground/90",children:"Min Weight Limit"}),e.jsx(pt,{checked:n.minWeight!=null,onCheckedChange:y=>a({...n,minWeight:y?5/100:void 0})})]}),n.minWeight!=null&&e.jsxs("div",{className:"flex flex-col gap-1 pb-1 pl-1",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(U,{type:"number",step:1,min:0,max:100,value:Math.round(n.minWeight*100),onChange:y=>{const E=Number(y.target.value);Number.isFinite(E)&&E>=0&&a({...n,minWeight:E/100})},className:"h-7 w-16 font-mono text-xs"}),e.jsx("span",{className:"text-xs text-muted-foreground",children:"% per position"})]}),n.minWeight*100>mw+.001&&e.jsx("p",{className:"text-[10px] leading-4 text-rose-400",children:`Must be \u2264 ${mw.toFixed(1)}%`})]})',
);

/* 9 — UI: honest footnote */
edit(
  "UI footnote",
  'children:"Min weight, sector, and turnover limits are reconstruction assumptions not yet enforced in v1."',
  'children:"Min weight is enforced on every solve: weights are floored at the minimum and rescaled to sum to 100%. Sector and turnover limits are reconstruction assumptions not yet enforced."',
);

/* 10 — UI: feasibility bound for the hint (max allowed floor in %) */
edit(
  "UI feasibility bound",
  "w=n.maxWeight!=null?Math.round(n.maxWeight*100):30,C=M.useMemo(",
  "w=n.maxWeight!=null?Math.round(n.maxWeight*100):30,mw=i?Math.min(n.maxWeight??1,1/i.tickers.length)*100:100,C=M.useMemo(",
);

/* 11 — Math Process panel: document the projection */
editRe(
  "Math Process bullet",
  /bisection \(no [^"]+"\}\)/,
  (m) =>
    m +
    ',e.jsx("li",{children:"Min weight floor - waterline projection pins underweights at the floor, then rescales so the weights still sum to 1"})',
);

/* ---- check every anchor is unique BEFORE touching the file ---- */
const problems = [];
for (const e of edits) {
  let count;
  if (e.regex) {
    const re = new RegExp(e.regex.source, e.regex.flags.includes("g") ? e.regex.flags : e.regex.flags + "g");
    count = (src.match(re) || []).length;
  } else {
    count = src.split(e.anchor).length - 1;
  }
  if (count !== 1) problems.push(`  ${e.name}: matched ${count} times`);
}
if (problems.length) {
  console.error("ABORT — anchors not unique, nothing written:\n" + problems.join("\n"));
  process.exit(1);
}

/* ---- apply ---- */
for (const e of edits) {
  src = e.regex ? src.replace(e.regex, e.fn) : src.replace(e.anchor, e.replacement);
}

if (!existsSync(backup)) {
  console.warn("Note: no .orig backup found next to the bundle; consider keeping one.");
}
writeFileSync(target, src);
console.log(`Applied ${edits.length} edits to ${target}`);
console.log(`New size: ${src.length} chars (was ${readFileSync(backup, "utf8").length} in .orig).`);
