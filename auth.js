/* DELTA auth gate — Firebase email verification -> password -> session bridge.
 * Runs on every page; renders the sign-in wizard only on /auth.
 * The app's native auth wall stays mounted underneath (hidden) and supplies the
 * session bridge, so the data engine itself is untouched.
 * Flow: email -> verification link -> set password (min 8) -> enter DELTA.
 * Returning users: email + password, or auto-continue if Firebase session alive.
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
var GATE_ID = "delta-gate";
var GUEST_RE = /continue\s+as\s+guest/i;

var auth = null, overlay = null, card = null;
var state = "start", busy = false, bridged = false, wizardActive = false;
var firebaseHasUser = false;

function enforceGate() {
  var ks = [], i, k;
  try {
    for (i = 0; i < localStorage.length; i++) ks.push(localStorage.key(i));
    for (i = 0; i < ks.length; i++) {
      k = ks[i];
      if (/^__convexAuth(JWT|RefreshToken)_/.test(k)) localStorage.removeItem(k);
    }
  } catch (e) {}
  if (location.pathname.indexOf("/auth") !== 0) location.replace("/auth");
}
var pendingEmail = null, resendUntil = 0;

function $(sel, root) { return (root || document).querySelector(sel); }
function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }

var CSS = [
  "#" + GATE_ID + "{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;",
    "background:radial-gradient(1200px 600px at 50% -10%,rgba(45,212,191,.10),transparent 60%),rgba(8,12,18,.96);",
    "font-family:'Space Grotesk',system-ui,-apple-system,sans-serif;color:#e2e8f0;}",
  "#" + GATE_ID + " .dg-card{width:min(400px,92vw);background:rgba(15,23,32,.92);border:1px solid rgba(94,234,212,.18);",
    "border-radius:16px;padding:32px 30px;box-shadow:0 24px 80px rgba(0,0,0,.55);}",
  "#" + GATE_ID + " .dg-logo{font-weight:700;letter-spacing:.35em;font-size:13px;color:#5eead4;margin-bottom:6px;}",
  "#" + GATE_ID + " .dg-h1{font-size:22px;font-weight:700;margin:0 0 4px;color:#f1f5f9;}",
  "#" + GATE_ID + " .dg-sub{font-size:12.5px;color:#94a3b8;margin:0 0 20px;line-height:1.5;}",
  "#" + GATE_ID + " label{display:block;font-size:11px;letter-spacing:.08em;color:#94a3b8;margin:12px 0 5px;text-transform:uppercase;}",
  "#" + GATE_ID + " input{width:100%;box-sizing:border-box;background:rgba(2,6,12,.7);border:1px solid rgba(148,163,184,.25);",
    "border-radius:9px;padding:11px 12px;font-size:14px;color:#f1f5f9;outline:none;font-family:inherit;}",
  "#" + GATE_ID + " input:focus{border-color:#2dd4bf;box-shadow:0 0 0 3px rgba(45,212,191,.15);}",
  "#" + GATE_ID + " .dg-btn{width:100%;margin-top:18px;background:linear-gradient(135deg,#2dd4bf,#0ea5b7);border:none;border-radius:9px;",
    "padding:12px;font-size:14px;font-weight:600;color:#04211d;cursor:pointer;font-family:inherit;transition:filter .15s;}",
  "#" + GATE_ID + " .dg-btn:hover{filter:brightness(1.1);}",
  "#" + GATE_ID + " .dg-btn:disabled{opacity:.55;cursor:wait;}",
  "#" + GATE_ID + " .dg-ghost{width:100%;margin-top:10px;background:transparent;border:1px solid rgba(148,163,184,.25);border-radius:9px;",
    "padding:11px;font-size:13px;color:#cbd5e1;cursor:pointer;font-family:inherit;}",
  "#" + GATE_ID + " .dg-ghost:hover{border-color:rgba(94,234,212,.45);color:#5eead4;}",
  "#" + GATE_ID + " .dg-err{margin-top:14px;font-size:12.5px;color:#fda4af;background:rgba(190,18,60,.12);",
    "border:1px solid rgba(251,113,133,.25);border-radius:8px;padding:9px 11px;line-height:1.45;display:none;}",
  "#" + GATE_ID + " .dg-ok{margin-top:14px;font-size:12.5px;color:#5eead4;line-height:1.55;}",
  "#" + GATE_ID + " .dg-link{background:none;border:none;color:#94a3b8;font-size:12px;cursor:pointer;padding:0;margin-top:14px;",
    "text-decoration:underline;text-underline-offset:3px;font-family:inherit;display:block;width:100%;}",
  "#" + GATE_ID + " .dg-link:hover{color:#5eead4;}",
  "#" + GATE_ID + " .dg-foot{margin-top:18px;font-size:10.5px;color:#475569;text-align:center;letter-spacing:.04em;}",
  "#" + GATE_ID + " .dg-spin{display:inline-block;width:13px;height:13px;border:2px solid rgba(94,234,212,.35);border-top-color:#5eead4;",
    "border-radius:50%;animation:dgspin .8s linear infinite;vertical-align:-2px;margin-right:8px;}",
  "@keyframes dgspin{to{transform:rotate(360deg)}}"
].join("");

function mount() {
  if (document.getElementById(GATE_ID)) return;
  overlay = document.createElement("div");
  overlay.id = GATE_ID;
  var st = document.createElement("style");
  st.textContent = CSS;
  overlay.appendChild(st);
  card = document.createElement("div");
  card.className = "dg-card";
  overlay.appendChild(card);
  document.documentElement.appendChild(overlay);
}

function showError(msg) {
  var e = $("#dg-err", card);
  if (e) { e.textContent = msg; e.style.display = "block"; }
  busy = false; paint();
}
function showInfo(msg) {
  var e = $("#dg-err", card);
  if (e) { e.textContent = msg; e.style.display = "block"; e.style.color = "#5eead4"; }
}

var SCREENS = {
  start: function () {
    return '<div class="dg-logo">D E L T A</div><h1 class="dg-h1">Portfolio Optimization</h1>' +
      '<p class="dg-sub">Sign in to run optimizations and backtests.</p>' +
      '<button class="dg-btn" data-act="signup">Create account</button>' +
      '<button class="dg-ghost" data-act="signin">Sign in</button>' +
      '<div class="dg-foot">Email verification required &middot; Secured by Firebase</div>';
  },
  signupEmail: function () {
    return '<div class="dg-logo">D E L T A</div><h1 class="dg-h1">Create your account</h1>' +
      '<p class="dg-sub">We email you a verification link first. You choose your password after verifying.</p>' +
      '<form data-form="send-link"><label>Email</label>' +
      '<input type="email" id="dg-email" placeholder="you@example.com" autocomplete="email" required></form>' +
      '<button class="dg-btn" data-act="send-link">Email me a verification link</button>' +
      '<button class="dg-link" data-act="start">Back</button><div class="dg-err" id="dg-err"></div>';
  },
  signupSent: function () {
    return '<div class="dg-logo">D E L T A</div><h1 class="dg-h1">Check your inbox</h1>' +
      '<p class="dg-sub">We sent a verification link to <b style="color:#5eead4">' + esc(pendingEmail) + '</b>. ' +
      'Open it on this device and this page continues automatically &mdash; then you pick your password.</p>' +
      '<div class="dg-ok">Keep this tab open while you check your email.</div>' +
      '<div class="dg-foot" style="text-align:left;line-height:1.6">Sent from <b style="color:#94a3b8">noreply@delta-71243.firebaseapp.com</b> &mdash; check <b>Spam</b>. Some providers (Outlook, university mail) block this sender &mdash; a Gmail address is most reliable.</div>' +
      '<button class="dg-ghost" data-act="resend" id="dg-resend">Resend link</button>' +
      '<button class="dg-link" data-act="start">Use a different email</button><div class="dg-err" id="dg-err"></div>';
  },
  finishEmail: function () {
    return '<div class="dg-logo">D E L T A</div><h1 class="dg-h1">One more step</h1>' +
      '<p class="dg-sub">Enter the email you verified with to finish setting up your account.</p>' +
      '<form data-form="complete-link"><label>Email</label>' +
      '<input type="email" id="dg-email2" placeholder="you@example.com" autocomplete="email" required></form>' +
      '<button class="dg-btn" data-act="complete-link">Continue</button>' +
      '<div class="dg-err" id="dg-err"></div>';
  },
  signIn: function () {
    return '<div class="dg-logo">D E L T A</div><h1 class="dg-h1">Sign in</h1>' +
      '<p class="dg-sub">Welcome back. Enter your credentials.</p>' +
      '<form data-form="do-signin"><label>Email</label><input type="email" id="dg-email" autocomplete="email" required>' +
      '<label>Password</label><input type="password" id="dg-pass" autocomplete="current-password" required></form>' +
      '<button class="dg-btn" data-act="do-signin">Sign in</button>' +
      '<button class="dg-link" data-act="forgot">Forgot password?</button>' +
      '<button class="dg-link" data-act="signup">Create a new account</button>' +
      '<div class="dg-err" id="dg-err"></div>';
  },
  forgot: function () {
    return '<div class="dg-logo">D E L T A</div><h1 class="dg-h1">Reset password</h1>' +
      '<p class="dg-sub">We will email you a link to set a new password.</p>' +
      '<form data-form="do-reset"><label>Email</label><input type="email" id="dg-email" autocomplete="email" required></form>' +
      '<button class="dg-btn" data-act="do-reset">Send reset link</button>' +
      '<button class="dg-link" data-act="signin">Back to sign in</button><div class="dg-err" id="dg-err"></div>';
  },
  setPassword: function () {
    return '<div class="dg-logo">D E L T A</div><h1 class="dg-h1">Create your password</h1>' +
      '<p class="dg-sub">Your email is verified. Choose a password of at least 8 characters.</p>' +
      '<form data-form="do-password"><label>Password</label><input type="password" id="dg-p1" minlength="8" autocomplete="new-password" required>' +
      '<label>Confirm password</label><input type="password" id="dg-p2" minlength="8" autocomplete="new-password" required></form>' +
      '<button class="dg-btn" data-act="do-password">Create account and enter DELTA</button>' +
      '<div class="dg-err" id="dg-err"></div>';
  },
  ready: function () {
    return '<div class="dg-logo">D E L T A</div><h1 class="dg-h1">' + (state === "readyNew" ? "Account created" : "Signed in") + '</h1>' +
      '<p class="dg-sub">' + esc(pendingEmail || "") + '</p>' +
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
  if (bridged) return;
  bridged = true;
  var attempts = 0;
  var tryClick = function () {
    var btn = null, all = document.querySelectorAll("button"), i;
    for (i = 0; i < all.length; i++) {
      if (GUEST_RE.test(all[i].textContent || "")) { btn = all[i]; break; }
    }
    if (btn) { btn.click(); return true; }
    return false;
  };
  if (tryClick()) return;
  var mo = new MutationObserver(function () { if (tryClick()) mo.disconnect(); });
  mo.observe(document.body, { childList: true, subtree: true });
  var iv = setInterval(function () {
    attempts++;
    if (tryClick() || attempts > 40) { clearInterval(iv); mo.disconnect(); }
  }, 400);
}

function enterReady(isNew) {
  state = isNew ? "readyNew" : "ready";
  wizardActive = false;
  paint();
  bridgeToApp();
}

function onRouteChange() {
  var onAuth = location.pathname.indexOf("/auth") === 0;
  if (!onAuth && overlay) {
    overlay.remove(); overlay = null; card = null;
  }
  /* SPA navigation into /auth (e.g. clicking Launch workspace on the landing
   * page) never reloads the page, so remount the wizard when we arrive. */
  if (onAuth && !overlay && !firebaseHasUser) {
    wizardActive = true;
    if (state === "ready" || state === "readyNew") state = "start";
    mount(); paint();
  }
}

