// Patch: user-editable Black-Litterman views (absolute + relative, confidence slider).
// Anchored replacements on the minified bundle; aborts without writing unless every
// anchor matches exactly once. Idempotent via the __ViewsEditor guard.
import fs from "node:fs";

const PATH = new URL("./assets/Dashboard-CTKqEs0Z.js", import.meta.url);
let s = fs.readFileSync(PATH, "utf8");
const before = s.length;

if (s.includes("function __ViewsEditor(") || s.includes("function __normView(")) {
  console.log("already patched — nothing to do");
  process.exit(0);
}

// ---------- E1: editor component, inserted before the Optimize view ----------
const A1 = "function Nr({api:t,portfolio:s,settings:n,setSettings:a,run:o,running:r,analysis:i}){";
const E1 = `function __normView(t){const s=t.type==="absolute"?{type:"absolute",asset:t.asset??"",q:Number(t.q)||0,confidence:t.confidence??.5}:{type:"relative",assetA:t.assetA??"",assetB:t.assetB??"",q:Number(t.q)||0,confidence:t.confidence??.5};s.q=Math.min(Math.max(s.q,-2),2),s.confidence=Math.min(Math.max(s.confidence,.01),.99);return s}
function __ViewsEditor({settings:n,setSettings:a,analysis:i}){const l=(i?.tickers??[]).map(s=>({v:s,l:s})),o=n.views??[],d=(v,x)=>a({...n,views:o.map((t,s2)=>s2===v?__normView({...t,...x}):t)}),h=v=>a({...n,views:o.filter((t,s2)=>s2!==v)}),p=()=>a({...n,views:[...o,__normView({type:"absolute",asset:l[0]?.v??"",q:.05,confidence:.6})]}),g=()=>a({...n,views:[...o,__normView({type:"relative",assetA:l[0]?.v??"",assetB:(l[1]??l[0])?.v??"",q:.03,confidence:.6})]}),m=()=>a({...n,views:Is.map(t=>({...t}))}),c=()=>a({...n,views:[]});
return e.jsx(T,{title:"Black-Litterman Views",children:e.jsxs("div",{className:"space-y-2",children:[e.jsx("p",{className:"text-[10px] leading-4 text-muted-foreground",children:"Your predictions, blended with equilibrium returns (\u03a0 = \u03b4\u03a3w\u2098\u2096\u209c). Absolute = \u201casset returns X%\u201d. Relative = \u201cA beats B by X%\u201d. Confidence sets the error variance \u03a9\u1d62\u1d62 = (P\u03c4\u03a3P\u1d40)\u1d62\u1d62\u00b7(1/c \u2212 1): higher confidence tilts the portfolio harder toward the view."}),o.length===0&&e.jsx("p",{className:"text-[11px] text-amber-300",children:"No views set \u2014 Black-Litterman reduces to the equilibrium portfolio."}),o.map((s,v)=>{const b=s.type==="absolute",A=b?l.some(t=>t.v===s.asset):l.some(t=>t.v===s.assetA)&&l.some(t=>t.v===s.assetB)&&s.assetA!==s.assetB;return e.jsxs("div",{className:"rounded-md border border-white/10 bg-white/[0.02] p-2",children:[e.jsxs("div",{className:"flex flex-wrap items-end gap-2",children:[e.jsxs("div",{className:"flex flex-col gap-1",children:[e.jsx("span",{className:"text-[9px] font-medium uppercase tracking-wider text-muted-foreground",children:"Type"}),e.jsx("span",{className:"rounded border px-1.5 py-0.5 text-[10px] font-medium "+(b?"border-cyan-400/30 bg-cyan-400/10 text-cyan-300":"border-violet-400/30 bg-violet-400/10 text-violet-300"),children:b?"Absolute":"Relative"})]}),b?e.jsxs("div",{className:"flex flex-col gap-1",children:[e.jsx("span",{className:"text-[9px] font-medium uppercase tracking-wider text-muted-foreground",children:"Asset"}),e.jsx("select",{value:s.asset??"",onChange:t=>d(v,{asset:t.target.value}),className:"h-7 w-28 rounded-md border border-white/10 bg-black/30 px-1.5 font-mono text-xs text-foreground",children:l.map(t=>e.jsx("option",{value:t.v,children:t.l},t.v))})]}):e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"flex flex-col gap-1",children:[e.jsx("span",{className:"text-[9px] font-medium uppercase tracking-wider text-muted-foreground",children:"Long"}),e.jsx("select",{value:s.assetA??"",onChange:t=>d(v,{assetA:t.target.value}),className:"h-7 w-24 rounded-md border border-white/10 bg-black/30 px-1.5 font-mono text-xs text-foreground",children:l.map(t=>e.jsx("option",{value:t.v,children:t.l},t.v))})]}),e.jsxs("div",{className:"flex flex-col gap-1",children:[e.jsx("span",{className:"text-[9px] font-medium uppercase tracking-wider text-muted-foreground",children:"Short"}),e.jsx("select",{value:s.assetB??"",onChange:t=>d(v,{assetB:t.target.value}),className:"h-7 w-24 rounded-md border border-white/10 bg-black/30 px-1.5 font-mono text-xs text-foreground",children:l.map(t=>e.jsx("option",{value:t.v,children:t.l},t.v))})]})]}),e.jsxs("div",{className:"flex flex-col gap-1",children:[e.jsx("span",{className:"text-[9px] font-medium uppercase tracking-wider text-muted-foreground",children:"Prediction %/yr"}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(U,{type:"number",step:"0.5",value:Math.round((Number(s.q)||0)*1e4)/100,onChange:t=>{const E=Number(t.target.value);Number.isFinite(E)&&d(v,{q:E/100})},className:"h-7 w-20 font-mono text-xs"}),e.jsx("span",{className:"text-[10px] text-muted-foreground",children:"%"})]})]}),e.jsxs("div",{className:"flex min-w-44 flex-1 flex-col gap-1",children:[e.jsx("span",{className:"text-[9px] font-medium uppercase tracking-wider text-muted-foreground",children:"Confidence"}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("input",{type:"range",min:1,max:99,value:Math.round((s.confidence??.5)*100),onChange:t=>d(v,{confidence:Number(t.target.value)/100}),className:"h-1 flex-1 accent-cyan-400"}),e.jsx(U,{type:"number",min:"1",max:"99",value:Math.round((s.confidence??.5)*100),onChange:t=>{const E=Number(t.target.value);Number.isFinite(E)&&d(v,{confidence:Math.min(Math.max(E,1),99)/100})},className:"h-7 w-14 font-mono text-xs"}),e.jsx("span",{className:"text-[10px] text-muted-foreground",children:"%"})]})]}),e.jsx(W,{variant:"outline",size:"sm",onClick:()=>h(v),className:"shrink-0 text-rose-400 hover:text-rose-300",children:"Remove"})]}),!A&&e.jsx("p",{className:"mt-1 text-[10px] text-amber-300",children:"Invalid or duplicate tickers \u2014 the solver will ignore this view."})]},v)}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsx(W,{variant:"outline",size:"sm",onClick:p,disabled:o.length>=12,children:"+ Absolute"}),e.jsx(W,{variant:"outline",size:"sm",onClick:g,disabled:o.length>=12,children:"+ Relative"}),e.jsx(W,{variant:"outline",size:"sm",onClick:m,children:"Reset to defaults"}),e.jsx(W,{variant:"outline",size:"sm",onClick:c,children:"Clear all"})]}),e.jsx("p",{className:"text-[10px] leading-4 text-muted-foreground",children:"Views feed the Optimize result and the Black-Litterman row in the Backtest (applied at every rebalance). They never alter historical data."})]})})}
` + A1;

// ---------- E2: render the card above the Run Optimization button ----------
const A2 = 'e.jsxs(W,{onClick:_,disabled:r,className:"w-full gap-2",children:[e.jsx(ms,{className:"size-4"}),r?"Computing…":"Run Optimization"]})';
const E2 = 'e.jsx(__ViewsEditor,{settings:n,setSettings:a,analysis:i}),' + A2;

const edits = [
  { name: "E1 editor-before-Nr", oldS: A1, newS: E1 },
  { name: "E2 card-render",      oldS: A2, newS: E2 },
];

for (const ed of edits) {
  const count = s.split(ed.oldS).length - 1;
  if (count !== 1) {
    console.error(`ABORT: anchor "${ed.name}" matched ${count} times (expected 1). No write.`);
    process.exit(1);
  }
}
for (const ed of edits) s = s.replace(ed.oldS, ed.newS);
fs.writeFileSync(PATH, s);
console.log(`patched OK: ${before} -> ${s.length} chars (+${s.length - before})`);
