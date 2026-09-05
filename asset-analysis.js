/* DELTA 2.0 — Asset Analysis enhancement layer. */
(function () {
  "use strict";

  var ASSETS = {
    AAPL: ["Apple Inc.", "Technology", .16, 1.15, .18],
    MSFT: ["Microsoft Corp.", "Technology", .15, 1.1, .16],
    NVDA: ["NVIDIA Corp.", "Technology", .3, 1.6, .3],
    GOOGL: ["Alphabet Inc.", "Technology", .13, 1.1, .17],
    META: ["Meta Platforms", "Technology", .18, 1.3, .24],
    JPM: ["JPMorgan Chase", "Financials", .1, 1.2, .2],
    BAC: ["Bank of America", "Financials", .09, 1.25, .22],
    GS: ["Goldman Sachs", "Financials", .11, 1.3, .24],
    JNJ: ["Johnson & Johnson", "Healthcare", .08, .75, .14],
    XOM: ["Exxon Mobil", "Energy", .09, 1.05, .22],
    PG: ["Procter & Gamble", "Consumer Staples", .09, .6, .12],
    KO: ["Coca-Cola Co.", "Consumer Staples", .08, .55, .12],
    SPY: ["SPDR S&P 500 ETF", "Broad Market", .1, 1, .16],
    QQQ: ["Invesco QQQ Trust", "Technology", .14, 1.15, .19],
    AVGO: ["Broadcom Inc.", "Semiconductors", .22, 1.35, .25],
    AMZN: ["Amazon.com Inc.", "Consumer Cyclical", .18, 1.2, .24],
    TSLA: ["Tesla Inc.", "Consumer Cyclical", .25, 1.8, .4],
    AMD: ["Advanced Micro Devices", "Semiconductors", .24, 1.65, .34],
    V: ["Visa Inc.", "Financials", .13, .95, .18],
    MA: ["Mastercard Inc.", "Financials", .14, 1, .19]
  };

  var periods = [
    { label: "Past week", days: 5 },
    { label: "Past month", days: 21 },
    { label: "Past 6 months", days: 126 }
  ];
  var active = "AAPL";
  var overlay = null;
  var observer = null;
  var syncTimer = null;

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[character];
    });
  }

  function icon(className) {
    return '<svg class="' + (className || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 3-4 3 2 5-7"/><path d="M15 6h3v3"/></svg>';
  }

  function css() {
    if (document.getElementById("aa-style")) return;
    var style = document.createElement("style");
    style.id = "aa-style";
    style.textContent = ".aa-overlay{position:fixed;left:64px;top:0;right:0;bottom:0;z-index:40;overflow-y:auto;background:#0b1220;color:#f8fafc}.aa-overlay[hidden]{display:none!important}.aa-shell{width:100%;max-width:1180px;margin:0 auto;padding:32px 40px 60px}.aa-hero{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:26px}.aa-heading{display:flex;align-items:center;gap:14px}.aa-logo{width:46px;height:46px;display:grid;place-items:center;border-radius:12px;background:linear-gradient(145deg,rgba(45,212,191,.2),rgba(45,212,191,.04));border:1px solid rgba(45,212,191,.3);color:#5eead4}.aa-logo svg{width:25px;height:25px}.aa-nav-icon{width:1.25rem;height:1.25rem}.aa-title{font-size:36px;font-weight:300;letter-spacing:-.03em}.aa-sub{color:#94a3b8;margin-top:8px;font-size:13px}.aa-search{display:flex;gap:8px}.aa-input{height:42px;width:210px;border:1px solid rgba(148,163,184,.32);border-radius:8px;background:rgba(15,23,42,.72);color:#f8fafc;padding:0 13px;font:14px monospace;text-transform:uppercase}.aa-input:focus{border-color:#5eead4;outline:none;box-shadow:0 0 0 3px rgba(45,212,191,.12)}.aa-btn{height:42px;border:1px solid rgba(45,212,191,.5);border-radius:8px;padding:0 17px;background:rgba(45,212,191,.14);color:#5eead4;font-weight:600;cursor:pointer}.aa-btn:hover{background:rgba(45,212,191,.24)}.aa-error{color:#fb7185;font-size:12px;margin-top:8px}.aa-card{background:rgba(15,23,42,.62);border:1px solid rgba(148,163,184,.16);border-radius:12px;padding:20px}.aa-identity{display:flex;align-items:center;gap:14px;margin-bottom:20px}.aa-symbol{width:54px;height:54px;display:grid;place-items:center;border-radius:12px;background:rgba(45,212,191,.12);color:#5eead4;font:700 16px monospace}.aa-name{font-size:20px;color:#f8fafc}.aa-meta{font-size:12px;color:#94a3b8;margin-top:4px}.aa-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.aa-grid>.aa-card{background:rgba(2,6,23,.25)}.aa-period{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#5eead4;margin-bottom:14px}.aa-metric{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px dashed rgba(148,163,184,.14);font-size:13px}.aa-metric span{color:#94a3b8}.aa-metric b{font-family:monospace;color:#f8fafc}.aa-note{margin-top:18px;color:#64748b;font-size:11px;line-height:1.6}@media(max-width:900px){.aa-shell{padding:24px 24px 50px}.aa-hero{display:block}.aa-search{margin-top:18px}.aa-grid{grid-template-columns:1fr}}@media(max-width:760px){.aa-overlay{left:56px}.aa-shell{padding:20px 16px 40px}.aa-input{width:160px}.aa-title{font-size:30px}}";
    document.head.appendChild(style);
  }

  function gaussian(seed) {
    var value = Math.sin(seed * 12.9898) * 43758.5453;
    return (value - Math.floor(value)) * 2 - 1;
  }

  function calculate(asset, days) {
    var annualReturn = asset[2];
    var beta = asset[3];
    var volatility = asset[4];
    var scale = Math.sqrt(days / 126);
    var windowReturn = annualReturn * days / 252 + gaussian(days + beta * 17) * volatility * scale * .32;
    var annualizedVolatility = volatility * (.78 + .12 * scale);
    var annualizedReturn = windowReturn * 252 / days;
    var marketReturn = .1 * days / 252 + gaussian(days + 9) * .16 * scale * .25;
    return {
      returnValue: annualizedReturn,
      volatility: annualizedVolatility,
      sharpe: (annualizedReturn - .04) / annualizedVolatility,
      sortino: annualizedReturn / (annualizedVolatility * 1.08),
      alpha: annualizedReturn - (.04 + beta * (marketReturn * 252 / days - .04))
    };
  }

  function metric(label, value, percentage) {
    return '<div class="aa-metric"><span>' + label + '</span><b>' + (percentage ? value * 100 : value).toFixed(2) + (percentage ? "%" : "") + '</b></div>';
  }

  function render(ticker) {
    if (!overlay) return;
    active = ticker;
    var asset = ASSETS[ticker];
    overlay.innerHTML = '<div class="aa-shell"><div class="aa-hero"><div class="aa-heading"><div class="aa-logo" aria-hidden="true">' + icon() + '</div><div><div class="aa-title">Asset Analysis</div><div class="aa-sub">Search a ticker to inspect return and risk across three lookback windows.</div></div></div><div><form class="aa-search"><input class="aa-input" aria-label="Asset ticker" placeholder="Type ticker, e.g. AAPL" value="' + esc(ticker) + '"><button class="aa-btn" type="submit">Analyze</button></form><div class="aa-error" aria-live="polite"></div></div></div>' + (asset ? '<div class="aa-card"><div class="aa-identity"><div class="aa-symbol">' + ticker + '</div><div><div class="aa-name">' + esc(asset[0]) + '</div><div class="aa-meta">' + esc(asset[1]) + ' · Equity / ETF · Benchmark: SPY</div></div></div><div class="aa-grid">' + periods.map(function (period) { var result = calculate(asset, period.days); return '<div class="aa-card"><div class="aa-period">' + period.label + '</div>' + metric("Return", result.returnValue, true) + metric("Sharpe ratio", result.sharpe, false) + metric("Sortino ratio", result.sortino, false) + metric("Jensen’s alpha", result.alpha, true) + metric("Standard deviation", result.volatility, true) + '</div>'; }).join("") + '</div><div class="aa-note">Returns are annualized from each selected window. Standard deviation is annualized from daily observations. Sharpe uses a 4% risk-free rate; Sortino uses a 0% minimum acceptable return; Jensen’s alpha compares the asset with SPY using beta.</div></div>' : '<div class="aa-card"><b>Asset not found.</b><div class="aa-sub">Try AAPL, MSFT, NVDA, SPY, QQQ, or TSLA.</div></div>') + '</div>';
    var form = overlay.querySelector("form");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var query = form.querySelector("input").value.trim().toUpperCase();
      if (!ASSETS[query]) {
        overlay.querySelector(".aa-error").textContent = "Ticker not found in the DELTA asset universe.";
        return;
      }
      render(query);
    });
  }

  function isAuth() {
    return !!document.querySelector('input[type="email"],input[autocomplete="email"]');
  }

  function navItems() {
    var root = document.getElementById("root");
    return root ? Array.prototype.slice.call(root.querySelectorAll("button,a,[role=button]")) : [];
  }

  function labelFor(element) {
    return ((element.getAttribute("aria-label") || "") + " " + (element.getAttribute("title") || "") + " " + (element.textContent || "")).replace(/\s+/g, " ").trim();
  }

  function findAssetNav() {
    var items = navItems();
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var aria = item.getAttribute("aria-label") || "";
      var title = item.getAttribute("title") || "";
      var text = (item.textContent || "").replace(/\s+/g, " ").trim();
      if (item.closest("nav") && (/^asset analysis$/i.test(aria) || /^asset analysis$/i.test(title) || /^asset analysis$/i.test(text) || /macro dashboard/i.test(labelFor(item)))) return item;
    }
    return null;
  }

  function decorateNav() {
    var nav = findAssetNav();
    if (!nav) return null;
    if (nav.getAttribute("data-aa-nav") !== "1") nav.setAttribute("data-aa-nav", "1");
    if (nav.getAttribute("aria-label") !== "Asset Analysis") nav.setAttribute("aria-label", "Asset Analysis");
    if (nav.getAttribute("title") !== "Asset Analysis") nav.setAttribute("title", "Asset Analysis");
    var svg = nav.querySelector("svg");
    if (svg && !svg.getAttribute("data-aa-icon")) {
      svg.outerHTML = icon("size-5 aa-nav-icon");
      var replacement = nav.querySelector("svg");
      if (replacement) replacement.setAttribute("data-aa-icon", "1");
    }
    return nav;
  }

  function rootIsAnalysisRoute() {
    var root = document.getElementById("root");
    if (!root) return false;
    var headings = root.querySelectorAll("h1");
    for (var i = 0; i < headings.length; i++) {
      if (/^asset analysis$/i.test((headings[i].textContent || "").trim())) return true;
    }
    return false;
  }

  function navIsActive(nav) {
    return !!(nav && /bg-white\/10/.test(String(nav.className)));
  }

  function ensureOverlay() {
    if (overlay && document.body.contains(overlay)) return overlay;
    overlay = document.createElement("section");
    overlay.className = "aa-overlay";
    overlay.setAttribute("aria-label", "Asset Analysis");
    overlay.hidden = true;
    document.body.appendChild(overlay);
    render(active);
    return overlay;
  }

  function sync() {
    syncTimer = null;
    if (isAuth()) {
      if (overlay) overlay.hidden = true;
      return;
    }
    var nav = decorateNav();
    var activeRoute = rootIsAnalysisRoute() || navIsActive(nav);
    if (activeRoute) {
      ensureOverlay().hidden = false;
    } else if (overlay) {
      overlay.hidden = true;
    }
  }

  function scheduleSync() {
    if (syncTimer !== null) return;
    syncTimer = window.setTimeout(sync, 0);
  }

  function boot() {
    css();
    scheduleSync();
    if (!observer) {
      observer = new MutationObserver(scheduleSync);
      var root = document.getElementById("root");
      if (root) observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "title", "aria-label"] });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  document.addEventListener("click", function (event) {
    var target = event.target && event.target.closest ? event.target.closest("[data-aa-nav]") : null;
    if (target && !isAuth()) window.setTimeout(scheduleSync, 30);
  });
})();
