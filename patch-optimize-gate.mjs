/* Patch: the Optimize view must not re-optimize on its own.
 *
 * The mirrored bundle derives the whole result panel from the *live* Method
 * dropdown, so picking a different method silently swapped every metric at once
 * (the "abrupt" auto-run). This patch splits the selection into
 *
 *   l             - the pending choice in the dropdown (unchanged)
 *   __optApplied  - the method whose results are on screen
 *
 * and only moves __optApplied when the user clicks Run Optimization, after a
 * two second loader window so the pentafoil spinner is actually legible.
 *
 * Run: tools/nodejs/node.exe mirror/patch-optimize-gate.mjs
 * Anchors are checked before and after the rewrite, so a second run (or an
 * anchor that overlaps another edit) aborts instead of half-applying.
 */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const url = new URL('./assets/Dashboard-CTKqEs0Z.js', import.meta.url);
const backup = new URL('./assets/Dashboard-CTKqEs0Z.js.pre-optimize-gate', import.meta.url);
const bundle = fs.readFileSync(url, 'utf8');
const LOADER_MS = '2e3'; // 2000 ms

const edits = [
  /* 1. state: applied method + the 2 s busy window, and a combined loading flag
   *    (the parent's `running` prop still drives its own short window). */
  {
    name: 'run-gate state',
    from: '[p,u]=M.useState(0),d=M.useRef("mptMaxSharpe"),h=M.useRef(0),',
    to: '[p,u]=M.useState(0),[__optApplied,__setOptApplied]=M.useState("mptMaxSharpe"),' +
        '[__optBusy,__setOptBusy]=M.useState(!1),__optLoading=__optBusy||r,' +
        '__optPortfolioRef=M.useRef(null),d=M.useRef("mptMaxSharpe"),h=M.useRef(0),'
  },
  /* 2. the results panel reads the applied method, never the pending dropdown */
  {
    name: 'result panel follows the applied method',
    from: 'f=x.find(y=>y.key===l)??x[0]',
    to: 'f=x.find(y=>y.key===__optApplied)??x[0]'
  },
  /* 3. the click arms a two second window, then commits and persists the run;
   *    the tab also opens on the portfolio's own last run instead of a fixed
   *    default, so what is on screen is always a run that actually happened. */
  {
    name: 'run click holds the loader for 2 s before committing',
    from: '_=()=>{d.current=l,o(),u(y=>y+1)}',
    /* the arrow must end the declaration list, so the sync effect is a
     * statement of its own rather than a bogus const declarator */
    to: `_=()=>{d.current=l,o(),__setOptBusy(!0),setTimeout(()=>{__setOptApplied(d.current),__setOptBusy(!1),u(y=>y+1)},${LOADER_MS})};` +
        'M.useEffect(()=>{if(!i||!s)return;if(__optPortfolioRef.current===s.id)return;__optPortfolioRef.current=s.id;' +
        'const m=s.optimization?.method;m&&i.portfolios.some(E=>E.key===m)&&(__setOptApplied(m),c(m))},[i,s])'
  },
  /* 4. hint above the button, then the button itself: both live in one anchor so
   *    neither edit can invalidate the other. The busy state spans the whole
   *    window instead of the parent's 450 ms `running` flag. */
  {
    name: 'pending-choice hint + button busy state',
    from: 'e.jsx(__ViewsEditor,{settings:n,setSettings:a,analysis:i,portfolio:s,api:t}),e.jsxs(W,{onClick:_,disabled:r,"aria-busy":r,className:"w-full gap-2",children:[r?e.jsx(__DeltaLoader,{className:"size-4"}):e.jsx(ms,{className:"size-4"}),r?null:"Run Optimization"]})',
    to: 'e.jsx(__ViewsEditor,{settings:n,setSettings:a,analysis:i,portfolio:s,api:t}),' +
        'l!==__optApplied&&!__optLoading&&e.jsx("p",{className:"text-[10px] leading-4 text-muted-foreground",' +
        'children:"Method changed. Click Run Optimization to apply it."}),' +
        'e.jsxs(W,{onClick:_,disabled:__optLoading,"aria-busy":__optLoading,className:"w-full gap-2",' +
        'children:[__optLoading?e.jsx(__DeltaLoader,{className:"size-4"}):e.jsx(ms,{className:"size-4"}),' +
        '__optLoading?null:"Run Optimization"]})'
  },
  /* 5. the status line above the results reports the running pass too */
  {
    name: 'results header shows the loader while running',
    from: '!r&&e.jsxs("span",{className:"mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-teal-300",children:[e.jsx(ft,{className:"size-3.5"})," Optimization complete"]})',
    to: '(__optLoading?e.jsxs("span",{className:"mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-teal-300",children:[e.jsx(__DeltaLoader,{className:"size-3.5"})," Optimizing"]}):e.jsxs("span",{className:"mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-teal-300",children:[e.jsx(ft,{className:"size-3.5"})," Optimization complete"]}))'
  }
];

for (const edit of edits) {
  const count = bundle.split(edit.from).length - 1;
  if (count !== 1) throw new Error(`anchor "${edit.name}" matched ${count} times, expected 1`);
}
let patched = bundle;
for (const edit of edits) patched = patched.replace(edit.from, edit.to);

/* verify the rewritten bundle, not just the edits we intended */
for (const edit of edits) {
  const count = patched.split(edit.to).length - 1;
  if (count !== 1) throw new Error(`"${edit.name}" landed ${count} times, expected 1`);
}
for (const leftover of [
  'r?null:"Run Optimization"',
  'disabled:r,"aria-busy":r,className:"w-full gap-2"',
  '!r&&e.jsxs("span",{className:"mb-1',
  'f=x.find(y=>y.key===l)',
  'u(y=>y+1)};if(M.useEffect'
]) {
  if (patched.includes(leftover)) throw new Error(`stale code left behind: ${leftover}`);
}
if (patched === bundle) throw new Error('no change produced');

/* Parse gate: the browser loads this chunk as an ES module. `node --check`
 * parses it as a script and silently tolerates a broken const declaration, so
 * parse it as a module instead. */
const gate = "const vm=require('vm');new vm.SourceTextModule(require('fs').readFileSync(0,'utf8'));";
try {
  execFileSync(process.execPath, ['--no-warnings', '--experimental-vm-modules', '--eval', gate],
    { input: patched, stdio: ['pipe', 'pipe', 'pipe'] });
} catch (err) {
  throw new Error(`patched bundle fails to parse as an ES module, nothing written: ${err.stderr || err.message}`);
}

fs.writeFileSync(backup, bundle);
fs.writeFileSync(url, patched);
console.log(`Patched ${fileURLToPath(url)} (${edits.length} edits, loader window ${LOADER_MS} ms).`);
console.log('Backup written to assets/Dashboard-CTKqEs0Z.js.pre-optimize-gate');
