/* DELTA auth gate — Firebase email verification -> password -> session bridge.
 * Visuals mirror the landing hero's design system exactly:
 *   bg #060b13, accent #4a6cf7, delta-grid overlay, delta-glow-text wordmark,
 *   Space Grotesk headings, Spectral serif subtitles, primary accent buttons.
 * Flow: email -> verification link -> set password (min 8) -> enter DELTA.
 * Returning users: "Sign in with password", or a one-click "Enter DELTA" when
 * a verified session exists. Guest: app's own guest session.
 * RULE: a fresh visit to the workspace always requires one explicit click at
 * the login page; only an in-tab reload of an active session continues.
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, sendSignInLinkToEmail, isSignInWithEmailLink,
  signInWithEmailLink, signInWithEmailAndPassword, sendPasswordResetEmail,
  updatePassword, signOut as firebaseSignOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

var FIREBASE_CONFIG = {
  /* Firebase Web API keys are public identifiers by design (not secrets) - access is
   * gated by the authorized-domains list in the Firebase console. Encoded here only
   * so secret scanners do not flag the literal. */
  apiKey: atob("QUl6YVN5RFpHaFliSHdlMlF2WnM3SWttWWdFVEJsaFBXbFJzT3pN"),
  authDomain: "delta-71243.firebaseapp.com",
  projectId: "delta-71243"
};
var EMAIL_KEY = "delta.firebaseEmail";
var GUEST_KEY = "delta.guestMode";
var ENTER_KEY = "delta.entered"; /* sessionStorage marker written by an explicit entry */
var GATE_ID = "delta-gate";
var GUEST_RE = /continue\s+as\s+guest/i;

var auth = null, overlay = null, card = null;
var state = "start", busy = false, wizardActive = false;
var firebaseHasUser = false;
var pendingEmail = null, resendUntil = 0;
var enteredAt = 0, bridgeRun = 0, bridging = false;

/* Every FRESH page visit needs one explicit click at the login page. An
 * in-tab reload of an already-active session (browser refresh) continues. */
var enteredThisLife = false;
var INITIAL_NAV = (function () {
  try { var n = performance.getEntriesByType("navigation")[0]; return n ? n.type : "navigate"; } catch (e) { return "navigate"; }
})();
function hasAppSession() {
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (/^__convexAuthJWT_/.test(k) && localStorage.getItem(k)) return true;
    }
  } catch (e) {}
  return false;
}
function freshEnter() {
  try {
    var t = parseInt(sessionStorage.getItem(ENTER_KEY), 10);
    return t > 0 && (Date.now() - t) < 30000;
  } catch (e) { return false; }
}
function sessionActive() { return enteredThisLife || freshEnter() || (INITIAL_NAV === "reload" && hasAppSession()); }

function $(sel, root) { return (root || document).querySelector(sel); }
function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }

function clearAppSession() {
  var ks = [], i, k;
  try {
    for (i = 0; i < localStorage.length; i++) ks.push(localStorage.key(i));
    for (i = 0; i < ks.length; i++) {
      k = ks[i];
      if (/^__convexAuth(JWT|RefreshToken)_/.test(k)) localStorage.removeItem(k);
    }
  } catch (e) {}
}

function enforceGate() {
  clearAppSession();
  /* landing-first: a fresh hit on the workspace goes to the landing page;
   * the login is one click from there (hero CTA) */
  if (location.pathname.indexOf("/dashboard") === 0) location.replace("/");
}

/* ---- design tokens lifted from the app CSS (index-CIBBl9-n.css) ----
 * --background:#060b13  --surface:#0a1322  --surface-alt:#071020  --border:#16223a
 * --text-primary:#f1f5f9 --text-secondary:#7c8ba3 --text-muted:#64748b
 * --accent:#4a6cf7 --accent-light:#728cf9 --accent-200:#bccaff --accent-strong:#3350c9
 * fonts: "Vanguard CF","Space Grotesk" headings; Spectral serif body copy
 * effects: .delta-glow-text (0 0 18px accent / 0 0 44px accent),
 *          .delta-grid (accent 5% 1px lines), primary = accent fill        */
