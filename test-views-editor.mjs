// Verification for the views-editor patch: extracts the real solver functions from
// the patched bundle and checks them against an independent BL implementation.
import fs from "node:fs";

const s = fs.readFileSync(new URL("./assets/Dashboard-CTKqEs0Z.js", import.meta.url), "utf8");
let pass = 0, fail = 0;
function ok(cond, label) { if (cond) { pass++; console.log("  ok  " + label); } else { fail++; console.log("FAIL  " + label); } }

// ---------- anchor / wiring checks ----------
ok((s.split("function __ViewsEditor(").length - 1) === 1, "exactly one __ViewsEditor definition");
ok((s.split("e.jsx(__ViewsEditor,{settings:n,setSettings:a,analysis:i,portfolio:s,api:t}),").length - 1) === 1, "exactly one render wiring (v3: with portfolio+api props)");
ok(s.indexOf("function __ViewsEditor(") < s.indexOf("function Nr({"), "editor defined before Nr");
ok((s.split("function __normView(").length - 1) === 1, "exactly one __normView definition");

// ---------- extract solver functions from the bundle ----------
const iK = s.indexOf("function K("), iTr = s.indexOf("function tr(");
const window_ = s.slice(iK, iTr); // K .. Ts (contiguous top-level fns)
const HnDef = (s.match(/\bHn\s*=\s*([0-9.]+(?:e-?\d+)?)/) || [])[1] ?? "1e-11";
const iAm = s.indexOf("function applyMinW(");
const iBe = s.indexOf("function be(", iAm);
const applyMinWSrc = s.slice(iAm, iBe) + "\nfunction Es(t){const n=t.reduce((a,o)=>a+o,0);return n<=0?t.map(()=>1/t.length):t.map(a=>a/n)}";
const iIs = s.indexOf("const Is=[");
const iIsEnd = s.indexOf("],gr=", iIs);
const IsSrc = s.slice(iIs, iIsEnd + 1);

let lib;
try {
  lib = new Function(window_ + "\n" + applyMinWSrc + "\nconst Hn=" + HnDef + ";\n" +
    "return {O,Q,vs,_e,le,Ae,bs,K,ct,Ot,Jn,Zn,er,Ts,applyMinW};")();
  ok(true, "solver functions extracted & compiled");
} catch (x) { ok(false, "solver extraction: " + x.message); process.exit(1); }
const DEFAULT_VIEWS = new Function(IsSrc + ";return Is;")();
ok(Array.isArray(DEFAULT_VIEWS) && DEFAULT_VIEWS.length === 3, "default views Is extracted (3 views)");

// ---------- independent reference BL (no shared code with the bundle) ----------
const inv = M => { const n = M.length, A = M.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => i === j ? 1 : 0)]);
  for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    if (Math.abs(A[p][c]) < 1e-14) throw new Error("singular"); [A[c], A[p]] = [A[p], A[c]];
    const d = A[c][c]; for (let j = c; j < 2 * n; j++) A[c][j] /= d;
    for (let r = 0; r < n; r++) { if (r === c) continue; const f = A[r][c]; for (let j = c; j < 2 * n; j++) A[r][j] -= f * A[c][j]; } }
  return A.map(r => r.slice(n)); };
const mm = (A, B) => A.map((r, i) => B[0].map((_, j) => r.reduce((a, v, k) => a + v * B[k][j], 0)));
const mv = (A, x) => A.map(r => r.reduce((a, v, k) => a + v * x[k], 0));
const Tm = A => A[0].map((_, j) => A.map(r => r[j]));
const scal = (A, k) => A.map(r => r.map(v => v * k));
const add = (A, B) => A.map((r, i) => r.map((v, j) => v + B[i][j]));
function refBL({ mu, cov, rf, w, tau, views, tickers, riskAversion }) {
  const rows = [], qs = [], confs = [];
  for (const v of views) { const r = new Array(mu.length).fill(0);
    if (v.type === "absolute") { const i = tickers.indexOf(v.asset); if (i >= 0) { r[i] = 1; rows.push(r); qs.push(v.q); confs.push(v.confidence ?? .5); } }
    else { const a = tickers.indexOf(v.assetA), b = tickers.indexOf(v.assetB);
      if (a >= 0 && b >= 0 && a !== b) { r[a] = 1; r[b] = -1; rows.push(r); qs.push(v.q); confs.push(v.confidence ?? .5); } } }
  const P = rows, k = qs.length;
  const Sw = mv(cov, w), num = w.reduce((a, v, i) => a + v * mu[i], 0) - rf, den = w.reduce((a, v, i) => a + v * Sw[i], 0);
  let delta = den > 1e-12 ? num / den : riskAversion; if (!isFinite(delta) || delta <= 0) delta = riskAversion;
  const pi = Sw.map(v => v * delta);
  if (k === 0) return { pi, postExcess: pi.slice(), postCov: add(cov, scal(cov, tau)) };
  const tS = scal(cov, tau), iSt = inv(tS), Pt = Tm(P);
  const omegaDiag = P.map((r, vi) => { const c2 = Math.min(Math.max(confs[vi], .01), .99); const v2 = mv(tS, r); return r.reduce((a, x, i) => a + x * v2[i], 0) * (1 / c2 - 1); });
  const iOm = inv(omegaDiag.map((d, i) => { const row = new Array(k).fill(0); row[i] = d; return row; }));
  const M = add(iSt, mm(mm(Pt, iOm), P)), iM = inv(M);
  const omq = mv(iOm, qs); // view space
  const ptOmQ = Pt.map(row => row.reduce((a, v, k) => a + v * omq[k], 0)); // asset space via P^T
  const rhs = mv(iSt, pi).map((v, i) => v + ptOmQ[i]);
  const postExcess = mv(iM, rhs);
  return { pi, postExcess, postCov: add(cov, iM) };
}