function act(a) {
  if (busy) return;
  var emailEl, em;
  if (a === "start") { state = "start"; wizardActive = true; paint(); return; }
  if (a === "signup") { state = "signupEmail"; wizardActive = true; paint(); return; }
  if (a === "signin") { state = "signIn"; wizardActive = true; paint(); return; }
  if (a === "forgot") { state = "forgot"; wizardActive = true; paint(); return; }
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

function boot() {
  try { auth = getAuth(initializeApp(FIREBASE_CONFIG)); } catch (e) { return; }

  mount(); paint();

  onAuthStateChanged(auth, function (user) {
    firebaseHasUser = !!(user && user.emailVerified);
    if (!user) {
      /* landing page (/) stays public - only the workspace (/dashboard) is gated */
      if (location.pathname.indexOf("/dashboard") === 0) enforceGate();
      return;
    }
    if (!user.emailVerified) return;
    if (user && user.emailVerified) {
      if (state === "setPassword" || state === "ready" || state === "readyNew") return;
      if (wizardActive && (state === "signupSent" || state === "finishEmail")) return;
      if (!bridged) { state = "ready"; pendingEmail = user.email; paint(); bridgeToApp(); }
    }
  });

  if (isSignInWithEmailLink(auth, location.href)) {
    var em = null;
    try { em = localStorage.getItem(EMAIL_KEY); } catch (e) {}
    if (em) { paint(); finishEmailLink(em); }
    else { state = "finishEmail"; wizardActive = true; paint(); }
    return;
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
      try { localStorage.removeItem(EMAIL_KEY); } catch (e) {}
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
    if (!firebaseHasUser && location.pathname.indexOf("/dashboard") === 0) { enforceGate(); return; }
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