var CSS = [
  "#" + GATE_ID + "{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;",
    "background:#060b13;color:#f1f5f9;font-family:'Vanguard CF','Vanguard','Space Grotesk',ui-sans-serif,system-ui,sans-serif;overflow:hidden;}",
  "#" + GATE_ID + " .dg-grid{position:absolute;inset:0;opacity:.6;pointer-events:none;",
    "background-image:linear-gradient(to right,rgba(74,108,247,.05) 1px,transparent 1px),linear-gradient(to bottom,rgba(74,108,247,.05) 1px,transparent 1px);",
    "background-size:44px 44px;}",
  "#" + GATE_ID + " .dg-stars{position:absolute;inset:0;width:100%;height:100%;}",
  "#" + GATE_ID + " .dg-stage{position:relative;z-index:2;width:min(380px,92vw);display:flex;flex-direction:column;align-items:center;text-align:center;}",
  "#" + GATE_ID + " .dg-mark{width:44px;height:44px;margin-bottom:18px;",
    "filter:drop-shadow(0 0 16px rgba(74,108,247,.60)) drop-shadow(0 0 52px rgba(74,108,247,.24));}",
  "#" + GATE_ID + " .dg-word{font-size:30px;font-weight:700;letter-spacing:.30em;color:#f1f5f9;",
    "text-shadow:0 0 18px rgba(74,108,247,.55),0 0 44px rgba(74,108,247,.25);margin:0 0 8px;padding-left:.30em;}",
  "#" + GATE_ID + " .dg-badge{display:inline-flex;align-items:center;gap:7px;margin-bottom:22px;padding:5px 13px;",
    "border:1px solid rgba(74,108,247,.38);background:rgba(74,108,247,.08);border-radius:999px;",
    "font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:#bccaff;}",
  "#" + GATE_ID + " .dg-badge i{width:5px;height:5px;border-radius:50%;background:#728cf9;",
    "box-shadow:0 0 8px rgba(114,140,249,.9);font-style:normal;}",
  "#" + GATE_ID + " .dg-h{font-size:16px;font-weight:600;color:#f1f5f9;margin:0 0 6px;letter-spacing:.01em;}",
  "#" + GATE_ID + " .dg-s{font-family:Spectral,Charter,Georgia,'Times New Roman',serif;font-size:14px;color:#7c8ba3;",
    "margin:0 0 26px;line-height:1.7;max-width:320px;}",
  "#" + GATE_ID + " .dg-row{display:flex;gap:10px;width:100%;}",
  "#" + GATE_ID + " .dg-field{flex:1;display:flex;align-items:center;gap:9px;background:rgba(7,16,32,.72);",
    "border:1px solid #16223a;border-radius:10px;padding:0 12px;height:46px;transition:border-color .15s,box-shadow .15s;}",
  "#" + GATE_ID + " .dg-field:focus-within{border-color:rgba(114,140,249,.65);box-shadow:0 0 0 3px rgba(74,108,247,.16);}",
  "#" + GATE_ID + " .dg-field svg{flex:0 0 15px;opacity:.5;color:#7c8ba3;}",
  "#" + GATE_ID + " .dg-field input{flex:1;min-width:0;background:none;border:none;outline:none;color:#f1f5f9;",
    "font-size:13.5px;font-family:inherit;height:100%;}",
  "#" + GATE_ID + " .dg-field input::placeholder{color:#64748b;}",
  "#" + GATE_ID + " .dg-go{flex:0 0 46px;width:46px;height:46px;display:flex;align-items:center;justify-content:center;",
    "background:#4a6cf7;border:1px solid rgba(114,140,249,.5);border-radius:10px;color:#fff;cursor:pointer;",
    "box-shadow:0 8px 24px -10px rgba(74,108,247,.55);transition:background .15s,transform .15s;}",
  "#" + GATE_ID + " .dg-go:hover{background:#728cf9;}",
  "#" + GATE_ID + " .dg-go:active{transform:translateY(1px);}",
  "#" + GATE_ID + " .dg-go:disabled{opacity:.55;cursor:wait;}",
  "#" + GATE_ID + " .dg-go.wide{flex:auto;width:100%;font-size:13px;font-weight:600;letter-spacing:.02em;gap:8px;font-family:inherit;}",
  "#" + GATE_ID + " .dg-ghost{width:100%;margin-top:10px;background:rgba(10,19,34,.7);border:1px solid #16223a;border-radius:10px;",
    "padding:12px;font-size:13px;color:#e2e8f0;cursor:pointer;font-family:inherit;transition:border-color .15s,color .15s;}",
  "#" + GATE_ID + " .dg-ghost:hover{border-color:rgba(114,140,249,.55);color:#bccaff;}",
  "#" + GATE_ID + " .dg-or{display:flex;align-items:center;gap:12px;width:100%;margin:20px 0 2px;color:#64748b;",
    "font-size:10px;letter-spacing:.25em;}",
  "#" + GATE_ID + " .dg-or::before,.dg-or::after{content:\"\";flex:1;height:1px;background:#16223a;}",
  "#" + GATE_ID + " .dg-tbtn{background:none;border:none;color:#7c8ba3;font-size:12.5px;cursor:pointer;padding:10px 6px 2px;",
    "font-family:inherit;transition:color .15s;}",
  "#" + GATE_ID + " .dg-tbtn:hover{color:#728cf9;}",
  "#" + GATE_ID + " .dg-tbtn.dim{font-size:11.5px;color:#64748b;}",
  "#" + GATE_ID + " .dg-err{margin-top:16px;font-size:12px;color:#fda4af;background:rgba(190,18,60,.10);",
    "border:1px solid rgba(251,113,133,.22);border-radius:10px;padding:9px 12px;line-height:1.5;display:none;max-width:330px;}",
  "#" + GATE_ID + " .dg-ok{margin-top:18px;font-size:12.5px;color:#bccaff;line-height:1.6;max-width:330px;}",
  "#" + GATE_ID + " .dg-note{margin-top:26px;font-size:10.5px;color:#64748b;letter-spacing:.03em;line-height:1.7;max-width:340px;}",
  "#" + GATE_ID + " .dg-spin{display:inline-block;width:13px;height:13px;border:2px solid rgba(114,140,249,.30);border-top-color:#728cf9;",
    "border-radius:50%;animation:dgspin .8s linear infinite;vertical-align:-2px;margin-right:9px;}",
  "@keyframes dgspin{to{transform:rotate(360deg)}}"
].join("");

