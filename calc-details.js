/* Delta 2.0 — Calculation Details
 * Adds a "ƒx" button next to every computed metric (stat cards + table cells).
 * Clicking opens a modal showing the formula, a glossary of variables, and a
 * worked calculation using the numbers displayed on the page.
 *
 * This is an enhancement layer on top of the compiled app bundle — it never
 * touches app internals, only the rendered DOM.
 */
(function () {
  "use strict";

  /* ---------------- utilities ---------------- */

  function norm(s) {
    return String(s)
      .toLowerCase()
      .replace(/[\u00a0\u2009\u2013\u2014]/g, " ")
      .replace(/[^a-z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function parseNum(text) {
    if (text == null) return null;
    var t = String(text).trim();
    var m = t.match(/(-?[\d,]+\.?\d*)/);
    if (!m) return null;
    var n = parseFloat(m[1].replace(/,/g, ""));
    if (!isFinite(n)) return null;
    return { raw: t, value: n, isPct: /%/.test(t) };
  }

  function pct(x, d) {
    if (d == null) d = 2;
    return (x * 100).toFixed(d) + "%";
  }

  /* ---------------- metric registry ---------------- */

  var METRICS = {
    sharpe: {
      name: "Sharpe Ratio",
      formula:
        "SR = (R<sub>p</sub> &minus; R<sub>f</sub>) / &sigma;<sub>p</sub>",
      vars: [
        ["R<sub>p</sub>", "portfolio return (annualized)"],
        ["R<sub>f</sub>", "risk-free rate (e.g. T-bill yield)"],
        ["&sigma;<sub>p</sub>", "portfolio volatility (annualized)"],
      ],
      worked: function (ctx) {
        var lines = [];
        lines.push(
          "SR = (R<sub>p</sub> &minus; R<sub>f</sub>) / &sigma;<sub>p</sub>"
        );
        if (ctx.ret != null && ctx.vol != null) {
          var rf = ctx.ret - ctx.sr * ctx.vol;
          lines.push(
            "&nbsp;&nbsp;&nbsp;= (" +
              pct(ctx.ret, 2) +
              " &minus; R<sub>f</sub>) / " +
              pct(ctx.vol, 2) +
              " = " +
              ctx.sr.toFixed(4)
          );
          lines.push(
            "&rArr; R<sub>f</sub> = R<sub>p</sub> &minus; SR &times; &sigma;<sub>p</sub> = " +
              pct(ctx.ret, 2) +
              " &minus; " +
              ctx.sr.toFixed(4) +
              " &times; " +
              pct(ctx.vol, 2) +
              " &asymp; " +
              pct(rf, 2)
          );
          lines.push(
            "(with R<sub>f</sub> = 0, SR = " +
              pct(ctx.ret, 2) +
              " / " +
              pct(ctx.vol, 2) +
              " &asymp; " +
              (ctx.ret / ctx.vol).toFixed(4) +
              ")"
          );
        } else {
          lines.push(
            "Reported SR = <b>" +
              ctx.sr.toFixed(4) +
              "</b> — the engine computes it from the portfolio's annualized return and volatility (not shown on this card)."
          );
        }
        return lines;
      },
    },
    return: {
      name: "Portfolio Return",
      formula:
        "R<sub>p</sub> = (V<sub>end</sub> &minus; V<sub>start</sub>) / V<sub>start</sub>",
      vars: [
        ["V<sub>end</sub>", "portfolio value at end of period"],
        ["V<sub>start</sub>", "portfolio value at start of period"],
        ["R<sub>p</sub>", "annualized return of the portfolio"],
      ],
      worked: function (ctx) {
        return [
          "R<sub>p</sub> = (V<sub>end</sub> &minus; V<sub>start</sub>) / V<sub>start</sub>",
          "Reported R<sub>p</sub> = <b>" +
            ctx.raw +
            "</b>. The backtest engine compounds daily portfolio returns over the window and annualizes the result (geometric mean &times; 252 trading days).",
        ];
      },
    },
    volatility: {
      name: "Volatility",
      formula:
        "&sigma;<sub>ann</sub> = &sigma;<sub>daily</sub> &times; &radic;252",
      vars: [
        ["&sigma;<sub>daily</sub>", "standard deviation of daily returns"],
        ["&radic;252", "annualization factor (252 trading days/year)"],
        ["&sigma;<sub>ann</sub>", "annualized volatility"],
      ],
      worked: function (ctx) {
        var daily = ctx.vol / Math.sqrt(252);
        return [
          "&sigma;<sub>ann</sub> = &sigma;<sub>daily</sub> &times; &radic;252",
          "&sigma;<sub>daily</sub> = &sigma;<sub>ann</sub> / &radic;252 = " +
            pct(ctx.vol, 2) +
            " / 15.8745 &asymp; " +
            pct(daily, 2),
          "Reported annualized volatility = <b>" +
            ctx.raw +
            "</b>.",
        ];
      },
    },
    drawdown: {
      name: "Max Drawdown",
      formula:
        "MDD = max<sub>t</sub> [ (V<sub>peak</sub> &minus; V<sub>trough</sub>) / V<sub>peak</sub> ]",
      vars: [
        ["V<sub>peak</sub>", "highest portfolio value before the decline"],
        ["V<sub>trough</sub>", "lowest portfolio value during the decline"],
        ["MDD", "largest peak-to-trough decline over the window"],
      ],
      worked: function (ctx) {
        return [
          "MDD = max<sub>t</sub> [ (V<sub>peak</sub> &minus; V<sub>trough</sub>) / V<sub>peak</sub> ]",
          "Reported MDD = <b>" +
            ctx.raw +
            "</b> — the worst drawdown the engine found across the full backtest window.",
        ];
      },
    },
    sortino: {
      name: "Sortino Ratio",
      formula:
        "Sortino = (R<sub>p</sub> &minus; R<sub>f</sub>) / &sigma;<sub>d</sub>",
      vars: [
        ["R<sub>p</sub>", "portfolio return (annualized)"],
        ["R<sub>f</sub>", "risk-free rate"],
        ["&sigma;<sub>d</sub>", "downside deviation — volatility of returns below the target"],
      ],
      worked: function (ctx) {
        var lines = [
          "Sortino = (R<sub>p</sub> &minus; R<sub>f</sub>) / &sigma;<sub>d</sub>",
        ];
        if (ctx.ret != null) {
          var sd = (ctx.ret - 0) / ctx.sortino;
          lines.push(
            "Solving for downside deviation (with R<sub>f</sub> = 0): &sigma;<sub>d</sub> = R<sub>p</sub> / Sortino = " +
              pct(ctx.ret, 2) +
              " / " +
              ctx.sortino.toFixed(4) +
              " &asymp; " +
              pct(sd, 2)
          );
        }
        lines.push(
          "Reported Sortino = <b>" +
            ctx.sortino.toFixed(4) +
            "</b> — like Sharpe but penalizes only downside moves."
        );
        return lines;
      },
    },
    calmar: {
      name: "Calmar Ratio",
      formula: "Calmar = CAGR / MDD",
      vars: [
        ["CAGR", "compound annual growth rate of the portfolio"],
        ["MDD", "max drawdown (as a positive number)"],
      ],
      worked: function (ctx) {
        return [
          "Calmar = CAGR / MDD",
          "Reported Calmar = <b>" +
            ctx.calmar.toFixed(4) +
            "</b>. Higher is better — return per unit of worst-case loss.",
        ];
      },
    },
    var: {
      name: "Value at Risk (VaR)",
      formula:
        "VaR<sub>&alpha;</sub> = &minus;( &mu;<sub>p</sub> + z<sub>&alpha;</sub> &sigma;<sub>p</sub> )",
      vars: [
        ["&mu;<sub>p</sub>", "expected portfolio return"],
        ["&sigma;<sub>p</sub>", "portfolio volatility"],
        ["z<sub>&alpha;</sub>", "z-score of the confidence level (&alpha;=95% &rarr; 1.645)"],
      ],
      worked: function (ctx) {
        return [
          "VaR<sub>95%</sub> = &minus;( &mu;<sub>p</sub> + 1.645 &sigma;<sub>p</sub> )",
          "Reported VaR = <b>" +
            ctx.raw +
            "</b> — the loss not expected to be exceeded 95% of the time (parametric method).",
        ];
      },
    },
    cvar: {
      name: "CVaR (Expected Shortfall)",
      formula:
        "CVaR<sub>&alpha;</sub> = &minus;( &mu;<sub>p</sub> &minus; &sigma;<sub>p</sub> &middot; &phi;(z<sub>&alpha;</sub>) / (1&minus;&alpha;) )",
      vars: [
        ["&mu;<sub>p</sub>", "expected portfolio return"],
        ["&sigma;<sub>p</sub>", "portfolio volatility"],
        ["&phi;(z)", "standard normal density at the quantile"],
        ["&alpha;", "confidence level (e.g. 0.95)"],
      ],
      worked: function (ctx) {
        return [
          "CVaR<sub>95%</sub> = &minus;( &mu;<sub>p</sub> &minus; &sigma;<sub>p</sub> &middot; &phi;(1.645) / 0.05 )",
          "Reported CVaR = <b>" +
            ctx.raw +
            "</b> — the average loss in the worst 5% of scenarios (tail risk).",
        ];
      },
    },
    alpha: {
      name: "Alpha",
      formula: "&alpha; = R<sub>p</sub> &minus; [ R<sub>f</sub> + &beta;(R<sub>m</sub> &minus; R<sub>f</sub>) ]",
      vars: [
        ["R<sub>p</sub>", "portfolio return"],
        ["R<sub>m</sub>", "market (benchmark) return"],
        ["&beta;", "portfolio beta vs the benchmark"],
        ["R<sub>f</sub>", "risk-free rate"],
      ],
      worked: function (ctx) {
        return [
          "&alpha; = R<sub>p</sub> &minus; [ R<sub>f</sub> + &beta;(R<sub>m</sub> &minus; R<sub>f</sub>) ]",
          "Reported alpha = <b>" +
            ctx.raw +
            "</b> — the return earned beyond what the benchmark beta predicts (Jensen's alpha).",
        ];
      },
    },
    beta: {
      name: "Beta",
      formula: "&beta; = Cov(R<sub>p</sub>, R<sub>m</sub>) / Var(R<sub>m</sub>)",
      vars: [
        ["Cov(R<sub>p</sub>, R<sub>m</sub>)", "covariance of portfolio and market returns"],
        ["Var(R<sub>m</sub>)", "variance of market returns"],
      ],
      worked: function (ctx) {
        return [
          "&beta; = Cov(R<sub>p</sub>, R<sub>m</sub>) / Var(R<sub>m</sub>)",
          "Reported beta = <b>" + ctx.raw + "</b> — sensitivity of the portfolio to the benchmark.",
        ];
      },
    },
    information: {
      name: "Information Ratio",
      formula: "IR = (R<sub>p</sub> &minus; R<sub>b</sub>) / TE",
      vars: [
        ["R<sub>p</sub> &minus; R<sub>b</sub>", "active return vs benchmark"],
        ["TE", "tracking error (volatility of active returns)"],
      ],
      worked: function (ctx) {
        return [
          "IR = (R<sub>p</sub> &minus; R<sub>b</sub>) / TE",
          "Reported IR = <b>" + ctx.raw + "</b> — active return per unit of tracking error.",
        ];
      },
    },
    hhi: {
      name: "Herfindahl–Hirschman Index",
      formula: "HHI = &Sigma;<sub>i</sub> w<sub>i</sub><sup>2</sup>",
      vars: [
        ["w<sub>i</sub>", "weight of asset i in the portfolio"],
        ["HHI", "concentration measure (1/N = fully diversified)"],
      ],
      worked: function (ctx) {
        return [
          "HHI = &Sigma;<sub>i</sub> w<sub>i</sub><sup>2</sup>",
          "Reported HHI = <b>" + ctx.raw + "</b> — the sum of squared weights. Lower means more diversified.",
        ];
      },
    },
    effective: {
      name: "Effective Holdings",
      formula: "N<sub>eff</sub> = 1 / &Sigma;<sub>i</sub> w<sub>i</sub><sup>2</sup>",
      vars: [
        ["w<sub>i</sub>", "weight of asset i"],
        ["N<sub>eff</sub>", "equivalent number of equally-weighted holdings"],
      ],
      worked: function (ctx) {
        return [
          "N<sub>eff</sub> = 1 / &Sigma;<sub>i</sub> w<sub>i</sub><sup>2</sup>",
          "Reported effective holdings = <b>" + ctx.raw + "</b>.",
        ];
      },
    },
    turnover: {
      name: "Turnover",
      formula: "Turnover = (1/2) &Sigma;<sub>i</sub> |w<sub>i,t</sub> &minus; w<sub>i,t&minus;1</sub>|",
      vars: [
        ["w<sub>i,t</sub>", "weight of asset i at rebalance t"],
        ["w<sub>i,t&minus;1</sub>", "weight of asset i at the previous rebalance"],
      ],
      worked: function (ctx) {
        return [
          "Turnover = (1/2) &Sigma;<sub>i</sub> |w<sub>i,t</sub> &minus; w<sub>i,t&minus;1</sub>|",
          "Reported turnover = <b>" + ctx.raw + "</b> — half the total weight changed each rebalance.",
        ];
      },
    },
  };

  var LABEL_MAP = {
    sharpe: ["sharpe", "sharpe ratio", "last sharpe ratio"],
    return: ["return", "portfolio return", "annual return", "cumulative return", "expected return", "total return"],
    volatility: ["volatility", "annualized volatility", "portfolio volatility", "std dev", "standard deviation"],
    drawdown: ["max drawdown", "maximum drawdown", "drawdown"],
    sortino: ["sortino", "sortino ratio"],
    calmar: ["calmar", "calmar ratio"],
    var: ["var", "value at risk", "var 95", "var95"],
    cvar: ["cvar", "conditional var", "expected shortfall"],
    alpha: ["alpha", "annualized alpha"],
    beta: ["beta"],
    information: ["information ratio", "info ratio"],
    hhi: ["hhi", "herfindahl", "herfindahl hirschman"],
    effective: ["effective holdings", "effective n"],
    turnover: ["turnover"],
  };

  var LABEL_TO_METRIC = {};
  Object.keys(LABEL_MAP).forEach(function (key) {
    LABEL_MAP[key].forEach(function (label) {
      LABEL_TO_METRIC[norm(label)] = key;
    });
  });

  /* ---------------- button + modal ---------------- */

  var styleEl = null;
  function ensureStyles() {
    if (styleEl) return;
    styleEl = document.createElement("style");
    styleEl.textContent =
      ".calc-btn{display:inline-flex;align-items:center;justify-content:center;margin-left:8px;min-width:22px;height:22px;padding:0 6px;border:1px solid rgba(45,212,191,.35);border-radius:5px;background:rgba(45,212,191,.08);color:#5eead4;font-family:Georgia,serif;font-style:italic;font-size:12px;line-height:1;cursor:pointer;vertical-align:middle;transition:all .15s ease;user-select:none}" +
      ".calc-btn:hover{background:rgba(45,212,191,.22);border-color:rgba(45,212,191,.7);box-shadow:0 0 10px rgba(45,212,191,.25)}" +
      ".calc-btn:active{transform:scale(.92)}" +
      "#calc-overlay{position:fixed;inset:0;z-index:2147483000;background:rgba(3,6,16,.78);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:24px}" +
      "#calc-modal{width:min(640px,100%);max-height:86vh;overflow-y:auto;background:#0a1120;border:1px solid rgba(94,234,212,.25);border-radius:14px;box-shadow:0 24px 80px rgba(0,0,0,.6);color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}" +
      "#calc-modal .calc-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(148,163,184,.15)}" +
      "#calc-modal .calc-title{font-size:15px;font-weight:600;color:#f1f5f9;letter-spacing:.01em}" +
      "#calc-modal .calc-close{background:transparent;border:1px solid rgba(148,163,184,.3);color:#94a3b8;border-radius:6px;width:26px;height:26px;font-size:14px;line-height:1;cursor:pointer}" +
      "#calc-modal .calc-close:hover{color:#f1f5f9;border-color:#94a3b8}" +
      "#calc-modal .calc-body{padding:20px}" +
      "#calc-modal .calc-section{margin-bottom:18px}" +
      "#calc-modal .calc-section:last-child{margin-bottom:0}" +
      "#calc-modal .calc-label{font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#5eead4;margin-bottom:8px}" +
      "#calc-modal .calc-formula{font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:19px;color:#a5f3fc;background:rgba(45,212,191,.07);border:1px solid rgba(45,212,191,.22);border-radius:10px;padding:14px 16px;line-height:1.6;overflow-x:auto}" +
      "#calc-modal .calc-var{display:flex;gap:10px;padding:7px 0;border-bottom:1px dashed rgba(148,163,184,.12);font-size:13px}" +
      "#calc-modal .calc-var:last-child{border-bottom:none}" +
      "#calc-modal .calc-var b{font-family:'SFMono-Regular',Consolas,monospace;font-weight:600;color:#f8fafc;min-width:52px}" +
      "#calc-modal .calc-var span{color:#94a3b8}" +
      "#calc-modal .calc-steps{font-family:'SFMono-Regular',Consolas,monospace;font-size:13px;line-height:1.9;color:#cbd5e1;background:rgba(148,163,184,.05);border:1px solid rgba(148,163,184,.15);border-radius:10px;padding:14px 16px;overflow-x:auto;white-space:nowrap}" +
      "#calc-modal .calc-steps b{color:#f8fafc;font-weight:600}" +
      "#calc-modal .calc-foot{padding:10px 20px 14px;font-size:11px;color:#64748b;border-top:1px solid rgba(148,163,184,.12)}";
    document.head.appendChild(styleEl);
  }

  var modal = null;
  function openModal(metric, workedLines, rawValue) {
    ensureStyles();
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "calc-overlay";
      modal.addEventListener("click", function (e) {
        if (e.target === modal) closeModal();
      });
      document.body.appendChild(modal);
    }
    var vars = metric.vars
      .map(function (v) {
        return (
          '<div class="calc-var"><b>' +
          v[0] +
          "</b><span>" +
          v[1] +
          "</span></div>"
        );
      })
      .join("");
    var steps = workedLines
      .map(function (l) {
        return "<div>" + l + "</div>";
      })
      .join("");
    modal.innerHTML =
      '<div id="calc-modal" role="dialog" aria-label="' +
      metric.name +
      ' calculation">' +
      '<div class="calc-head"><div class="calc-title">' +
      metric.name +
      (rawValue ? ' &middot; ' + rawValue : "") +
      '</div><button class="calc-close" aria-label="Close">&#10005;</button></div>' +
      '<div class="calc-body">' +
      '<div class="calc-section"><div class="calc-label">Formula</div><div class="calc-formula">' +
      metric.formula +
      "</div></div>" +
      '<div class="calc-section"><div class="calc-label">Variables</div>' +
      vars +
      "</div>" +
      '<div class="calc-section"><div class="calc-label">Worked calculation</div><div class="calc-steps">' +
      steps +
      "</div></div>" +
      "</div>" +
      '<div class="calc-foot">Numbers above are read from the page &mdash; formulas are the standard definitions used by the DELTA engines.</div>' +
      "</div>";
    var close = modal.querySelector(".calc-close");
    close.addEventListener("click", closeModal);
    var prevFocus = document.activeElement;
    close.focus();
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal && modal.isConnected) {
        closeModal();
        if (prevFocus && prevFocus.focus) prevFocus.focus();
      }
    });
  }

  function closeModal() {
    if (modal) modal.remove();
  }

  function makeButton(metric, ctx, rawValue) {
    var btn = document.createElement("button");
    btn.className = "calc-btn";
    btn.type = "button";
    btn.title = "See the full calculation";
    btn.textContent = "ƒx";
    btn.setAttribute("data-calc-btn", "1");
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      openModal(metric, metric.worked(ctx), rawValue);
    });
    return btn;
  }

  /* ---------------- scanning ---------------- */

  function metricForLabel(text) {
    return LABEL_TO_METRIC[norm(text)];
  }

  function scan() {
    if (!document.body) return;
    ensureStyles();

    /* 1) stat / metric cards: <p> label + value in the same card */
    var ps = document.querySelectorAll("p");
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i];
      if (p.closest("[data-calc-btn]")) continue;
      var key = metricForLabel(p.textContent);
      if (!key) continue;
      // value lives in the card body, next to the label row
      var card = p.closest(".delta-card");
      if (!card) card = p.parentElement ? p.parentElement.parentElement : null;
      if (!card) continue;
      if (card.querySelector("[data-calc-btn]")) continue;
      var valueEl = null;
      var cands = card.querySelectorAll("span, div, p, b");
      for (var j = 0; j < cands.length; j++) {
        var c = cands[j];
        var num = parseNum(c.textContent);
        if (num && c.children.length === 0 && c.textContent.trim() === num.raw) {
          valueEl = c;
          break;
        }
      }
      if (!valueEl) continue;
      // context: the metric value itself; for sharpe cards there is no R/σ
      var ctx = buildCtx({}, key, valueEl, num);
      var btn = makeButton(METRICS[key], ctx, num.raw);
      var row = valueEl.parentElement;
      if (row) row.appendChild(btn);
      else valueEl.parentNode.insertBefore(btn, valueEl.nextSibling);
    }

    /* 2) tables: numeric cells under metric headers */
    var tables = document.querySelectorAll("table");
    for (var t = 0; t < tables.length; t++) {
      var table = tables[t];
      var thead = table.querySelector("thead");
      if (!thead) continue;
      var headerCells = Array.prototype.slice.call(
        thead.querySelectorAll("th")
      );
      var colMetrics = headerCells.map(function (th) {
        return metricForLabel(th.textContent);
      });
      var rows = table.querySelectorAll("tbody tr");
      for (var r = 0; r < rows.length; r++) {
        var row = rows[r];
        var cells = Array.prototype.slice.call(row.querySelectorAll("td"));
        if (!cells.length) continue;
        // build row context: header -> value
        var rowCtx = {};
        for (var ci = 0; ci < cells.length && ci < colMetrics.length; ci++) {
          var cellNum = parseNum(cells[ci].textContent);
          if (cellNum && colMetrics[ci]) {
            rowCtx[colMetrics[ci]] = cellNum.isPct
              ? cellNum.value / 100
              : cellNum.value;
            rowCtx[colMetrics[ci] + "_raw"] = cellNum.raw;
          }
        }
        for (var k = 0; k < cells.length && k < colMetrics.length; k++) {
          var key2 = colMetrics[k];
          if (!key2) continue;
          var cell = cells[k];
          if (cell.querySelector("[data-calc-btn]")) continue;
          var cellNum2 = parseNum(cell.textContent);
          if (!cellNum2) continue;
          var ctx2 = buildCtx(rowCtx, key2, cell, cellNum2);
          var btn2 = makeButton(METRICS[key2], ctx2, cellNum2.raw);
          var wrap = document.createElement("span");
          wrap.style.cssText =
            "display:inline-flex;align-items:center;justify-content:flex-end;gap:4px;";
          var txt = document.createElement("span");
          txt.textContent = cellNum2.raw;
          wrap.appendChild(txt);
          wrap.appendChild(btn2);
          cell.textContent = "";
          cell.appendChild(wrap);
        }
      }
    }
  }

  function buildCtx(rowCtx, key, el, num) {
    var ctx = {
      raw: num.raw,
      value: num.isPct ? num.value / 100 : num.value,
    };
    switch (key) {
      case "sharpe":
        ctx.sr = num.isPct ? num.value / 100 : num.value;
        ctx.ret = rowCtx.return != null ? rowCtx.return : null;
        ctx.vol = rowCtx.volatility != null ? rowCtx.volatility : null;
        break;
      case "return":
        ctx.ret = num.isPct ? num.value / 100 : num.value;
        break;
      case "volatility":
        ctx.vol = num.isPct ? num.value / 100 : num.value;
        break;
      case "sortino":
        ctx.sortino = num.isPct ? num.value / 100 : num.value;
        ctx.ret = rowCtx.return != null ? rowCtx.return : null;
        break;
      case "calmar":
        ctx.calmar = num.isPct ? num.value / 100 : num.value;
        break;
    }
    return ctx;
  }

  /* ---------------- boot ---------------- */

  var scheduled = false;
  function scheduleScan() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(function () {
      scheduled = false;
      try {
        scan();
      } catch (err) {
        /* never break the host app */
      }
    }, 250);
  }

  if (document.body) {
    scheduleScan();
  }
  document.addEventListener("DOMContentLoaded", scheduleScan);

  var observer = new MutationObserver(function () {
    scheduleScan();
  });
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }
})();
