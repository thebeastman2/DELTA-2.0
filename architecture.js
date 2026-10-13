/* DELTA master architecture sequence
 * 13 scroll chapters (init, 5 core layers, 6 card+expansion expansions,
 * final activation) driven by one normalized progress value. Pinned stage
 * via one GSAP ScrollTrigger. Every SVG piece owns an absolute construction
 * window in the 100-unit master timeline. Deterministic geometry, cached path
 * lengths, reversible construction, and separately managed hover highlights. */
(function () {
  "use strict";
  if (window.__dgArch) return;
  window.__dgArch = true;

  /* ------------------------------------------------------------ *
   * 1. Chapter schedule (master progress 0-1)                    *
   * ------------------------------------------------------------ */
  var CH = {
    init: [0.00, 0.04], market: [0.04, 0.13], stats: [0.13, 0.22],
    opt: [0.22, 0.35], risk: [0.35, 0.45], intel: [0.45, 0.54],
    portfolio: [0.54, 0.61], frontier: [0.61, 0.68], corr: [0.68, 0.75],
    riskc: [0.75, 0.82], mc: [0.82, 0.89], bt: [0.89, 0.96], fin: [0.96, 1.00]
  };
  var CHAPTER_IDS = ["init", "market", "stats", "opt", "risk", "intel",
    "portfolio", "frontier", "corr", "riskc", "mc", "bt", "fin"];
  function W(ch, a, b) {
    var c = CH[ch];
    return [c[0] + (c[1] - c[0]) * a, c[0] + (c[1] - c[0]) * b, ch];
  }

  /* ------------------------------------------------------------ *
   * 2. Exact left-panel copy                                     *
   * ------------------------------------------------------------ */
  var PANELS = [
    { eb: "DELTA / SYSTEM ARCHITECTURE", step: "INITIALIZING",
      head: "The intelligence behind every allocation.",
      desc: "Explore how DELTA brings market data, mathematical optimization, and risk analysis into one connected portfolio engine. Scroll to construct the system.",
      caps: [], note: "SCROLL TO INITIALIZE \u2193" },
    { eb: "01 / DATA FOUNDATION", step: "MARKET DATA",
      head: "Start with the market. Build from the numbers.",
      desc: "DELTA organizes historical prices and asset returns into a structured analytical foundation. Every calculation begins with consistent market information.",
      caps: ["Historical prices and returns", "Asset-level input preparation", "Cross-asset data alignment"],
      note: "r\u209C = P\u209C / P\u209C\u208B\u2081 \u2212 1" },
    { eb: "02 / STATISTICAL ENGINE", step: "STATISTICAL INTELLIGENCE",
      head: "Discover the relationships behind the risk.",
      desc: "DELTA estimates volatility, expected returns, and the relationships between assets. Covariance shrinkage and clustering help reveal the structure of portfolio risk.",
      caps: ["Covariance and correlation matrices", "Ledoit\u2013Wolf estimation", "Hierarchical asset clustering"],
      note: "\u03A3 = Cov(R)" },
    { eb: "03 / OPTIMIZATION CORE", step: "OPTIMIZATION",
      head: "Find better allocations through mathematics.",
      desc: "Compare portfolio allocations using Modern Portfolio Theory, Black\u2013Litterman, and Hierarchical Risk Parity. Explore different approaches to balancing expected return, risk, and diversification.",
      caps: ["Mean-variance optimization", "Black\u2013Litterman modeling", "Hierarchical Risk Parity"],
      note: "min w\u1D40\u03A3w subject to constraints",
      fine: "The notation describes a minimum-variance formulation; other optimization objectives may be supported separately." },
    { eb: "04 / RISK INTELLIGENCE", step: "RISK & SIMULATION",
      head: "See the outcomes. Understand the downside.",
      desc: "Stress-test portfolio ideas through simulated outcomes and historical performance. Evaluate volatility, drawdowns, and risk-adjusted returns before comparing strategies.",
      caps: ["Monte Carlo simulation", "Downside risk and drawdown", "Historical strategy evaluation"],
      note: "\u03C3\u209A = \u221A(w\u1D40\u03A3w)" },
    { eb: "05 / UNIFIED INTERFACE", step: "PORTFOLIO INTELLIGENCE",
      head: "Connect every model to the portfolio.",
      desc: "DELTA unifies allocations, model outputs, and performance analytics in one environment. Move from complex calculations to a clearer understanding of portfolio behavior.",
      caps: ["Portfolio analytics", "Model comparison", "Interactive risk intelligence"],
      note: "CORE ARCHITECTURE COMPLETE" },
    { eb: "06 / PORTFOLIO OVERVIEW", step: "PORTFOLIO OVERVIEW",
      head: "Every allocation. One complete picture.",
      desc: "Understand where capital is allocated, how the portfolio is expected to perform, and how its assets contribute to the overall strategy.",
      caps: ["Allocation composition", "Portfolio performance metrics", "Asset-weight breakdowns"],
      note: "\u03A3w\u1D62 = 1" },
    { eb: "07 / EFFICIENT FRONTIER", step: "EFFICIENT FRONTIER",
      head: "Explore the tradeoff between risk and return.",
      desc: "Visualize candidate portfolios across expected return and volatility. Identify efficient allocations and compare solutions produced by different optimization approaches.",
      caps: ["Risk-return comparison", "Efficient portfolio identification", "Allocation model exploration"],
      note: "E[R\u209A] = w\u1D40\u03BC" },
    { eb: "08 / ASSET RELATIONSHIPS", step: "CORRELATION & COVARIANCE",
      head: "Understand what truly diversifies a portfolio.",
      desc: "See how asset returns move together and how their relationships influence portfolio risk. Explore covariance estimates, correlations, and clustered asset groups.",
      caps: ["Correlation heatmaps", "Covariance estimation", "Relationship clustering"],
      note: "\u03C1\u1D62\u2C7C = Cov(R\u1D62,R\u2C7C)/(\u03C3\u1D62\u03C3\u2C7C)" },
    { eb: "09 / RISK EXPOSURE", step: "RISK EXPOSURE",
      head: "Measure the risk behind the allocation.",
      desc: "Evaluate portfolio volatility, downside exposure, and risk-adjusted performance. Examine the metrics that help explain how much uncertainty accompanies expected returns.",
      caps: ["Sharpe and Sortino ratios", "Value at Risk", "Drawdown and risk contribution"],
      note: "Sharpe = (R\u209A \u2212 R𝒻)/\u03C3\u209A" },
    { eb: "10 / MONTE CARLO", step: "MONTE CARLO",
      head: "Explore thousands of possible outcomes.",
      desc: "Simulate potential portfolio paths using return assumptions and statistical estimates. Examine the spread of possible results rather than relying on a single forecast.",
      caps: ["Simulated portfolio paths", "Outcome distributions", "Forecast percentiles"],
      note: "R\u209C ~ Model(\u03BC, \u03A3)" },
    { eb: "11 / BACKTESTING", step: "HISTORICAL BACKTEST",
      head: "Test the strategy against history.",
      desc: "Compare portfolio performance across historical periods and evaluate outcomes against a benchmark. Understand how alternative allocation approaches behaved under past market conditions.",
      caps: ["Historical return analysis", "Benchmark comparisons", "Drawdown and performance metrics"],
      note: "Growth\u209C = \u220F(1 + R\u209A,\u209C)" },
    { eb: "DELTA / SYSTEM ONLINE", step: "FINAL ACTIVATION",
      head: "One engine. Every portfolio decision connected.",
      desc: "From market data to optimization, simulation, and performance evaluation, DELTA brings the quantitative investment process into one analytical system.",
      caps: [], note: "ARCHITECTURE / COMPLETE", cta: "Launch DELTA \u2197" }
  ];

  /* ------------------------------------------------------------ *
   * 3. Diagram generator (deterministic, isometric)              *
   * ------------------------------------------------------------ */
  function build() {
    var COS = Math.cos(Math.PI / 6), CX = 470, A = 200, T = 24;
    var s = 7;
    var rand = function () { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
    var out = [], pieceSeq = 0, buildGroup = "init";
    var st = function (w, kind) {
      var chapter = w[2] || CHAPTER_IDS.find(function(id) { return w[0] >= CH[id][0] && w[0] < CH[id][1]; }) || "fin";
      pieceSeq++;
      return 'data-build-id="' + buildGroup + '.' + (kind || 'piece') + '.' + ("0000" + pieceSeq).slice(-4) +
        '" data-chapter="' + chapter + '" data-type="' + (kind || 'piece') + '" data-order="' + pieceSeq +
        '" style="--s:' + w[0].toFixed(6) + ';--e:' + w[1].toFixed(6) + '"';
    };
    var path = function (cls, d, w) { out.push('<path class="' + cls + '" d="' + d + '" ' + st(w, cls) + '/>'); };
    var P = function (a) { return "M" + a.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join("L"); };
    var poly = function (cls, pts, w) { path(cls, P(pts) + "Z", w); };
    var circ = function (cx, cy, r) { return "M" + (cx - r) + " " + cy + "a" + r + " " + r + " 0 1 0 " + 2 * r + " 0a" + r + " " + r + " 0 1 0 " + (-2 * r) + " 0"; };
    var txt = function (cls, x, y, str, w, anchor) {
      out.push('<text class="' + cls + '" x="' + Number(x).toFixed(1) + '" y="' + Number(y).toFixed(1) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : "") + " " + st(w) + ">" + str + "</text>");
    };
    function projectIso(point, originY) {
      return [CX + (point.x - point.y) * Math.cos(Math.PI / 6), originY + (point.x + point.y) * Math.sin(Math.PI / 6) - point.z];
    }
    var pt = function (sy, u, v, z) { return projectIso({x:u, y:v, z:z || 0}, sy); };
    function partWindow(w, a, b) { return [w[0] + (w[1]-w[0])*a, w[0] + (w[1]-w[0])*b, w[2]]; }
    var slabFaces = function (sy, w) {
      poly("face", [pt(sy,-A,-A),pt(sy,A,-A),pt(sy,A,A),pt(sy,-A,A)],partWindow(w,0,.45));
      poly("fside", [pt(sy,-A,A),pt(sy,A,A),pt(sy,A,A,-T),pt(sy,-A,A,-T)],partWindow(w,.35,.8));
      poly("fside", [pt(sy,A,-A),pt(sy,A,A),pt(sy,A,A,-T),pt(sy,A,-A,-T)],partWindow(w,.55,1));
    };
    function solid(sy,u,v,pw,pd,h,z,wn,kind) {
      out.push('<g class="'+kind+'" '+st(wn,kind)+'>');
      var corners = [[u,v],[u+pw,v],[u+pw,v+pd],[u,v+pd]];
      poly("draw",corners.map(function(c){return pt(sy,c[0],c[1],z);}),partWindow(wn,0,.3));
      out[out.length-1]=out[out.length-1].replace('<path','<path data-part="base"');
      poly("fside",[pt(sy,u,v+pd,z),pt(sy,u+pw,v+pd,z),pt(sy,u+pw,v+pd,z+h),pt(sy,u,v+pd,z+h)],partWindow(wn,.18,.58));
      out[out.length-1]=out[out.length-1].replace('<path','<path data-part="side-left"');
      poly("fside",[pt(sy,u+pw,v,z),pt(sy,u+pw,v+pd,z),pt(sy,u+pw,v+pd,z+h),pt(sy,u+pw,v,z+h)],partWindow(wn,.35,.72));
      out[out.length-1]=out[out.length-1].replace('<path','<path data-part="side-right"');
      poly("ftop",corners.map(function(c){return pt(sy,c[0],c[1],z+h);}),partWindow(wn,.6,.9));
      out[out.length-1]=out[out.length-1].replace('<path','<path data-part="top-outline"');
      path("hair",P([pt(sy,u+pw*.2,v+pd*.5,z+h+1),pt(sy,u+pw*.8,v+pd*.5,z+h+1)]),partWindow(wn,.82,1));
      out[out.length-1]=out[out.length-1].replace('<path','<path data-part="detail"');
      out.push('</g>');
    }
    var prism = function(sy,u,v,pw,pd,h,wn) { solid(sy,u,v,pw,pd,h,0,wn,"prism"); };
    var cube = function(sy,u,v,size,z,wn) { solid(sy,u,v,size,size,size*.72,z,wn,"cube"); };
    var label = function (sy, num, txtS, w, dx) {
      var rx = CX + (dx || 1) * 2 * A * COS;
      var x1 = rx + (dx || 1) * 10, x2 = rx + (dx || 1) * 46;
      path("hair", "M" + Math.min(x1, x2) + " " + sy.toFixed(1) + "L" + Math.max(x1, x2) + " " + sy.toFixed(1), w);
      txt("lbl", rx + (dx || 1) * 54, sy + 6, num + " \u00B7 " + txtS, w, (dx || 1) < 0 ? "end" : "start");
    };
    var SY = [1150, 990, 830, 670, 510]; /* market, stats, opt, risk, intel */
    var G = function (id) { buildGroup=id; out.push('<g data-grp="' + id + '">'); };
    var GE = function () { out.push("</g>"); };

    /* ================= CHAPTER 00 · INITIALIZATION ================= */
    G("init");
    for (var g = -6; g <= 6; g++) {
      path("grid", P([pt(830, g * 90, -620), pt(830, g * 90, 620)]), W("init", 0.10, 0.30));
      path("grid", P([pt(830, -620, g * 90), pt(830, 620, g * 90)]), W("init", 0.10, 0.30));
    }
    /* axes drawing outward from the origin */
    path("hair", P([pt(830, -620, 0), pt(830, 620, 0)]), W("init", 0.30, 0.55));
    path("hair", P([pt(830, 0, -620), pt(830, 0, 620)]), W("init", 0.30, 0.55));
    /* perimeter guide around the future footprint */
    poly("draw", [pt(830, -A - 60, -A - 60), pt(830, A + 60, -A - 60), pt(830, A + 60, A + 60), pt(830, -A - 60, A + 60)], W("init", 0.55, 0.85));
    /* architectural anchor markers */
    [[-A, -A], [A, -A], [A, A], [-A, A], [0, 0]].forEach(function (m) {
      var p = pt(830, m[0], m[1]);
      path("conn", "M" + (p[0] - 6) + " " + p[1] + "L" + (p[0] + 6) + " " + p[1] + "M" + p[0] + " " + (p[1] - 6) + "L" + p[0] + " " + (p[1] + 6), W("init", 0.80, 1.00));
    });
    GE();

    /* ================= SLAB 1 · MARKET DATA ================= */
    var sy = SY[0];
    G("market");
    slabFaces(sy, W("market", 0.00, 0.10));
    for (g = 1; g < 6; g++) {
      path("hair", P([pt(sy, -A + g * 66, -A), pt(sy, -A + g * 66, A)]), W("market", 0.08, 0.16));
      path("hair", P([pt(sy, -A, -A + g * 66), pt(sy, A, -A + g * 66)]), W("market", 0.08, 0.16));
    }
    /* data terminal prisms rising in a staggered diagonal wave */
    [[-150, -140, 40, 30, 34], [40, -150, 46, 34, 46], [-60, 60, 38, 28, 30]].forEach(function (tm, i) {
      prism(sy, tm[0], tm[1], tm[2], tm[3], tm[4], W("market", 0.14 + i * 0.05, 0.24 + i * 0.05));
    });
    /* data cubes in ordered rows (diagonal wave) */
    var cubeCells = [];
    for (var r = 0; r < 3; r++) for (var c = 0; c < 4; c++) cubeCells.push([r, c]);
    cubeCells.sort(function (x, y) { return (x[0] + x[1]) - (y[0] + y[1]) || x[0]-y[0] || x[1]-y[1]; });
    cubeCells.forEach(function (rc, i) {
      var u = 60 + rc[1] * 30, v = -60 + rc[0] * 30;
      cube(sy, u, v, 20, 8, W("market", 0.26 + 0.16 * (i / 11), 0.32 + 0.16 * (i / 11)));
    });
    /* taller processing prisms */
    prism(sy, -150, 40, 34, 26, 52, W("market", 0.42, 0.50));
    prism(sy, 100, 70, 30, 24, 44, W("market", 0.46, 0.54));
    /* miniature time-series rails */
    [[-140, -40], [10, 90], [-30, -150]].forEach(function (ts, i) {
      var pts = [];
      for (var k = 0; k <= 6; k++) pts.push(pt(sy, ts[0] + k * 16, ts[1] + (k % 2 ? 5 : -4) - k * 1.5, 2));
      path("spark", P(pts), W("market", 0.52 + i * 0.03, 0.60 + i * 0.03));
    });
    /* return-calculation + validation modules */
    prism(sy, -40, -60, 24, 20, 20, W("market", 0.60, 0.66));
    prism(sy, 60, -20, 22, 18, 18, W("market", 0.66, 0.72));
    /* primary bus routes + local connectors */
    path("rail", P([pt(sy, -A + 20, -A + 110), pt(sy, A - 20, -A + 110)]), W("market", 0.72, 0.80));
    path("rail", P([pt(sy, -A + 130, -A + 20), pt(sy, -A + 130, A - 20)]), W("market", 0.74, 0.82));
    [[-150, -140, -110], [40, -150, -110], [-60, 60, -110], [-150, 40, -130], [100, 70, -130]].forEach(function (cn, i) {
      path("conn", P([pt(sy, cn[0], cn[1], 2), pt(sy, cn[0], -A + 110, 2), pt(sy, cn[2], -A + 110, 2)]), W("market", 0.78 + i * 0.012, 0.84 + i * 0.012));
    });
    /* input markers */
    for (var mi = 0; mi < 5; mi++) {
      var mp = pt(sy, -A + 30 + mi * 90, A - 24, 2);
      out.push('<circle class="dot' + (mi === 2 ? " acc" : "") + '" cx="' + mp[0].toFixed(1) + '" cy="' + mp[1].toFixed(1) + '" r="3.4" ' + st(W("market", 0.84 + mi * 0.016, 0.90 + mi * 0.016)) + "/>");
    }
    /* restrained activation pass */
    poly("pulse", [pt(sy, -A - 16, -A - 16), pt(sy, A + 16, -A - 16), pt(sy, A + 16, A + 16), pt(sy, -A - 16, A + 16)], W("market", 0.90, 0.97));
    label(sy, "01", "MARKET DATA \u00B7 VERIFIED ASSETS", W("market", 0.93, 1.00));
    GE();

    /* ================= SLAB 2 · STATISTICAL INTELLIGENCE ================= */
    sy = SY[1];
    G("stats");
    slabFaces(sy, W("stats", 0.00, 0.10));
    /* matrix chamber base */
    poly("draw", [pt(sy, -150, -150), pt(sy, 40, -150), pt(sy, 40, 40), pt(sy, -150, 40)], W("stats", 0.10, 0.18));
    /* covariance grid cells, one at a time, diagonal wave */
    var heatCells = [];
    for (r = 0; r < 6; r++) for (c = 0; c < 6; c++) heatCells.push([r, c]);
    heatCells.sort(function (x, y) { return (x[0] + x[1]) - (y[0] + y[1]) || x[0]-y[0] || x[1]-y[1]; });
    heatCells.forEach(function (rc) {
      var hx = -138 + rc[1] * 28, hy = -138 + rc[0] * 28, hh = (rand() * 0.55 + 0.10).toFixed(2);
      var wq = W("stats", 0.16 + 0.20 * (heatCells.indexOf(rc) / 35), 0.21 + 0.20 * (heatCells.indexOf(rc) / 35));
      poly("heat", [pt(sy, hx, hy), pt(sy, hx + 20, hy), pt(sy, hx + 20, hy + 20), pt(sy, hx, hy + 20)], wq);
      out[out.length - 1] = out[out.length - 1].replace('style="', 'style="--h:' + hh + ";");
    });
    /* main diagonal indicators */
    for (r = 0; r < 6; r++) {
      var dp = pt(sy, -128 + r * 28, -128 + r * 28, 4);
      out.push('<circle class="dot acc" cx="' + dp[0].toFixed(1) + '" cy="' + dp[1].toFixed(1) + '" r="2.6" ' + st(W("stats", 0.38 + r * 0.01, 0.43 + r * 0.01)) + "/>");
    }
    /* Ledoit-Wolf module housing + sample cells */
    prism(sy, 90, -140, 60, 50, 30, W("stats", 0.42, 0.50));
    txt("lbl small", pt(sy, 120, -115, 34)[0].toFixed(1), pt(sy, 120, -115, 34)[1].toFixed(1), "LW", W("stats", 0.48, 0.54), "middle");
    [[96, -78], [130, -78], [96, -50], [130, -50]].forEach(function (sc, i) {
      poly("cell", [pt(sy, sc[0], sc[1]), pt(sy, sc[0] + 22, sc[1]), pt(sy, sc[0] + 22, sc[1] + 18), pt(sy, sc[0], sc[1] + 18)], W("stats", 0.50 + i * 0.018, 0.55 + i * 0.018));
    });
    /* shrinkage transformation connectors */
    for (var shk = 0; shk < 3; shk++) {
      var a1 = pt(sy, 44, -40 + shk * 24, 4), a2 = pt(sy, 88, -40 + shk * 24, 20);
      path("conn", "M" + a1[0].toFixed(1) + " " + a1[1].toFixed(1) + "C" + (a1[0] + 20) + " " + a1[1] + " " + (a2[0] - 20) + " " + a2[1] + " " + a2[0].toFixed(1) + " " + a2[1].toFixed(1), W("stats", 0.56 + shk * 0.02, 0.63 + shk * 0.02));
    }
    /* estimated output cells */
    [[96, -16], [130, -16], [96, 12]].forEach(function (oc, i) {
      poly("cell", [pt(sy, oc[0], oc[1]), pt(sy, oc[0] + 22, oc[1]), pt(sy, oc[0] + 22, oc[1] + 18), pt(sy, oc[0], oc[1] + 18)], W("stats", 0.64 + i * 0.018, 0.69 + i * 0.018));
    });
    /* correlation nodes + links */
    var corrN = [[-60, 120], [10, 150], [80, 120], [150, 150]];
    var corrS = [];
    corrN.forEach(function (cn, i) {
      var p = pt(sy, cn[0], cn[1], 6);
      corrS.push(p);
      path("ring", circ(p[0], p[1], 10), W("stats", 0.70 + i * 0.02, 0.76 + i * 0.02));
    });
    [[0, 1], [1, 2], [2, 3], [0, 2]].forEach(function (e, i) {
      path("conn", P([corrS[e[0]], corrS[e[1]]]), W("stats", 0.76 + i * 0.015, 0.82 + i * 0.015));
    });
    /* asset-clustering prisms + dendrogram leaves-to-root */
    [[-160, 110], [-120, 140], [-80, 110]].forEach(function (cp, i) { prism(sy, cp[0], cp[1], 22, 20, 16, W("stats", 0.82 + i * 0.02, 0.87 + i * 0.02)); });
    path("dendro", P([pt(sy, -149, 120, 18), pt(sy, -140, 145, 30), pt(sy, -109, 120, 18)]), W("stats", 0.86, 0.91));
    path("dendro", P([pt(sy, -140, 145, 30), pt(sy, -100, 130, 42), pt(sy, -69, 120, 18)]), W("stats", 0.89, 0.94));
    /* expected-return vector */
    var ev1 = pt(sy, 150, 60, 4), ev2 = pt(sy, 150, 130, 40);
    path("spark", "M" + ev1[0].toFixed(1) + " " + ev1[1].toFixed(1) + "L" + ev2[0].toFixed(1) + " " + ev2[1].toFixed(1), W("stats", 0.90, 0.96));
    /* interlayer data connectors to slab 3 */
    path("conn", P([pt(sy, -100, -100, 4), pt(SY[2], -100, -100, -T)]), W("stats", 0.93, 1.00));
    path("conn", P([pt(sy, 100, 100, 4), pt(SY[2], 100, 100, -T)]), W("stats", 0.93, 1.00));
    label(sy, "02", "STATISTICAL ENGINE \u00B7 \u03A3 = Cov(R)", W("stats", 0.95, 1.00));
    GE();

    /* ================= SLAB 3 · OPTIMIZATION CORE ================= */
    sy = SY[2];
    G("opt");
    slabFaces(sy, W("opt", 0.00, 0.06));
    /* MPT engine platform: axes, candidates, frontier, marker */
    poly("draw", [pt(sy, -170, -170), pt(sy, -40, -170), pt(sy, -40, -40), pt(sy, -170, -40)], W("opt", 0.06, 0.12));
    prism(sy, -170, -170, 130, 130, 10, W("opt", 0.08, 0.14));
    path("hair", P([pt(sy, -150, -60, 12), pt(sy, -60, -60, 12)]), W("opt", 0.12, 0.16));
    path("hair", P([pt(sy, -150, -160, 12), pt(sy, -150, -60, 12)]), W("opt", 0.12, 0.16));
    var mptPts = [];
    for (var mi2 = 0; mi2 < 8; mi2++) {
      var t2 = mi2 / 7, u = -150 + t2 * 84, v = -150 + Math.sin(t2 * 2.4) * 26 + (1 - t2) * 44;
      var pp = pt(sy, u, v, 16);
      mptPts.push(pp);
      out.push('<circle class="dot' + (mi2 === 5 ? " acc" : "") + '" cx="' + pp[0].toFixed(1) + '" cy="' + pp[1].toFixed(1) + '" r="2.8" ' + st(W("opt", 0.16 + 0.012 * mi2, 0.20 + 0.012 * mi2)) + "/>");
    }
    path("spark", P(mptPts), W("opt", 0.24, 0.30));
    var selP = mptPts[5];
    path("ring", circ(selP[0], selP[1], 7), W("opt", 0.30, 0.34));
    /* Black-Litterman base frame: rails, confidence blocks, output module */
    prism(sy, 40, -160, 130, 90, 14, W("opt", 0.14, 0.20));
    path("rail", P([pt(sy, 56, -146, 16), pt(sy, 150, -146, 16)]), W("opt", 0.20, 0.24));
    path("rail", P([pt(sy, 56, -116, 16), pt(sy, 150, -116, 16)]), W("opt", 0.22, 0.26));
    [[56, -90], [92, -90], [128, -90]].forEach(function (cb, i) { cube(sy, cb[0], cb[1], 18, 14, W("opt", 0.26 + i * 0.02, 0.30 + i * 0.02)); });
    prism(sy, 60, -60, 90, 26, 24, W("opt", 0.32, 0.38));
    /* HRP chamber: clusters, dendrogram, allocation rails */
    poly("draw", [pt(sy, -170, 40), pt(sy, -50, 40), pt(sy, -50, 160), pt(sy, -170, 160)], W("opt", 0.24, 0.30));
    [[-156, 56], [-124, 56], [-92, 56], [-156, 100], [-124, 100], [-92, 100]].forEach(function (hc, i) { cube(sy, hc[0], hc[1], 20, 10, W("opt", 0.30 + 0.014 * i, 0.35 + 0.014 * i)); });
    path("dendro", P([pt(sy, -146, 66, 12), pt(sy, -135, 80, 24), pt(sy, -114, 66, 12)]), W("opt", 0.38, 0.42));
    path("dendro", P([pt(sy, -135, 80, 24), pt(sy, -103, 80, 30), pt(sy, -82, 66, 12)]), W("opt", 0.40, 0.44));
    path("dendro", P([pt(sy, -146, 110, 12), pt(sy, -125, 124, 28), pt(sy, -103, 110, 12)]), W("opt", 0.42, 0.46));
    path("rail", P([pt(sy, -160, 140, 8), pt(sy, -60, 140, 8)]), W("opt", 0.44, 0.48));
    /* central optimizer platform: rings, segments, prisms, constraints */
    poly("draw", [pt(sy, 20, 20), pt(sy, 150, 20), pt(sy, 150, 150), pt(sy, 20, 150)], W("opt", 0.36, 0.42));
    prism(sy, 30, 30, 110, 110, 16, W("opt", 0.38, 0.44));
    var coreC = pt(sy, 85, 85, 18);
    path("ring", circ(coreC[0], coreC[1], 26), W("opt", 0.44, 0.48));
    path("ring", circ(coreC[0], coreC[1], 18), W("opt", 0.46, 0.50));
    for (var sg = 0; sg < 4; sg++) {
      var aA = sg * 1.57, aB = aA + 1.2;
      path("conn", "M" + (coreC[0] + 26 * Math.cos(aA)).toFixed(1) + " " + (coreC[1] + 13 * Math.sin(aA)).toFixed(1) + "A26 26 0 0 1 " + (coreC[0] + 26 * Math.cos(aB)).toFixed(1) + " " + (coreC[1] + 13 * Math.sin(aB)).toFixed(1), W("opt", 0.48 + 0.012 * sg, 0.52 + 0.012 * sg));
    }
    [[36, 96], [64, 122], [104, 122], [126, 96]].forEach(function (wp, i) { cube(sy, wp[0], wp[1], 16, 18, W("opt", 0.52 + 0.014 * i, 0.57 + 0.014 * i)); });
    poly("cell", [pt(sy, 36, 40), pt(sy, 60, 40), pt(sy, 60, 54), pt(sy, 36, 54)], W("opt", 0.56, 0.60));
    poly("cell", [pt(sy, 68, 40), pt(sy, 92, 40), pt(sy, 92, 54), pt(sy, 68, 54)], W("opt", 0.58, 0.62));
    /* engine-to-core connectors */
    var mptC = pt(sy, -105, -105, 14), blC = pt(sy, 105, -110, 20), hrpC = pt(sy, -110, 100, 12);
    path("conn", P([mptC, coreC]), W("opt", 0.62, 0.68));
    path("conn", P([blC, coreC]), W("opt", 0.64, 0.70));
    path("conn", P([hrpC, coreC]), W("opt", 0.66, 0.72));
    /* output rails + interlayer input lines from slab 2 */
    path("rail", P([pt(sy, 85, 155, 4), pt(sy, 85, 190, 4)]), W("opt", 0.72, 0.78));
    path("rail", P([pt(sy, 20, 85, 4), pt(sy, -10, 85, 4)]), W("opt", 0.74, 0.80));
    poly("pulse", [pt(sy, -A - 16, -A - 16), pt(sy, A + 16, -A - 16), pt(sy, A + 16, A + 16), pt(sy, -A - 16, A + 16)], W("opt", 0.80, 0.88));
    label(sy, "03", "OPTIMIZATION CORE \u00B7 MPT / BL / HRP", W("opt", 0.86, 0.94));
    GE();

    /* ================= SLAB 4 · RISK & SIMULATION ================= */
    sy = SY[3];
    G("risk");
    slabFaces(sy, W("risk", 0.00, 0.08));
    path("rail", P([pt(sy, -A + 16, -A + 16), pt(sy, A - 16, -A + 16)]), W("risk", 0.04, 0.10));
    /* simulation platform + axes */
    poly("draw", [pt(sy, -170, -170), pt(sy, -10, -170), pt(sy, -10, -20), pt(sy, -170, -20)], W("risk", 0.08, 0.14));
    path("hair", P([pt(sy, -150, -40, 8), pt(sy, -30, -40, 8)]), W("risk", 0.14, 0.18));
    path("hair", P([pt(sy, -150, -160, 8), pt(sy, -150, -40, 8)]), W("risk", 0.14, 0.18));
    /* simulated paths tracing one by one */
    var fanPaths = [];
    for (var fp = 0; fp < 7; fp++) {
      var pts = [];
      for (var k2 = 0; k2 <= 6; k2++) {
        var u = -150 + k2 * 22, v = -155 + fp * 12 - k2 * 9 + ((k2 * 7 + fp * 13) % 3) * 4;
        pts.push(pt(sy, u, v, 10));
      }
      fanPaths.push(pts);
      path("fanpath", P(pts), W("risk", 0.18 + 0.016 * fp, 0.24 + 0.016 * fp));
    }
    /* median line + percentile tracks */
    path("spark", P(fanPaths[3]), W("risk", 0.28, 0.33));      path("hair", P([fanPaths[1][0], fanPaths[1][6]]), W("risk", 0.32, 0.36));
    path("hair", P([fanPaths[5][0], fanPaths[5][6]]), W("risk", 0.34, 0.38));
    /* risk distribution chamber + return path + VaR marker */
    poly("draw", [pt(sy, 30, -160), pt(sy, 160, -160), pt(sy, 160, -40), pt(sy, 30, -40)], W("risk", 0.38, 0.44));
    var dist = [];
    for (k2 = 0; k2 <= 8; k2++) dist.push(pt(sy, 42 + k2 * 13, -150 + 30 * Math.sin(k2 / 8 * Math.PI) + 22, 8));
    path("spark", P(dist), W("risk", 0.42, 0.48));
    var varP = pt(sy, 62, -140, 8);
    path("conn", "M" + varP[0].toFixed(1) + " " + (varP[1] - 14).toFixed(1) + "L" + varP[0].toFixed(1) + " " + (varP[1] + 10).toFixed(1), W("risk", 0.48, 0.52));
    /* metric prisms: volatility, sharpe, sortino, drawdown */
    [[-160, 30, "\u03C3"], [-100, 30, "SR"], [-40, 30, "SO"], [20, 30, "DD"]].forEach(function (mp2, i) {
      prism(sy, mp2[0], mp2[1], 40, 34, 26 + (i % 2) * 8, W("risk", 0.52 + i * 0.035, 0.58 + i * 0.035));
      var lp = pt(sy, mp2[0] + 20, mp2[1] + 17, 26 + (i % 2) * 8 + 8);
      txt("lbl small", lp[0].toFixed(1), lp[1].toFixed(1), mp2[2], W("risk", 0.56 + i * 0.035, 0.62 + i * 0.035), "middle");
    });
    /* risk-contribution blocks */
    [[110, 30], [140, 30], [110, 80], [140, 80]].forEach(function (rc2, i) {
      poly("cell", [pt(sy, rc2[0], rc2[1]), pt(sy, rc2[0] + 22, rc2[1]), pt(sy, rc2[0] + 22, rc2[1] + 20), pt(sy, rc2[0], rc2[1] + 20)], W("risk", 0.66 + i * 0.016, 0.71 + i * 0.016));
    });
    /* backtesting platform + portfolio/benchmark curves */
    poly("draw", [pt(sy, -170, 100), pt(sy, 160, 100), pt(sy, 160, 175), pt(sy, -170, 175)], W("risk", 0.74, 0.80));
    path("hair", P([pt(sy, -150, 168, 6), pt(sy, 140, 168, 6)]), W("risk", 0.78, 0.82));
    var bc1 = [], bc2 = [];
    for (k2 = 0; k2 <= 6; k2++) {
      bc1.push(pt(sy, -150 + k2 * 48, 160 - k2 * 7 - (k2 % 2) * 4, 8));
      bc2.push(pt(sy, -150 + k2 * 48, 162 - k2 * 4.4, 8));
    }
    path("spark", P(bc1), W("risk", 0.80, 0.87));
    path("conn", P(bc2), W("risk", 0.84, 0.90));
    /* interlayer output connectors + label */
    path("conn", P([pt(sy, -80, -100, 12), pt(SY[4], -80, -100, -T)]), W("risk", 0.88, 0.95));
    path("conn", P([pt(sy, 80, 60, 12), pt(SY[4], 80, 60, -T)]), W("risk", 0.90, 0.96));
    label(sy, "04", "RISK & SIMULATION \u00B7 OUT-OF-SAMPLE", W("risk", 0.92, 1.00));
    GE();

    /* ================= SLAB 5 · PORTFOLIO INTELLIGENCE ================= */
    sy = SY[4];
    G("intel");
    slabFaces(sy, W("intel", 0.00, 0.08));
    for (g = 1; g < 6; g++) {
      path("hair", P([pt(sy, -A + g * 66, -A), pt(sy, -A + g * 66, A)]), W("intel", 0.06, 0.12));
      path("hair", P([pt(sy, -A, -A + g * 66), pt(sy, A, -A + g * 66)]), W("intel", 0.06, 0.12));
    }
    /* interface sockets */
    var SOCK = [[-130, -110], [0, -140], [110, -90], [-100, 60], [30, 100], [140, 60]];
    SOCK.forEach(function (sk, i) {
      var p = pt(sy, sk[0], sk[1], 2);
      path("ring", circ(p[0], p[1], 6), W("intel", 0.12 + i * 0.012, 0.17 + i * 0.012));
    });
    /* primary + secondary analytical nodes with icons */
    var INODES = [
      [-130, -110, "PORTFOLIO NODE \u2014 allocation hub", "M-5 0H5M0 -5V5"],
      [0, -140, "RISK NODE \u2014 exposure metrics", "M-5 4L-1 -3L2 0L5 -4"],
      [110, -90, "SIMULATION NODE \u2014 outcome engine", "M-5 -4A5 5 0 1 0 5 -4"],
      [-100, 60, "CORRELATION NODE \u2014 asset relationships", "M-6 0H6M-3 -3L0 0L-3 3M3 -3L6 0L3 3"],
      [30, 100, "BACKTEST NODE \u2014 historical evaluation", "M-5 4V-4M-5 0L0 -2M0 -4V4M0 -1L5 -3M5 -4V4"],
      [140, 60, "FRONTIER NODE \u2014 model comparison", "M-5 4L0 -4L5 4M-2 1L2 1"]
    ];
    var nodeS = [];
    INODES.forEach(function (nd, i) {
      var p = pt(sy, nd[0], nd[1], 4);
      nodeS.push(p);
      var wn = i < 3 ? W("intel", 0.18 + i * 0.05, 0.26 + i * 0.05) : W("intel", 0.30 + (i - 3) * 0.035, 0.38 + (i - 3) * 0.035);
      out.push('<g class="node" data-grp="intel" ' + st(wn) + '><title>' + nd[2] + "</title>" +
        '<circle class="halo" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="15"/>' +
        '<circle class="ring" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="11" ' + st(partWindow(wn,0,.6),'ring') + '/>' +
        '<path class="icon" transform="translate(' + p[0].toFixed(1) + " " + p[1].toFixed(1) + ')" d="' + nd[3] + '" ' + st(partWindow(wn,.5,1),'icon') + '/></g>');
    });
    /* local network connectors + cluster links */
    [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3]].forEach(function (e, i) {
      path("conn", P([nodeS[e[0]], nodeS[e[1]]]), W("intel", 0.40 + i * 0.016, 0.46 + i * 0.016));
    });
    [[0, 4], [2, 5]].forEach(function (e, i) {
      path("hair", P([nodeS[e[0]], nodeS[e[1]]]), W("intel", 0.46 + i * 0.02, 0.52 + i * 0.02));
    });
    /* central portfolio node housing + icon */
    var coreP = pt(sy, 20, -10, 10);
    prism(sy, 0, -30, 44, 40, 12, W("intel", 0.50, 0.56));
    out.push('<g class="node" data-grp="intel" ' + st(W("intel", 0.54, 0.60)) + '><title>CENTRAL PORTFOLIO ENGINE \u2014 one connected system</title>' +
      '<circle class="halo" cx="' + coreP[0].toFixed(1) + '" cy="' + coreP[1].toFixed(1) + '" r="19"/>' +
      '<circle class="ring acc" cx="' + coreP[0].toFixed(1) + '" cy="' + coreP[1].toFixed(1) + '" r="13" ' + st(W('intel',.54,.575),'ring') + '/>' +
      '<path class="icon" transform="translate(' + coreP[0].toFixed(1) + " " + coreP[1].toFixed(1) + ')" d="M-5 0H5M0 -5V5" ' + st(W('intel',.57,.60),'icon') + '/></g>');
    /* card attachment sockets (activate per card chapter) */
    var SOCKETS = [pt(sy, 20, -10, 14), pt(sy, 0, -140, 8), pt(sy, -100, 60, 8), pt(sy, 30, 100, 8), pt(sy, 110, -90, 8), pt(sy, 140, 60, 8)];
    SOCKETS.forEach(function (sp, i) {
      path("ring", circ(sp[0], sp[1], 9), W(CHAPTER_IDS[6 + i], 0.02, 0.08));
    });
    /* long-distance connector paths down the stack */
    [[-130, -110, SY[3]], [110, -90, SY[2]], [-100, 60, SY[1]]].forEach(function (lc, i) {
      path("conn", P([pt(sy, lc[0], lc[1], 6), pt(lc[2], lc[0], lc[1], 12)]), W("intel", 0.62 + i * 0.04, 0.70 + i * 0.04));
    });
    label(sy, "05", "PORTFOLIO INTELLIGENCE", W("intel", 0.72, 0.80), 1);
    GE();

    /* ================= CHAPTERS 06–11 · EXPANSIONS + CARDS =================
     * Every card has seven shared timing phases; extension internals and card
     * contents are scheduled from the same chapter progress, never autoplay. */
    var EXP = [
      { ch:"portfolio", id:"portfolio", title:"PORTFOLIO / OVERVIEW", name:"PORTFOLIO CONTROL TERRACE", center:[20,-10], sy:360, card:[350,60], kind:"allocation", anchor:0 },
      { ch:"frontier", id:"frontier", title:"OPTIMIZATION / FRONTIER", name:"OPTIMIZATION OBSERVATORY", center:[-320,-45], sy:760, card:[-300,380], kind:"frontier", anchor:1 },
      { ch:"corr", id:"correlation", title:"STATISTICS / RELATIONSHIPS", name:"COVARIANCE MATRIX CHAMBER", center:[180,-280], sy:920, card:[980,730], kind:"matrix", anchor:2 },
      { ch:"riskc", id:"risk", title:"RISK / EXPOSURE", name:"RISK INSTRUMENTATION ARRAY", center:[330,70], sy:610, card:[1010,450], kind:"risk", anchor:3 },
      { ch:"mc", id:"monte-carlo", title:"SIMULATION / OUTCOMES", name:"SIMULATION PROJECTION FIELD", center:[160,-370], sy:460, card:[940,100], kind:"simulation", anchor:4 },
      { ch:"bt", id:"backtest", title:"BACKTEST / PERFORMANCE", name:"PERFORMANCE ANALYSIS WING", center:[-320,180], sy:1040, card:[-300,900], kind:"backtest", anchor:5 }
    ];
    var CORE_ANCHORS = [coreP, nodeS[5], nodeS[3], nodeS[1], nodeS[2], nodeS[4]];
    function expansion(e, index) {
      var wB=W(e.ch,0.10,0.24), wD=W(e.ch,0.38,0.70), wE=W(e.ch,0.70,0.84), wF=W(e.ch,0.84,0.94), wG=W(e.ch,0.94,1.00);
      var eu=e.center[0], ev=e.center[1], es=e.sy;
      buildGroup='expansion.'+e.id;
      out.push('<g class="expansion" data-expansion="'+e.id+'" data-grp="expansion">');
      /* A: explicit anchor and activated analytical target */
      var anchor=CORE_ANCHORS[e.anchor];
      var sourceY=[SY[4],SY[2],SY[1],SY[3],SY[3],SY[3]][index];
      var source=pt(sourceY,index%2 ? -170 : 170,index%2 ? 60 : -60,8);
      path('rail',P([source,pt(es,eu-72,ev-54,12)]),W(e.ch,.12,.24));
      path('rail',P([pt(sourceY,index%2 ? -150 : 150,index%2 ? 80 : -80,8),pt(es,eu-54,ev-36,12)]),W(e.ch,.16,.24));
      path("ring",circ(anchor[0],anchor[1],13),W(e.ch,0.00,0.10));
      var baseU=eu-72, baseV=ev-54;
      /* B: terrace/chamber/wings are iso platforms with supports */
      prism(es,baseU,baseV,144,108,12,wB);
      prism(es,baseU+8,baseV+8,128,92,5,W(e.ch,0.14,0.26));
      for(var support=0;support<4;support++){
        var su=baseU+(support%2)*118, sv=baseV+Math.floor(support/2)*78;
        prism(es,su,sv,16,16,34,W(e.ch,0.16+support*0.012,0.25+support*0.012));
      }
      /* Distinct housings and modular rails: not six copies of a bare plane. */
      var housingCount=[2,3,2,5,3,2][index];
      for(var housing=0;housing<housingCount;housing++) {
        prism(es,baseU-26+housing*30,baseV-28,18,index===5 ? 84 : 24,18+(housing%3)*14,W(e.ch,.38+housing*.025,.46+housing*.025));
      }
      if(index===5) prism(es,baseU-62,baseV+20,62,32,12,W(e.ch,.16,.24));
      if(index===4) for(var track=0;track<4;track++) path('rail',P([pt(es,baseU+8,baseV-55-track*9,9),pt(es,baseU+170,baseV-55-track*9,9)]),W(e.ch,.39+track*.025,.50+track*.025));
      /* restrained inner grid and function-specific structural modules */
      for(var rail=1;rail<5;rail++){
        path("hair",P([pt(es,baseU+rail*25,baseV+10,7),pt(es,baseU+rail*25,baseV+98,7)]),W(e.ch,0.38,0.44));
        path("hair",P([pt(es,baseU+10,baseV+rail*20,7),pt(es,baseU+134,baseV+rail*20,7)]),W(e.ch,0.39,0.45));
      }
      if(e.kind==="allocation"){
        for(var ai=0;ai<12;ai++) cube(es,baseU+12+(ai%4)*28,baseV+12+Math.floor(ai/4)*25,16,8,W(e.ch,0.44+ai*0.012,0.50+ai*0.012));
        for(ai=0;ai<4;ai++) path("rail",P([pt(es,baseU+16,baseV+82+ai*4,12),pt(es,baseU+28+ai*23,baseV+82+ai*4,12)]),W(e.ch,0.42+ai*0.012,0.50+ai*0.012));
      } else if(e.kind==="frontier"){
        var fpts=[]; for(ai=0;ai<9;ai++){var ft=ai/8; fpts.push(pt(es,baseU+12+ft*116,baseV+70-Math.sin(ft*Math.PI)*48,16));}
        path("spark",P(fpts),W(e.ch,0.43,0.60));
        for(ai=0;ai<9;ai++){var fpnt=pt(es,baseU+14+ai*14,baseV+28+(ai%3)*14,15);out.push('<circle class="dot" cx="'+fpnt[0].toFixed(1)+'" cy="'+fpnt[1].toFixed(1)+'" r="2.7" '+st(W(e.ch,0.40+ai*0.012,0.47+ai*0.012))+'/>');}
        prism(es,baseU+84,baseV+38,18,18,24,W(e.ch,0.48,0.58));
      } else if(e.kind==="matrix"){
        for(ai=0;ai<49;ai++){
          var mr=Math.floor(ai/7),mc=ai%7, mh=(rand()*.65+.08).toFixed(2);
          poly("heat",[pt(es,baseU+12+mc*17,baseV+10+mr*15),pt(es,baseU+25+mc*17,baseV+10+mr*15),pt(es,baseU+25+mc*17,baseV+22+mr*15),pt(es,baseU+12+mc*17,baseV+22+mr*15)],W(e.ch,0.43+0.20*(mr+mc)/12,0.49+0.20*(mr+mc)/12));
          out[out.length-1]=out[out.length-1].replace('style="','style="--h:'+mh+';');
        }
        for(ai=0;ai<5;ai++) path("dendro",P([pt(es,baseU+18+ai*20,baseV+94,14),pt(es,baseU+25+ai*20,baseV+82,24),pt(es,baseU+36+ai*20,baseV+94,14)]),W(e.ch,0.54+ai*.012,0.62+ai*.012));
      } else if(e.kind==="risk"){
        for(ai=0;ai<6;ai++){
          var pu=baseU+14+ai*21, ph=20+(ai*31%52);
          prism(es,pu,baseV+30,14,18,ph,W(e.ch,0.40+ai*.025,0.49+ai*.025));
          path("hair",P([pt(es,pu-2,baseV+24,5),pt(es,pu+18,baseV+24,5)]),W(e.ch,0.42+ai*.01,0.50+ai*.01));
        }
        var rp=[];for(ai=0;ai<8;ai++)rp.push(pt(es,baseU+8+ai*18,baseV+85-Math.sin(ai/7*Math.PI)*30,10));path("spark",P(rp),W(e.ch,0.50,0.64));
      } else if(e.kind==="simulation"){
        for(ai=0;ai<12;ai++){
          var sim=[];for(var sj=0;sj<6;sj++)sim.push(pt(es,baseU+8+sj*23,baseV+54-ai*2-sj*3+((ai+sj*3)%4)*5,12));
          path("fanpath",P(sim),W(e.ch,0.40+ai*.012,0.49+ai*.012));
        }
        for(ai=0;ai<12;ai++)cube(es,baseU+10+ai*10,baseV+86+(ai%3)*4,8,10+(ai%4)*5,W(e.ch,0.48+ai*.01,0.56+ai*.01));
      } else {
        for(ai=0;ai<12;ai++){
          var bp1=pt(es,baseU+10+ai*10,baseV+80-(ai*7%38),12),bp2=pt(es,baseU+10+ai*10,baseV+88-(ai*5%30),12);
          if(ai===0) var bpts1=[bp1],bpts2=[bp2]; else {bpts1.push(bp1);bpts2.push(bp2);}
          path("hair",P([pt(es,baseU+10+ai*10,baseV+94,5),pt(es,baseU+10+ai*10,baseV+89,5)]),W(e.ch,0.38+ai*.012,0.45+ai*.012));
        }
        path("spark",P(bpts1),W(e.ch,0.39,0.53));path("conn",P(bpts2),W(e.ch,0.48,0.60));
      }
      /* E: card-to-extension connector and path to its core node */
      var cardX=e.card[0],cardY=e.card[1],cardAnchor=[cardX,cardY+92],expAnchor=pt(es,eu,ev,24);
      path("link",P([cardAnchor,pt(es,eu,ev,42),expAnchor]),wE);
      path("conn",P([expAnchor,anchor]),W(e.ch,0.76,0.86));
      /* F: expansion label and indexing markers */
      var expLabel=pt(es,eu,ev+78,18);
      txt("exlabel",expLabel[0],expLabel[1],e.name,wF,"middle");
      for(ai=0;ai<5;ai++)path("hair",P([pt(es,baseU+ai*26,baseV-7,8),pt(es,baseU+ai*26+11,baseV-7,8)]),W(e.ch,0.86+ai*.012,0.94));
      for(ai=0;ai<8;ai++) cube(es,baseU-20+(ai%4)*26,baseV+122+Math.floor(ai/4)*22,14,8,W(e.ch,.84+ai*.006,.88+ai*.006));
      /* G: activation outline */
      poly("pulse",[pt(es,baseU-5,baseV-5),pt(es,baseU+149,baseV-5),pt(es,baseU+149,baseV+113),pt(es,baseU-5,baseV+113)],wG);
      out.push("</g>");
    }
    EXP.forEach(expansion);

    /* Six individually detailed floating dashboard cards. Card shell enters
     * during phase C; header/details construct during D; integration is E. */
    function card(e) {
      var c=W(e.ch,0.24,0.38), d=W(e.ch,0.38,0.70), f=W(e.ch,0.84,0.94), x=e.card[0], y=e.card[1], w=248, h=174;
      buildGroup='card.'+e.id;
      out.push('<g class="floating-card" data-card="'+e.id+'" data-grp="card" role="button" aria-label="'+e.title+' — highlight connected architecture" tabindex="-1"><title>'+e.name+'</title>');
      /* C: descending card shell */
      out.push('<g class="card-shell" '+st(c)+'>');
      out.push('<rect class="card-frame" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="5"/>');
      path("cardline","M"+(x+12)+" "+(y+29)+"H"+(x+w-12),c);
      txt("card-title",x+14,y+20,e.title,c,"start");
      out.push("</g>");
      /* D: shared module factories use count-calibrated windows inside 38–70%. */
      function dw(i,count){return W(e.ch,.38+(count>1?i/(count-1):0)*.23,.45+(count>1?i/(count-1):0)*.23);}
      function metric(xx,yy,label,value,i,count){
        txt('card-label',xx,yy,label,dw(i,count),'start');
        txt('card-value',xx,yy+13,value,dw(i,count),'start');
      }
      out.push('<g class="card-details" '+st(d)+'>');
      if(e.kind==="allocation"){
        ["EXPECTED RETURN","VOLATILITY","SHARPE","ASSETS"].forEach(function(l,i){
          var xx=x+14+(i%2)*110, yy=y+48+Math.floor(i/2)*36;
          path('cardline','M'+xx+' '+(yy-7)+'h96',dw(i,4));
          txt("card-label",xx,yy,l,dw(i,4),"start");
          txt("card-value",xx,yy+15,["8.42%","12.6%","0.67","24"][i],dw(i,4),"start");
        });
        for(var i=0;i<7;i++){
          var bx=x+14+i*17, by=y+127, bw=13+(i*17%24);
          out.push('<rect class="barrect" x="'+bx+'" y="'+(by-bw)+'" width="12" height="'+bw+'" '+st(W(e.ch,0.43+i*.025,0.52+i*.025))+'/>');
        }
        path('chart-line',P([[x+144,y+124],[x+162,y+120],[x+178,y+126],[x+199,y+112],[x+226,y+100]]),W(e.ch,.56,.69));
        txt('card-label',x+14,y+140,'ALLOCATION / GROWTH',f,'start');
      } else if(e.kind==="frontier"){
        path("chart-axis","M"+(x+24)+" "+(y+124)+"V"+(y+48)+"M"+(x+24)+" "+(y+124)+"H"+(x+220),d);
        for(var i=0;i<16;i++){
          var px=x+42+(i%8)*22, py=y+112-Math.sin((i%8)/7*Math.PI)*58+Math.floor(i/8)*4;
          out.push('<circle class="chart-dot" cx="'+px+'" cy="'+py+'" r="2.4" '+st(W(e.ch,0.42+i*.012,0.48+i*.012))+'/>');
        }
        path("chart-line","M"+(x+42)+" "+(y+105)+"Q"+(x+95)+" "+(y+38)+" "+(x+210)+" "+(y+52),d);
        path('ring',circ(x+130,y+58,5),W(e.ch,.60,.67));
        path('ring',circ(x+42,y+105,4),W(e.ch,.62,.69));
        txt('card-label',x+30,y+42,'MPT  /  BL  /  HRP',W(e.ch,.56,.65),'start');
        txt("card-label",x+26,y+143,"VOL 12.6% / RETURN 8.42%",f,"start");
      } else if(e.kind==="matrix"){
        for(var i=0;i<36;i++){
          var rr=Math.floor(i/6),cc=i%6, hh=(.14+((i*23)%70)/100).toFixed(2);
          out.push('<rect class="heatcell" x="'+(x+24+cc*25)+'" y="'+(y+48+rr*14)+'" width="20" height="10" '+st(W(e.ch,0.42+i*.006,0.47+i*.006)).replace('style="','style="--h:'+hh+';')+'/>');
        }
        for(var axis=0;axis<6;axis++) txt('card-label',x+24+axis*25,y+42,['US','EU','EM','FI','RE','AU'][axis],dw(axis,6),'start');
        for(var scale=0;scale<5;scale++) out.push('<rect class="heatcell" x="'+(x+190)+'" y="'+(y+51+scale*15)+'" width="24" height="12" '+st(dw(scale,5)).replace('style="','style="--h:'+(scale+1)*.16+';')+'/>');
        path('cardline','M'+(x+97)+' '+(y+75)+'h24v14h-24Z',W(e.ch,.61,.69));
        txt("card-label",x+22,y+145,"PAIR US / FI · ρ = 0.24",f,"start");
      } else if(e.kind==="risk"){
        ["VOL","VaR","DD","SR","SO"].forEach(function(l,i){
          var xx=x+15+i*44, bh=24+(i*19%48);
          out.push('<rect class="metric-bar" x="'+xx+'" y="'+(y+120-bh)+'" width="24" height="'+bh+'" '+st(W(e.ch,0.42+i*.035,0.50+i*.035))+'/>');
          txt("card-label",xx+12,y+137,l,dw(i,5),"middle");
          txt('card-label',xx+12,y+49,['12.6%','-2.8%','-14.2%','0.67','0.91'][i],dw(i,5),'middle');
        });
        path("chart-line","M"+(x+16)+" "+(y+78)+"Q"+(x+80)+" "+(y+53)+" "+(x+124)+" "+(y+83)+"T"+(x+225)+" "+(y+61),W(e.ch,.52,.66));
        path('cardline','M'+(x+53)+' '+(y+58)+'v62',W(e.ch,.60,.68));
        txt('card-label',x+16,y+147,'VaR 95% / DAILY ILLUSTRATION',f,'start');
      } else if(e.kind==="simulation"){
        for(var i=0;i<12;i++){
          var ps=[];for(var j=0;j<6;j++)ps.push([x+20+j*39,y+105-i*1.8-j*5+((i*5+j*11)%4)*7]);
          path("chart-line",P(ps),W(e.ch,0.42+i*.009,0.50+i*.009));
        }
        path("chart-axis","M"+(x+16)+" "+(y+126)+"H"+(x+230),d);
        path('chart-line',P([[x+20,y+100],[x+59,y+97],[x+98,y+92],[x+137,y+85],[x+176,y+79],[x+215,y+72]]),W(e.ch,.56,.67));
        for(var bin=0;bin<8;bin++) out.push('<rect class="barrect" x="'+(x+142+bin*10)+'" y="'+(y+121-(6+Math.sin(bin/7*Math.PI)*14))+'" width="7" height="'+(6+Math.sin(bin/7*Math.PI)*14)+'" '+st(dw(bin,8))+'/>');
        txt('card-label',x+20,y+43,'1,000 PATHS / 12-MONTH HORIZON',W(e.ch,.58,.69),'start');
        txt("card-label",x+20,y+143,"P10 0.89× / P50 1.08× / P90 1.29×",f,"start");
      } else {
        path("chart-axis","M"+(x+20)+" "+(y+120)+"V"+(y+48)+"M"+(x+20)+" "+(y+120)+"H"+(x+228),d);
        var c1=[],c2=[];for(var i=0;i<9;i++){c1.push([x+24+i*24,y+105-i*6+(i%3)*7]);c2.push([x+24+i*24,y+111-i*4]);}
        path("chart-line",P(c1),d);path("chart-line muted",P(c2),d);
        path('ring',circ(x+216,y+57,3),W(e.ch,.60,.68));
        path('chart-line muted',P([[x+24,y+119],[x+58,y+124],[x+91,y+120],[x+124,y+125],[x+169,y+123],[x+216,y+119]]),W(e.ch,.57,.68));
        txt('card-label',x+25,y+42,'CAGR 8.4% / DD -14.2% / SR 0.67',W(e.ch,.60,.69),'start');
        txt("card-label",x+25,y+143,"2020–2025 / PORTFOLIO · BENCHMARK",f,"start");
      }
      out.push("</g>");
      /* F: fine annotations and indexed status marks */
      txt("card-note",x+w-12,y+h-10,"ILLUSTRATIVE / DELTA",f,"end");
      path("hair", "M"+(x+w-58)+" "+(y+17)+"h8m4 0h8",f);
      out.push("</g>");
    }
    EXP.forEach(card);

    /* Final activation is a reversible, ordered pass, not an ambient loop. */
    buildGroup='complete';
    SY.forEach(function(level,i) {
      poly('pulse',[pt(level,-A-9,-A-9),pt(level,A+9,-A-9),pt(level,A+9,A+9),pt(level,-A-9,A+9)],W('fin',i*.055,i*.055+.045));
    });
    EXP.forEach(function(e,i) {
      poly('pulse',[pt(e.sy,e.center[0]-80,e.center[1]-62),pt(e.sy,e.center[0]+80,e.center[1]-62),pt(e.sy,e.center[0]+80,e.center[1]+62),pt(e.sy,e.center[0]-80,e.center[1]+62)],W('fin',.28+i*.055,.325+i*.055));
    });
    EXP.forEach(function(e) { path('link',P([[e.card[0],e.card[1]+92],pt(e.sy,e.center[0],e.center[1],24)]),W('fin',.62,.72)); });
    txt('system-title',470,1420,'DELTA',W('fin',.73,.83),'middle');

    /* ------------------------------------------------------------ *
     * 4. Styles + semantic narrative/stage DOM                     *
     * ------------------------------------------------------------ */
    var STYLE = [
      "html,body{overflow-x:clip}#root>div.relative.min-h-screen.overflow-hidden{overflow:visible!important}#dg-architecture-flow{--bg:#060b13;position:relative;min-height:100svh;background:transparent;color:#f4f6fb;z-index:2;isolation:isolate}",
      "#dg-architecture-stage{position:relative;height:100svh;overflow:hidden;display:flex;align-items:center;background:transparent}",
      "#dg-architecture-stage:before{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(6,11,19,.30) 0%,rgba(6,11,19,.10) 40%,rgba(6,11,19,0) 66%)}",
      ".da-copy{position:relative;z-index:3;width:40%;max-width:620px;padding:5vh 0 5vh clamp(28px,7vw,116px);height:100%;display:flex;align-items:center;flex:none}",
      ".da-panel{position:absolute;left:clamp(28px,7vw,116px);right:24px;max-width:500px;opacity:0;visibility:hidden;pointer-events:none}",
      ".da-panel.active{pointer-events:auto}",
      ".da-eyebrow,.da-index,.da-note,.da-caps,.da-fine{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.13em;text-transform:uppercase}",
      ".da-eyebrow{font-size:11px;color:#9db4ff;margin:0 0 22px}.da-index{font-size:10px;color:rgba(226,233,250,.48);margin:0 0 11px}",
      ".da-panel h2{font-size:clamp(26px,3.2vw,48px);line-height:1.05;letter-spacing:-.045em;font-weight:450;margin:0 0 18px;color:#f6f7fb}",
      ".da-desc{font-size:clamp(14px,1.12vw,17px);line-height:1.65;color:rgba(225,232,245,.72);max-width:470px;margin:0 0 22px}",
      ".da-caps{list-style:none;padding:0;margin:0 0 24px;display:grid;gap:8px;font-size:10px;letter-spacing:.06em;text-transform:none;color:rgba(227,234,248,.69)}",
      ".da-caps li:before{content:'+';color:#8ca7ff;margin-right:10px}.da-note{font-size:10px;color:rgba(195,207,232,.66);letter-spacing:.12em;text-transform:none;border-top:1px solid rgba(220,230,255,.15);padding-top:14px;margin:0}",
      ".da-fine{font-size:9px;line-height:1.5;text-transform:none;letter-spacing:.03em;color:rgba(205,216,239,.43);margin-top:12px}",
      ".da-cta{display:inline-flex;margin-top:22px;padding:12px 18px;border:1px solid rgba(157,180,255,.55);color:#fff;text-decoration:none;font:11px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;transition:background .2s,border-color .2s}",
      ".da-cta:hover{background:rgba(124,155,255,.16);border-color:#9db4ff}",
      ".da-art{position:relative;z-index:2;width:60%;height:94%;margin-left:auto;display:flex;align-items:center;justify-content:center;overflow:visible}",
      ".da-svg{width:100%;height:100%;overflow:visible}",
      ".da-svg :is(.face,.fside,.ftop,.cside,.ctop,.draw,.grid,.hair,.conn,.link,.rail,.ring,.icon,.spark,.fanpath,.dendro,.pulse,.cardline,.chart-axis,.chart-line){fill:none;stroke:#d9e4ff;stroke-width:1;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:var(--length,1);stroke-dashoffset:calc(var(--length,1) * (1 - var(--k,0)));}",
      ".da-svg .face{stroke-width:1.6;stroke-opacity:.83}.da-svg .fside,.da-svg .ftop,.da-svg .cside,.da-svg .ctop{stroke-width:1.1;stroke-opacity:.76;fill:rgba(220,232,255,.025)}",
      ".da-svg .draw{stroke-opacity:.58}.da-svg .grid{stroke-opacity:.10;stroke-width:.8}.da-svg .hair{stroke-opacity:.32;stroke-width:.85}.da-svg .conn,.da-svg .rail{stroke-opacity:.58}.da-svg .link{stroke:#91aaff;stroke-width:1.45;stroke-opacity:.85}",
      ".da-svg .ring{stroke:#dce5ff;stroke-opacity:.86}.da-svg .ring.acc{stroke:#91aaff;stroke-width:2}.da-svg .icon{stroke-width:1.4}.da-svg .spark,.da-svg .fanpath{stroke:#c7d5ff;stroke-width:1.35;stroke-opacity:.8}.da-svg .fanpath{stroke-opacity:.35}",
      ".da-svg .pulse{stroke:#94adff;stroke-width:1.8;stroke-opacity:calc(var(--k,0)*.52)}.da-svg .dot{fill:#e7edff;opacity:var(--k,0)}.da-svg .dot.acc{fill:#8ca7ff}",
      ".da-svg .heat{fill:rgba(139,164,255,var(--heat, .2));stroke:rgba(205,218,255,.3);stroke-width:.5}.da-svg .cell{fill:rgba(220,231,255,.09);stroke:rgba(220,231,255,.5);stroke-width:.7}",
      ".da-svg .lbl,.da-svg .exlabel{fill:#e1e8f8;font:10px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.13em;opacity:var(--k,0)}.da-svg .lbl{font-size:9px}.da-svg .lbl.small{font-size:7px}.da-svg .exlabel{font-size:8px;fill:#9eb3ff;text-anchor:middle}",
      ".da-svg .node .halo{fill:#8ca7ff;fill-opacity:.1;opacity:var(--k,0)}.da-svg .node .ring{stroke-width:1.4}.da-svg .node:hover .halo{fill-opacity:.30}",
      ".da-svg .heat{fill-opacity:calc(var(--k,0)*(.1 + var(--h,.3)))}.da-svg .prism,.da-svg .cube,.da-svg .expansion{--k:clamp(0,(var(--build,0) - var(--s,0))/max(.001,(var(--e,1) - var(--s,0))),1)}",
      ".da-svg [data-build-id]{--k:0}.da-svg path,.da-svg circle,.da-svg rect{opacity:var(--k,0)}.da-svg .prism,.da-svg .cube{opacity:1}.da-svg .floating-card{pointer-events:none}.da-svg .floating-card.ready{pointer-events:auto;cursor:crosshair}",
      ".da-svg .card-shell{transform:translateY(calc((1 - var(--k,0))*-38px))}.da-svg .node{pointer-events:none}.da-svg .node.ready{pointer-events:auto}",
      ".da-svg .card-shell,.da-svg .card-details{opacity:var(--k,0)}.da-svg .card-frame{fill:rgba(9,16,31,.95);stroke:rgba(212,225,255,.74);stroke-width:1.2}.da-svg .card-title{font:9px ui-monospace,SFMono-Regular,Menlo,monospace;fill:#edf2ff;letter-spacing:.12em;opacity:var(--k,0)}",
      ".da-svg .card-label,.da-svg .card-note{fill:#91a4c7;font:6px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;opacity:var(--k,0)}.da-svg .card-value{fill:#f0f4ff;font:10px ui-monospace,SFMono-Regular,Menlo,monospace;opacity:var(--k,0)}",
      ".da-svg .cardline,.da-svg .chart-axis{stroke:#8598bf;stroke-opacity:.48}.da-svg .chart-line{stroke:#c9d7ff;stroke-width:1.25}.da-svg .chart-line.muted{stroke:#7788ad;stroke-width:.9}.da-svg .chart-dot{fill:#cbd8ff}.da-svg .heatcell{fill:rgba(142,169,255,var(--h,.3));stroke:rgba(220,230,255,.24);stroke-width:.5}.da-svg .barrect,.da-svg .metric-bar{fill:rgba(142,169,255,.47);stroke:rgba(215,226,255,.62);stroke-width:.55}.da-svg .card-note{fill:#8294b6}",
      ".da-rail{position:absolute;left:22px;top:50%;transform:translateY(-50%);z-index:5;display:grid;gap:10px}.da-rail i{display:block;width:17px;height:2px;background:rgba(226,235,255,.17);transition:background .2s,box-shadow .2s}.da-rail i.active{background:#90aaff;box-shadow:0 0 9px rgba(125,155,255,.75)}",
      "@media(max-width:1100px){.da-copy{width:42%;padding-left:5vw}.da-panel{left:5vw}.da-art{width:58%}.da-rail{display:none}}",
      "@media(max-width:700px){#dg-architecture-stage{display:flex;flex-direction:column;justify-content:flex-start;padding-top:3vh}#dg-architecture-stage:before{background:linear-gradient(180deg,rgba(6,11,19,0),rgba(6,11,19,.10) 45%,rgba(6,11,19,.30) 78%,rgba(6,11,19,.34) 100%)}.da-art{order:0;width:100%;height:48%;flex:none;margin:0;opacity:.85}.da-svg{width:100%;height:100%}.da-copy{order:1;width:100%;height:49%;padding:0 24px 12px;align-items:flex-start;margin-top:-1vh}.da-panel{left:24px;right:24px;top:0;max-width:none}.da-eyebrow{font-size:9px;margin-bottom:10px}.da-panel h2{font-size:clamp(25px,7vw,34px);margin-bottom:10px}.da-desc{font-size:12px;line-height:1.45;margin-bottom:10px}.da-caps{font-size:8px;gap:4px;margin-bottom:10px}.da-note{font-size:8px;padding-top:8px}.da-fine{display:none}.da-cta{margin-top:10px;padding:9px 13px}.da-rail{display:none}}",
      ".da-svg .system-title{fill:#ecf2ff;font:30px ui-monospace,monospace;letter-spacing:.6em;opacity:var(--k,0)}.da-svg .is-highlighted :is(path,circle){stroke:#a9f4df}.da-svg .floating-card.is-highlighted .card-frame{stroke:#a9f4df;stroke-width:2.2}.da-svg .connector-muted{stroke-opacity:.15}.da-svg .floating-card:focus{outline:none}.da-svg .floating-card:focus-visible .card-frame{stroke:#a9f4df;stroke-width:3}",
      ".da-tooltip{position:absolute;bottom:15px;right:24px;max-width:60%;font:11px ui-monospace,monospace;color:#c0eddf;background:#0b1725;padding:10px 14px;pointer-events:none;border:1px solid #33495c}.da-tooltip:empty{display:none}.da-error{padding:24px;color:#ffb4b4}",
      "#dg-architecture-flow.reduced #dg-architecture-stage{height:auto;min-height:100svh;display:flex;flex-direction:column;overflow:visible}#dg-architecture-flow.reduced #dg-architecture-stage:before{background:linear-gradient(180deg,rgba(6,11,19,0),rgba(6,11,19,.12) 32%,rgba(6,11,19,.32) 100%)}#dg-architecture-flow.reduced .da-art{height:min(85vh,900px);width:100%;margin:0}#dg-architecture-flow.reduced .da-copy{width:100%;max-width:1200px;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:32px;margin:auto;padding:40px 24px;height:auto}#dg-architecture-flow.reduced .da-panel{position:static;opacity:1!important;visibility:visible!important;transform:none!important;pointer-events:auto}#dg-architecture-flow.reduced .da-panel h2{font-size:26px}#dg-architecture-flow.reduced .da-rail{display:none}#dg-architecture-flow.reduced .da-note{font-size:10px}#dg-architecture-flow.reduced .da-art{order:0}#dg-architecture-flow.reduced .da-copy{order:1}",
      "@media(max-height:650px) and (min-width:701px){.da-panel h2{font-size:28px}.da-eyebrow{margin-bottom:10px}.da-desc{font-size:13px;line-height:1.45;margin-bottom:12px}.da-caps{margin-bottom:12px;gap:4px}}"
    ].join("");
    var styleEl=document.createElement("style");styleEl.id="dg-architecture-style";styleEl.textContent=STYLE;document.head.appendChild(styleEl);

    var flow=document.createElement("section");flow.id="dg-architecture-flow";flow.setAttribute("aria-label","DELTA system architecture, assembled as you scroll");
    var stage=document.createElement("div");stage.id="dg-architecture-stage";
    var copy=document.createElement("div");copy.className="da-copy";
    PANELS.forEach(function(p,i){
      var panel=document.createElement("article");panel.className="da-panel"+(i===0?" active":"");panel.setAttribute("data-panel",String(i));panel.setAttribute("aria-hidden",i===0?"false":"true");
      var eyebrow=document.createElement("p");eyebrow.className="da-eyebrow";eyebrow.textContent=p.eb;panel.appendChild(eyebrow);
      var index=document.createElement("p");index.className="da-index";index.textContent=p.step;panel.appendChild(index);
      var heading=document.createElement("h2");heading.textContent=p.head;panel.appendChild(heading);
      var desc=document.createElement("p");desc.className="da-desc";desc.textContent=p.desc;panel.appendChild(desc);
      if(p.caps.length){var ul=document.createElement("ul");ul.className="da-caps";p.caps.forEach(function(c){var li=document.createElement("li");li.textContent=c;ul.appendChild(li);});panel.appendChild(ul);}
      var note=document.createElement("p");note.className="da-note";note.textContent=p.note;panel.appendChild(note);
      if(p.fine){var fine=document.createElement("p");fine.className="da-fine";fine.textContent=p.fine;panel.appendChild(fine);}
      if(p.cta){var a=document.createElement("a");a.className="da-cta";a.href="/auth?from=hero";a.textContent=p.cta;panel.appendChild(a);}
      copy.appendChild(panel);
    });
    var art=document.createElement("div");art.className="da-art";art.setAttribute("aria-label","Connected quantitative architecture; dashboard values are illustrative");
    var svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.classList.add("da-svg");svg.setAttribute("viewBox","-340 0 1660 1480");svg.setAttribute("preserveAspectRatio","xMidYMid meet");svg.innerHTML=out.join("");art.appendChild(svg);
    var railEl=document.createElement("div");railEl.className="da-rail";railEl.setAttribute("aria-hidden","true");railEl.innerHTML=CHAPTER_IDS.map(function(){return "<i></i>";}).join("");
    var tooltip=document.createElement('div');tooltip.className='da-tooltip';tooltip.setAttribute('role','status');
    stage.appendChild(copy);stage.appendChild(art);stage.appendChild(railEl);stage.appendChild(tooltip);flow.appendChild(stage);

    /* ------------------------------------------------------------ *
     * 5. Install stage and one normalized scroll controller         *
     * ------------------------------------------------------------ */
    if(window.__deltaArchitecture) window.__deltaArchitecture.dispose();
    var oldFlow=document.getElementById("dg-architecture-flow");
    if(oldFlow)oldFlow.remove();
    var app=document.getElementById("root");
    if(app&&app.firstElementChild){
      var content=app.querySelector(".relative.z-10");
      var hero=content&&content.querySelector(":scope > section");
      if(hero)hero.after(flow);
      else app.firstElementChild.appendChild(flow);
    } else document.body.appendChild(flow);

    var panels=Array.from(copy.querySelectorAll('.da-panel')),ticks=railEl.children;
    var gsap=window.gsap, ScrollTrigger=window.ScrollTrigger;
    if(!gsap || !ScrollTrigger) {
      var error=document.createElement('p');error.className='da-error';error.textContent='Architecture animation could not load. Please reload to retry.';stage.prepend(error);return;
    }
    gsap.registerPlugin(ScrollTrigger);
    var registry=Array.from(svg.querySelectorAll('[data-build-id]')).map(function(el) {
      var length=0;
      if(typeof el.getTotalLength==='function') {
        length=el.getTotalLength();el.removeAttribute('pathLength');el.style.setProperty('--length',length.toFixed(3));
      }
      return {id:el.dataset.buildId,chapter:el.dataset.chapter,type:el.dataset.type,order:Number(el.dataset.order),group:el.closest('[data-grp]') ? el.closest('[data-grp]').dataset.grp : 'complete',start:parseFloat(el.style.getPropertyValue('--s')),end:parseFloat(el.style.getPropertyValue('--e')),length:length,element:el};
    });
    var cardEls=EXP.map(function(e) { return svg.querySelector('[data-card="'+e.id+'"]'); });
    var nodes=Array.from(svg.querySelectorAll('.node'));
    var clock={progress:0}, master=null, active=-1, highlighted=null;
    var restoredProgress=null;
    try {
      var navigation=performance.getEntriesByType('navigation')[0];
      if(navigation && navigation.type==='reload') {
        var saved=sessionStorage.getItem('delta.architecture.scroll');
        if(saved!==null) restoredProgress=Math.min(1,Math.max(0,Number(saved)));
      }
    } catch(e) {}
    function savePosition() {
      if(!master || !master.scrollTrigger) return;
      var t=master.scrollTrigger;
      try {
        if(window.scrollY>=t.start && window.scrollY<=t.end+1) sessionStorage.setItem('delta.architecture.scroll',String(clock.progress));
        else sessionStorage.removeItem('delta.architecture.scroll');
      } catch(e) {}
    }
    window.addEventListener('pagehide',savePosition);
    function chapterAt(p) {
      for(var j=12;j>=0;j--) if(p>=CH[CHAPTER_IDS[j]][0]-1e-7) return j;
      return 0;
    }
    function clearHighlight() {
      svg.querySelectorAll('.is-highlighted,.connector-muted').forEach(function(el){el.classList.remove('is-highlighted','connector-muted');});
      highlighted=null;tooltip.textContent='';
    }
    function highlight(cardEl) {
      if(!cardEl || !cardEl.classList.contains('ready')) return;
      clearHighlight();highlighted=cardEl;
      var index=cardEls.indexOf(cardEl), e=EXP[index];
      cardEl.classList.add('is-highlighted');
      svg.querySelector('[data-expansion="'+e.id+'"]').classList.add('is-highlighted');
      var nodeIndex=[6,5,3,1,2,4][index];nodes[nodeIndex].classList.add('is-highlighted');
      svg.querySelectorAll('.conn,.link').forEach(function(el) {
        var end=parseFloat(el.style.getPropertyValue('--e'));
        if(end<=clock.progress && !el.closest('.is-highlighted')) el.classList.add('connector-muted');
      });
      tooltip.textContent=e.name+' / connected to '+e.title;
    }
    function updateState(p,reduced) {
      clock.progress=p;
      var next=chapterAt(p);svg.dataset.progress=p.toFixed(6);flow.dataset.chapter=CHAPTER_IDS[next];
      if(next!==active || reduced) {
        panels.forEach(function(panel,i) {
          var on=reduced || i===next;panel.inert=!on;panel.setAttribute('aria-hidden',on?'false':'true');panel.classList.toggle('active',on);
        });active=next;
        for(var i=0;i<ticks.length;i++)ticks[i].className=i<=next?'active':'';
      }
      cardEls.forEach(function(el,i) {
        var ready=reduced || p>=CH[EXP[i].ch][0]+(CH[EXP[i].ch][1]-CH[EXP[i].ch][0])*.94;
        el.classList.toggle('ready',ready);el.setAttribute('tabindex',ready?'0':'-1');el.setAttribute('aria-hidden',ready?'false':'true');
      });
      nodes.forEach(function(el) { el.classList.toggle('ready',reduced || p>=parseFloat(el.style.getPropertyValue('--e'))); });
      if(highlighted && !highlighted.classList.contains('ready')) clearHighlight();
    }
    svg.addEventListener('pointerover',function(ev) { highlight(ev.target.closest('[data-card]')); });
    svg.addEventListener('pointerout',function(ev) { var el=ev.target.closest('[data-card]');if(el && !el.contains(ev.relatedTarget)) clearHighlight(); });
    svg.addEventListener('focusin',function(ev) { highlight(ev.target.closest('[data-card]')); });
    svg.addEventListener('focusout',clearHighlight);
    svg.addEventListener('click',function(ev) { highlight(ev.target.closest('[data-card]')); });
    svg.addEventListener('keydown',function(ev) { if(ev.key==='Escape') clearHighlight();if(ev.key==='Enter' || ev.key===' '){ev.preventDefault();highlight(ev.target.closest('[data-card]'));} });
    var media=gsap.matchMedia();
    media.add({reduced:'(prefers-reduced-motion: reduce)',motion:'(prefers-reduced-motion: no-preference)'},function(ctx) {
      var reduced=ctx.conditions.reduced;
      flow.classList.toggle('reduced',reduced);active=-1;clearHighlight();
      if(reduced) {
        gsap.set(registry.map(function(item){return item.element;}),{'--k':1});
        gsap.set(panels,{autoAlpha:1,y:0});
        gsap.set(copy.querySelector('.da-cta'),{autoAlpha:1});
        updateState(1,true);master=null;
        return;
      }
      gsap.set(registry.map(function(item){return item.element;}),{'--k':0});
      gsap.set(panels,{autoAlpha:0,y:12});gsap.set(panels[0],{autoAlpha:1,y:0});
      var cta=copy.querySelector('.da-cta');gsap.set(cta,{autoAlpha:0});
      clock.progress=0;
      master=gsap.timeline({defaults:{ease:'none'},onUpdate:function(){updateState(master.time()/100,false);},scrollTrigger:{id:'delta-architecture',trigger:flow,pin:stage,start:'top top',end:function(){return '+='+window.innerHeight*(window.innerWidth<=700?7:window.innerWidth<=1100?10:12);},scrub:true,invalidateOnRefresh:true,anticipatePin:1}});
      CHAPTER_IDS.forEach(function(id,index) {
        var span=CH[id],start=span[0]*100,duration=(span[1]-span[0])*100;
        var child=gsap.timeline({defaults:{ease:'none'}});
        child.to({}, {duration:duration},0); // Explicitly calibrate even empty holds.
        registry.filter(function(item){return item.chapter===id;}).forEach(function(item) {
          child.to(item.element,{'--k':1,duration:(item.end-item.start)*100},(item.start-span[0])*100);
        });
        if(index>0) {
          child.to(panels[index-1],{autoAlpha:0,y:-12,duration:duration*.055},0);
          child.to(panels[index],{autoAlpha:1,y:0,duration:duration*.065},duration*.025);
        }
        if(index===12) child.to(cta,{autoAlpha:1,duration:duration*.08},duration*.84);
        master.addLabel(id,start);master.add(child,start);master.addLabel(id+'.end',span[1]*100);
      });
      master.scrollTrigger.refresh();
      if(restoredProgress!==null) {
        var trigger=master.scrollTrigger;
        window.scrollTo(0,trigger.start+(trigger.end-trigger.start)*restoredProgress);
        ScrollTrigger.update();master.progress(restoredProgress);
      } else master.progress(master.scrollTrigger.progress);
      updateState(master.progress(),false);
      return function(){clearHighlight();master=null;};
    });
    function refresh(){
      ScrollTrigger.refresh();
      if(restoredProgress!==null && master && master.scrollTrigger) {
        var trigger=master.scrollTrigger;
        window.scrollTo(0,trigger.start+(trigger.end-trigger.start)*restoredProgress);
        ScrollTrigger.update();master.progress(restoredProgress);updateState(restoredProgress,false);restoredProgress=null;
      }
    }
    if(document.fonts) document.fonts.ready.then(refresh);
    window.addEventListener('load',refresh,{once:true});
    window.addEventListener('pageshow',refresh);
    window.__deltaArchitecture={chapters:CH,registry:registry,get master(){return master;},get progress(){return clock.progress;},dispose:function(){media.revert();window.removeEventListener('pageshow',refresh);window.removeEventListener('pagehide',savePosition);flow.remove();styleEl.remove();delete window.__deltaArchitecture;}};
  }

  function startWhenReady(){
    if(location.pathname!=='/' && location.pathname!=='/index.html') return;
    var root=document.getElementById("root");
    if(root&&root.querySelector(".relative.z-10 > section")){build();return;}
    if(root&&"MutationObserver" in window){
      var wait=new MutationObserver(function(){if(root.querySelector(".relative.z-10 > section")){wait.disconnect();build();}});
      wait.observe(root,{childList:true,subtree:true});
      window.setTimeout(function(){wait.disconnect();if(root.querySelector('.relative.z-10 > section') && !document.getElementById('dg-architecture-flow'))build();},5000);
    } else window.setTimeout(build,500);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",startWhenReady,{once:true});
  else startWhenReady();
})();