// ---------- 1) __normView clamping ----------
const norm = new Function(s.slice(s.indexOf("function __normView("), s.indexOf("function __ViewsEditor(")) + ";return __normView;")();
ok(JSON.stringify(norm({ type: "absolute", asset: "AAPL", q: 5, confidence: 1.5 })) === JSON.stringify({ type: "absolute", asset: "AAPL", q: 2, confidence: .99 }), "norm clamps q=5 -> 2, conf=1.5 -> .99");
ok(norm({ type: "relative", assetA: "A", assetB: "B", q: -9, confidence: 0 }).q === -2, "norm clamps q=-9 -> -2");
ok(norm({ type: "relative", assetA: "A", assetB: "B", q: .03 }).confidence === .5, "norm defaults confidence .5");
ok(norm({ type: "absolute", asset: "X", q: .05, confidence: .6 }).confidence === .6, "norm preserves valid view");

// ---------- 2) Jn: P/q construction ----------
const tick = ["AAPL", "MSFT", "JNJ", "XOM"];
const { P: Pj, q: qj } = lib.Jn([
  { type: "absolute", asset: "MSFT", q: .03, confidence: .5 },
  { type: "relative", assetA: "AAPL", assetB: "XOM", q: .08, confidence: .6 },
  { type: "absolute", asset: "ZZZZ", q: .05, confidence: .5 },
  { type: "relative", assetA: "JNJ", assetB: "JNJ", q: .04, confidence: .5 },
], tick);
ok(Pj.length === 2 && qj.length === 2, "Jn drops invalid + duplicate-asset views (2 of 4 kept)");
ok(JSON.stringify(Pj[0]) === JSON.stringify([0, 1, 0, 0]) && qj[0] === .03, "absolute view -> unit row, q");
ok(JSON.stringify(Pj[1]) === JSON.stringify([1, 0, 0, -1]) && qj[1] === .08, "relative view -> +1/-1 row, q");

// ---------- 3) er: delta calibration on hand numbers ----------
const muH = [.10, .06], covH = [[.04, .01], [.01, .09]], wH = [.6, .4], rfH = .02;
const erH = lib.er(muH, covH, rfH, wH, 2.5);
ok(Math.abs(erH.riskAversion - (.084 - .02) / .0336) < 1e-12, "er delta = (w.mu-rf)/(w.Sw) hand value");
ok(Math.abs(erH.pi[0] - .028 * ((.084 - .02) / .0336)) < 1e-12 && Math.abs(erH.pi[1] - .042 * ((.084 - .02) / .0336)) < 1e-12, "er pi = delta*S*w hand value");
const erF = lib.er([.01, .005], covH, .5, wH, 2.5);
ok(erF.riskAversion === 2.5, "er falls back to riskAversion when delta <= 0");

