/* DELTA scroll ship + left-column reveal layout
 * Injected on the landing page only. Everything is white; hierarchy comes
 * from opacity and stroke weight. Drives a single --build custom property
 * per frame; the SVG computes each path's own progress in CSS. */
(function () {
  "use strict";
  if (window.__shipBoot) return;
  window.__shipBoot = true;

  var REDUCE = false;
  try { REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  /* ------------------------------------------------------------------ *
   * 1. Procedural ship generator (seeded, deterministic, nose-up)      *
   * ------------------------------------------------------------------ */
  function shipSVG(seed) {
    var W = 1000, CX = 500;
    var s = (seed || 7) >>> 0;
    var rand = function () { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
    var mir = function (p) { return [W - p[0], p[1]]; };
    var P = function (a) { return "M" + a.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join("L"); };

    /* right-half geometry: long tapered nose (top), bulbous reactor mid,
     * swept wings, rear engine cluster (bottom) */
    var HULL   = [[500,40],[522,95],[548,175],[578,285],[612,425],[642,565],[656,700],[644,835],[614,945],[588,1030],[574,1110],[560,1190],[540,1235]];
    var WING   = [[646,620],[765,705],[865,905],[935,1185],[902,1262],[702,1152],[622,1005]];
    var CANARD = [[596,330],[694,468],[646,525]];
    var hullX = function (y) {
      for (var i = 0; i < HULL.length - 1; i++) {
        var a = HULL[i], b = HULL[i + 1];
        if (y >= a[1] && y <= b[1]) return a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]);
      }
      return CX;
    };
    var OUTLINE = HULL.concat(HULL.slice().reverse().map(mir));
    var closed = function (a) { return P(a) + "Z"; };
    var circ = function (cx, cy, r) { return "M" + (cx - r) + " " + cy + "a" + r + " " + r + " 0 1 0 " + 2 * r + " 0a" + r + " " + r + " 0 1 0 " + (-2 * r) + " 0"; };
    var ell = function (cx, cy, rx, ry) { return "M" + (cx - rx) + " " + cy + "a" + rx + " " + ry + " 0 1 0 " + 2 * rx + " 0a" + rx + " " + ry + " 0 1 0 " + (-2 * rx) + " 0"; };
    var rect = function (x, y, w, h) { return "M" + x + " " + y + "h" + w + "v" + h + "h" + (-w) + "z"; };

    var out = [];
    var win = function (s0, e0) { var a = s0 + rand() * (e0 - s0) * 0.6; return [a, a + (e0 - s0) * 0.4]; };
    var st = function (w) { return 'style="--s:' + w[0].toFixed(3) + ";--e:" + w[1].toFixed(3) + '"'; };
    var path = function (cls, d, w) { out.push('<path class="' + cls + '" pathLength="1" d="' + d + '" ' + st(w) + "/>"); };
    var sym = function (cls, pts, L) { var w = win(L[0], L[1]); path(cls, P(pts), w); path(cls, P(pts.map(mir)), w); };
    var symClosed = function (cls, pts, L) { var w = win(L[0], L[1]); path(cls, closed(pts), w); path(cls, closed(pts.map(mir)), w); };
    var dot = function (x, y, L) { var w = win(L[0], L[1]); [[x, y], mir([x, y])].forEach(function (p) { out.push('<circle class="dot" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="1.8" ' + st(w) + "/>"); }); };
    var inHull = function (y, pad) { pad = pad || 14; return CX + 8 + rand() * Math.max(2, hullX(y) - CX - pad - 8); };

    /* L1 SKELETON 0.00-0.12 */
    var L1 = [0, 0.12];
    path("prim", "M500 40L500 1330", [0, 0.05]);
    for (var y = 120; y <= 1220; y += 100) sym("prim", [[CX, y], [hullX(y) - 6, y]], L1);
    sym("prim", [WING[0], WING[3]], L1);
    sym("prim", [WING[6], WING[4]], L1);

    /* L2 SECONDARY FRAMES 0.12-0.28 */
    var L2 = [0.12, 0.28];
    [55, 110, 160].forEach(function (off) {
      var ys = []; for (var y = 60; y < 1230; y += 10) if (hullX(y) - CX > off + 8) ys.push(y);
      if (ys.length) sym("sec", [[CX + off, ys[0]], [CX + off, ys[ys.length - 1]]], L2);
    });
    for (var y = 120; y < 1220; y += 100) sym("sec", [[CX, y], [hullX(y + 100) - 6, y + 100]], L2);
    [1150, 1185, 1215].forEach(function (y) { sym("sec", [[CX, y], [hullX(y) - 4, y]], L2); });

    /* L3 HULL + PLATING 0.28-0.45 */
    var L3 = [0.28, 0.45];
    path("sec", closed(OUTLINE), [0.28, 0.38]);
    symClosed("sec", WING, L3);
    symClosed("sec", CANARD, L3);
    var bands = [40, 175, 285, 425, 565, 700, 835, 945, 1030, 1110, 1190, 1235];
    for (var i = 0; i < bands.length - 1; i++) {
      var a = bands[i], b = bands[i + 1], w = win(0.34, 0.45);
      var quad = [[CX, a], [hullX(a) - 3, a], [hullX(b) - 3, b], [CX, b]];
      path("panel", closed(quad), w); path("panel", closed(quad.map(mir)), w);
    }
    symClosed("panel", WING, [0.36, 0.45]);

    /* L4 ENGINES / WING HARDWARE 0.45-0.60 */
    var L4 = [0.45, 0.60];
    var bell = function (x) { return [[x - 30, 1200], [x + 30, 1200], [x + 44, 1335], [x - 44, 1335]]; };
    path("sec", closed(bell(CX)), win(L4[0], L4[1]));
    symClosed("sec", bell(588), L4);
    symClosed("sec", bell(668).map(function (p) { return [p[0], p[1] - 70]; }), L4);
    [0.35, 0.6].forEach(function (t) {
      var p0 = WING[0], p1 = WING[3];
      var x = p0[0] + (p1[0] - p0[0]) * t, yy = p0[1] + (p1[1] - p0[1]) * t;
      symClosed("sec", [[x - 14, yy - 40], [x + 14, yy - 40], [x + 14, yy + 80], [x - 14, yy + 80]], L4);
    });

    /* L5 REACTOR, CANOPY, MODULES 0.60-0.75 */
    var L5 = [0.60, 0.75];
    [120, 88, 54].forEach(function (r) { path("prim", circ(CX, 640, r), win(L5[0], L5[1])); });
    for (var i = 0; i < 24; i++) {
      var an = i / 24 * Math.PI * 2, c = Math.cos(an), sn = Math.sin(an);
      path("fine", "M" + (CX + c * 120).toFixed(1) + " " + (640 + sn * 120).toFixed(1) + "L" + (CX + c * 134).toFixed(1) + " " + (640 + sn * 134).toFixed(1), win(L5[0], L5[1]));
    }
    path("sec", ell(CX, 235, 30, 78), win(L5[0], L5[1]));
    for (i = 0; i < 14; i++) { var yy = 130 + rand() * 1000, x = inHull(yy, 40); var w5 = win(L5[0], L5[1]); path("fine", rect(x, yy, 22, 14), w5); path("fine", rect(W - x - 22, yy, 22, 14), w5); }
    path("fine", "M500 40L500 8", win(L5[0], L5[1]));

    /* L6 FINE DETAIL 0.75-0.88 */
    var L6 = [0.75, 0.88];
    for (i = 0; i < 70; i++) { var y6 = 110 + rand() * 1090, x6 = inHull(y6), len = 20 + rand() * 40; sym("fine", [[x6, y6], [Math.min(x6 + len, hullX(y6) - 8), y6]], L6); }
    for (i = 0; i < 22; i++) {
      var y7 = 140 + rand() * 1000, x7 = inHull(y7, 30), pts = [[x7, y7]];
      for (var k = 0; k < 3; k++) { if (k % 2) y7 += 25 + rand() * 60; else x7 = Math.min(x7 + 20 + rand() * 50, hullX(y7) - 8); pts.push([x7, y7]); }
      sym("fine", pts, L6);
    }
    for (i = 0; i < 90; i++) { var y8 = 100 + rand() * 1100; dot(inHull(y8, 10), y8, L6); }
    for (i = 0; i < 5; i++) { var y9 = 880 + i * 12; sym("fine", [[CX + 25, y9], [CX + 85, y9]], L6); }

    /* L7 MICRO-DETAIL: self-similar mini ships 0.88-0.96 */
    var sil = closed(OUTLINE) + closed(WING) + closed(WING.map(mir)) + "M500 40L500 1235";
    var minis = [[580, 410, 0.12], [420, 410, 0.12], [596, 860, 0.10], [404, 860, 0.10], [500, 1010, 0.09]];
    var micro = [];
    for (i = 0; i < 24; i++) { var ym = 150 + rand() * 1000; micro.push([inHull(ym, 24) * (i % 2 ? 1 : -1) + (i % 2 ? 0 : W), ym, 0.03]); }
    minis.concat(micro).forEach(function (m) {
      var w = win(0.88, 0.96);
      out.push('<use href="#sil" class="mini" transform="translate(' + (m[0] - CX * m[2]).toFixed(1) + " " + (m[1] - 700 * m[2]).toFixed(1) + ") scale(" + m[2] + ')" ' + st(w) + ' stroke-width="' + (1.6 / m[2]).toFixed(1) + '"/>');
    });

    /* L8 CALLOUTS + DIMENSIONS + ENGINE GLOW 0.96-1.00 */
    var lbl = function (x, y, t) { out.push('<text class="lbl" x="' + x + '" y="' + y + '" ' + st([0.96, 1]) + ">" + t + "</text>"); };
    path("fine", "M672 640L860 640", [0.96, 1]); lbl(868, 646, "REACTOR CORE");
    path("fine", "M560 235L860 235", [0.96, 1]); lbl(868, 241, "COMMAND SECTION");
    path("fine", "M600 1300L860 1300", [0.96, 1]); lbl(868, 1306, "THRUSTERS");
    path("fine", "M985 40L985 1335", [0.96, 1]);
    [40, 1335].forEach(function (yy) { path("fine", "M975 " + yy + "L995 " + yy, [0.96, 1]); });
    [CX, 588, 412].forEach(function (x) { out.push('<ellipse class="glow" cx="' + x + '" cy="1345" rx="34" ry="44" ' + st([0.96, 1]) + "/>"); });
    out.push('<rect class="scan" x="180" y="40" width="640" height="3"/>');
    out.push('<circle class="nav" cx="935" cy="1185" r="3" ' + st([0.96, 1]) + "/><circle class=\"nav\" cx=\"65\" cy=\"1185\" r=\"3\" " + st([0.96, 1]) + "/>");

    return '<defs><path id="ship-sil" class="draw" pathLength="1" d="' + sil + '"/></defs>' + out.join("");
  }

  /* ------------------------------------------------------------------ *
   * 2. Styles                                                          *
   * ------------------------------------------------------------------ */
  var CSS = [
    ".ship-layer{position:fixed;inset:0;z-index:1;pointer-events:none;overflow:hidden;",
      "-webkit-mask-image:linear-gradient(90deg,transparent 0,transparent 26%,#000 46%);",
      "mask-image:linear-gradient(90deg,transparent 0,transparent 26%,#000 46%);}",
    "html{background:#060b13}",

    "/* ship container: pinned, descends, one full clockwise turn */",
    ".ship{--ty0:-14vh;--ty1:6vh;position:absolute;left:65%;top:50%;",
      "height:min(72vh,88vw);aspect-ratio:1000/1400;width:auto;overflow:visible;",
      "opacity:.8;mix-blend-mode:screen;",
      "filter:drop-shadow(0 0 6px rgba(255,255,255,.35));",
      "will-change:transform;",
      "transform:translate(-50%,-50%)",
        "translateY(calc(var(--ty0) + (var(--ty1) - var(--ty0)) * var(--ease,0)))",
        "rotate(calc((var(--ease,0) - 1) * 360deg))",
        "scale(calc(.85 + .15 * var(--ease,0)));}",

    "/* each element computes its own 0-1 progress from --build and its window */",
    ".ship :is(.prim,.sec,.fine,.draw,.panel,.dot,.lbl,.glow,.nav){",
      "--k:clamp(0,(var(--build,.04) - var(--s,0)) / max(.001,(var(--e,1) - var(--s,0))),1);}",
    ".ship :is(.prim,.sec,.fine,.draw,.mini){fill:none;stroke:#fff;stroke-linejoin:round;stroke-linecap:round;",
      "stroke-dasharray:1;stroke-dashoffset:calc(1 - var(--k,0));}",
    ".ship .prim{stroke-width:2.4;stroke-opacity:.9}",
    ".ship .sec{stroke-width:1.8;stroke-opacity:.6}",
    ".ship .fine{stroke-width:1.2;stroke-opacity:.45}",
    ".ship .mini{stroke-opacity:.7}",
    ".ship .panel{fill:#fff;fill-opacity:calc(var(--k,0) * .06);stroke:none}",
    ".ship .dot{fill:#fff;opacity:calc(var(--k,0) * .6)}",
    ".ship .lbl{fill:#fff;font:20px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;opacity:var(--k,0)}",
    ".ship .glow{fill:#fff;fill-opacity:.25;opacity:var(--k,0)}",
    ".ship .nav{fill:#fff;opacity:var(--k,0)}",
    ".ship .scan{fill:#fff;opacity:0}",

    "/* idle life after the ship is built */",
    "[data-ship-built=\"1\"] .ship .glow{animation:ship-pulse 3s ease-in-out infinite}",
    "[data-ship-built=\"1\"] .ship .nav{animation:ship-blink 2.4s ease-in-out infinite}",
    "[data-ship-built=\"1\"] .ship .scan{animation:ship-scan 6s linear infinite}",
    "@keyframes ship-pulse{0%,100%{opacity:.35}50%{opacity:.9}}",
    "@keyframes ship-blink{0%,100%{opacity:.15}50%{opacity:.85}}",
    "@keyframes ship-scan{0%{transform:translateY(0);opacity:0}10%,90%{opacity:.18}100%{transform:translateY(1250px);opacity:0}}",
    ".ship.lock{animation:ship-lock .9s ease-out}",
    "@keyframes ship-lock{0%{filter:drop-shadow(0 0 28px #fff) drop-shadow(0 0 6px #fff)}100%{filter:drop-shadow(0 0 6px rgba(255,255,255,.35))}}",

    "/* left-column layout: both sections share the same column; the middle",
      "   and right of the viewport belong to the ship */",
    "section.dg-left>div:first-child,section.dg-left .dg-head{width:min(40vw,560px) !important;max-width:none !important;margin-left:clamp(24px,6vw,120px) !important;margin-right:0 !important;}",
    "section.dg-left .dg-grid{width:min(40vw,560px) !important;max-width:none !important;margin-left:clamp(24px,6vw,120px) !important;margin-right:0 !important;grid-template-columns:1fr !important;}",
    "section.dg-left{padding-top:10vh !important;}",
    "section.dg-left+.dg-gap{height:20vh}",
    ".dg-card-glass{background:rgba(8,10,18,.55) !important;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.08)}",

    "/* scroll reveal (reversible) */",
    ".reveal-left{opacity:0;transform:translateX(-48px);filter:blur(6px);",
      "transition:opacity .6s ease,transform .6s cubic-bezier(.2,.7,.2,1),filter .6s ease;",
      "transition-delay:calc(var(--i,0) * 60ms);will-change:opacity,transform,filter;}",
    ".reveal-left.is-in{opacity:1;transform:none;filter:none}",

    "/* keep every other section readable over the ship */",
    "#root .relative.z-10>section:not(.dg-left),#root .relative.z-10>footer{position:relative}",
    "#root .relative.z-10>section:not(.dg-left)>.\\32 :before{content:none}",

    "@media (max-width:800px){",
      "section.dg-left>div:first-child,section.dg-left .dg-head,section.dg-left .dg-grid{width:auto !important;margin-inline:20px !important;}",
      ".ship{left:50%;--ty0:-8vh;--ty1:3vh;opacity:.45;height:min(62vh,88vw)}}",

    "@media (prefers-reduced-motion:reduce){",
      ".reveal-left{opacity:1;transform:none;filter:none;transition:none}",
      ".ship{transform:translate(-50%,-50%) translateY(6vh) rotate(0deg) scale(1)}}",

    /* content sits above the ship layer */
    "#root .relative.z-10{z-index:2}"
  ].join("");

  /* ------------------------------------------------------------------ *
   * 3. DOM wiring: ship layer + section layout + reveal classes        *
   * ------------------------------------------------------------------ */
  var root = document.documentElement;
  var head = document.head || document.documentElement;

  var style = document.createElement("style");
  style.id = "ship-style";
  style.textContent = CSS;
  head.appendChild(style);

  var layer = document.createElement("div");
  layer.className = "ship-layer";
  layer.setAttribute("aria-hidden", "true");

  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.id = "ship";
  svg.setAttribute("class", "ship");
  svg.setAttribute("viewBox", "0 0 1000 1400");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  var mobile = false;
  try { mobile = matchMedia("(max-width:800px)").matches; } catch (e) {}
  svg.innerHTML = shipSVG(mobile ? 11 : 7);
  layer.appendChild(svg);
  document.body.appendChild(layer);

  function tagSections() {
    var secs = document.querySelectorAll("#root section");
    for (var i = 0; i < secs.length; i++) {
      var s = secs[i];
      var h2 = s.querySelector("h2");
      var h = h2 ? h2.textContent.trim() : "";
      var isTarget = /five construction frameworks/i.test(h) || /mathematics is explicit/i.test(h);
      if (!isTarget) { if (s.classList.contains("dg-left")) s.classList.remove("dg-left"); continue; }
      if (!s.classList.contains("dg-left")) {
        s.classList.add("dg-left");
        /* clear old inline gap markers on re-runs */
        var old = s.nextElementSibling;
        if (old && old.classList && old.classList.contains("dg-gap")) old.remove();
      }
      /* the heading block (first child) + cards grid */
      var headBlock = s.children[0];
      if (headBlock && !headBlock.classList.contains("dg-head")) headBlock.classList.add("dg-head");
      if (h2 && !h2.classList.contains("reveal-left")) h2.classList.add("reveal-left");
      /* subtext follows the heading slightly later */
      var sub = headBlock ? headBlock.querySelector("h2 ~ p, h2 ~ div") : null;
      if (sub && !sub.classList.contains("reveal-left")) { sub.classList.add("reveal-left"); sub.style.setProperty("--i", 1); }
      /* cards grid: single column, glass, staggered reveals */
      var grid = s.querySelector(".grid");
      if (grid && !grid.classList.contains("dg-grid")) grid.classList.add("dg-grid");
      if (grid) {
        for (var c = 0; c < grid.children.length; c++) {
          var card = grid.children[c];
          card.classList.add("dg-card-glass", "reveal-left");
          card.style.setProperty("--i", String(2 + c));
        }
      }
      /* 20vh spacer so the next section starts after this one finishes revealing */
      if (i < secs.length - 1) {
        var next = secs[i + 1];
        if (/mathematics is explicit/i.test((next.querySelector("h2") || {}).textContent || "")) {
          if (!s.nextElementSibling || !s.nextElementSibling.classList.contains("dg-gap")) {
            var gap = document.createElement("div");
            gap.className = "dg-gap";
            gap.style.height = "20vh";
            if (s.nextSibling) s.parentNode.insertBefore(gap, s.nextSibling);
            else s.parentNode.appendChild(gap);
          }
        }
      }
    }
  }
  tagSections();
  /* React re-renders can wipe classes; re-apply cheaply when the tree mutates */
  if ("MutationObserver" in window) {
    var mo = new MutationObserver(function () { tagSections(); refreshReveals(); });
    try { mo.observe(document.getElementById("root") || document.body, { childList: true, subtree: true }); } catch (e) {}
  }

  /* ------------------------------------------------------------------ *
   * 4. Scroll controller: one write per frame                          *
   * ------------------------------------------------------------------ */
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var ticking = false, built = false;

  function apply(t) {
    root.style.setProperty("--build", (0.04 + 0.96 * t).toFixed(4));
    root.style.setProperty("--ease", easeOut(t).toFixed(4));
    var nowBuilt = t >= 1;
    root.setAttribute("data-ship-built", nowBuilt ? "1" : "0");
    if (nowBuilt && !built) {
      svg.classList.add("lock");
      setTimeout(function () { svg.classList.remove("lock"); }, 950);
    }
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
   * 5. Card + heading reveals (reversible on scroll-up)                *
   *    React re-renders wipe added classes, so tagSections() re-applies
   *    them; the Set keeps revealed elements revealed across re-mounts.  *
   * ------------------------------------------------------------------ */
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
})();
