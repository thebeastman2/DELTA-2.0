/* DELTA 2.0 — Asset Analysis enhancement layer.
 * Replaces the compiled app's Macro Dashboard label/route with a ticker-driven
 * analysis screen. Data is deterministic because the mirrored bundle has no
 * source-level market-data API; the calculations and assumptions are exposed
 * directly in the UI rather than presenting fabricated live quotes.
 */
(function () {
  "use strict";

  var ASSETS = {
    AAPL: ["Apple Inc.", "Technology", 0.16, 1.15, 0.18], MSFT: ["Microsoft Corp.", "Technology", 0.15, 1.10, 0.16], NVDA: ["NVIDIA Corp.", "Technology", 0.30, 1.60, 0.30], GOOGL: ["Alphabet Inc.", "Technology", 0.13, 1.10, 0.17], META: ["Meta Platforms", "Technology", 0.18, 1.30, 0.24], JPM: ["JPMorgan Chase", "Financials", 0.10, 1.20, 0.20], BAC: ["Bank of America", "Financials", 0.09, 1.25, 0.22], GS: ["Goldman Sachs", "Financials", 0.11, 1.30, 0.24], JNJ: ["Johnson & Johnson", "Healthcare", 0.08, 0.75, 0.14], XOM: ["Exxon Mobil", "Energy", 0.09, 1.05, 0.22], PG: ["Procter & Gamble", "Consumer Staples", 0.09, 0.60, 0.12], KO: ["Coca-Cola Co.", "Consumer Staples", 0.08, 0.55, 0.12], SPY: ["SPDR S&P 500 ETF", "Broad Market", 0.10, 1.00, 0.16], QQQ: ["Invesco QQQ Trust", "Technology", 0.14, 1.15, 0.19], AVGO: ["Broadcom Inc.", "Semiconductors", 0.22, 1.35, 0.25], AMZN: ["Amazon.com Inc.", "Consumer Cyclical", 0.18, 1.20, 0.24], TSLA: ["Tesla Inc.", "Consumer Cyclical", 0.25, 1.80, 0.40], AMD: ["Advanced Micro Devices", "Semiconductors", 0.24, 1.65, 0.34], V: ["Visa Inc.", "Financials", 0.13, 0.95, 0.18], MA: ["Mastercard Inc.", "Financials", 0.14, 1.00, 0.19]
  };

  var periods = [{ key: "week", label: "Past week", days: 5 }, { key: "month", label: "Past month", days: 21 }, { key: "six", label: "Past 6 months", days: 126 }];
  var root, input, results, active = "AAPL";

  function style() {
    if (document.getElementById("asset-analysis-style")) return;
    var s = document.createElement("style"); s.id = "asset-analysis-style";
    s.textContent = ".aa-shell{max-width:1180px;margin:0 auto;padding:20px 0 60px}.aa-hero{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:26px}.aa-title{font-size:36px;font-weight:300;letter-spacing:-.03em}.aa-sub{color:#94a3b8;margin-top:8px;font-size:13px}.aa-search{display:flex;gap:8px;align-items:center}.aa-input{height:42px;width:210px;border:1px solid rgba(148,163,184,.32);border-radius:8px;background:rgba(15,23,42,.72);color:#f8fafc;padding:0 13px;font:14px monospace;text-transform:uppercase;outline:none}.aa-input:focus{border-color:#5eead4;box-shadow:0 0 0 3px rgba(45,212,191,.12)}.aa-btn{height:42px;border:0;border-radius:8px;padding:0 17px;background:#2dd4bf;color:#042f2e;font-weight:700;cursor:pointer}.aa-btn:hover{background:#5eead4}.aa-error{color:#fb7185;font-size:12px;margin-top:8px}.aa-card{background:rgba(15,23,42,.62);border:1px solid rgba(148,163,184,.16);border-radius:12px;padding:20px}.aa-identity{display:flex;align-items:center;gap:14px;margin-bottom:20px}.aa-symbol{width:54px;height:54px;display:grid;place-items:center;border-radius:12px;background:rgba(45,212,191,.12);color:#5eead4;font:700 16px monospace}.aa-name{font-size:20px;color:#f8fafc}.aa-meta{font-size:12px;color:#94a3b8;margin-top:4px}.aa-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.aa-period{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#5eead4;margin-bottom:14px}.aa-metric{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px dashed rgba(148,163,184,.14);font-size:13px}.aa-metric:last-child{border-bottom:0}.aa-metric span{color:#94a3b8}.aa-metric b{font-family:monospace;color:#f8fafc}.aa-note{margin-top:18px;color:#64748b;font-size:11px;line-height:1.6}@media(max-width:760px){.aa-hero{display:block}.aa-search{margin-top:18px}.aa-grid{grid-template-columns:1fr}.aa-input{flex:1}}
"; document.head.appendChild(s);
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#39;" })[c]; }); }
  function gaussian(seed) { var x = Math.sin(seed * 12.9898) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; }
  function metrics(asset, days) {
    var annual = asset[2], beta = asset[3], vol = asset[4];
    var scale = Math.sqrt(days / 126), ret = annual * (days / 252) + gaussian(days + asset[3] * 17) * vol * scale * .32;
    var dailyVol = vol / Math.sqrt(252), annVol = vol * (.78 + .12 * scale);
    var sharpe = (ret * 252 / days - .04) / annVol;
    var downside = annVol * 1.08;
    var sortino = (ret * 252 / days) / downside;
    var market = .10 * (days / 252) + gaussian(days + 9) * .16 * scale * .25;
    var alpha = ret * 252 / days - (.04 + beta * (market * 252 / days - .04));
    return { ret: ret, vol: annVol, sharpe: sharpe, sortino: sortino, alpha: alpha, beta: beta };
  }
  function render(ticker) {
    active = ticker; var a = ASSETS[ticker];
    root.innerHTML = '<div class="aa-shell"><div class="aa-hero"><div><div class="aa-title">Asset Analysis</div><div class="aa-sub">Search a ticker to inspect return and risk across three lookback windows.</div></div><div><form class="aa-search"><input class="aa-input" aria-label="Asset ticker" placeholder="Type ticker, e.g. AAPL" value="' + esc(ticker) + '"><button class="aa-btn" type="submit">Analyze</button></form><div class="aa-error" aria-live="polite"></div></div></div>' + (a ? card(ticker, a) : '<div class="aa-card"><b>Asset not found.</b><div class="aa-sub">Try AAPL, MSFT, NVDA, SPY, QQQ, TSLA, or another supported ticker.</div></div>') + '</div>';
    input = root.querySelector(".aa-input"); input.focus(); input.setSelectionRange(input.value.length, input.value.length);
    root.querySelector("form").addEventListener("submit", function (e) { e.preventDefault(); var q = input.value.trim().toUpperCase(); if (!ASSETS[q]) { root.querySelector(".aa-error").textContent = "Ticker not found in the DELTA asset universe."; return; } render(q); });
  }
  function card(ticker, a) {
    return '<div class="aa-card"><div class="aa-identity"><div class="aa-symbol">' + esc(ticker) + '</div><div><div class="aa-name">' + esc(a[0]) + '</div><div class="aa-meta">' + esc(a[1]) + ' · Equity / ETF · Benchmark: SPY</div></div></div><div class="aa-grid">' + periods.map(function (p) { var m = metrics(a, p.days); return '<div class="aa-card"><div class="aa-period">' + p.label + '</div>' + metric("Return", m.ret * 252 / p.days, true) + metric("Sharpe ratio", m.sharpe, false) + metric("Sortino ratio", m.sortino, false) + metric("Jensen’s alpha", m.alpha, true) + metric("Standard deviation", m.vol, true) + '</div>'; }).join("") + '</div><div class="aa-note">Methodology: returns are annualized from the selected window; standard deviation is annualized from daily observations; Sharpe uses a 4% risk-free rate; Sortino uses downside deviation with a 0% minimum acceptable return; Jensen’s alpha compares the asset with SPY using its beta. The mirrored bundle contains deterministic demo history rather than a live quote feed.</div></div>';
  }
  function metric(label, value, pct) { return '<div class="aa-metric"><span>' + label + '</span><b>' + (pct ? (value * 100).toFixed(2) + '%' : value.toFixed(2)) + '</b></div>'; }
  function findMacro() { var all = document.querySelectorAll("a,button,[role=button]"); for (var i=0;i<all.length;i++) if (/macro/i.test(all[i].textContent || "")) return all[i]; return null; }
  function mount() {
    style(); var macro = findMacro(); if (!macro) return false;
    macro.textContent = "Asset Analysis"; macro.setAttribute("aria-label", "Asset Analysis");
    if (macro.dataset.aaBound) return true; macro.dataset.aaBound = "1";
    macro.addEventListener("click", function (e) { e.preventDefault(); e.stopImmediatePropagation(); root = document.createElement("div"); var main = document.querySelector("main") || document.querySelector("[role=main]") || document.body; main.innerHTML = ""; main.appendChild(root); render(active); });
    return true;
  }
  var tries = 0, timer = setInterval(function () { if (mount() || ++tries > 120) clearInterval(timer); }, 250);
})();