// ---------- 4) Ts vs independent reference BL ----------
function compareBL(name, mu, cov, rf, w, tau, views, fallback) {
  const tickers = mu.map((_, i) => "A" + i);
  const out = lib.Ts({ mu, cov, rf, marketWeights: w, tau, views, tickers, riskAversionFallback: fallback });
  const ref = refBL({ mu, cov, rf, w, tau, views, tickers, riskAversion: fallback });
  let maxErr = 0;
  for (let i = 0; i < mu.length; i++) {
    maxErr = Math.max(maxErr, Math.abs(out.posteriorExcess[i] - ref.postExcess[i]));
    for (let j = 0; j < mu.length; j++) maxErr = Math.max(maxErr, Math.abs(out.posteriorCov[i][j] - ref.postCov[i][j]));
  }
  ok(maxErr < 1e-10, name + " posterior matches independent BL (max err " + maxErr.toExponential(2) + ")");
  return out;
}
const cov4 = [[.045, .012, .008, .006], [.012, .038, .007, .005], [.008, .007, .028, .009], [.006, .005, .009, .031]];
compareBL("4-asset, mixed views", [.12, .09, .06, .05], cov4, .03, [.35, .3, .2, .15], .05,
  [{ type: "relative", assetA: "A0", assetB: "A3", q: .05, confidence: .7 },
   { type: "absolute", asset: "A2", q: .03, confidence: .5 }], 2.5);
compareBL("high-confidence view", [.12, .09, .06, .05], cov4, .03, [.35, .3, .2, .15], .05,
  [{ type: "absolute", asset: "A0", q: .40, confidence: .95 }], 2.5);
const zeroV = lib.Ts({ mu: [.1, .06], cov: covH, rf: .02, marketWeights: wH, tau: .05, views: [], tickers: ["A", "B"], riskAversionFallback: 2.5 });
ok(Math.abs(zeroV.posteriorExcess[0] - zeroV.pi[0]) < 1e-15 && Math.abs(zeroV.posteriorCov[0][0] - (covH[0][0] * 1.05)) < 1e-12, "zero views -> posterior = equilibrium, cov = S+tS");
ok(zeroV.posterior[0] === zeroV.posteriorExcess[0] + .02, "posterior adds rf to excess");

// ---------- 5) the app's default views still produce a posterior ----------
const outDef = lib.Ts({ mu: [.12, .09, .06, .05], cov: cov4, rf: .03, marketWeights: [.35, .3, .2, .15], tau: .05, views: DEFAULT_VIEWS.map(v => ({ ...v })), tickers: ["NVDA", "JNJ", "COST", "XOM"], riskAversionFallback: 2.5 });
ok(outDef && Array.isArray(outDef.posterior) && outDef.posterior.length === 4, "default Is views produce a 4-asset posterior");

// ---------- 6) applyMinW regression (BL output still floored) ----------
const wBL = [.62, .18, .11, .09];
const floored = lib.applyMinW(wBL, .10, .5);
ok(Math.abs(floored.reduce((a, b) => a + b, 0) - 1) < 1e-9, "applyMinW keeps sum 1 on BL weights");
ok(Math.min(...floored) >= .10 - 1e-12, "applyMinW floors BL weights at 10%");
ok(JSON.stringify(lib.applyMinW(wBL, 0, .5)) === JSON.stringify(wBL), "applyMinW passthrough when floor 0");

// ---------- 7) bundle sanity ----------
ok(s.length >= 140000 && s.length < 200000, "bundle length in plausible post-patch range (" + s.length + " chars)");

// ---------- 8) v2/v3 feature checks ----------
ok((s.split("delta.blviews.v2").length - 1) === 2, "localStorage key delta.blviews.v2 read+written exactly once each");
ok((s.split("function __getStoredViews()").length - 1) === 1, "exactly one __getStoredViews");
ok((s.split("function __storeViews(").length - 1) === 1, "exactly one __storeViews");
ok((s.split("let __viewsRestored=!1").length - 1) === 1, "restore-once guard present");
ok((s.split("s.viewScope===\"perPortfolio\"&&Array.isArray(t.views)").length - 1) === 1, "perPortfolio read gate in analysis hook (once)");
ok((s.split("function __ViewsEditor({settings:n,setSettings:a,analysis:i,portfolio:pf,api:ap})").length - 1) === 1, "editor takes portfolio+api (v3)");
ok((s.split("ap.update(pf.id,{views:").length - 1) === 1, "per-portfolio write-through via api.update (v3)");
ok((s.split("BL diagnostics (last run)").length - 1) === 1, "BL diagnostics panel present (once)");
ok(s.includes("posteriorExcess"), "diagnostics source uses analysis.bl posteriorExcess");
const editorSrc = s.slice(s.indexOf("function __ViewsEditor("), s.indexOf("function Nr({"));
ok(editorSrc.includes("n.viewScope===\"perPortfolio\"?(Array.isArray(pf?.views)?pf.views:(n.views??[])):(n.views??[])"), "editor reads EFFECTIVE views (portfolio override w/ fallback) (v3)");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
