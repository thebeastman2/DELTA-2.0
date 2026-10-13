// Patch v2: persistence, per-portfolio scope, BL diagnostics, calc-details entry.
// Anchored replacements; aborts without writing unless every anchor matches exactly once.
// Idempotent: guarded on "delta.blviews.v2" presence. All anchors are pure ASCII.
import fs from "node:fs";

const PATH = new URL("./assets/Dashboard-CTKqEs0Z.js", import.meta.url);
let s = fs.readFileSync(PATH, "utf8");
const before = s.length;

if (s.includes("delta.blviews.v2")) { console.log("already patched — nothing to do"); process.exit(0); }

const edits = [];

// ---------- E1: storage helpers, inserted before Nr ----------
edits.push({
  name: "E1 prefns",
  oldS: "function Nr({api:t,portfolio:s,settings:n,setSettings:a,run:o,running:r,analysis:i}){",
  newS: `function __getStoredViews(){try{const t=localStorage.getItem("delta.blviews.v2");if(!t)return null;const s=JSON.parse(t);return Array.isArray(s.views)?{views:s.views,scope:s.scope==="perPortfolio"?"perPortfolio":"global"}:null}catch{return null}}
function __storeViews(t,s){try{localStorage.setItem("delta.blviews.v2",JSON.stringify({views:t,scope:s}))}catch{}}
let __viewsRestored=!1;` + "function Nr({api:t,portfolio:s,settings:n,setSettings:a,run:o,running:r,analysis:i}){",
});

// ---------- E2: scope toggle, inserted at the top of the card children ----------
edits.push({
  name: "E2 card-top",
  oldS: 'children:[e.jsx("p",{className:"text-[10px] leading-4 text-muted-foreground",children:"Your predictions',
  newS: 'children:[e.jsx(Le,{label:"Per-portfolio views",checked:n.viewScope==="perPortfolio",onChange:t2=>{const s2=t2?"perPortfolio":"global";__storeViews(o,s2),a({...n,viewScope:s2})}}),e.jsx("p",{className:"text-[10px] leading-4 text-muted-foreground",children:"Your predictions',
});

// ---------- E3: diagnostics panel + persist-on-edit in the card ----------
edits.push({
  name: "E3 card-fns",
  oldS: 'd=(v,x)=>a({...n,views:o.map((t,s2)=>s2===v?__normView({...t,...x}):t)}),h=v=>a({...n,views:o.filter((t,s2)=>s2!==v)}),p=()=>a({...n,views:[...o,__normView({type:"absolute",asset:l[0]?.v??"",q:.05,confidence:.6})]}),g=()=>a({...n,views:[...o,__normView({type:"relative",assetA:l[0]?.v??"",assetB:(l[1]??l[0])?.v??"",q:.03,confidence:.6})]}),m=()=>a({...n,views:Is.map(t=>({...t}))}),c=()=>a({...n,views:[]});',
  newS: 'q2=(t,s2)=>{__storeViews(t,n.viewScope??"global"),a({...n,views:t,...(s2||{})})},d=(v,x)=>q2(o.map((t,s3)=>s3===v?__normView({...t,...x}):t)),h=v=>q2(o.filter((t,s3)=>s3!==v)),p=()=>q2([...o,__normView({type:"absolute",asset:l[0]?.v??"",q:.05,confidence:.6})]),g=()=>q2([...o,__normView({type:"relative",assetA:l[0]?.v??"",assetB:(l[1]??l[0])?.v??"",q:.03,confidence:.6})]),m=()=>q2(Is.map(t=>({...t}))),c=()=>q2([]);',
});

