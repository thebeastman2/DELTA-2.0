/* DELTA scroll-built architecture diagram
 * Replaces the ship: an isometric exploded stack of DELTA's methodology
 * (market data -> estimation -> construction engines -> validation) that
 * assembles piece by piece as the user scrolls, with floating deliverable
 * cards connecting down into the top slab. One --build custom property per
 * frame; every piece computes its own progress in CSS from its --s/--e
 * window. White linework, indigo accent for highlights, reversible. */
(function () {
  "use strict";
  if (window.__dgDiagram) return;
  window.__dgDiagram = true;

  var REDUCE = false;
  try { REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  /* ------------------------------------------------------------------ *
   * 1. Isometric generator (seeded, deterministic)                     *
   * ------------------------------------------------------------------ */
  function diagramSVG(seed) {
    var COS = 0.866, SIN = 0.5, CX = 430, A = 230, T = 26;
    var s = (seed || 5) >>> 0;
    var rand = function () { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
    var out = [];
    var win = function (s0, e0) { var a = s0 + rand() * (e0 - s0) * 0.55; return [a, a + (e0 - s0) * 0.45]; };
    var st = function (w) { return 'style="--s:' + w[0].toFixed(3) + ";--e:" + w[1].toFixed(3) + '"'; };
    var path = function (cls, d, w) { out.push('<path class="' + cls + '" pathLength="1" d="' + d + '" ' + st(w) + "/>"); };
    var P = function (a) { return "M" + a.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join("L"); };
    var poly = function (cls, pts, w) { path(cls, P(pts) + "Z", w); };
    var circ = function (cx, cy, r) { return "M" + (cx - r) + " " + cy + "a" + r + " " + r + " 0 1 0 " + 2 * r + " 0a" + r + " " + r + " 0 1 0 " + (-2 * r) + " 0"; };
    /* plan coords (u,v) on a slab whose top-center is at screen (CX, sy) */
    var pt = function (sy, u, v, z) { z = z || 0; return [CX + (u - v) * COS, sy + (u + v) * SIN - z]; };
    var slabFaces = function (sy, w) {
      poly("face", [pt(sy, -A, -A), pt(sy, A, -A), pt(sy, A, A), pt(sy, -A, A)], w);
      poly("face", [pt(sy, -A, A), pt(sy, A, A), pt(sy, A, A, T), pt(sy, -A, A, T)], w);
      poly("face", [pt(sy, A, -A), pt(sy, A, A), pt(sy, A, A, T), pt(sy, A, -A, T)], w);
    };
    var label = function (sy, num, txt, w) {
      var rx = CX + 2 * A * COS;
      path("fine", "M" + (rx + 10).toFixed(1) + " " + sy.toFixed(1) + "L" + (rx + 52).toFixed(1) + " " + sy.toFixed(1), w);
      out.push('<text class="lbl" x="' + (rx + 60) + '" y="' + (sy + 6) + '" ' + st(w) + ">" + num + " \u00B7 " + txt + "</text>");
    };
    var SL = [[0.08, 0.30], [0.28, 0.50], [0.48, 0.70], [0.68, 0.86]];
    var SY = [1080, 900, 720, 540];

    /* faint isometric background grid */
    for (var g = -6; g <= 6; g++) {
      var w0 = win(0, 0.1);
      path("grid", P([pt(810, g * 90, -620), pt(810, g * 90, 620)]), w0);
      path("grid", P([pt(810, -620, g * 90), pt(810, 620, g * 90)]), w0);
    }

    /* ---- SLAB 1 · MARKET DATA (dot matrix, fills row by row) ---- */
    var sy = SY[0];
    slabFaces(sy, win(SL[0][0], SL[0][0] + 0.06));
    var cols = [], r, c, n = 0;
    for (r = 0; r < 8; r++) { cols.push([]); for (c = 0; c < 8; c++) cols[r].push([-A + 42 + c * 42.5, -A + 42 + r * 42.5]); }
    for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) {
      var f = (r * 8 + c) / 63, p = pt(sy, cols[r][c][0], cols[r][c][1]);
      var hot = rand() < 0.09;
      out.push('<circle class="dot' + (hot ? " acc" : "") + '" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (hot ? 5 : 3.4) + '" ' + st([0.12 + 0.13 * f, 0.12 + 0.13 * f + 0.05]) + "/>");
    }
    for (r = 0; r < 8; r++) {
      var a1 = pt(sy, cols[r][0][0] - 14, cols[r][0][1]), a2 = pt(sy, cols[r][7][0] + 14, cols[r][7][1]);
      path("hair", P([a1, a2]), win(0.14 + 0.13 * (r / 7), 0.14 + 0.13 * (r / 7) + 0.05));
    }
    label(sy, "01", "MARKET DATA \u00B7 16K+ ASSETS", win(0.26, 0.30));

    /* ---- SLAB 2 · ESTIMATION (concentric insets + covariance heat) ---- */
    sy = SY[1];
    slabFaces(sy, win(SL[1][0], SL[1][0] + 0.06));
    for (var k = 0; k < 5; k++) {
      var a2 = A - 26 - k * 38, wk = win(0.44 - 0.028 * k, 0.44 - 0.028 * k + 0.05);
      poly("draw", [pt(sy, -a2, -a2), pt(sy, a2, -a2), pt(sy, a2, a2), pt(sy, -a2, a2)], wk);
    }
    for (r = 0; r < 6; r++) for (c = 0; c < 4; c++) {
      var hx = -A + 58 + c * 34, hy = -A + 58 + r * 34, hh = (rand() * 0.5 + 0.12).toFixed(2);
      var wq = win(0.40 + 0.06 * ((r * 4 + c) / 23), 0.40 + 0.06 * ((r * 4 + c) / 23) + 0.05);
      poly('heat', [pt(sy, hx, hy), pt(sy, hx + 22, hy), pt(sy, hx + 22, hy + 22), pt(sy, hx, hy + 22)], wq);
      out[out.length - 1] = out[out.length - 1].replace('style="', 'style="--h:' + hh + ';');
    }
    label(sy, "02", "ESTIMATION \u00B7 \u03BC \u03A3 DISTANCE", win(0.46, 0.50));

    /* ---- SLAB 3 · CONSTRUCTION (engine cubes, diagonal wave) ---- */
    sy = SY[2];
    slabFaces(sy, win(SL[2][0], SL[2][0] + 0.06));
    var cubePts = [];
    for (r = 0; r < 5; r++) for (c = 0; c < 5; c++) { if (rand() < 0.16) continue; cubePts.push([r, c]); }
    cubePts.sort(function (x, y) { return (x[0] + x[1]) - (y[0] + y[1]); });
    cubePts.forEach(function (rc, i) {
      var u = -A + 62 + rc[1] * 53, v = -A + 62 + rc[0] * 53, h = 26;
      var wv = win(0.52 + 0.11 * (i / (cubePts.length - 1)), 0.52 + 0.11 * (i / (cubePts.length - 1)) + 0.05);
      poly("cube", [pt(sy, u, v, h), pt(sy, u + 30, v, h), pt(sy, u + 30, v + 30, h), pt(sy, u, v + 30, h)], wv);
      poly("cube", [pt(sy, u, v + 30, h), pt(sy, u + 30, v + 30, h), pt(sy, u + 30, v + 30, h + T), pt(sy, u, v + 30, h + T)], wv);
      poly("cube", [pt(sy, u + 30, v, h), pt(sy, u + 30, v + 30, h), pt(sy, u + 30, v + 30, h + T), pt(sy, u + 30, v, h + T)], wv);
      if (i % 4 === 0) { var cp = pt(sy, u + 15, v + 15, h + T + 10); out.push('<circle class="dot acc" cx="' + cp[0].toFixed(1) + '" cy="' + cp[1].toFixed(1) + '" r="3" ' + st(wv) + "/>"); }
    });
    label(sy, "03", "CONSTRUCTION \u00B7 5 ENGINES", win(0.66, 0.70));

    /* ---- SLAB 4 · VALIDATION (nodes + traced connectors) ---- */
    sy = SY[3];
    slabFaces(sy, win(SL[3][0], SL[3][0] + 0.06));
    for (g = 1; g < 6; g++) {
      path("hair", P([pt(sy, -A + g * 65, -A), pt(sy, -A + g * 65, A)]), win(0.72, 0.78));
      path("hair", P([pt(sy, -A, -A + g * 65), pt(sy, A, -A + g * 65)]), win(0.72, 0.78));
    }
    var NODES = [
      [-150, -95, "WALK-FORWARD SPLIT \u2014 strict no-look-ahead", "M-6 3L-2 -3L1 1L6 -4"],
      [-45, -140, "ESTIMATION WINDOW \u2014 trailing data only", "M-5 4V-4M-5 0L0 -2M0 -4V4M0 -1L5 -3M5 -4V4"],
      [65, -120, "CONSTRUCTION PASS \u2014 weights per engine", "M-6 0H6M-3 -3L0 0L-3 3M3 -3L6 0L3 3"],
      [150, -70, "HOLDING PERIOD \u2014 out-of-sample", "M-6 4L-2 -2L2 2L6 -4"],
      [-110, 90, "RISK CONTRIBUTIONS \u2014 \u03A3 CR = \u03C3", "M0 -5V5M-4 -2C-1 -6 1 2 4 -2"],
      [0, 60, "TURNOVER + COSTS \u2014 net of fees", "M-5 -4A5 5 0 1 0 5 -4"],
      [110, 95, "SHARPE \u00B7 SORTINO \u00B7 DRAWDOWN", "M-5 4L-1 -3L2 0L5 -4"]
    ];
    var nodeScreen = [];
    NODES.forEach(function (nd, i) {
      var p = pt(sy, nd[0], nd[1]);
      nodeScreen.push(p);
      var wv = win(0.72 + 0.08 * (i / 6), 0.72 + 0.08 * (i / 6) + 0.05);
      out.push('<g class="node" ' + st(wv) + '><title>' + nd[2] + "</title>" +
        '<circle class="halo" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="17"/>' +
        '<circle class="ring" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="13" pathLength="1"/>' +
        '<path class="icon" pathLength="1" transform="translate(' + p[0].toFixed(1) + " " + p[1].toFixed(1) + ')" d="' + nd[3] + '"/></g>');
    });
    [[0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6], [2, 6], [3, 6]].forEach(function (e, i) {
      var a3 = nodeScreen[e[0]], b3 = nodeScreen[e[1]];
      path("conn", "M" + a3[0].toFixed(1) + " " + a3[1].toFixed(1) + "L" + b3[0].toFixed(1) + " " + b3[1].toFixed(1), win(0.80 + 0.05 * (i / 7), 0.80 + 0.05 * (i / 7) + 0.05));
    });
    label(sy, "04", "VALIDATION \u00B7 OUT-OF-SAMPLE", win(0.84, 0.86));

    /* ---- FLOATING DELIVERABLE CARDS ---- */
    var CARDS = [
      { cx: 240, cy: 300, s: 120, t: "OPTIMIZED WEIGHTS", tip: "Per-asset allocation from the selected engine" },
      { cx: 560, cy: 210, s: 130, t: "BACKTEST CURVE", tip: "Walk-forward equity, net of costs" },
      { cx: 430, cy: 420, s: 105, t: "RISK REPORT", tip: "Sharpe, drawdown, concentration" }
    ];
    CARDS.forEach(function (cd, ci) {
      var base = 0.84 + ci * 0.04, wv = win(base, base + 0.09);
      var ptl = function (u, v) { return [cd.cx + (u - v) * COS, cd.cy + (u + v) * SIN]; };
      var d = "";
      out.push('<g class="fcard" ' + st(wv) + "><title>" + cd.tip + "</title>");
      poly("cardface", [ptl(-cd.s, -cd.s * 0.62), ptl(cd.s, -cd.s * 0.62), ptl(cd.s, cd.s * 0.62), ptl(-cd.s, cd.s * 0.62)], wv);
      if (ci === 0) {
        for (var b = 0; b < 5; b++) {
          var bl = 0.35 + ((b * 7919) % 60) / 100, v = -cd.s * 0.45 + b * cd.s * 0.22;
          path("bar", P([ptl(-cd.s * 0.75, v), ptl(-cd.s * 0.75 + bl * cd.s * 1.5, v)]), win(base + 0.02 + b * 0.004, base + 0.04 + b * 0.004));
        }
      } else if (ci === 1) {
        var pts = [];
        for (b = 0; b <= 6; b++) pts.push(ptl(-cd.s * 0.75 + b * cd.s * 0.25, cd.s * (0.42 - 0.13 * b - (b % 3) * 0.02)));
        path("spark", P(pts), win(base + 0.02, base + 0.07));
        path("hair", P([ptl(-cd.s * 0.75, cd.s * 0.45), ptl(cd.s * 0.75, cd.s * 0.45)]), win(base + 0.02, base + 0.04));
      } else {
        for (b = 0; b < 9; b++) {
          var bx = -cd.s * 0.7 + (b % 3) * cd.s * 0.46, by = -cd.s * 0.38 + Math.floor(b / 3) * cd.s * 0.30;
          poly("cell", [ptl(bx, by), ptl(bx + cd.s * 0.34, by), ptl(bx + cd.s * 0.34, by + cd.s * 0.18), ptl(bx, by + cd.s * 0.18)], win(base + 0.02 + b * 0.003, base + 0.04 + b * 0.003));
        }
      }
      out.push('<text class="lbl small" x="' + (ptl(-cd.s, cd.s * 0.62)[0] + 6).toFixed(1) + '" y="' + (ptl(-cd.s, cd.s * 0.62)[1] + 22).toFixed(1) + '" ' + st(wv) + ">" + cd.t + "</text>");
      var anchor = nodeScreen[ci === 0 ? 4 : ci === 1 ? 3 : 5];
      path("conn link", "M" + cd.cx.toFixed(1) + " " + (cd.cy + cd.s * 0.62 * SIN + 4).toFixed(1) + "L" + anchor[0].toFixed(1) + " " + anchor[1].toFixed(1), win(base + 0.06, base + 0.09));
      out.push("</g>");
    });

    return out.join("");
  }

  /* ------------------------------------------------------------------ *
   * 2. Styles                                                          *
   * ------------------------------------------------------------------ */
  var CSS = [
    ".dg-layer{position:fixed;inset:0;z-index:1;pointer-events:none;overflow:hidden;",
      "-webkit-mask-image:linear-gradient(90deg,transparent 0,transparent 26%,#000 46%);",
      "mask-image:linear-gradient(90deg,transparent 0,transparent 26%,#000 46%);}",
    "html{background:#060b13}",

    "/* the stack rises gently as it is built */",
    ".diagram{position:absolute;left:65%;top:52%;height:min(78vh,90vw);aspect-ratio:1000/1250;width:auto;",
      "opacity:.85;mix-blend-mode:screen;will-change:transform;overflow:visible;",
      "transform:translate(-50%,-50%) translateY(calc((1 - var(--ease,0)) * 5vh));}",

    "/* each piece computes its own 0-1 progress from --build and its window */",
    ".diagram :is(.face,.draw,.grid,.hair,.conn,.ring,.icon,.spark,.bar,.link){",
      "--k:clamp(0,(var(--build,.04) - var(--s,0)) / max(.001,(var(--e,1) - var(--s,0))),1);}",
    ".diagram :is(.face,.draw,.grid,.hair,.conn,.ring,.icon,.spark,.bar,.link){fill:none;stroke:#fff;",
      "stroke-linejoin:round;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:calc(1 - var(--k,0));}",
    ".diagram .face{stroke-width:1.6;stroke-opacity:.85}",
    ".diagram .draw{stroke-width:1.4;stroke-opacity:.7}",
    ".diagram .grid{stroke-width:1;stroke-opacity:.12}",
    ".diagram .hair{stroke-width:1;stroke-opacity:.35}",
    ".diagram .conn{stroke-width:1.3;stroke-opacity:.55}",
    ".diagram .link{stroke-width:1.3;stroke-opacity:.5}",
    ".diagram .ring{stroke-width:1.5;stroke-opacity:.9}",
    ".diagram .icon{stroke-width:1.5;stroke-opacity:.9}",
    ".diagram .spark{stroke-width:1.6;stroke-opacity:.95}",
    ".diagram .bar{stroke-width:4.5;stroke-opacity:.75}",
    ".diagram .dot{fill:#fff;opacity:calc(var(--k,0) * .7);transform:translateY(calc((1 - var(--k,0)) * 8px));transform-box:fill-box;}",
    ".diagram .dot.acc{fill:#7c9bff}",
    ".diagram .heat{fill:#fff;stroke:none;fill-opacity:calc(var(--k,0) * (.10 + var(--h,.3)));}",
    ".diagram .cell{fill:#fff;stroke:#fff;stroke-width:.75;fill-opacity:calc(var(--k,0) * .08);stroke-opacity:calc(var(--k,0) * .5);}",
    ".diagram .cube{stroke-width:1.3;stroke-opacity:.75;fill-opacity:calc(var(--k,0) * .05);fill:#fff;",
      "transform:translateY(calc((1 - var(--k,0)) * 12px)) scale(calc(.7 + .3 * var(--k,0)));transform-box:fill-box;transform-origin:center;}",
    ".diagram .halo{fill:#fff;fill-opacity:.06;stroke:none;opacity:var(--k,0)}",
    ".diagram .lbl{fill:#fff;font:17px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;opacity:var(--k,0)}",
    ".diagram .lbl.small{font-size:13px}",
    ".diagram .node{opacity:var(--k,0);transform:scale(calc(.6 + .4 * var(--k,0)));transform-box:fill-box;transform-origin:center;cursor:default;pointer-events:auto}",
    ".diagram .node:hover .halo{fill-opacity:.16}",
    ".diagram .fcard{opacity:var(--k,0);transform:translateY(calc((1 - var(--k,0)) * -36px));transform-box:fill-box;pointer-events:auto;cursor:default}",
    ".diagram .fcard:hover .link{stroke-opacity:1;stroke:#9db4ff}",
    ".diagram .cardface{stroke-width:1.4;stroke-opacity:.8;fill:#fff;fill-opacity:.03}",

    "/* ambient life once fully built */",
    "[data-dg-built=\"1\"] .diagram .ring{animation:dg-pulse 3s ease-in-out infinite}",
    "[data-dg-built=\"1\"] .diagram .conn,[data-dg-built=\"1\"] .diagram .link{stroke-dasharray:6 5;animation:dg-flow 1.6s linear infinite}",
    "@keyframes dg-pulse{0%,100%{stroke-opacity:.65}50%{stroke-opacity:1}}",
    "@keyframes dg-flow{to{stroke-dashoffset:-22}}",

    "/* left-column layout for the two methodology sections */",
    "section.dg-left>div:first-child,section.dg-left .dg-head{width:min(40vw,560px) !important;max-width:none !important;margin-left:clamp(24px,6vw,120px) !important;margin-right:0 !important;}",
    "section.dg-left .dg-grid{width:min(40vw,560px) !important;max-width:none !important;margin-left:clamp(24px,6vw,120px) !important;margin-right:0 !important;grid-template-columns:1fr !important;}",
    "section.dg-left{padding-top:10vh !important;}",
    ".dg-gap{height:20vh}",
    ".dg-card-glass{background:rgba(8,10,18,.55) !important;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.08)}",

    "/* scroll reveal (reversible) */",
    ".reveal-left{opacity:0;transform:translateX(-48px);filter:blur(6px);",
      "transition:opacity .6s ease,transform .6s cubic-bezier(.2,.7,.2,1),filter .6s ease;",
      "transition-delay:calc(var(--i,0) * 60ms);will-change:opacity,transform,filter;}",
    ".reveal-left.is-in{opacity:1;transform:none;filter:none}",

    "/* layer progress rail */",
    ".dg-rail{position:fixed;left:22px;top:50%;transform:translateY(-50%);z-index:2;display:flex;flex-direction:column;gap:26px;pointer-events:none}",
    ".dg-rail i{display:block;width:14px;height:2px;background:rgba(255,255,255,.22);transition:background .3s,box-shadow .3s}",
    ".dg-rail i.on{background:#7c9bff;box-shadow:0 0 8px rgba(124,155,255,.8)}",
    "@media (max-width:1100px){.dg-rail{display:none}}",

    "#root .relative.z-10{z-index:2}",
    "#root .relative.z-10>section:not(.dg-left),#root .relative.z-10>footer{position:relative}",

    "@media (max-width:800px){",
      "section.dg-left>div:first-child,section.dg-left .dg-head,section.dg-left .dg-grid{width:auto !important;margin-inline:20px !important;}",
      ".diagram{left:50%;opacity:.5;height:min(62vh,92vw)}}",      "@media (prefers-reduced-motion:reduce){",
      ".reveal-left{opacity:1;transform:none;filter:none;transition:none}",
      ".diagram{transform:translate(-50%,-50%)}}"
  ].join("");

  /* ------------------------------------------------------------------ *
   * 3. DOM wiring: diagram layer + progress rail                       *
   * ------------------------------------------------------------------ */
  var root = document.documentElement;
  var head = document.head || document.documentElement;

  var style = document.createElement("style");
  style.id = "dg-style";
  style.textContent = CSS;
  head.appendChild(style);

  var layer = document.createElement("div");
  layer.className = "dg-layer";
  layer.setAttribute("aria-hidden", "true");

  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.id = "dg-diagram";
  svg.setAttribute("class", "diagram");
  svg.setAttribute("viewBox", "0 0 1000 1250");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  var mobile = false;
  try { mobile = matchMedia("(max-width:800px)").matches; } catch (e) {}
  svg.innerHTML = diagramSVG(mobile ? 13 : 5);
  layer.appendChild(svg);
  document.body.appendChild(layer);

  var rail = document.createElement("div");
  rail.className = "dg-rail";
  rail.setAttribute("aria-hidden", "true");
  rail.innerHTML = '<i></i><i></i><i></i><i></i>';
  document.body.appendChild(rail);
  var railTicks = rail.children;

  /* ------------------------------------------------------------------ *
   * 4. Left-column tagging + reversible reveals (React-resilient)      *
   * ------------------------------------------------------------------ */
  function tagSections() {
    var secs = document.querySelectorAll("#root section");
    for (var i = 0; i < secs.length; i++) {
      var sec = secs[i];
      var h2 = sec.querySelector("h2");
      var h = h2 ? h2.textContent.trim() : "";
      var isTarget = /five construction frameworks/i.test(h) || /mathematics is explicit/i.test(h);
      if (!isTarget) { if (sec.classList.contains("dg-left")) sec.classList.remove("dg-left"); continue; }
      if (!sec.classList.contains("dg-left")) {
        sec.classList.add("dg-left");
        var old = sec.nextElementSibling;
        if (old && old.classList && old.classList.contains("dg-gap")) old.remove();
      }
      var headBlock = sec.children[0];
      if (headBlock && !headBlock.classList.contains("dg-head")) headBlock.classList.add("dg-head");
      if (h2 && !h2.classList.contains("reveal-left")) h2.classList.add("reveal-left");
      var sub = headBlock ? headBlock.querySelector("h2 ~ p, h2 ~ div") : null;
      if (sub && !sub.classList.contains("reveal-left")) { sub.classList.add("reveal-left"); sub.style.setProperty("--i", 1); }
      var grid = sec.querySelector(".grid");
      if (grid && !grid.classList.contains("dg-grid")) grid.classList.add("dg-grid");
      if (grid) {
        for (var c = 0; c < grid.children.length; c++) {
          var card = grid.children[c];
          card.classList.add("dg-card-glass", "reveal-left");
          card.style.setProperty("--i", String(2 + c));
        }
      }
      if (i < secs.length - 1) {
        var next = secs[i + 1];
        if (/mathematics is explicit/i.test((next.querySelector("h2") || {}).textContent || "")) {
          if (!sec.nextElementSibling || !sec.nextElementSibling.classList.contains("dg-gap")) {
            var gap = document.createElement("div");
            gap.className = "dg-gap";
            if (sec.nextSibling) sec.parentNode.insertBefore(gap, sec.nextSibling);
            else sec.parentNode.appendChild(gap);
          }
        }
      }
    }
  }
  tagSections();

  var revealedSet = new WeakSet();
  var io = null;
  if (!REDUCE && "IntersectionObserver" in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting || e.boundingClientRect.top < 0) revealedSet.add(e.target);
        else if (e.boundingClientRect.top > 0) revealedSet.delete(e.target);
        e.target.classList.toggle("is-in", revealedSet.has(e.target));
      });
    }, { rootMargin: "0px 0px -20% 0px", threshold: 0 });
  }
  function refreshReveals() {
    var els = document.querySelectorAll(".reveal-left");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!revealedSet.has(el) && el.getBoundingClientRect().top < 0) revealedSet.add(el);
      el.classList.toggle("is-in", revealedSet.has(el));
      if (io) io.observe(el);
    }
  }
  if (REDUCE || !io) {
    document.querySelectorAll(".reveal-left").forEach(function (el) { el.classList.add("is-in"); });
  }
  refreshReveals();

  if ("MutationObserver" in window) {
    var mo = new MutationObserver(function () { tagSections(); refreshReveals(); });
    try { mo.observe(document.getElementById("root") || document.body, { childList: true, subtree: true }); } catch (e) {}
  }

  /* ------------------------------------------------------------------ *
   * 5. Scroll controller: one write per frame + stage rail             *
   * ------------------------------------------------------------------ */
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var STAGES = [0.08, 0.28, 0.48, 0.68];
  var ticking = false, built = false;

  function apply(t) {
    root.style.setProperty("--build", (0.04 + 0.96 * t).toFixed(4));
    root.style.setProperty("--ease", easeOut(t).toFixed(4));
    var nowBuilt = t >= 1;
    root.setAttribute("data-dg-built", nowBuilt ? "1" : "0");
    var stage = 0;
    for (var i = 0; i < STAGES.length; i++) if (t >= STAGES[i]) stage = i + 1;
    for (var j = 0; j < railTicks.length; j++) railTicks[j].className = j < stage ? "on" : "";
    built = nowBuilt;
  }
  function update() {
    ticking = false;
    var max = Math.max(1, root.scrollHeight - window.innerHeight);
    apply(clamp((window.scrollY / max) / 0.8, 0, 1));
  }
  if (REDUCE) {
    apply(1);
  } else {
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ------------------------------------------------------------------ *
   * 6. Anchor links: re-issue the scroll after the SPA router settles  *
   *    (its own scroll-to-top otherwise races the native hash jump)    *
   * ------------------------------------------------------------------ */
  function scrollToHash() {
    var h = location.hash.slice(1);
    if (!h) return;
    var el = document.getElementById(h);
    if (el) { try { el.scrollIntoView({ behavior: REDUCE ? "auto" : "smooth" }); } catch (e) { el.scrollIntoView(); } }
  }
  document.addEventListener("click", function (ev) {
    var t = ev.target;
    if (!t || !t.closest) return;
    if (!t.closest('a[href^="#"]')) return;
    setTimeout(scrollToHash, 80);
    setTimeout(scrollToHash, 300);
  }, true);
  window.addEventListener("hashchange", function () { setTimeout(scrollToHash, 80); });
})();
