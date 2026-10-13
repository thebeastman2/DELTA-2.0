import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

/* Regression checks for the pentafoil loader that replaces the button label while an
 * optimization runs. The reference glyph is the trefoil spinner supplied with the
 * request; its 5-fold sibling is a rounded {5/2} star weave (5 petals + inner pentagon). */

const dashboard = await fs.readFile(new URL('./assets/Dashboard-CTKqEs0Z.js', import.meta.url), 'utf8');
const html = await fs.readFile(new URL('./index.html', import.meta.url), 'utf8');
let checks = 0;
function check(name, fn) { fn(); checks++; console.log('ok', name); }

/* The app loads this chunk as an ES module. `node --check` parses it as a
 * script and tolerates a broken const declaration (it passed a bundle the
 * browser rejected with "Missing initializer in const declaration"), so the
 * syntax gate has to be a real module parse. */
check('bundle parses as an ES module, the way the browser loads it', () => {
  const gate = "const vm=require('vm');new vm.SourceTextModule(require('fs').readFileSync(0,'utf8'));";
  execFileSync(process.execPath, ['--no-warnings', '--experimental-vm-modules', '--eval', gate],
    { input: dashboard, stdio: ['pipe', 'pipe', 'pipe'] });
});

/* ---------- wiring ---------- */
const loader = dashboard.match(/function __DeltaLoader\(t\)\{([\s\S]*?)\}\n/);
check('loader renders one track and one travelling dash on a closed pentafoil path', () => {
  assert.ok(loader, '__DeltaLoader is defined');
  const body = loader[1];
  assert.ok(body.includes('delta-loader-track') && body.includes('delta-loader-car'), 'track + car paths');
  assert.equal((body.match(/d:__DELTA_PENTAFOIL/g) || []).length, 2, 'both paths share the pentafoil geometry');
  assert.ok(body.includes('pathLength:100'), 'dash lengths are normalised to 100');
  assert.ok(body.includes('strokeWidth:4'), 'same stroke weight as the reference trefoil loader');
  assert.ok(body.includes('viewBox:"0 0 40 40"'), 'same viewBox as the reference loader');
});
check('loader is announced to assistive technology', () => {
  const body = loader[1];
  assert.ok(body.includes('role:"status"'), 'role=status');
  assert.ok(body.includes('"aria-label":(t&&t.label)||"Optimizing"'), 'default accessible label');
});
check('Run Optimization swaps its label for the loader while running', () => {
  assert.ok(!dashboard.includes('Computing…'), 'previous abrupt label swap removed');
  assert.match(dashboard,
    /children:\[__optLoading\?e\.jsx\(__DeltaLoader,\{className:"size-4"\}\):e\.jsx\(ms,\{className:"size-4"\}\),__optLoading\?null:"Run Optimization"\]/,
    'running state renders the loader instead of icon + label');
  assert.ok(dashboard.includes('__optLoading?null:"Run Optimization"'), 'label is hidden only while loading');
});
check('Run Optimization reports a busy state and stays disabled while running', () => {
  assert.ok(dashboard.includes('disabled:__optLoading,"aria-busy":__optLoading,className:"w-full gap-2"'), 'disabled + aria-busy track the loading flag');
  assert.ok(dashboard.includes('__optLoading=__optBusy||r'), 'the busy window also covers the parent run flag');
});
check('changing the method does not re-optimize on its own', () => {
  assert.ok(dashboard.includes('f=x.find(y=>y.key===__optApplied)??x[0]'), 'results are keyed to the applied method');
  assert.ok(!dashboard.includes('f=x.find(y=>y.key===l)??x[0]'), 'the live dropdown no longer drives the result panel');
  assert.ok(dashboard.includes('e.jsx(Je,{label:"Method",value:l,onChange:y=>c(y),'), 'the dropdown still moves the pending choice');
  assert.ok(dashboard.includes('l!==__optApplied&&!__optLoading&&e.jsx("p"'), 'an unapplied choice is called out above the button');
});
check('the tab opens on the run the portfolio already has, not a fixed default', () => {
  assert.ok(dashboard.includes('__optPortfolioRef=M.useRef(null)'), 'per-portfolio sync guard is declared');
  assert.ok(dashboard.includes('const m=s.optimization?.method;m&&i.portfolios.some(E=>E.key===m)&&(__setOptApplied(m),c(m))'),
    'the applied method and the dropdown are adopted from the stored optimization');
  assert.ok(dashboard.includes('if(__optPortfolioRef.current===s.id)return;'),
    'sync happens once per target portfolio, so a pending choice is never clobbered');
});
check('Run Optimization holds the loader for a full two seconds, then produces output', () => {
  const click = dashboard.match(/_=\(\)=>\{d\.current=l,o\(\),__setOptBusy\(!0\),setTimeout\(\(\)=>\{__setOptApplied\(d\.current\),__setOptBusy\(!1\),u\(y=>y\+1\)\},([\d.e]+)\)\}/);
  assert.ok(click, 'the click arms a loader window before committing the run');
  assert.equal(Number(click[1]), 2000, 'the loader window is 2000 ms');
  assert.ok(dashboard.includes('i.portfolios.find(E=>E.key===d.current)'), 'the run persists the method snapshotted at click time');
  assert.ok(!dashboard.includes('u(y=>y+1)};if(M.useEffect'), 'no un-delayed run commit is left behind');
});
check('the results header reports the running pass with the same loader', () => {
  assert.match(dashboard, /__optLoading\?e\.jsxs\("span",\{className:"mb-1 flex items-center gap-1\.5 text-\[11px\] uppercase tracking-wider text-teal-300",children:\[e\.jsx\(__DeltaLoader,\{className:"size-3\.5"\}\)," Optimizing"\]/);
  assert.ok(dashboard.includes('" Optimization complete"'), 'the idle state still reports completion');
});
check('Optimize this portfolio loads before switching view', () => {
  const button = dashboard.match(/e\.jsx\(W,\{onClick:\(\)=>\{setOpt\(!0\),setTimeout\(\(\)=>n\("optimize"\),(\d+)\)\},disabled:opt,"aria-busy":opt,className:"w-full",children:opt\?e\.jsx\(__DeltaLoader,\{className:"size-5"\}\):"Optimize this portfolio"\}\)/);
  assert.ok(button, 'click sets a busy flag, shows the loader and defers the view switch');
  const delay = Number(button[1]);
  assert.ok(delay >= 250 && delay <= 800, `feedback delay stays short (${delay}ms)`);
  assert.equal((dashboard.match(/setOpt\(!0\)/g) || []).length, 1, 'the busy flag is only set by this click');
  assert.match(dashboard, /\[m,g\]=M\.useState\(!1\),\[opt,setOpt\]=M\.useState\(!1\),\{tickers:p\}=bt\(\);/, 'busy state is declared in the portfolio view');
});
check('loader is used only by the optimization controls', () => {
  assert.equal((dashboard.match(/__DeltaLoader/g) || []).length, 4,
    'one definition + portfolio button + Run button + results header');
});

/* ---------- theme ---------- */
check('spinner colours come from the button theme', () => {
  const style = html.match(/<style id="delta-loader-style">([\s\S]*?)<\/style>/);
  assert.ok(style, 'loader stylesheet is embedded in the document');
  const css = style[1];
  assert.ok(/\.delta-loader\s*\{[^}]*color:\s*currentColor/.test(css), 'loader inherits the button colour');
  assert.ok(/\.delta-loader \.delta-loader-car\s*\{[^}]*stroke:\s*currentColor/.test(css), 'travelling dash uses currentColor');
  assert.ok(/\.delta-loader \.delta-loader-track\s*\{[^}]*stroke:\s*currentColor/.test(css), 'track uses currentColor');
  assert.ok(/\.delta-loader-track\s*\{[^}]*opacity:\s*\.2\b/.test(css), 'track stays a faint guide');
  assert.ok(!/#[0-9a-f]{3,6}\b/i.test(css), 'no hard-coded colours that would fight the Settings accent');
});
check('motion matches the reference trefoil loader', () => {
  const css = html.match(/<style id="delta-loader-style">([\s\S]*?)<\/style>/)[1];
  assert.ok(/stroke-dasharray:\s*15 85/.test(css), 'same car/track dash split');
  assert.ok(/animation:\s*delta-loader-travel 1\.4s linear infinite/.test(css), 'same 1.4s travel');
  assert.ok(/@keyframes delta-loader-travel\s*\{[\s\S]*?to\s*\{\s*stroke-dashoffset:\s*-100/.test(css), 'travel completes one lap');
  assert.ok(/@media \(prefers-reduced-motion: reduce\)[\s\S]*animation-duration:\s*3\.5s/.test(css), 'slower travel when reduced motion is requested');
});
check('stylesheet sits in the document head before the app mounts', () => {
  const styleAt = html.indexOf('<style id="delta-loader-style">');
  assert.ok(styleAt > -1 && styleAt < html.indexOf('</head>'), 'style precedes </head>');
});

/* ---------- geometry ---------- */
const pentafoil = dashboard.match(/__DELTA_PENTAFOIL="([^"]+)"/);
const points = [...pentafoil[1].matchAll(/([ML])(-?[\d.]+) (-?[\d.]+)/g)].map(m => [parseFloat(m[2]), parseFloat(m[3])]);
check('path is dense enough to render as a smooth curve at small sizes', () => {
  assert.ok(points.length >= 200, `${points.length} points`);
  assert.ok(pentafoil[1].startsWith('M') && pentafoil[1].endsWith('Z'), 'closed subpath');
  assert.ok(points.every(p => p[0] >= 0 && p[0] <= 40 && p[1] >= 0 && p[1] <= 40), 'geometry stays inside the viewBox');
});
function intersections(P) {
  const n = P.length, raw = [];
  const hit = (p, q, r, s) => {
    const d1x = q[0] - p[0], d1y = q[1] - p[1], d2x = s[0] - r[0], d2y = s[1] - r[1];
    const den = d1x * d2y - d1y * d2x;
    if (Math.abs(den) < 1e-12) return null;
    const t = ((r[0] - p[0]) * d2y - (r[1] - p[1]) * d2x) / den;
    const u = ((r[0] - p[0]) * d1y - (r[1] - p[1]) * d1x) / den;
    if (t <= 0.001 || t >= 0.999 || u <= 0.001 || u >= 0.999) return null;
    return [p[0] + t * d1x, p[1] + t * d1y];
  };
  for (let a = 0; a < n; a++) {
    const b = (a + 1) % n;
    for (let c = a + 2; c < n; c++) {
      const d = (c + 1) % n;
      if (Math.min(Math.abs(a - c), n - Math.abs(a - c)) < 4) continue;
      const h = hit(P[a], P[b], P[c], P[d]);
      if (h) raw.push(h);
    }
  }
  const merged = [];
  for (const p of raw) if (!merged.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 0.25)) merged.push(p);
  return merged;
}
function stats(P) {
  const centres = [20, 20];
  let maxR = 0, minR = Infinity;
  for (const p of P) { const r = Math.hypot(p[0] - centres[0], p[1] - centres[1]); maxR = Math.max(maxR, r); minR = Math.min(minR, r); }
  const cross = intersections(P);
  return { cross, crossR: cross.length ? cross.reduce((s, p) => s + Math.hypot(p[0] - 20, p[1] - 20), 0) / cross.length / maxR : 0, minR: minR / maxR };
}
const geo = stats(points);
check('pentafoil weave has exactly five crossings', () => assert.equal(geo.cross.length, 5));
check('geometry has exact five-fold rotational symmetry', () => {
  const rot = points.map(p => {
    const a = (2 * Math.PI) / 5, dx = p[0] - 20, dy = p[1] - 20;
    return [20 + dx * Math.cos(a) - dy * Math.sin(a), 20 + dx * Math.sin(a) + dy * Math.cos(a)];
  });
  let worst = 0;
  for (let i = 0; i < rot.length; i += 3) {
    let best = Infinity;
    for (const q of points) {
      const d = (rot[i][0] - q[0]) ** 2 + (rot[i][1] - q[1]) ** 2;
      if (d < best) best = d;
    }
    worst = Math.max(worst, Math.sqrt(best));
  }
  assert.ok(worst < 0.05, `72-degree rotation deviation ${worst.toFixed(4)} px`);
});
check('weave depth matches the trefoil glyph it replaces', () => {
  assert.ok(geo.crossR > 0.35 && geo.crossR < 0.55, `crossings sit at ${geo.crossR.toFixed(3)} of the outer radius (trefoil: 0.391-0.507)`);
  assert.ok(geo.minR > 0.18 && geo.minR < 0.5, `inner weave at ${geo.minR.toFixed(3)} of the outer radius`);
});
check('strands stay visually separated at button size', () => {
  const N = points.length, far = Math.floor(N * 0.18), gaps = [];
  for (let i = 0; i < N; i += 2) {
    let best = Infinity;
    for (let j = 0; j < N; j++) {
      const g = Math.min(Math.abs(i - j), N - Math.abs(i - j));
      if (g < far) continue;
      const d = Math.hypot(points[i][0] - points[j][0], points[i][1] - points[j][1]);
      if (d < best) best = d;
    }
    gaps.push(best);
  }
  gaps.sort((a, b) => a - b);
  const median = gaps[Math.floor(gaps.length / 2)];
  const p10 = gaps[Math.floor(gaps.length * 0.1)];
  assert.ok(median > 4, `median strand gap ${median.toFixed(2)}px exceeds the 4px stroke width`);
  assert.ok(p10 > 0.7, `10th-percentile gap ${p10.toFixed(2)}px keeps the crossings readable`);
});

console.log(`Pentafoil loader checks passed: ${checks} checks (wiring, busy states, theme, motion, 5-crossing geometry).`);
