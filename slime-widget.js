/* Klaut slime chat widget — drop-in for all klaut.id + compass.klaut.id static pages.
   Self-contained: injects its own CSS + DOM + handlers. No accessories, green slime,
   cycles through expressions (smile / excited / wink / look-up), bobs gently, opens
   a small chat-style panel on click with a "Book a call" CTA.

   Usage:  <script src="/slime-widget.js" defer></script>     (just include the tag) */

(function () {
  'use strict';
  if (window.__klautSlimeMounted) return;
  window.__klautSlimeMounted = true;

  /* ---------- CSS (scoped to .klaut-slime-*) ---------- */
  var css = ''
    + '.klaut-slime-fab{position:fixed;right:22px;bottom:22px;z-index:9998;width:88px;height:88px;background:none;border:0;padding:0;cursor:pointer;outline:0;display:grid;place-items:center;filter:drop-shadow(0 18px 36px rgba(0,0,0,.45));transition:transform .18s ease}'
    + '.klaut-slime-fab:hover{transform:translateY(-2px) scale(1.04)}'
    + '.klaut-slime-fab:focus-visible{outline:2px solid #6366f1;outline-offset:4px;border-radius:22px}'
    + '.klaut-slime-fab svg{width:100%;height:100%;overflow:visible;display:block;transform-box:fill-box;transform-origin:50% 92%;animation:klaut-slime-bob 3.6s ease-in-out infinite}'
    + '@keyframes klaut-slime-bob{0%,100%{transform:translateY(0) scaleY(1)}45%{transform:translateY(-5px) scaleY(.99)}55%{transform:translateY(-5px) scaleY(.99)}80%{transform:translateY(1.2px) scaleY(1.02)}}'
    + '.klaut-slime-fab[data-state="thinking"] svg{animation:klaut-slime-breathe 1.6s ease-in-out infinite}'
    + '@keyframes klaut-slime-breathe{0%,100%{transform:scaleY(.985)}50%{transform:scaleY(1.015)}}'
    + '.klaut-slime-bubble{position:fixed;right:22px;bottom:120px;z-index:9999;width:320px;max-width:calc(100vw - 44px);background:#11141b;border:1px solid #2e323c;border-radius:14px;padding:16px 18px;color:#e7ecf3;font-family:Inter,-apple-system,Segoe UI,system-ui,sans-serif;box-shadow:0 24px 60px -16px rgba(0,0,0,.55),0 6px 22px -6px rgba(0,0,0,.4);transform:translateY(8px);opacity:0;pointer-events:none;transition:transform .22s cubic-bezier(.2,.8,.2,1),opacity .18s ease;font-size:14px;line-height:1.55}'
    + '.klaut-slime-bubble.is-open{transform:translateY(0);opacity:1;pointer-events:auto}'
    + '.klaut-slime-bubble::after{content:"";position:absolute;right:34px;bottom:-7px;width:14px;height:14px;background:#11141b;border-right:1px solid #2e323c;border-bottom:1px solid #2e323c;transform:rotate(45deg)}'
    + '.klaut-slime-h{display:flex;align-items:center;gap:9px;font-size:12px;color:#a1a1aa;text-transform:uppercase;letter-spacing:.12em;font-weight:600;margin-bottom:8px}'
    + '.klaut-slime-h .klaut-slime-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.2);flex:none}'
    + '.klaut-slime-h-x{margin-left:auto;background:transparent;border:0;color:#71717a;cursor:pointer;font-size:18px;line-height:1;padding:2px 6px;border-radius:5px}'
    + '.klaut-slime-h-x:hover{color:#fff;background:rgba(255,255,255,.06)}'
    + '.klaut-slime-msg{color:#e7ecf3;font-size:14.5px;font-weight:500;margin:0 0 6px}'
    + '.klaut-slime-sub{color:#a1a1aa;font-size:12.5px;margin:0 0 14px;line-height:1.55}'
    + '.klaut-slime-cta{display:inline-flex;align-items:center;gap:7px;padding:9px 14px;background:#6366f1;color:#fff;text-decoration:none;font-weight:600;font-size:13px;border-radius:8px;transition:background .18s ease}'
    + '.klaut-slime-cta:hover{background:#4f46e5}'
    + '.klaut-slime-link{display:inline-flex;margin-left:8px;color:#a1a1aa;font-size:12.5px;text-decoration:none}'
    + '.klaut-slime-link:hover{color:#fff}'
    + '@media (prefers-reduced-motion:reduce){.klaut-slime-fab svg{animation:none}.klaut-slime-fab[data-state="thinking"] svg{animation:none}}';

  var style = document.createElement('style');
  style.setAttribute('data-klaut-slime', '');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- SVG: green slime, gumdrop body, 4 expression variants ---------- */
  // Body, blush, sparkles shared. Eyes + mouth swap per expression key.
  function svgFor(expr) {
    var body = ''
      + '<defs>'
      + '<linearGradient id="kslime-body" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0%" stop-color="#a8e063"/>'
      + '<stop offset="55%" stop-color="#7ed44d"/>'
      + '<stop offset="100%" stop-color="#5fb83a"/>'
      + '</linearGradient>'
      + '<radialGradient id="kslime-hi" cx="0.32" cy="0.28" r="0.22">'
      + '<stop offset="0%" stop-color="#ffffff" stop-opacity=".95"/>'
      + '<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>'
      + '</radialGradient>'
      + '</defs>'
      // gumdrop body — flat bottom, rounded top
      + '<path d="M 36,176 C 36,108 76,52 120,52 C 164,52 204,108 204,176 L 204,196 L 36,196 Z" fill="url(#kslime-body)" stroke="#2f6b22" stroke-width="3.2" stroke-linejoin="round"/>'
      // top-left highlight blob
      + '<ellipse cx="85" cy="92" rx="14" ry="9" fill="rgba(255,255,255,.85)"/>'
      // soft sheen
      + '<ellipse cx="120" cy="108" rx="84" ry="60" fill="url(#kslime-hi)"/>';

    // Cheek blush (only on excited)
    var blush = '';
    if (expr === 'excited') {
      blush = ''
        + '<ellipse cx="82" cy="148" rx="9" ry="5" fill="#f6a8b8" opacity=".85"/>'
        + '<ellipse cx="160" cy="148" rx="9" ry="5" fill="#f6a8b8" opacity=".85"/>';
    }

    // Sparkle (only on excited)
    var sparkle = '';
    if (expr === 'excited') {
      sparkle = ''
        + '<path d="M 178,72 L 181,80 L 189,83 L 181,86 L 178,94 L 175,86 L 167,83 L 175,80 Z" fill="#ffffff"/>'
        + '<circle cx="195" cy="72" r="2.4" fill="#ffffff"/>';
    }

    // Eyes
    var eyes = '';
    if (expr === 'smile') {
      eyes = ''
        + '<ellipse cx="98"  cy="132" rx="5" ry="6" fill="#1d2f12"/>'
        + '<ellipse cx="142" cy="132" rx="5" ry="6" fill="#1d2f12"/>'
        + '<ellipse cx="100" cy="129" rx="1.6" ry="1.8" fill="#ffffff"/>'
        + '<ellipse cx="144" cy="129" rx="1.6" ry="1.8" fill="#ffffff"/>';
    } else if (expr === 'excited') {
      eyes = ''
        // big sparkly eyes
        + '<ellipse cx="98"  cy="132" rx="8.5" ry="10" fill="#1d2f12"/>'
        + '<ellipse cx="142" cy="132" rx="8.5" ry="10" fill="#1d2f12"/>'
        + '<ellipse cx="101" cy="128" rx="3"   ry="3.4" fill="#ffffff"/>'
        + '<ellipse cx="145" cy="128" rx="3"   ry="3.4" fill="#ffffff"/>'
        + '<circle  cx="95"  cy="135" r="1.5" fill="#ffffff" opacity=".8"/>'
        + '<circle  cx="139" cy="135" r="1.5" fill="#ffffff" opacity=".8"/>';
    } else if (expr === 'wink') {
      // both eyes closed/curved
      eyes = ''
        + '<path d="M 90,134 Q 98,124 106,134" stroke="#1d2f12" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
        + '<path d="M 134,134 Q 142,124 150,134" stroke="#1d2f12" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
    } else if (expr === 'lookup') {
      // eyes glanced to upper-right
      eyes = ''
        + '<ellipse cx="98"  cy="132" rx="7" ry="9" fill="#ffffff" stroke="#1d2f12" stroke-width="2"/>'
        + '<ellipse cx="142" cy="132" rx="7" ry="9" fill="#ffffff" stroke="#1d2f12" stroke-width="2"/>'
        + '<ellipse cx="101" cy="128" rx="3.6" ry="4.5" fill="#1d2f12"/>'
        + '<ellipse cx="145" cy="128" rx="3.6" ry="4.5" fill="#1d2f12"/>';
    }

    // Mouth
    var mouth = '';
    if (expr === 'smile') {
      mouth = '<path d="M 104,156 Q 120,168 136,156" stroke="#1d2f12" stroke-width="3" fill="none" stroke-linecap="round"/>';
    } else if (expr === 'excited') {
      mouth = '<path d="M 102,156 Q 120,176 138,156 Q 130,170 110,170 Q 100,170 102,156 Z" fill="#1d2f12"/>';
    } else if (expr === 'wink') {
      // small smile + pink tongue sticking out the side
      mouth = ''
        + '<path d="M 100,158 Q 120,170 140,158" stroke="#1d2f12" stroke-width="3" fill="none" stroke-linecap="round"/>'
        + '<path d="M 140,160 Q 152,166 148,174 Q 142,170 138,164 Z" fill="#f06a8a" stroke="#1d2f12" stroke-width="1.6" stroke-linejoin="round"/>';
    } else if (expr === 'lookup') {
      mouth = '<path d="M 106,158 Q 120,166 134,158" stroke="#1d2f12" stroke-width="3" fill="none" stroke-linecap="round"/>';
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
      // Don't disturb during open chat — leave on current
      if (bubble.classList.contains('is-open')) return;
      fab.innerHTML = svgFor(EXPRS[idleIdx]);
    }, 4200);
  }
  function stopIdle() { if (idleTimer) { clearInterval(idleTimer); idleTimer = null; } }

  fab.addEventListener('mouseenter', function () { fab.innerHTML = svgFor('excited'); });
  fab.addEventListener('mouseleave', function () {
    if (!bubble.classList.contains('is-open')) fab.innerHTML = svgFor(EXPRS[idleIdx]);
  });

  /* ---------- open/close ---------- */
  function open() {
    bubble.classList.add('is-open');
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
  bubble.querySelector('.klaut-slime-h-x').addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && bubble.classList.contains('is-open')) close();
  });

  startIdle();
})();