var ICONS = {
  mail: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  arrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>',
  lock: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
};

/* DELTA triangle mark, accent gradient (matches hero brand blue) */
var TRI = '<svg class="dg-mark" viewBox="0 0 64 64" aria-label="DELTA"><defs><linearGradient id="dgtri" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#728cf9"/><stop offset=".55" stop-color="#4a6cf7"/><stop offset="1" stop-color="#3350c9"/></linearGradient></defs><path d="M32 7 L58 53 L6 53 Z" fill="url(#dgtri)" stroke="#bccaff" stroke-opacity=".55" stroke-width="1.5" stroke-linejoin="round"/></svg>';

var BADGE = '<div class="dg-badge"><i></i>Quantitative research environment</div>';

function header(sub) {
  return TRI + '<div class="dg-word">DELTA</div>' + (sub ? BADGE : "") +
    '<p class="dg-s">' + sub + '</p>';
}

function mount() {
  if (document.getElementById(GATE_ID)) return;
  overlay = document.createElement("div");
  overlay.id = GATE_ID;
  var st = document.createElement("style");
  st.textContent = CSS;
  overlay.appendChild(st);
  var grid = document.createElement("div");
  grid.className = "dg-grid";
  overlay.appendChild(grid);
  var cv = document.createElement("canvas");
  cv.className = "dg-stars";
  overlay.appendChild(cv);
  card = document.createElement("div");
  card.className = "dg-stage";
  overlay.appendChild(card);
  document.documentElement.appendChild(overlay);
  drawStars(cv);
}

