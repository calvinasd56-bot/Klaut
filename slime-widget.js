/* Klaut slime chat widget — drop-in for all klaut.id + compass.klaut.id static pages.
   Self-contained: injects its own CSS + DOM + handlers. No accessories. Klaut-blue
   slime per brand_klaut.md (Electric Blue #4F6BFF + Soft Blue #BFCBFF + Midnight stroke).
   Cycles through 4 expressions (smile / excited / wink / lookup), bobs gently, and
   periodically "talks" via a small floating speech bubble. Click opens a chat panel.

   Usage:  <script src="/slime-widget.js" defer></script> */

(function () {
  'use strict';
  if (window.__klautSlimeMounted) return;
  window.__klautSlimeMounted = true;

  /* ---------- brand colors (locked to brand_klaut.md) ---------- */
  var C_TOP    = '#BFCBFF'; // Soft Blue — top highlight
  var C_MID    = '#4F6BFF'; // Electric Blue — primary
  var C_DEEP   = '#2D43C9'; // darker tone of Electric Blue for bottom of body
  var C_STROKE = '#0B0F1A'; // Midnight — outline
  var C_BLUSH  = '#f6a8b8'; // pink cheeks for excited (kept; not in brand but warm)
  var C_TONGUE = '#f06a8a'; // pink tongue for wink

  /* ---------- CSS (scoped to .klaut-slime-*) ---------- */
  var css = ''
    + '.klaut-slime-fab{position:fixed;right:22px;bottom:22px;z-index:9998;width:88px;height:88px;background:none;border:0;padding:0;cursor:pointer;outline:0;display:grid;place-items:center;filter:drop-shadow(0 18px 36px rgba(11,15,26,.55)) drop-shadow(0 0 22px rgba(79,107,255,.18));transition:transform .18s ease}'
    + '.klaut-slime-fab:hover{transform:translateY(-2px) scale(1.04)}'
    + '.klaut-slime-fab:focus-visible{outline:2px solid #4F6BFF;outline-offset:4px;border-radius:22px}'
    + '.klaut-slime-fab svg{width:100%;height:100%;overflow:visible;display:block;transform-box:fill-box;transform-origin:50% 92%;animation:klaut-slime-bob 3.6s ease-in-out infinite}'
    + '@keyframes klaut-slime-bob{0%,100%{transform:translateY(0) scaleY(1)}45%{transform:translateY(-5px) scaleY(.99)}55%{transform:translateY(-5px) scaleY(.99)}80%{transform:translateY(1.2px) scaleY(1.02)}}'
    + '.klaut-slime-fab[data-state="thinking"] svg{animation:klaut-slime-breathe 1.6s ease-in-out infinite}'
    + '@keyframes klaut-slime-breathe{0%,100%{transform:scaleY(.985)}50%{transform:scaleY(1.015)}}'
    + '.klaut-slime-say{position:fixed;right:118px;bottom:62px;z-index:9997;max-width:240px;background:#0B0F1A;border:1px solid rgba(79,107,255,.45);border-radius:14px;padding:10px 14px;color:#fff;font:500 13px/1.4 Inter,-apple-system,Segoe UI,system-ui,sans-serif;box-shadow:0 14px 32px -10px rgba(11,15,26,.6),0 0 0 1px rgba(79,107,255,.1);transform:translateX(8px) scale(.94);opacity:0;pointer-events:none;transition:transform .26s cubic-bezier(.2,.8,.2,1),opacity .22s ease}'
    + '.klaut-slime-say.is-open{transform:translateX(0) scale(1);opacity:1}'
    + '.klaut-slime-say::after{content:"";position:absolute;right:-7px;bottom:18px;width:12px;height:12px;background:#0B0F1A;border-right:1px solid rgba(79,107,255,.45);border-bottom:1px solid rgba(79,107,255,.45);transform:rotate(-45deg)}'
    + '.klaut-slime-say .klaut-slime-say-txt{display:inline-block}'
    + '.klaut-slime-say .klaut-slime-say-cursor{display:inline-block;width:1px;height:14px;background:#BFCBFF;margin-left:1px;vertical-align:-2px;animation:klaut-slime-cursor 0.9s steps(2,start) infinite}'
    + '@keyframes klaut-slime-cursor{50%{opacity:0}}'
    + '.klaut-slime-bubble{position:fixed;right:22px;bottom:120px;z-index:9999;width:320px;max-width:calc(100vw - 44px);background:#0B0F1A;border:1px solid rgba(79,107,255,.35);border-radius:14px;padding:16px 18px;color:#fff;font-family:Inter,-apple-system,Segoe UI,system-ui,sans-serif;box-shadow:0 24px 60px -16px rgba(11,15,26,.7),0 0 0 1px rgba(79,107,255,.08),0 6px 22px -6px rgba(11,15,26,.5);transform:translateY(8px);opacity:0;pointer-events:none;transition:transform .22s cubic-bezier(.2,.8,.2,1),opacity .18s ease;font-size:14px;line-height:1.55}'
    + '.klaut-slime-bubble.is-open{transform:translateY(0);opacity:1;pointer-events:auto}'
    + '.klaut-slime-bubble::after{content:"";position:absolute;right:34px;bottom:-7px;width:14px;height:14px;background:#0B0F1A;border-right:1px solid rgba(79,107,255,.35);border-bottom:1px solid rgba(79,107,255,.35);transform:rotate(45deg)}'
    + '.klaut-slime-h{display:flex;align-items:center;gap:9px;font-size:12px;color:#8B93A7;text-transform:uppercase;letter-spacing:.12em;font-weight:600;margin-bottom:8px}'
    + '.klaut-slime-h .klaut-slime-dot{width:8px;height:8px;border-radius:50%;background:#4F6BFF;box-shadow:0 0 0 3px rgba(79,107,255,.22);flex:none}'
    + '.klaut-slime-h-x{margin-left:auto;background:transparent;border:0;color:#8B93A7;cursor:pointer;font-size:18px;line-height:1;padding:2px 6px;border-radius:5px}'
    + '.klaut-slime-h-x:hover{color:#fff;background:rgba(255,255,255,.06)}'
    + '.klaut-slime-msg{color:#fff;font-size:14.5px;font-weight:500;margin:0 0 6px}'
    + '.klaut-slime-sub{color:#8B93A7;font-size:12.5px;margin:0 0 14px;line-height:1.55}'
    + '.klaut-slime-cta{display:inline-flex;align-items:center;gap:7px;padding:9px 14px;background:#4F6BFF;color:#fff;text-decoration:none;font-weight:600;font-size:13px;border-radius:8px;transition:background .18s ease}'
    + '.klaut-slime-cta:hover{background:#2D43C9}'
    + '.klaut-slime-link{display:inline-flex;margin-left:8px;color:#8B93A7;font-size:12.5px;text-decoration:none}'
    + '.klaut-slime-link:hover{color:#BFCBFF}'
    + '@media (prefers-reduced-motion:reduce){.klaut-slime-fab svg{animation:none}.klaut-slime-fab[data-state="thinking"] svg{animation:none}.klaut-slime-say .klaut-slime-say-cursor{animation:none}}'
    + '@media (max-width:640px){.klaut-slime-say{display:none}}';

  var style = document.createElement('style');
  style.setAttribute('data-klaut-slime', '');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- SVG: Klaut-blue slime, gumdrop body, 4 expression variants ---------- */
  function svgFor(expr) {
    var body = ''
      + '<defs>'
      + '<linearGradient id="kslime-body" x1="0" y1="0" x2="0" y2="1">'
      +   '<stop offset="0%" stop-color="' + C_TOP + '"/>'
      +   '<stop offset="55%" stop-color="' + C_MID + '"/>'
      +   '<stop offset="100%" stop-color="' + C_DEEP + '"/>'
      + '</linearGradient>'
      + '<radialGradient id="kslime-hi" cx="0.32" cy="0.28" r="0.22">'
      +   '<stop offset="0%" stop-color="#ffffff" stop-opacity=".95"/>'
      +   '<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>'
      + '</radialGradient>'
      + '</defs>'
      // gumdrop body — flat bottom, rounded top
      + '<path d="M 36,176 C 36,108 76,52 120,52 C 164,52 204,108 204,176 L 204,196 L 36,196 Z" fill="url(#kslime-body)" stroke="' + C_STROKE + '" stroke-width="3.2" stroke-linejoin="round"/>'
      // top-left highlight blob
      + '<ellipse cx="85" cy="92" rx="14" ry="9" fill="rgba(255,255,255,.85)"/>'
      // soft sheen
      + '<ellipse cx="120" cy="108" rx="84" ry="60" fill="url(#kslime-hi)"/>';

    var blush = '';
    if (expr === 'excited') {
      blush = ''
        + '<ellipse cx="82" cy="148" rx="9" ry="5" fill="' + C_BLUSH + '" opacity=".85"/>'
        + '<ellipse cx="160" cy="148" rx="9" ry="5" fill="' + C_BLUSH + '" opacity=".85"/>';
    }

    var sparkle = '';
    if (expr === 'excited') {
      sparkle = ''
        + '<path d="M 178,72 L 181,80 L 189,83 L 181,86 L 178,94 L 175,86 L 167,83 L 175,80 Z" fill="#ffffff"/>'
        + '<circle cx="195" cy="72" r="2.4" fill="#ffffff"/>';
    }

    var eyes = '';
    if (expr === 'smile') {
      eyes = ''
        + '<ellipse cx="98"  cy="132" rx="5" ry="6" fill="' + C_STROKE + '"/>'
        + '<ellipse cx="142" cy="132" rx="5" ry="6" fill="' + C_STROKE + '"/>'
        + '<ellipse cx="100" cy="129" rx="1.6" ry="1.8" fill="#ffffff"/>'
        + '<ellipse cx="144" cy="129" rx="1.6" ry="1.8" fill="#ffffff"/>';
    } else if (expr === 'excited') {
      eyes = ''
        + '<ellipse cx="98"  cy="132" rx="8.5" ry="10" fill="' + C_STROKE + '"/>'
        + '<ellipse cx="142" cy="132" rx="8.5" ry="10" fill="' + C_STROKE + '"/>'
        + '<ellipse cx="101" cy="128" rx="3"   ry="3.4" fill="#ffffff"/>'
        + '<ellipse cx="145" cy="128" rx="3"   ry="3.4" fill="#ffffff"/>'
        + '<circle  cx="95"  cy="135" r="1.5" fill="#ffffff" opacity=".8"/>'
        + '<circle  cx="139" cy="135" r="1.5" fill="#ffffff" opacity=".8"/>';
    } else if (expr === 'wink') {
      eyes = ''
        + '<path d="M 90,134 Q 98,124 106,134" stroke="' + C_STROKE + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
        + '<path d="M 134,134 Q 142,124 150,134" stroke="' + C_STROKE + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
    } else if (expr === 'lookup') {
      eyes = ''
        + '<ellipse cx="98"  cy="132" rx="7" ry="9" fill="#ffffff" stroke="' + C_STROKE + '" stroke-width="2"/>'
        + '<ellipse cx="142" cy="132" rx="7" ry="9" fill="#ffffff" stroke="' + C_STROKE + '" stroke-width="2"/>'
        + '<ellipse cx="101" cy="128" rx="3.6" ry="4.5" fill="' + C_STROKE + '"/>'
        + '<ellipse cx="145" cy="128" rx="3.6" ry="4.5" fill="' + C_STROKE + '"/>';
    }

    var mouth = '';
    if (expr === 'smile') {
      mouth = '<path d="M 104,156 Q 120,168 136,156" stroke="' + C_STROKE + '" stroke-width="3" fill="none" stroke-linecap="round"/>';
    } else if (expr === 'excited') {
      mouth = '<path d="M 102,156 Q 120,176 138,156 Q 130,170 110,170 Q 100,170 102,156 Z" fill="' + C_STROKE + '"/>';
    } else if (expr === 'wink') {
      mouth = ''
        + '<path d="M 100,158 Q 120,170 140,158" stroke="' + C_STROKE + '" stroke-width="3" fill="none" stroke-linecap="round"/>'
        + '<path d="M 140,160 Q 152,166 148,174 Q 142,170 138,164 Z" fill="' + C_TONGUE + '" stroke="' + C_STROKE + '" stroke-width="1.6" stroke-linejoin="round"/>';
    } else if (expr === 'lookup') {
      mouth = '<path d="M 106,158 Q 120,166 134,158" stroke="' + C_STROKE + '" stroke-width="3" fill="none" stroke-linecap="round"/>';
    }

    return '<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + body + blush + sparkle + eyes + mouth + '</svg>';
  }

  /* ---------- mount DOM ---------- */
  var fab = document.createElement('button');
  fab.className = 'klaut-slime-fab';
  fab.type = 'button';
  fab.setAttribute('aria-label', 'Klaut assistant — open chat');
  fab.setAttribute('aria-expanded', 'false');
  fab.dataset.state = 'idle';
  fab.innerHTML = svgFor('smile');

  // Floating "speech" bubble (separate from the click-to-open chat panel).
  var say = document.createElement('div');
  say.className = 'klaut-slime-say';
  say.setAttribute('role', 'status');
  say.setAttribute('aria-live', 'polite');
  say.innerHTML = '<span class="klaut-slime-say-txt"></span><span class="klaut-slime-say-cursor"></span>';

  var bubble = document.createElement('div');
  bubble.className = 'klaut-slime-bubble';
  bubble.setAttribute('role', 'dialog');
  bubble.setAttribute('aria-label', 'Klaut assistant');
  bubble.innerHTML = ''
    + '<div class="klaut-slime-h">'
    +   '<span class="klaut-slime-dot"></span>Klaut'
    +   '<button class="klaut-slime-h-x" type="button" aria-label="Close" title="Close">&times;</button>'
    + '</div>'
    + '<p class="klaut-slime-msg">Hi! I\'m the Klaut slime. Want to see Compass?</p>'
    + '<p class="klaut-slime-sub">Book a 30-min walkthrough — we\'ll show how Compass fits your team.</p>'
    + '<a class="klaut-slime-cta" href="https://calendar.app.google/gey4SNwkcNYrbBpVA" target="_blank" rel="noopener">'
    +   'Book a call'
    +   '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>'
    + '</a>'
    + '<a class="klaut-slime-link" href="https://compass-app.klaut.id/" target="_blank" rel="noopener">Try demo &rsaquo;</a>';

  document.body.appendChild(say);
  document.body.appendChild(bubble);
  document.body.appendChild(fab);

  /* ---------- expression cycling ---------- */
  var EXPRS = ['smile','excited','wink','lookup'];
  var idleIdx = 0;
  var idleTimer = null;
  function startIdle() {
    stopIdle();
    idleTimer = setInterval(function () {
      idleIdx = (idleIdx + 1) % EXPRS.length;
      if (bubble.classList.contains('is-open')) return;
      fab.innerHTML = svgFor(EXPRS[idleIdx]);
    }, 4200);
  }
  function stopIdle() { if (idleTimer) { clearInterval(idleTimer); idleTimer = null; } }

  fab.addEventListener('mouseenter', function () { fab.innerHTML = svgFor('excited'); });
  fab.addEventListener('mouseleave', function () {
    if (!bubble.classList.contains('is-open')) fab.innerHTML = svgFor(EXPRS[idleIdx]);
  });

  /* ---------- "ngomong" — periodic speech bubble with typed-in messages ---------- */
  var LINES = [
    "Halo! I'm Klaut 👋",
    "Need a hand?",
    "Workforce intelligence for the AI transition.",
    "We integrate your tools + AI stacks.",
    "30-min walkthrough? Click me.",
    "Compass aligns three parties at once.",
    "Human-first. AI second.",
    "Want to see the demo?"
  ];
  var sayTxt = say.querySelector('.klaut-slime-say-txt');
  var sayTimer = null;
  var sayTypeTimer = null;
  var sayHideTimer = null;
  var sayClosed = false; // user dismissed the chat — pause talking
  var prm = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;

  function typeOut(text, done) {
    sayTxt.textContent = '';
    if (prm) { sayTxt.textContent = text; if (done) setTimeout(done, 0); return; }
    var i = 0;
    clearInterval(sayTypeTimer);
    sayTypeTimer = setInterval(function () {
      sayTxt.textContent = text.slice(0, ++i);
      if (i >= text.length) { clearInterval(sayTypeTimer); sayTypeTimer = null; if (done) done(); }
    }, 28);
  }

  function speak() {
    if (sayClosed) return;
    if (bubble.classList.contains('is-open')) return; // don't talk while chat panel open
    var line = LINES[Math.floor(Math.random() * LINES.length)];
    say.classList.add('is-open');
    fab.innerHTML = svgFor('excited');
    typeOut(line, function () {
      clearTimeout(sayHideTimer);
      sayHideTimer = setTimeout(function () {
        say.classList.remove('is-open');
        if (!bubble.classList.contains('is-open')) fab.innerHTML = svgFor(EXPRS[idleIdx]);
      }, 4200);
    });
  }
  function startTalking() {
    // first chirp after 6s, then every 18-30s
    setTimeout(function () { speak(); scheduleNext(); }, 6000);
  }
  function scheduleNext() {
    clearTimeout(sayTimer);
    var delay = 18000 + Math.random() * 12000;
    sayTimer = setTimeout(function () { speak(); scheduleNext(); }, delay);
  }
  // pause talking when tab is hidden, resume when visible
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { clearTimeout(sayTimer); clearInterval(sayTypeTimer); clearTimeout(sayHideTimer); }
    else if (!sayClosed) { scheduleNext(); }
  });

  /* ---------- open/close ---------- */
  function open() {
    bubble.classList.add('is-open');
    say.classList.remove('is-open');
    fab.setAttribute('aria-expanded', 'true');
    fab.innerHTML = svgFor('excited');
  }
  function close() {
    bubble.classList.remove('is-open');
    fab.setAttribute('aria-expanded', 'false');
    fab.innerHTML = svgFor(EXPRS[idleIdx]);
  }
  fab.addEventListener('click', function () {
    if (bubble.classList.contains('is-open')) close(); else open();
  });
  bubble.querySelector('.klaut-slime-h-x').addEventListener('click', function () {
    close();
    sayClosed = true; // user closed the chat — stop talking automatically
    clearTimeout(sayTimer); say.classList.remove('is-open');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && bubble.classList.contains('is-open')) close();
  });

  startIdle();
  startTalking();
})();