// ---------- E4: diagnostics panel, inserted after the footnote paragraph ----------
edits.push({
  name: "E4 diagnostics",
  oldS: 'children:"Views feed the Optimize result and the Black-Litterman row in the Backtest (applied at every rebalance). They never alter historical data."})]})})}',
  newS: 'children:"Views feed the Optimize result and the Black-Litterman row in the Backtest (applied at every rebalance). They never alter historical data."}),(()=>{const y=i?.bl,R2=(y?.riskAversion??2.5)*1,S2=(i?.params?.tau??.05)*1,W2=y?.pi?.map(t=>Math.round((Number(t)||0)*1e4)/1e4)??[],Z2=y?.posteriorExcess?.map(t=>Math.round((Number(t)||0)*1e4)/1e4)??[],M2=Array.isArray(y?.omega)?y.omega.map(t=>Math.max(t?.[0]??0,1e-12)):[],L2={margin:"0",padding:"6px 8px",fontSize:"11px",fontFamily:"monospace",background:"rgba(0,0,0,.35)",border:"1px solid rgba(255,255,255,.08)",borderRadius:"6px",width:"100%"};return e.jsx("details",{className:"rounded-md border border-white/10 bg-white/[0.02]",children:e.jsxs("summary",{className:"cursor-pointer px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground",children:["BL diagnostics (last run)"]}),children:e.jsxs("div",{className:"space-y-1.5 p-2",children:[y?e.jsxs(e.Fragment,{children:[e.jsxs("p",{className:"text-[10px] text-muted-foreground",children:["Implied \\u03b4 = ",R2.toFixed(3)," (\\u03c4 = ",S2.toFixed(3),") from the last optimization run."]}),e.jsx("details",{children:e.jsxs("summary",{className:"cursor-pointer text-[10px] text-muted-foreground",children:["Equilibrium \\u03a0 vs posterior \\u03bc (per asset)"]}),children:e.jsxs("table",{style:L2,children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{style:{textAlign:"left",paddingRight:8},children:"Asset"}),e.jsx("th",{style:{textAlign:"right",paddingRight:8},children:"\\u03a0"}),e.jsx("th",{style:{textAlign:"right",paddingRight:8},children:"\\u03bc_BL"}),e.jsx("th",{style:{textAlign:"right"},children:"\\u0394"})]})}),e.jsx("tbody",{children:(y.tickers??i?.tickers??[]).map((t2,s2)=>{const i2=W2[s2]??0,o2=Z2[s2]??0,i3=Math.round((o2-i2)*1e4)/1e4;return e.jsxs("tr",{children:[e.jsx("td",{style:{paddingRight:8},children:t2}),e.jsx("td",{style:{textAlign:"right",paddingRight:8},children:(i2*100).toFixed(2)+"%"}),e.jsx("td",{style:{textAlign:"right",paddingRight:8},children:(o2*100).toFixed(2)+"%"}),e.jsx("td",{style:{textAlign:"right",color:i3>0?"#5eead4":i3<0?"#fda4af":void 0},children:(i3>=0?"+":"")+(i3*100).toFixed(2)+"%"})]},t2)})})]})})}),M2.length>0&&e.jsx("details",{children:e.jsxs("summary",{className:"cursor-pointer text-[10px] text-muted-foreground",children:["\\u03a9 per view (error variance)"]}),children:e.jsx("table",{style:L2,children:e.jsx("tbody",{children:M2.map((t2,s2)=>e.jsxs("tr",{children:[e.jsx("td",{style:{paddingRight:8},children:"View "+(s2+1)}),e.jsx("td",{style:{textAlign:"right"},children:t2.toExponential(3)})]},s2))})})})]}):e.jsx("p",{className:"text-[10px] text-muted-foreground",children:"Run an optimization to populate diagnostics."})]})})})})]})})}',
});

// ---------- E5: restore stored views on mount ----------
edits.push({
  name: "E5 mount-restore",
  oldS: 'function Nr({api:t,portfolio:s,settings:n,setSettings:a,run:o,running:r,analysis:i}){const[l,c]=M.useState("mptMaxSharpe")',
  newS: 'function Nr({api:t,portfolio:s,settings:n,setSettings:a,run:o,running:r,analysis:i}){const[l,c]=M.useState("mptMaxSharpe");if(!__viewsRestored){__viewsRestored=!0;const t2=__getStoredViews();t2&&a(x2=>({...x2,views:t2.views,viewScope:t2.scope}))}',
});

// ---------- E6: per-portfolio override in the analysis hook ----------
edits.push({
  name: "E6 perportfolio",
  oldS: "const{assets:o,weights:cw}=Ie(t);return o.length<2?null:jr(o,{...s,rfAnnual:t.riskFreeRate,currentWeights:cw},a)},[t,s,a])}",
  newS: 'const{assets:o,weights:cw}=Ie(t);return o.length<2?null:jr(o,{...s,rfAnnual:t.riskFreeRate,currentWeights:cw,...(s.viewScope==="perPortfolio"&&Array.isArray(t.views)?{views:t.views}:{})},a)},[t,s,a])}',
});

for (const ed of edits) {
  const count = s.split(ed.oldS).length - 1;
  if (count !== 1) { console.error(`ABORT: anchor "${ed.name}" matched ${count} times (expected 1). No write.`); process.exit(1); }
}
for (const ed of edits) s = s.replace(ed.oldS, ed.newS);
fs.writeFileSync(PATH, s);
console.log(`patched v2 OK: ${before} -> ${s.length} chars (+${s.length - before})`);