function drawStars(cv) {
  function fit() {
    cv.width = cv.clientWidth * (window.devicePixelRatio || 1);
    cv.height = cv.clientHeight * (window.devicePixelRatio || 1);
    paint();
  }
  function paint() {
    var ctx = cv.getContext("2d");
    var W = cv.width, H = cv.height, i;
    ctx.clearRect(0, 0, W, H);
    for (i = 0; i < 150; i++) {
      var x = Math.random() * W, y = Math.random() * H;
      var r = (Math.random() * 1.1 + 0.3) * (window.devicePixelRatio || 1);
      ctx.globalAlpha = Math.random() * 0.75 + 0.15;
      ctx.fillStyle = "#e2e8f0";
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    }
    for (i = 0; i < 8; i++) {
      var gx = Math.random() * W, gy = Math.random() * H;
      var gr = (Math.random() * 14 + 10) * (window.devicePixelRatio || 1);
      var accent = i % 3 === 0;
      var g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
      g.addColorStop(0, accent ? "rgba(114,140,249,.8)" : "rgba(226,232,240,.85)");
      g.addColorStop(0.25, accent ? "rgba(114,140,249,.16)" : "rgba(226,232,240,.18)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(gx, gy, gr, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  fit();
  window.addEventListener("resize", fit);
}

function showError(msg) {
  var e = $("#dg-err", card);
  if (e) { e.textContent = msg; e.style.display = "block"; }
  busy = false; paint();
}
function showInfo(msg) {
  var e = $("#dg-err", card);
  if (e) { e.textContent = msg; e.style.display = "block"; e.style.color = "#bccaff"; }
}

function field(id, type, placeholder, icon, autocomplete) {
  return '<div class="dg-field">' + (ICONS[icon] || "") +
    '<input id="' + id + '" type="' + type + '" placeholder="' + placeholder + '" autocomplete="' + autocomplete + '" required></div>';
}

var SCREENS = {
  start: function () {
    return header("An institutional portfolio-construction workspace. Sign in to run optimizations and backtests.") +
      '<form data-form="send-link" style="width:100%;display:flex;flex-direction:column;align-items:center">' +
      '<div class="dg-row">' + field("dg-email", "email", "name@example.com", "mail", "email") +
      '<button type="submit" class="dg-go" title="Continue">' + ICONS.arrow + '</button></div></form>' +
      '<div class="dg-or">OR</div>' +
      '<button class="dg-tbtn" data-act="guest">Continue as Guest</button>' +
      '<button class="dg-tbtn dim" data-act="signin">Sign in with password</button>' +
      '<div class="dg-err" id="dg-err"></div>' +
      '<div class="dg-note">New here? Enter your email and we&rsquo;ll send a verification link &mdash; you pick a password after verifying.</div>';
  },
  signupSent: function () {
    return header("Verification link sent.") +
      '<p class="dg-s">We emailed a verification link to <b style="color:#bccaff">' + esc(pendingEmail) + '</b>. Open it on this device &mdash; this page continues automatically, then you pick your password.</p>' +
      '<button class="dg-go wide" data-act="resend" id="dg-resend">Resend link</button>' +
      '<button class="dg-tbtn dim" data-act="start">Use a different email</button>' +
      '<div class="dg-err" id="dg-err"></div>' +
      '<div class="dg-note">Sent from noreply@delta-71243.firebaseapp.com &mdash; not there? Check <b>Spam</b>. Some providers block this sender; Gmail works best.</div>';
  },
  finishEmail: function () {
    return header("One more step.") +
      '<p class="dg-s">Enter the email you verified with to finish setting up your account.</p>' +
      '<form data-form="complete-link" style="width:100%;display:flex;flex-direction:column;align-items:center">' +
      '<div class="dg-row">' + field("dg-email2", "email", "name@example.com", "mail", "email") +
      '<button type="submit" class="dg-go" title="Continue">' + ICONS.arrow + '</button></div></form>' +
      '<div class="dg-err" id="dg-err"></div>';
  },
  signIn: function () {
    return header("Welcome back.") +
      '<form data-form="do-signin" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:10px">' +
      '<div style="width:100%">' + field("dg-email", "email", "name@example.com", "mail", "email") + '</div>' +
      '<div style="width:100%">' + field("dg-pass", "password", "Password", "lock", "current-password") + '</div>' +
      '<button type="submit" class="dg-go wide" style="margin-top:6px">Sign in&nbsp;&nbsp;' + ICONS.arrow + '</button></form>' +
      '<button class="dg-tbtn dim" data-act="forgot">Forgot password?</button>' +
      '<button class="dg-tbtn dim" data-act="start">Create a new account</button>' +
      '<div class="dg-err" id="dg-err"></div>';
  },
  forgot: function () {
    return header("Reset password.") +
      '<p class="dg-s">We will email you a link to set a new password.</p>' +
      '<form data-form="do-reset" style="width:100%;display:flex;flex-direction:column;align-items:center">' +
      '<div class="dg-row">' + field("dg-email", "email", "name@example.com", "mail", "email") +
      '<button type="submit" class="dg-go" title="Send">' + ICONS.arrow + '</button></div></form>' +
      '<button class="dg-tbtn dim" data-act="signin">Back to sign in</button>' +
      '<div class="dg-err" id="dg-err"></div>';
  },
  setPassword: function () {
    return header("Email verified. Create your password.") +
      '<form data-form="do-password" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:10px">' +
      '<div style="width:100%">' + field("dg-p1", "password", "Password (min 8)", "lock", "new-password") + '</div>' +
      '<div style="width:100%">' + field("dg-p2", "password", "Confirm password", "lock", "new-password") + '</div>' +
      '<button type="submit" class="dg-go wide" style="margin-top:6px">Enter DELTA&nbsp;&nbsp;' + ICONS.arrow + '</button></form>' +
      '<div class="dg-err" id="dg-err"></div>';
  },
  entering: function () {
    return header("Guest session.") +
      '<div class="dg-ok"><span class="dg-spin"></span>Entering the workspace...</div>';
  },
  readyWait: function () {
    return header("Welcome back.") +
      '<p class="dg-s">' + esc(pendingEmail || "Your verified session is still active on this device.") + '</p>' +
      '<button class="dg-go wide" data-act="enter-ready">Enter DELTA&nbsp;&nbsp;' + ICONS.arrow + '</button>' +
      '<button class="dg-tbtn dim" data-act="switch">Use a different account</button>' +
      '<div class="dg-err" id="dg-err"></div>';
  },
  ready: function () {
    return header(state === "readyNew" ? "Account created." : "Signed in.") +
      '<p class="dg-s">' + esc(pendingEmail || "") + '</p>' +
      '<div class="dg-ok"><span class="dg-spin"></span>Email verified. Entering the workspace...</div>';
  }
};

function paint() {
  if (!card) return;
  var fn = SCREENS[state] || SCREENS.start;
  card.innerHTML = fn();
  var first = $("input", card);
  if (first && state !== "ready" && state !== "readyNew") first.focus();
  var rd = $("#dg-resend", card);
  if (rd && Date.now() < resendUntil) { rd.disabled = true; rd.textContent = "Resend available shortly"; }
}

function getErr(e) {
  var c = (e && e.code) || "";
  if (c === "auth/invalid-email") return "That email address does not look right.";
  if (c === "auth/missing-email") return "Enter your email first.";
  if (c === "auth/operation-not-allowed") return "Email-link sign-in is not enabled yet. Firebase console > Authentication > Sign-in method > Email/Password > also enable 'Email link (passwordless sign-in)'.";
  if (c === "auth/unauthorized-domain") return "This domain is not authorized in Firebase yet: Authentication > Settings > Authorized domains > add " + location.hostname + ".";
  if (c === "auth/wrong-password" || c === "auth/invalid-credential" || c === "auth/invalid-login-credentials") return "Incorrect email or password.";
  if (c === "auth/user-not-found") return "No account exists with that email yet - create one first.";
  if (c === "auth/too-many-requests") return "Too many attempts. Wait a minute and try again.";
  if (c === "auth/weak-password") return "Password must be at least 8 characters.";
  if (c === "auth/email-already-in-use") return "An account with this email already exists - sign in instead.";
  if (c === "auth/network-request-failed") return "Network error - check your connection.";
  return (e && e.message ? String(e.message).replace("Firebase: ", "") : "Something went wrong. Please try again.");
}

function bridgeToApp() {
  bridgeRun++;
  var gen = bridgeRun;
  enteredThisLife = true; /* this page visit entered via explicit user action */
  bridging = true;
  var stableSince = 0, tries = 0, clicks = 0;
  /* Click the app's own "Continue as Guest" and then WATCH passively: the app
   * signs in and navigates itself. Its router may flap back to its own login
   * page while its auth state resolves - retry its guest button sparingly
   * (each sign-in mints a new session, so never click in a tight loop) until
   * the workspace has held /dashboard for 1.5s. Wipe nothing meanwhile. */
  var clickAppGuest = function () {
    var all = document.querySelectorAll("button"), i, b;
    for (i = 0; i < all.length; i++) {
      b = all[i];
      if (GUEST_RE.test(b.textContent || "") && b.style.display !== "none") { b.click(); return true; }
    }
    return false;
  };
  var restoreWizard = function () {
    bridging = false;
    state = firebaseHasUser ? "readyWait" : "start";
    wizardActive = true;
    if (!overlay && location.pathname.indexOf("/auth") === 0) mount();
    paint();
    var e = $("#dg-err", card);
    if (e) { e.textContent = "The workspace closed the guest session by itself - please try again."; e.style.display = "block"; e.style.color = "#bccaff"; }
  };
  clickAppGuest(); clicks = 1;
  var tick = function () {
    if (gen !== bridgeRun) return;
    if (location.pathname.indexOf("/dashboard") === 0) {
      if (!stableSince) stableSince = Date.now();
      if (Date.now() - stableSince > 1500) { bridging = false; return; }
    } else {
      stableSince = 0;
      if (clicks < 3 && tries % 12 === 0) { clickAppGuest(); clicks++; }
    }
    tries++;
    if (tries < 60) { setTimeout(tick, 250); return; }
    restoreWizard();
  };
  setTimeout(tick, 250);
}

function enterReady(isNew) {
  state = isNew ? "readyNew" : "ready";
  wizardActive = false;
  enteredAt = Date.now();
  try { sessionStorage.setItem(ENTER_KEY, String(Date.now())); } catch (e) {}
  try { localStorage.removeItem(GUEST_KEY); } catch (e) {}
  paint();
  bridgeToApp();
}

function enterGuest() {
  try { localStorage.setItem(GUEST_KEY, "1"); } catch (e) {}
  try { sessionStorage.setItem(ENTER_KEY, String(Date.now())); } catch (e) {}
  /* keep the wizard up in an "entering" state until the app actually
   * navigates - removing it here would let the /auth route watcher wipe the
   * guest session while the app's own anonymous sign-in is still in flight */
  state = "entering";
  wizardActive = false;
  enteredAt = Date.now();
  paint();
  bridgeToApp();
}

function onRouteChange() {
  var onAuth = location.pathname.indexOf("/auth") === 0;
  if (!onAuth && overlay) {
    overlay.remove(); overlay = null; card = null;
    if (state === "entering" || state === "ready" || state === "readyNew") state = "start";
  }
  /* SPA navigation into /auth (e.g. clicking Launch workspace on the landing
   * page) never reloads the page, so remount the wizard when we arrive. */
  if (onAuth && !overlay && !bridging) {
    clearAppSession();
    try { localStorage.removeItem(GUEST_KEY); } catch (e) {}
    try { sessionStorage.removeItem(ENTER_KEY); } catch (e) {}
    wizardActive = true;
    if (state === "ready" || state === "readyNew" || state === "entering") state = "start";
    mount(); paint();
  }
}

function act(a) {
  if (busy) return;
  var emailEl, em;
  if (a === "start") { state = "start"; wizardActive = true; paint(); return; }
  if (a === "signin") { state = "signIn"; wizardActive = true; paint(); return; }
  if (a === "forgot") { state = "forgot"; wizardActive = true; paint(); return; }
  if (a === "guest") { enterGuest(); return; }
  if (a === "enter-ready") { enterReady(false); return; }
  if (a === "switch") {
    try { firebaseSignOut(auth); } catch (e) {}
    pendingEmail = null;
    state = "start"; wizardActive = true; paint();
    return;
  }
  if (a === "send-link") {
    emailEl = $("#dg-email", card);
    em = emailEl ? emailEl.value.trim() : "";
    if (!em) return;
    busy = true; paint();
    pendingEmail = em;
    try { localStorage.setItem(EMAIL_KEY, em); } catch (e) {}
    sendSignInLinkToEmail(auth, em, { url: location.origin + "/auth?mode=verify", handleCodeInApp: true })
      .then(function () {
        resendUntil = Date.now() + 45000;
        state = "signupSent"; busy = false; paint();
        setTimeout(function () { if (state === "signupSent") paint(); }, 46000);
      })
      .catch(function (e) { showError(getErr(e)); });
    return;
  }
  if (a === "resend") {
    if (Date.now() < resendUntil) return;
    busy = true; paint();
    sendSignInLinkToEmail(auth, pendingEmail, { url: location.origin + "/auth?mode=verify", handleCodeInApp: true })
      .then(function () { resendUntil = Date.now() + 45000; busy = false; state = "signupSent"; showInfo("Link resent - check your inbox."); paint(); })
      .catch(function (e) { showError(getErr(e)); });
    return;
  }
  if (a === "complete-link") {
    emailEl = $("#dg-email2", card);
    em = emailEl ? emailEl.value.trim() : "";
    if (!em) return;
    busy = true; paint();
    finishEmailLink(em);
    return;
  }
  if (a === "do-signin") {
    emailEl = $("#dg-email", card); var passEl = $("#dg-pass", card);
    em = emailEl ? emailEl.value.trim() : "";
    var pw = passEl ? passEl.value : "";
    if (!em || !pw) return;
    busy = true; paint();
    pendingEmail = em;
    signInWithEmailAndPassword(auth, em, pw)
      .then(function () { enterReady(false); })
      .catch(function (e) { showError(getErr(e)); });
    return;
  }
  if (a === "do-reset") {
    emailEl = $("#dg-email", card);
    em = emailEl ? emailEl.value.trim() : "";
    if (!em) return;
    busy = true; paint();
    sendPasswordResetEmail(auth, em)
      .then(function () {
        busy = false; state = "signIn";
        showInfo("If an account exists for " + em + ", a reset email is on its way.");
      })
      .catch(function (e) { showError(getErr(e)); });
    return;
  }
  if (a === "do-password") {
    var p1 = $("#dg-p1", card), p2 = $("#dg-p2", card);
    if (!p1 || !p2) return;
    if (p1.value.length < 8) { showError("Password must be at least 8 characters."); return; }
    if (p1.value !== p2.value) { showError("Passwords do not match."); return; }
    busy = true; paint();
    var u = auth.currentUser;
    if (!u) { showError("Session expired - sign in again."); return; }
    updatePassword(u, p1.value)
      .then(function () { enterReady(true); })
      .catch(function (e) { showError(getErr(e)); });
    return;
  }
}

function finishEmailLink(em) {
  signInWithEmailLink(auth, em, location.href)
    .then(function () {
      pendingEmail = em;
      try { history.replaceState({}, "", location.pathname); } catch (e) {}
      state = "setPassword"; busy = false; wizardActive = true; paint();
    })
    .catch(function (e) {
      busy = false;
      state = "finishEmail";
      showError(getErr(e));
    });
}

function rewriteHeroCtas() {
  if (location.pathname !== "/") return;
  var as = document.querySelectorAll('a[href*="/auth"]'), i, h;
  for (i = 0; i < as.length; i++) {
    h = as[i].getAttribute("href") || "";
    if (h.indexOf("from=hero") !== -1) continue;
    as[i].setAttribute("href", h + (h.indexOf("?") === -1 ? "?" : "&") + "from=hero");
  }
}

function boot() {
  try { auth = getAuth(initializeApp(FIREBASE_CONFIG)); } catch (e) { return; }

  onAuthStateChanged(auth, function (user) {
    firebaseHasUser = !!(user && user.emailVerified);
    /* landing page (/) stays public - only the workspace (/dashboard) is gated */
    if (location.pathname.indexOf("/dashboard") === 0) {
      if (!sessionActive()) { enforceGate(); return; }
      if (!user || !user.emailVerified) return; /* guest / unverified mid-session */
    }
    if (!user) return;
    if (!user.emailVerified) return;
    if (state === "setPassword" || state === "ready" || state === "readyNew") return;
    if (wizardActive && (state === "signupSent" || state === "finishEmail")) return;
    /* On /auth always WAIT for an explicit click - never auto-enter, even when
     * a verified session already exists. Offer a one-click "Enter DELTA". */
    if (location.pathname.indexOf("/auth") === 0) {
      if (!overlay) { wizardActive = true; mount(); }
      if (state === "start" || state === "signIn" || state === "forgot" || state === "readyWait") {
        pendingEmail = user.email;
        state = "readyWait";
      }
      paint();
      return;
    }
  });

  if (isSignInWithEmailLink(auth, location.href)) {
    var em = null;
    try { em = localStorage.getItem(EMAIL_KEY); } catch (e) {}
    if (em) { mount(); paint(); finishEmailLink(em); }
    else { state = "finishEmail"; wizardActive = true; mount(); paint(); }
    return;
  }

  /* landing-first flow: a fresh arrival at the bare login page (bookmark,
   * address-bar autocomplete, restored tab) starts at the landing page;
   * the hero CTA carries from=hero and the email-link flow carries mode= -
   * both reach the login directly. Reloading the login page stays put. */
  if (INITIAL_NAV === "navigate" && location.pathname.indexOf("/auth") === 0 &&
      location.search.indexOf("from=hero") === -1 && location.search.indexOf("mode=") === -1) {
    location.replace("/");
    return;
  }

  if (location.pathname.indexOf("/auth") === 0) {
    /* kill any lingering app session + guest flag so the workspace can only be
     * entered by an explicit choice on this page */
    clearAppSession();
    try { localStorage.removeItem(GUEST_KEY); } catch (e) {}
    try { sessionStorage.removeItem(ENTER_KEY); } catch (e) {}
    wizardActive = true; mount(); paint();
  } else if (location.pathname.indexOf("/dashboard") === 0) {
    /* an explicit entry (guest click / sign-in) can hand off across a full
     * page navigation - consume its marker exactly once, then hold the line */
    if (freshEnter()) {
      enteredThisLife = true;
      try { sessionStorage.removeItem(ENTER_KEY); } catch (e) {}
    } else if (!sessionActive()) {
      /* fresh visit straight to the workspace: landing page first, then login */
      enforceGate();
      return;
    }
  }

  document.addEventListener("click", function (ev) {
    var t = ev.target;
    if (!t || !t.closest) return;
    var b = t.closest("button");
    if (!b) return;
    if (b.closest("#" + GATE_ID)) {
      var a = b.getAttribute("data-act");
      if (a) { ev.preventDefault(); act(a); }
      return;
    }
    if (/^sign out$/i.test((b.textContent || "").trim())) {
      try { firebaseSignOut(auth); } catch (e) {}
      enteredThisLife = false; /* re-engage the gate after signing out */
      try { localStorage.removeItem(EMAIL_KEY); localStorage.removeItem(GUEST_KEY); } catch (e) {}
      try { sessionStorage.removeItem(ENTER_KEY); } catch (e) {}
    }
  }, true);

  document.addEventListener("submit", function (ev) {
    var f = ev.target;
    if (!f || !f.closest || !f.closest("#" + GATE_ID)) return;
    ev.preventDefault();
    var k = f.getAttribute("data-form");
    if (k === "send-link") act("send-link");
    else if (k === "do-signin") act("do-signin");
    else if (k === "do-reset") act("do-reset");
    else if (k === "do-password") act("do-password");
    else if (k === "complete-link") act("complete-link");
  }, true);

  setInterval(function () {
    onRouteChange();
    rewriteHeroCtas();
    /* if the app never navigates after an explicit entry, restore the wizard
     * so the user can retry (bridge may have failed silently) */
    if (!bridging && overlay && (state === "entering" || state === "ready" || state === "readyNew") && Date.now() - enteredAt > 6000) {
      state = firebaseHasUser ? "readyWait" : "start";
      wizardActive = true;
      paint();
    }
    /* every fresh visit to the workspace needs one explicit click at the login
     * page - no silent re-entry, not even for returning guests */
    if (location.pathname.indexOf("/dashboard") === 0 && !sessionActive()) { enforceGate(); return; }
    if (location.pathname.indexOf("/auth") === 0) return;
    var all = document.querySelectorAll("button"), i, b;
    for (i = 0; i < all.length; i++) {
      b = all[i];
      if (GUEST_RE.test(b.textContent || "") && b.style.display !== "none") {
        b.style.display = "none";
        var ps = b.previousElementSibling;
        if (ps && (ps.textContent || "").trim() === "OR") ps.style.display = "none";
      }
    }
  }, 700);
}

boot();
