/* ================================================================
   Compass Slime Widget — shared external JS
   Source: compass-app/pricing.html (commit 5f87a28)
   Serves: compass.klaut.id + klaut.id (both repos get identical copy)
   Lang: reads window.__slimeLang ('en'|'id', default 'en')
   Set BEFORE this script: <script>window.__slimeLang='id';</script>
   2026-05-28
   ================================================================ */
/* ================================================================
   Compass Slime Widget (EN) — pricing-page port
   Extracted surgically from dashboard/index.html (source untouched).
   No Supabase, no auth, no dashboard render paths.
   ================================================================ */
(function(){
'use strict';
/* Idempotency: skip if widget already mounted (external file loaded twice) */
if(document.getElementById('slime-fab')){return;}

/* ── stubs: satisfy engine dependencies without dashboard ── */
const $=(id)=>document.getElementById(id);
const esc=(s)=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
var _slimeAdapterProxy=null;
var DATA=null;
var view="personal";
var chatOpen=false;
var aiState="idle";
var aiBusy=false;
var learnProfile=null;
var learnState={};
var wishlist={};
var _liveMode=false;
const _prm=!!(window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches);

/* onboarding: reads real localStorage so returning visitors keep their hatched slime */
const OB_KEY="klaut_compass_onboarding";
function loadOB(){try{const o=JSON.parse(localStorage.getItem(OB_KEY));if(o&&o.answers)return o;}catch(e){}return{done:false,locked:false,answers:{}};}
function saveOB(){try{localStorage.setItem(OB_KEY,JSON.stringify(onboarding));}catch(e){}}
var onboarding=loadOB();
if(!onboarding.slime)onboarding.slime={};

/* toast uses #slime-toast (no conflict with existing page elements) */
var _toastTmr=null;
function toast(m){
  const t=document.getElementById("slime-toast");if(!t)return;
  t.textContent=m;t.style.opacity="1";t.style.transform="translateX(-50%) translateY(0)";
  clearTimeout(_toastTmr);
  _toastTmr=setTimeout(()=>{t.style.opacity="0";t.style.transform="translateX(-50%) translateY(20px)";},3200);
}

/* _showFabBubble, _fabBubbleTmr, _isFabQuipsEnabled, _setFabQuipsEnabled
   are declared inside Block 5 (engine) — do NOT pre-declare them here */

/* ── getElementById redirect: route ai-fab/ai-nudge/toast → pricing elements ── */
const _realGet=document.getElementById.bind(document);
function _patchedGet(id){
  if(id==="ai-fab")   return _realGet("slime-fab");
  if(id==="ai-nudge") return _realGet("slime-nudge");
  if(id==="toast")    return _realGet("slime-toast");
  return _realGet(id);
}
document.getElementById=_patchedGet;

/* ─────────────────────────────────────────────────────────────────────────────
   ENGINE — surgically extracted from dashboard/index.html
   Blocks: THEMES + SLIME_ACCS + ACC_SVG + SLIME_MODELS + BODY_PATH_V2 + BODY_PATHS
           slimeSVG + defaultSlime + curSlime + slimeModel + rollSlime + modelLabel
           slimeName + TEMPERAMENT + slimeTemp + monthKey + awardActive +
           monthEndLabel + ensureAward + teammateSlime + applySlime
           OB_TYPES + obAccSvg + OB_BODIES + OB_FACES + buildDesignSlime
           setEmo + slimeAnim + slimeBlink + slimeEmote + FACE_WEIGHTS_BY_MOOD + cycleFaces
           FAB_QUIPS + getAiSummaries + _startFabQuipLoop
           _FAB_COLOR_TOKENS + refreshFabSlime + syncDesignSlimeToEngine
           syncAiPanelTitle + aiInit
   ───────────────────────────────────────────────────────────────────────── */

/* Block 1: colour palette + shape data */
const THEMES={
  klaut:  {name:"Klaut",  light:"#BFCBFF", mid:"#4F6BFF", dark:"#2D43C9", outline:"#0B0F1A", blush:"#f6a8b8",
           a:"#BFCBFF", b:"#7C92FF", c:"#4F6BFF", d:"#2D43C9", think:"#dde4ff", glow:"79,107,255",  deep:"11,15,26"},
  green:  {name:"Green",  light:"#A8EE85", mid:"#6CD261", dark:"#3FB14F", outline:"#14391F", blush:"#FF7A9B",
           a:"#A8EE85", b:"#6CD261", c:"#3FB14F", d:"#1F5A2E", think:"#c8f5b0", glow:"108,210,97",  deep:"20,57,31"},
  blue:   {name:"Blue",   light:"#A8DEFF", mid:"#5DB8F2", dark:"#2E80D6", outline:"#0F2A48", blush:"#FF7A9B",
           a:"#A8DEFF", b:"#5DB8F2", c:"#2E80D6", d:"#0F2A48", think:"#d6f0ff", glow:"93,184,242",  deep:"15,42,72"},
  indigo: {name:"Indigo", light:"#D8CFFE", mid:"#9C8FFA", dark:"#5346E0", outline:"#1B1850", blush:"#FF7A9B",
           a:"#D8CFFE", b:"#9C8FFA", c:"#5346E0", d:"#1B1850", think:"#ebe6ff", glow:"156,143,250", deep:"27,24,80"},
  pink:   {name:"Pink",   light:"#FCD7E9", mid:"#F49DC5", dark:"#E5408C", outline:"#4A0D2D", blush:"#C53030",
           a:"#FCD7E9", b:"#F49DC5", c:"#E5408C", d:"#4A0D2D", think:"#fdebf3", glow:"244,157,197", deep:"74,13,45"},
  amber:  {name:"Amber",  light:"#FFE68C", mid:"#FBBF24", dark:"#D97706", outline:"#3A2200", blush:"#C53030",
           a:"#FFE68C", b:"#FBBF24", c:"#D97706", d:"#3A2200", think:"#fff2b8", glow:"251,191,36",  deep:"58,34,0"},
  red:    {name:"Red",    light:"#FFB4B4", mid:"#F87171", dark:"#DC2626", outline:"#3F0A0A", blush:"#7c1d1d",
           a:"#FFB4B4", b:"#F87171", c:"#DC2626", d:"#3F0A0A", think:"#ffcccc", glow:"248,113,113", deep:"63,10,10"},
};
/* v2 cosmetics — all on viewBox 240×240; reference var(--slime-out) and
   var(--slime-blush) so they tone with the body. Labels are cosmetic-only;
   persona names (Detective, Researcher etc.) are internal docs not in UI. */
const SLIME_ACCS=[
  ["none","None"],["fedora","Fedora"],["monocle","Monocle"],["cowboy","Cowboy hat"],
  ["sunglasses","Sunglasses"],["headset","Headset"],["bowtie","Bow tie"],
  ["hardhat","Hard hat"],["chef","Chef toque"],["grad","Graduation cap"],
  ["wizard","Wizard hat"],["dev","Dev cap"],["reader","Reader specs"],
  ["crown","Crown"],["headphones","Headphones"],["party","Party hat"],["coffee","Coffee"]
];
const ACC_SVG={
  none:"",
  fedora:`<g class="acc fedora"><ellipse cx="120" cy="62" rx="62" ry="6" fill="black" opacity="0.22"/><path d="M 56,58 Q 70,49 120,49 Q 170,49 184,58 Q 178,67 120,67 Q 62,67 56,58 Z" fill="#2a2a2e" stroke="#0c0c10" stroke-width="2" stroke-linejoin="round"/><path d="M 90,52 Q 92,20 120,16 Q 148,20 150,52 Z" fill="#3a3a40" stroke="#0c0c10" stroke-width="2" stroke-linejoin="round"/><path d="M 110,18 Q 120,24 130,18" fill="none" stroke="#0c0c10" stroke-width="1.5" stroke-linecap="round"/><path d="M 92,48 Q 120,54 148,48 L 148,52 Q 120,58 92,52 Z" fill="#4F6BFF"/><path d="M 100,28 Q 104,22 112,20" stroke="white" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.35"/></g>`,
  monocle:`<g class="acc monocle"><circle cx="145" cy="132" r="16" fill="none" stroke="#D4A93C" stroke-width="3"/><circle cx="145" cy="132" r="16" fill="white" opacity="0.06"/><path d="M 158,140 Q 168,160 172,182" stroke="#D4A93C" stroke-width="1.5" fill="none" stroke-dasharray="2 3"/></g>`,
  cowboy:`<g class="acc cowboy"><ellipse cx="120" cy="65" rx="74" ry="6" fill="black" opacity="0.22"/><path d="M 46,62 Q 120,76 194,62 Q 210,57 200,52 Q 175,32 120,32 Q 65,32 40,52 Q 30,57 46,62 Z" fill="#8B5A2B" stroke="#3a210c" stroke-width="2" stroke-linejoin="round"/><path d="M 84,52 Q 80,18 120,12 Q 160,18 156,52 Q 150,40 132,38 Q 120,46 108,38 Q 90,40 84,52 Z" fill="#A1693A" stroke="#3a210c" stroke-width="2" stroke-linejoin="round"/><path d="M 84,50 Q 120,58 156,50 L 156,54 Q 120,62 84,54 Z" fill="#3a210c"/><path d="M 120,52 l 2,5 5,1 -4,3 1,5 -4,-3 -4,3 1,-5 -4,-3 5,-1 z" fill="#F5D77A" stroke="#3a210c" stroke-width="0.5"/></g>`,
  sunglasses:`<g class="acc sunglasses"><path d="M 110,124 Q 120,118 130,124" stroke="#1c1c1c" stroke-width="3.5" fill="none" stroke-linecap="round"/><rect x="70" y="116" width="44" height="30" rx="13" fill="#1c1c1c" stroke="#0a0a0a" stroke-width="1.5"/><rect x="126" y="116" width="44" height="30" rx="13" fill="#1c1c1c" stroke="#0a0a0a" stroke-width="1.5"/><path d="M 70,126 Q 60,124 50,128" stroke="#1c1c1c" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M 170,126 Q 180,124 190,128" stroke="#1c1c1c" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M 78,122 L 86,122 L 80,134 L 74,134 Z" fill="white" opacity="0.35"/><path d="M 134,122 L 142,122 L 136,134 L 130,134 Z" fill="white" opacity="0.35"/></g>`,
  headset:`<g class="acc headset"><path d="M 56,128 Q 60,30 120,28 Q 180,30 184,128" stroke="#222229" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M 56,128 Q 60,30 120,28 Q 180,30 184,128" stroke="#3a3a45" stroke-width="2.5" fill="none" stroke-linecap="round"/><rect x="42" y="118" width="22" height="34" rx="8" fill="#222229" stroke="#0a0a0a" stroke-width="1.5"/><rect x="46" y="122" width="14" height="26" rx="4" fill="#3a3a45"/><rect x="176" y="118" width="22" height="34" rx="8" fill="#222229" stroke="#0a0a0a" stroke-width="1.5"/><rect x="180" y="122" width="14" height="26" rx="4" fill="#3a3a45"/><path d="M 64,148 Q 70,170 90,176" stroke="#222229" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="92" cy="178" r="5" fill="#222229"/><circle cx="92" cy="178" r="2" fill="#4F6BFF"/><circle cx="187" cy="135" r="2.5" fill="#22c55e"/></g>`,
  bowtie:`<g class="acc bowtie"><path d="M 92,200 L 92,222 L 116,212 Z" fill="#4F6BFF" stroke="var(--slime-out)" stroke-width="2" stroke-linejoin="round"/><path d="M 148,200 L 148,222 L 124,212 Z" fill="#4F6BFF" stroke="var(--slime-out)" stroke-width="2" stroke-linejoin="round"/><rect x="115" y="206" width="10" height="12" rx="2" fill="#3854E5" stroke="var(--slime-out)" stroke-width="2"/><path d="M 98,206 L 110,209" stroke="white" stroke-width="1.5" opacity="0.4" stroke-linecap="round"/></g>`,
  hardhat:`<g class="acc hardhat"><ellipse cx="120" cy="62" rx="58" ry="5" fill="black" opacity="0.22"/><path d="M 62,60 Q 70,55 120,55 Q 170,55 178,60 Q 174,68 120,68 Q 66,68 62,60 Z" fill="#FBBF24" stroke="#5a3d00" stroke-width="2" stroke-linejoin="round"/><path d="M 76,58 Q 80,20 120,18 Q 160,20 164,58 Z" fill="#FCD34D" stroke="#5a3d00" stroke-width="2" stroke-linejoin="round"/><path d="M 120,18 Q 118,38 120,58" stroke="#5a3d00" stroke-width="1.5" fill="none"/><rect x="92" y="40" width="6" height="3" rx="1" fill="#5a3d00"/><rect x="142" y="40" width="6" height="3" rx="1" fill="#5a3d00"/><rect x="108" y="32" width="24" height="10" rx="2" fill="#0a0a0a"/><text x="120" y="40" text-anchor="middle" font-family="Inter,sans-serif" font-size="7" font-weight="700" fill="#FBBF24" letter-spacing="0.5">KLAUT</text><path d="M 88,30 Q 94,22 104,20" stroke="white" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.5"/></g>`,
  chef:`<g class="acc chef"><rect x="78" y="48" width="84" height="14" rx="3" fill="#f5f5f5" stroke="var(--slime-out)" stroke-width="2"/><circle cx="88" cy="32" r="18" fill="#fafafa" stroke="var(--slime-out)" stroke-width="2"/><circle cx="120" cy="22" r="22" fill="#fafafa" stroke="var(--slime-out)" stroke-width="2"/><circle cx="152" cy="32" r="18" fill="#fafafa" stroke="var(--slime-out)" stroke-width="2"/><rect x="78" y="48" width="84" height="14" rx="3" fill="#f5f5f5" stroke="var(--slime-out)" stroke-width="2"/><ellipse cx="82" cy="26" rx="5" ry="3" fill="white" opacity="0.9"/><ellipse cx="115" cy="14" rx="6" ry="3" fill="white" opacity="0.9"/></g>`,
  grad:`<g class="acc grad"><ellipse cx="120" cy="54" rx="40" ry="8" fill="#0c0c12" stroke="#000" stroke-width="1"/><path d="M 60,42 L 120,28 L 180,42 L 120,56 Z" fill="#1a1a22" stroke="#000" stroke-width="2" stroke-linejoin="round"/><circle cx="120" cy="38" r="3" fill="#4F6BFF"/><path d="M 120,38 Q 165,38 168,62" stroke="#D4A93C" stroke-width="2" fill="none"/><path d="M 164,60 L 172,60 L 170,76 L 166,76 Z" fill="#D4A93C"/></g>`,
  wizard:`<g class="acc wizard"><ellipse cx="120" cy="58" rx="56" ry="5" fill="black" opacity="0.22"/><path d="M 58,56 Q 70,48 120,48 Q 170,48 182,56 Q 175,64 120,64 Q 65,64 58,56 Z" fill="#3b2168" stroke="#190a36" stroke-width="2" stroke-linejoin="round"/><path d="M 88,52 Q 105,40 100,8 Q 130,18 152,52 Z" fill="#5b3aa3" stroke="#190a36" stroke-width="2" stroke-linejoin="round"/><path d="M 115,36 l 1,3 3,0.5 -2.5,2 0.5,3 -2,-1.5 -2,1.5 0.5,-3 -2.5,-2 3,-0.5 z" fill="#FCD34D"/><path d="M 135,28 l 1,3 3,0.5 -2.5,2 0.5,3 -2,-1.5 -2,1.5 0.5,-3 -2.5,-2 3,-0.5 z" fill="#FCD34D"/><circle cx="105" cy="44" r="1.5" fill="#FCD34D"/><circle cx="142" cy="45" r="1.2" fill="#FCD34D"/></g>`,
  dev:`<g class="acc dev"><path d="M 78,54 Q 80,18 120,16 Q 162,18 168,54 Q 130,60 78,54 Z" fill="#1a1a1a" stroke="#000" stroke-width="2" stroke-linejoin="round"/><path d="M 168,54 Q 178,52 188,54" stroke="#000" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="178" y="50" width="6" height="8" rx="1" fill="#3a3a45"/><text x="120" y="42" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" font-weight="700" fill="#4F6BFF" letter-spacing="0.8">{}</text></g>`,
  reader:`<g class="acc reader"><circle cx="95" cy="132" r="14" fill="none" stroke="var(--slime-out)" stroke-width="2.5"/><circle cx="145" cy="132" r="14" fill="none" stroke="var(--slime-out)" stroke-width="2.5"/><path d="M 109,132 L 131,132" stroke="var(--slime-out)" stroke-width="2.5" stroke-linecap="round"/><path d="M 81,132 Q 72,130 64,134" stroke="var(--slime-out)" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M 159,132 Q 168,130 176,134" stroke="var(--slime-out)" stroke-width="2" fill="none" stroke-linecap="round"/></g>`,
  crown:`<g class="acc crown"><ellipse cx="120" cy="58" rx="48" ry="5" fill="black" opacity="0.22"/><path d="M 78,58 L 78,40 L 92,52 L 105,28 L 120,46 L 135,28 L 148,52 L 162,40 L 162,58 Z" fill="#F5C84A" stroke="#5C3F00" stroke-width="2" stroke-linejoin="round"/><circle cx="120" cy="48" r="3" fill="#EF4444" stroke="#5C3F00" stroke-width="1"/><circle cx="92" cy="52" r="2" fill="#4F6BFF"/><circle cx="148" cy="52" r="2" fill="#22c55e"/></g>`,
  headphones:`<g class="acc headphones"><path d="M 56,128 Q 60,28 120,26 Q 180,28 184,128" stroke="#1a1a1a" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M 56,128 Q 60,28 120,26 Q 180,28 184,128" stroke="#4F6BFF" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse cx="55" cy="138" rx="18" ry="22" fill="#1a1a1a" stroke="#000" stroke-width="2"/><ellipse cx="55" cy="138" rx="11" ry="15" fill="#3a3a45"/><circle cx="55" cy="138" r="4" fill="#4F6BFF"/><ellipse cx="185" cy="138" rx="18" ry="22" fill="#1a1a1a" stroke="#000" stroke-width="2"/><ellipse cx="185" cy="138" rx="11" ry="15" fill="#3a3a45"/><circle cx="185" cy="138" r="4" fill="#4F6BFF"/></g>`,
  party:`<g class="acc party"><ellipse cx="120" cy="58" rx="38" ry="4" fill="black" opacity="0.22"/><path d="M 88,58 L 120,8 L 152,58 Z" fill="#EC4899" stroke="#7d1d4a" stroke-width="2" stroke-linejoin="round"/><path d="M 102,38 L 138,38" stroke="#FBBF24" stroke-width="4" stroke-linecap="round"/><path d="M 110,22 L 130,22" stroke="#FBBF24" stroke-width="3" stroke-linecap="round"/><circle cx="120" cy="6" r="7" fill="#FBBF24" stroke="#7d1d4a" stroke-width="2"/></g>`,
  coffee:`<g class="acc coffee"><path d="M 188,140 Q 184,128 190,118 Q 196,108 190,98" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.55"/><path d="M 200,144 Q 204,130 198,118 Q 192,108 200,98" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.4"/><path d="M 172,148 L 216,148 L 212,196 L 176,196 Z" fill="#f5f1e6" stroke="var(--slime-out)" stroke-width="2.5" stroke-linejoin="round"/><path d="M 216,158 Q 230,160 230,176 Q 230,190 214,188" fill="none" stroke="var(--slime-out)" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="194" cy="150" rx="20" ry="3" fill="#5a3d1c" stroke="var(--slime-out)" stroke-width="2"/><text x="194" y="180" text-anchor="middle" font-family="Inter,sans-serif" font-size="14" font-weight="700" fill="var(--slime-out)">K</text></g>`,
  /* eotm — seasonal "Employee of the Month" laurel (auto-granted, non-permanent) */
  eotm:`<g class="acc eotm"><g transform="translate(120 34)"><path d="M -48 14 Q -38 -22 -28 -10 Q -26 -4 -32 2 Q -42 14 -48 14 Z" fill="#f6c453" stroke="#caa133" stroke-width="2" stroke-linejoin="round"/><path d="M 48 14 Q 38 -22 28 -10 Q 26 -4 32 2 Q 42 14 48 14 Z" fill="#f6c453" stroke="#caa133" stroke-width="2" stroke-linejoin="round"/><circle cx="0" cy="14" r="7" fill="#fff3b0" stroke="#caa133" stroke-width="2"/><circle cx="0" cy="14" r="2" fill="#caa133"/></g></g>`,
};
/* v2 — one shared chubby gumdrop body. The 6 "models" are the 6 tone palettes
   from THEMES; the gacha rolls a tone and the slime hatches with that colour. */
const SLIME_MODELS=[
  ["klaut","Klaut"],["green","Green"],["blue","Blue"],["indigo","Indigo"],
  ["pink","Pink"],["amber","Amber"],["red","Red"]
];
const BODY_PATH_V2="M 30,180 C 28,108 60,52 120,52 C 180,52 212,108 210,180 C 209,202 170,210 120,210 C 70,210 31,202 30,180 Z";
const BODY_PATHS={
  klaut:BODY_PATH_V2,
  green:BODY_PATH_V2, blue:BODY_PATH_V2, indigo:BODY_PATH_V2,
  pink:BODY_PATH_V2,  amber:BODY_PATH_V2, red:BODY_PATH_V2,
};

/* Block 2: slime SVG helpers + defaults + personality + accessory economy stubs */
function slimeSVG(m,uid){ if(!BODY_PATHS[m]) m="green"; const u=uid?String(uid):"";
 return `<div class="slimewrap"><div class="s-slime" data-emo="idle" data-model="${m}">`
+`<svg viewBox="0 0 240 240" aria-hidden="true"><defs>`
+`<linearGradient id="slBody${u}" x1="20%" y1="8%" x2="80%" y2="100%">`
+`<stop offset="0%" class="g0"/><stop offset="50%" class="g1"/><stop offset="100%" class="g2"/></linearGradient>`
+`<radialGradient id="slGloss${u}" cx="35%" cy="30%" r="60%">`
+`<stop offset="0%" stop-color="#fff" stop-opacity=".75"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient>`
+`<filter id="slBlur${u}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>`
+`</defs>`
+`<ellipse class="s-shadow" cx="120" cy="222" rx="74" ry="6" fill="#000" opacity=".22" filter="url(#slBlur${u})"/>`
+`<g class="s-body-g">`
+`<path class="s-body" d="${BODY_PATH_V2}" fill="url(#slBody${u})" stroke="var(--slime-out)" stroke-width="4.5" stroke-linejoin="round"/>`
+`<path d="M 50,202 C 80,210 160,210 190,202" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".18"/>`
+`<ellipse cx="82" cy="96" rx="30" ry="16" transform="rotate(-32 82 96)" fill="url(#slGloss${u})"/>`
+`<ellipse cx="62" cy="128" rx="5" ry="10" transform="rotate(-30 62 128)" fill="#fff" opacity=".45"/>`
+`<ellipse cx="73" cy="160" rx="14" ry="7" fill="var(--slime-blush)" opacity=".45"/>`
+`<ellipse cx="167" cy="160" rx="14" ry="7" fill="var(--slime-blush)" opacity=".45"/>`
+`<g class="s-acc"></g>`
+`<g class="s-face">`
+`<g class="emo emo-idle"><g class="face-eyes"><ellipse cx="95" cy="132" rx="7.5" ry="9.5" fill="var(--slime-out)"/><ellipse cx="145" cy="132" rx="7.5" ry="9.5" fill="var(--slime-out)"/><ellipse cx="93" cy="128" rx="2.2" ry="2.8" fill="#fff"/><ellipse cx="143" cy="128" rx="2.2" ry="2.8" fill="#fff"/></g><g class="face-mouth"><path d="M 102,172 Q 120,184 138,172" fill="none" stroke="var(--slime-out)" stroke-width="4.5" stroke-linecap="round"/></g></g>`
+`<g class="emo emo-happy"><g class="face-eyes"><path d="M 84,134 Q 95,118 106,134" fill="none" stroke="var(--slime-out)" stroke-width="5" stroke-linecap="round"/><path d="M 134,134 Q 145,118 156,134" fill="none" stroke="var(--slime-out)" stroke-width="5" stroke-linecap="round"/></g><g class="face-mouth"><path d="M 90,158 Q 120,153 150,158 Q 148,196 120,204 Q 92,196 90,158 Z" fill="var(--slime-out)"/><path d="M 102,184 Q 120,206 138,184 Q 134,200 120,202 Q 106,200 102,184 Z" fill="#FF7A9B"/><path d="M 113,158 L 117,158 L 116,164 L 114,164 Z" fill="#fff" opacity=".9"/></g></g>`
+`<g class="emo emo-annoyed"><g class="face-brows"><path d="M 78,114 L 108,124" stroke="var(--slime-out)" stroke-width="5" stroke-linecap="round"/><path d="M 132,124 L 162,114" stroke="var(--slime-out)" stroke-width="5" stroke-linecap="round"/></g><g class="face-eyes"><ellipse cx="95" cy="136" rx="6.5" ry="8.5" fill="var(--slime-out)"/><ellipse cx="145" cy="136" rx="6.5" ry="8.5" fill="var(--slime-out)"/><ellipse cx="94" cy="133" rx="1.8" ry="2.2" fill="#fff"/><ellipse cx="144" cy="133" rx="1.8" ry="2.2" fill="#fff"/></g><g class="face-mouth"><path d="M 104,182 Q 120,172 136,182" fill="none" stroke="var(--slime-out)" stroke-width="4.5" stroke-linecap="round"/></g></g>`
+`<g class="emo emo-think"><g class="face-eyes"><ellipse cx="95" cy="132" rx="9" ry="11" fill="#fff" stroke="var(--slime-out)" stroke-width="3"/><ellipse cx="145" cy="132" rx="9" ry="11" fill="#fff" stroke="var(--slime-out)" stroke-width="3"/><ellipse cx="98" cy="126" rx="3.5" ry="4.2" fill="var(--slime-out)"/><ellipse cx="148" cy="126" rx="3.5" ry="4.2" fill="var(--slime-out)"/></g><g class="face-mouth"><ellipse cx="120" cy="184" rx="5.5" ry="7" fill="var(--slime-out)"/></g><g class="face-extras"><circle cx="178" cy="104" r="3" fill="var(--slime-out)" opacity=".85"/><circle cx="190" cy="92" r="4" fill="var(--slime-out)" opacity=".7"/><circle cx="206" cy="78" r="5.5" fill="var(--slime-out)" opacity=".55"/></g></g>`
+`<g class="emo emo-blink"><g class="face-eyes"><path d="M 84,132 Q 95,127 106,132" fill="none" stroke="var(--slime-out)" stroke-width="4.5" stroke-linecap="round"/><path d="M 134,132 Q 145,127 156,132" fill="none" stroke="var(--slime-out)" stroke-width="4.5" stroke-linecap="round"/></g><g class="face-mouth"><path d="M 102,172 Q 120,184 138,172" fill="none" stroke="var(--slime-out)" stroke-width="4.5" stroke-linecap="round"/></g></g>`
+`</g></g></svg></div></div>`;}
function defaultSlime(){ return {name:"",theme:"indigo",acc:"none",model:null,owned:["none","glasses","bowtie"],points:null,eggPending:false,award:null}; }
function curSlime(){
  if (_slimeAdapterProxy && _slimeAdapterProxy.readSlimeStateSync) {
    return _slimeAdapterProxy.readSlimeStateSync({ _raw: true });
  }
  return Object.assign(defaultSlime(), (onboarding && onboarding.slime) || {});
}
function slimeModel(){ const m=curSlime().model; return BODY_PATHS[m]?m:"drop"; }
function rollSlime(){ return SLIME_MODELS[Math.floor(Math.random()*SLIME_MODELS.length)][0]; }
function modelLabel(m){ const e=SLIME_MODELS.find(x=>x[0]===m); return e?e[1]:"Slime"; }
function slimeName(){ const n=(curSlime().name||"").trim();
  return n || ((window.__user&&window.__user.name)||(DATA&&DATA.user&&DATA.user.name)||"your copilot").split(" ")[0]; }
/* the slime's resting temperament mirrors the user's DISC work-style (Learn) */
const TEMPERAMENT={
  D:{key:"bold",   label:"Bold",   src:"Driver",        blurb:"decisive & forward — just like you"},
  I:{key:"cheery", label:"Cheery", src:"Influencer",    blurb:"upbeat & expressive — just like you"},
  S:{key:"calm",   label:"Calm",   src:"Stabilizer",    blurb:"steady & easygoing — just like you"},
  C:{key:"focused",label:"Focused",src:"Conscientious", blurb:"precise & attentive — just like you"},
};
function slimeTemp(){ const t=(typeof learnProfile!=="undefined")&&learnProfile&&learnProfile.top;
  return (t&&TEMPERAMENT[t])?TEMPERAMENT[t]:null; }
/* ---- Phase C: gamification/monetization loop (CLIENT-SIDE DEMO of the roadmap;
   real economy/teammates/EOTM need the backend, the slime's brain = OpenClaw) ---- */
const CURR="$point";
function fmt(n){ return "$"+Number(n||0).toLocaleString("en-US"); }
const EGG_COST=10000;
const ACC_PRICE={sunglasses:2000,headset:4000,wizard:6000,halo:8000,visor:15000,crown:12000};
const ACC_FREE=["none","glasses","bowtie"];
// exclusive / secret cosmetics — premium $point, shown in their own row
const ACC_SECRET=[["halo","Halo"],["visor","Neon visor"],["crown","Crown"]];
function badgesEarnedN(){ const y=DATA&&DATA.you; if(!y) return 0; const lb=_learnBadgesEarned(); return BADGE_DEFS.filter(b=>(b.id in lb)?lb[b.id]:(y.badges&&y.badges[b.id])).length; }
// 6 deterministic learning-progress badges — earned state computed from real learnState/learnProfile/wishlist (NOT y.badges; no PRNG)
function _learnBadgesEarned(){
  const _doneN=Object.values(learnState).filter(s=>s&&s.done).length;
  const _wishN=Object.keys(wishlist).filter(k=>wishlist[k]).length;
  const _prof=!!(learnProfile&&learnProfile.top);
  const _cats=new Set();
  for(const id in learnState){const st=learnState[id]; if(st&&st.done){const m=LEARN_MODULES.find(x=>x.id===id); if(m) _cats.add(m.cat);}}
  return {first:_doneN>=1, disc:_prof, curator:_wishN>=3, loop:_doneN>=2, generalist:_cats.size>=3, triple:_doneN>=3};
}
// one-time starting wallet (generous so the $10k egg is demoable); after that
// $point is a STABLE persisted balance that only goes down when you spend —
// it must NOT recompute from the demo stats (those reseed on Generate).
// Every demo account starts with a flat $500,000 wallet (one-time grant;
// after that it's a stable persisted balance that only goes down on spend).
function slimeGrant(){ return 500000; }
function slimeCoins(){
  if (_slimeAdapterProxy && _slimeAdapterProxy.readLedgerFoldSync) {
    return _slimeAdapterProxy.readLedgerFoldSync();
  }
  // Fallback (pre-adapter, early-boot)
  const c = curSlime();
  if (c.points == null) { const g = slimeGrant(); onboarding.slime = Object.assign(curSlime(), {points:g}); saveOB(); return g; }
  return Math.max(0, c.points|0);
}
function slimeSpend(n){
  if (_slimeAdapterProxy && _slimeAdapterProxy.appendLedgerSync) {
    _slimeAdapterProxy.appendLedgerSync({ delta: -(n|0), reason: 'spend', ref: 'spend-' + Date.now() + '-' + (n|0) });
    return;
  }
  // Fallback (pre-adapter)
  const bal = slimeCoins();
  onboarding.slime = Object.assign(curSlime(), {points: Math.max(0, bal-(n|0))}); saveOB();
}
function accOwned(id){ return ACC_FREE.indexOf(id)>=0 || (curSlime().owned||[]).indexOf(id)>=0; }
// "crown" is the true SECRET — hidden until Pathfinder+ (lvl 4) or 2 unlocked items
function secretRevealed(id){ if(id!=="crown") return true;
  const y=DATA&&DATA.you, own=curSlime().owned||[];
  return (y&&y.lvlIdx>=3) || own.filter(x=>ACC_PRICE[x]).length>=2 || own.indexOf("crown")>=0; }
function monthKey(){ return new Date().toISOString().slice(0,7); }
function awardActive(){ const a=curSlime().award; return (a&&a.id&&a.month===monthKey())?a:null; }
function monthEndLabel(){ const n=new Date(), e=new Date(n.getFullYear(),n.getMonth()+1,0);
  return e.toLocaleDateString("en-US",{day:"numeric",month:"long"}); }
function ensureAward(){ // demo: you're Employee of the Month this month — auto-expires next month
  if (!awardActive()) {
    if (_slimeAdapterProxy && _slimeAdapterProxy.grantAwardSync) {
      _slimeAdapterProxy.grantAwardSync({ awardType: 'eotm', grantedBy: null, period: monthKey(), expiresAt: null });
    } else {
      onboarding.slime = Object.assign(curSlime(), {award:{id:"eotm",month:monthKey()}}); saveOB();
    }
  }
}
function teammateSlime(name){ let h=0; const s=String(name||"x");
  for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0;
  const tks=Object.keys(THEMES);
  return { model:SLIME_MODELS[h%SLIME_MODELS.length][0],
    theme:tks[(h>>>3)%tks.length], acc:SLIME_ACCS[(h>>>6)%SLIME_ACCS.length][0] }; }
function applySlime(cfg){
  cfg=cfg||curSlime();
  // Bridge: if the user hatched via the design-slime flow (type set), always
  // derive engine model/theme from the design fields so #ai-fab matches profile.
  if(cfg.type){
    const _BODY_BR={round:"round",droop:"drop",angular:"pebble",tall:"tall",small:"squat",flame:"bumpy"};
    const _COLOR_BR={
      indigo:"indigo",aqua:"sky",mint:"aurora",coral:"rose",amber:"sunset",lilac:"violet",slate:"graphite",
      glow:"sunset",drift:"sky",spark:"rose",steady:"indigo",wisp:"violet",ember:"sunset"
    };
    const _OBT=(typeof OB_TYPES!=="undefined")&&OB_TYPES[cfg.type];
    if(_OBT){
      cfg=Object.assign({},cfg,{
        model:_BODY_BR[_OBT.body]||"drop",
        theme:_COLOR_BR[cfg.colorLabel||cfg.type]||"indigo"
      });
      // Write back to onboarding.slime so subsequent curSlime() calls are consistent
      if(onboarding&&onboarding.slime){
        onboarding.slime.model=cfg.model; onboarding.slime.theme=cfg.theme;
      }
    }
  }
  const t=THEMES[cfg.theme]||THEMES.klaut||THEMES.green||Object.values(THEMES)[0], r=document.documentElement.style;
  /* back-compat vars (consumed by other dashboard chrome — kept set) */
  r.setProperty("--sl-a",t.a); r.setProperty("--sl-b",t.b);
  r.setProperty("--sl-c",t.c); r.setProperty("--sl-d",t.d);
  r.setProperty("--sl-think",t.think||t.light); r.setProperty("--sl-glow",t.glow);
  r.setProperty("--sl-deep",t.deep);
  /* v2 slime SVG vars (new — body/outline/blush) */
  r.setProperty("--slime-light",t.light); r.setProperty("--slime-mid",t.mid);
  r.setProperty("--slime-dark",t.dark);   r.setProperty("--slime-out",t.outline);
  r.setProperty("--slime-blush",t.blush);
  const aw=awardActive();
  // Map design-slime accessory names (from obAccSvg) to engine ACC_SVG keys
  const _ACC_BRIDGE={bow:"bowtie",monocle:"monocle",leaf:"none",spark:"none",antenna:"none",horns:"crown"};
  // Economy parked: user's chosen acc always wins; award never overrides rendered accessory
  const rawAcc=cfg.acc;
  const effAcc=_ACC_BRIDGE[rawAcc]!==undefined?_ACC_BRIDGE[rawAcc]:rawAcc;
  // [data-fixed] = independent slimes (e.g. team-gallery minis) — leave them alone
  document.querySelectorAll(".s-slime:not([data-fixed]) .s-acc").forEach(g=>g.innerHTML=ACC_SVG[effAcc]||"");
  const mdl=BODY_PATHS[cfg.model]?cfg.model:"drop";
  const tp=slimeTemp();
  document.querySelectorAll(".s-slime:not([data-fixed])").forEach(s=>{ s.dataset.model=mdl;
    s.dataset.temp = tp?tp.key:"";
    const p=s.querySelector(".s-body"); if(p) p.setAttribute("d",BODY_PATHS[mdl]); });
  const nm=(cfg.name||"").trim();
  document.querySelectorAll("[data-slime-name]").forEach(el=>el.textContent = nm || "Your slime");
}


/* Block 3: design-slime type system + SVG builder */
const OB_TYPES={
  glow:  {name:"Glow",  personality:"cheerful",desc:"warm, eager, social",tagline:"the spark in the room",      color:{base:"#fbbf24",hi:"#fde68a",deep:"#b45309",light:"#FFE68C",mid:"#FBBF24",dark:"#D97706",outline:"#3A2200",blush:"#C53030"},body:"cloud",  acc:"party",     traits:["warm","social","eager"]},
  drift: {name:"Drift", personality:"calm",    desc:"quiet, observant, steady",tagline:"deep current, no waves",color:{base:"#22d3ee",hi:"#a5f3fc",deep:"#0891b2",light:"#A8DEFF",mid:"#5DB8F2",dark:"#2E80D6",outline:"#0F2A48",blush:"#FF7A9B"},body:"pebble", acc:"reader",    traits:["calm","patient","kind"]},
  spark: {name:"Spark", personality:"sassy",   desc:"witty, sharp, fast",tagline:"the comeback you didn't expect",color:{base:"#fb7185",hi:"#fecdd3",deep:"#be123c",light:"#FCD7E9",mid:"#F49DC5",dark:"#E5408C",outline:"#4A0D2D",blush:"#C53030"},body:"bean",   acc:"sunglasses",traits:["witty","quick","bold"]},
  steady:{name:"Steady",personality:"focused", desc:"brief, direct, productive",tagline:"less words, more done",color:{base:"#4F6BFF",hi:"#a5b4fc",deep:"#4338ca",light:"#D8CFFE",mid:"#9C8FFA",dark:"#5346E0",outline:"#1B1850",blush:"#FF7A9B"},body:"cushion",acc:"monocle",   traits:["precise","analytical","loyal"]},
  wisp:  {name:"Wisp",  personality:"curious", desc:"questions everything, kind",tagline:"what if, though?",    color:{base:"#7B8FFF",hi:"#BFCBFF",deep:"#7e22ce",light:"#D8CFFE",mid:"#9C8FFA",dark:"#5346E0",outline:"#1B1850",blush:"#FF7A9B"},body:"onion",  acc:"wizard",    traits:["curious","gentle","open"]},
  ember: {name:"Ember", personality:"bold",    desc:"decisive, fierce, hot-take",tagline:"go first, ask later", color:{base:"#f97316",hi:"#fdba74",deep:"#9a3412",light:"#FFB4B4",mid:"#F87171",dark:"#DC2626",outline:"#3F0A0A",blush:"#7c1d1d"},body:"bean",   acc:"cowboy",    traits:["bold","decisive","driven"]}
};
/* Decision B: obBodyPath() removed — single canonical gumdrop for all OB_TYPEs.
   Path inlined in buildDesignSlime(). obMouthPath() removed — canonical
   filled mouth inlined; CSS d:path() mood rules override per mood. */

/* Canonical 37-key ACCESSORIES — verbatim from design/slime-assets-v2.2/slime-accessories.html ACC.
   Coordinates authored for viewBox 0 0 240 240 / gumdrop body.
   ${OUTLINE} -> var(--slime-out), ${BLUSH} -> var(--slime-blush).
   Glow filter refs dropped (no #-glow filter in buildDesignSlime defs). */
function obAccSvg(acc){
  // Legacy-key bridge: existing localStorage may still hold pre-port acc keys.
  // Map them to the nearest canonical equivalent so older sessions don't render bare.
  // antenna removed — it is now a canonical key.
  const _LEGACY_ACC_BRIDGE={none:'classic',leaf:'classic',spark:'sunglasses',bow:'bowtie',horns:'crown'};
  if(_LEGACY_ACC_BRIDGE[acc]) acc=_LEGACY_ACC_BRIDGE[acc];
  const ACCESSORIES={
    classic:()=>``,
    glasses:()=>`
    <g class="accessory" data-zone="eyes">
      <circle cx="95"  cy="132" r="14" fill="none" stroke="var(--slime-out)" stroke-width="2.8"/>
      <circle cx="145" cy="132" r="14" fill="none" stroke="var(--slime-out)" stroke-width="2.8"/>
      <path d="M 109,132 L 131,132" stroke="var(--slime-out)" stroke-width="2.8" stroke-linecap="round"/>
      <path d="M 81,131 Q 72,129 64,133" stroke="var(--slime-out)" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M 159,131 Q 168,129 176,133" stroke="var(--slime-out)" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M 88,127 Q 90,123 95,122" stroke="white" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.8"/>
      <path d="M 138,127 Q 140,123 145,122" stroke="white" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.8"/>
    </g>`,
    sunglasses:()=>`
    <g class="accessory" data-zone="eyes">
      <path d="M 110,124 Q 120,118 130,124" stroke="#1c1c1c" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <rect x="70" y="116" width="44" height="30" rx="13" fill="#1c1c1c" stroke="#0a0a0a" stroke-width="1.5"/>
      <rect x="126" y="116" width="44" height="30" rx="13" fill="#1c1c1c" stroke="#0a0a0a" stroke-width="1.5"/>
      <path d="M 70,126 Q 60,124 50,128" stroke="#1c1c1c" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M 170,126 Q 180,124 190,128" stroke="#1c1c1c" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M 78,122 L 86,122 L 80,134 L 74,134 Z" fill="white" opacity="0.35"/>
      <path d="M 134,122 L 142,122 L 136,134 L 130,134 Z" fill="white" opacity="0.35"/>
    </g>`,
    fedora:()=>`
    <g class="accessory" data-zone="head">
      <ellipse cx="120" cy="62" rx="62" ry="6" fill="black" opacity="0.22"/>
      <path d="M 56,58 Q 70,49 120,49 Q 170,49 184,58 Q 178,67 120,67 Q 62,67 56,58 Z" fill="#2a2a2e" stroke="#0c0c10" stroke-width="2" stroke-linejoin="round"/>
      <path d="M 90,52 Q 92,20 120,16 Q 148,20 150,52 Z" fill="#3a3a40" stroke="#0c0c10" stroke-width="2" stroke-linejoin="round"/>
      <path d="M 110,18 Q 120,24 130,18" fill="none" stroke="#0c0c10" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M 92,48 Q 120,54 148,48 L 148,52 Q 120,58 92,52 Z" fill="#4F6BFF"/>
      <path d="M 100,28 Q 104,22 112,20" stroke="white" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.35"/>
    </g>`,
    crown:()=>`
    <g class="accessory" data-zone="head">
      <ellipse cx="120" cy="58" rx="48" ry="5" fill="black" opacity="0.22"/>
      <path d="M 78,58 L 78,40 L 92,52 L 105,28 L 120,46 L 135,28 L 148,52 L 162,40 L 162,58 Z" fill="#F5C84A" stroke="#5C3F00" stroke-width="2" stroke-linejoin="round"/>
      <path d="M 78,52 L 162,52" stroke="#5C3F00" stroke-width="1.5" fill="none" opacity="0.5"/>
      <circle cx="120" cy="48" r="3" fill="#EF4444" stroke="#5C3F00" stroke-width="1"/>
      <circle cx="92" cy="52" r="2" fill="#4F6BFF"/>
      <circle cx="148" cy="52" r="2" fill="#22c55e"/>
      <circle cx="105" cy="26" r="3" fill="#F5C84A" stroke="#5C3F00" stroke-width="1"/>
      <circle cx="135" cy="26" r="3" fill="#F5C84A" stroke="#5C3F00" stroke-width="1"/>
      <path d="M 85,46 L 88,42" stroke="white" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>
    </g>`,
    halo:()=>`
    <g class="accessory" data-zone="float">
      <ellipse cx="120" cy="20" rx="44" ry="9" fill="#F5C84A" opacity="0.25"/>
      <ellipse cx="120" cy="20" rx="40" ry="8" fill="none" stroke="#D4A93C" stroke-width="6"/>
      <ellipse cx="120" cy="20" rx="40" ry="8" fill="none" stroke="#F5D77A" stroke-width="2.5"/>
      <path d="M 98,15 Q 120,11 142,15" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.75"/>
      <path d="M 80,8 l 1,3 3,1 -3,1 -1,3 -1,-3 -3,-1 3,-1 z" fill="white" opacity="0.9"/>
      <path d="M 162,12 l 0.8,2 2,0.8 -2,0.8 -0.8,2 -0.8,-2 -2,-0.8 2,-0.8 z" fill="white" opacity="0.7"/>
    </g>`,
    monocle:()=>`
    <g class="accessory" data-zone="eyes">
      <circle cx="145" cy="132" r="16" fill="none" stroke="#D4A93C" stroke-width="3"/>
      <circle cx="145" cy="132" r="16" fill="white" opacity="0.06"/>
      <path d="M 136,124 Q 138,120 144,120" stroke="white" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.7"/>
      <path d="M 156,144 Q 168,170 178,200" stroke="#D4A93C" stroke-width="1.5" fill="none" stroke-dasharray="2 3"/>
      <circle cx="178" cy="200" r="2.5" fill="#D4A93C" stroke="#8a6a1f" stroke-width="0.5"/>
    </g>`,
    antenna:()=>`
    <g class="accessory" data-zone="head">
      <ellipse cx="120" cy="55" rx="9" ry="3.5" fill="#2a2a2e" stroke="var(--slime-out)" stroke-width="1.5"/>
      <path d="M 120,54 Q 118,32 124,12" stroke="#2a2a2e" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M 120,54 Q 118,32 124,12" stroke="#5a5a65" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <circle cx="124" cy="10" r="14" fill="#4F6BFF" opacity="0.35"/>
      <circle cx="124" cy="10" r="7" fill="#7B8FFF" stroke="var(--slime-out)" stroke-width="1.8"/>
      <circle cx="122" cy="8" r="2.5" fill="white" opacity="0.8"/>
      <path d="M 124,-4 L 124,-1" stroke="#7B8FFF" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>
      <path d="M 114,4 L 117,5" stroke="#7B8FFF" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
      <path d="M 134,4 L 131,5" stroke="#7B8FFF" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
    </g>`,
    bowtie:()=>`
    <g class="accessory" data-zone="base">
      <path d="M 92,200 L 92,222 L 116,212 Z" fill="#4F6BFF" stroke="var(--slime-out)" stroke-width="2" stroke-linejoin="round"/>
      <path d="M 148,200 L 148,222 L 124,212 Z" fill="#4F6BFF" stroke="var(--slime-out)" stroke-width="2" stroke-linejoin="round"/>
      <rect x="115" y="206" width="10" height="12" rx="2" fill="#3854E5" stroke="var(--slime-out)" stroke-width="2"/>
      <path d="M 98,206 L 110,209" stroke="white" stroke-width="1.5" opacity="0.4" stroke-linecap="round"/>
    </g>`,
    scarf:()=>`
    <g class="accessory" data-zone="base">
      <path d="M 38,196 Q 80,208 120,206 Q 162,208 202,196 Q 205,212 200,222 Q 160,228 120,224 Q 80,228 40,222 Q 35,212 38,196 Z" fill="#EF4444" stroke="var(--slime-out)" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M 60,202 Q 60,216 56,224" stroke="var(--slime-out)" stroke-width="2" fill="none" opacity="0.3"/>
      <path d="M 90,206 Q 90,222 88,228" stroke="var(--slime-out)" stroke-width="2" fill="none" opacity="0.3"/>
      <path d="M 150,206 Q 152,222 154,228" stroke="var(--slime-out)" stroke-width="2" fill="none" opacity="0.3"/>
      <path d="M 180,202 Q 182,216 186,224" stroke="var(--slime-out)" stroke-width="2" fill="none" opacity="0.3"/>
      <path d="M 56,222 L 52,238 L 70,242 L 72,224 Z" fill="#EF4444" stroke="var(--slime-out)" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M 72,224 L 76,244 L 92,240 L 88,222 Z" fill="#DC2626" stroke="var(--slime-out)" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M 54,238 L 54,243 M 58,239 L 58,244 M 62,240 L 62,245 M 66,240 L 66,245 M 78,243 L 78,248 M 82,243 L 82,248 M 86,242 L 86,247 M 90,241 L 90,246" stroke="var(--slime-out)" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>
      <path d="M 60,200 Q 100,208 140,208" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.25"/>
    </g>`,
    beanie:()=>`
    <g class="accessory" data-zone="head">
      <ellipse cx="120" cy="60" rx="58" ry="5" fill="black" opacity="0.22"/>
      <path d="M 70,48 Q 68,12 120,8 Q 172,12 170,48 Z" fill="#C56F6F" stroke="#3D1F1F" stroke-width="2" stroke-linejoin="round"/>
      <rect x="64" y="48" width="112" height="14" rx="2" fill="#A85B5B" stroke="#3D1F1F" stroke-width="2"/>
      <path d="M 84,42 Q 84,28 88,14 M 102,46 Q 102,28 104,12 M 120,48 Q 120,28 120,8 M 138,46 Q 138,28 136,12 M 156,42 Q 156,28 152,14" stroke="#3D1F1F" stroke-width="1.2" fill="none" opacity="0.4"/>
      <path d="M 74,55 L 82,55 M 92,55 L 100,55 M 110,55 L 118,55 M 128,55 L 136,55 M 146,55 L 154,55 M 162,55 L 170,55" stroke="#3D1F1F" stroke-width="1.2" opacity="0.4"/>
      <circle cx="120" cy="6" r="6" fill="#F5E6C8" stroke="#3D1F1F" stroke-width="2"/>
      <path d="M 86,28 Q 92,18 102,14" stroke="white" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.35"/>
    </g>`,
    baseball:()=>`
    <g class="accessory" data-zone="head">
      <ellipse cx="120" cy="60" rx="54" ry="5" fill="black" opacity="0.22"/>
      <path d="M 40,52 Q 56,46 76,50 L 76,58 Q 56,62 40,58 Z" fill="#1E3A8A" stroke="#0a1a4a" stroke-width="2" stroke-linejoin="round"/>
      <path d="M 76,52 Q 78,16 120,12 Q 166,16 168,52 Z" fill="#2E50BD" stroke="#0a1a4a" stroke-width="2" stroke-linejoin="round"/>
      <path d="M 120,12 Q 118,30 120,52 M 98,16 Q 92,32 86,48 M 142,16 Q 148,32 154,48" stroke="#0a1a4a" stroke-width="1.2" fill="none" opacity="0.4"/>
      <circle cx="120" cy="14" r="2.5" fill="#1E3A8A" stroke="#0a1a4a" stroke-width="1"/>
      <text x="120" y="40" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" font-weight="700" fill="#FCD34D">K</text>
      <path d="M 88,26 Q 94,18 104,16" stroke="white" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.35"/>
    </g>`,
    cowboy:()=>`
    <g class="accessory" data-zone="head">
      <ellipse cx="120" cy="66" rx="74" ry="5" fill="black" opacity="0.22"/>
      <path d="M 46,62 Q 120,76 194,62 Q 210,57 200,52 Q 175,32 120,32 Q 65,32 40,52 Q 30,57 46,62 Z" fill="#8B5A2B" stroke="#3a210c" stroke-width="2" stroke-linejoin="round"/>
      <path d="M 84,52 Q 80,18 120,12 Q 160,18 156,52 Q 150,40 132,38 Q 120,46 108,38 Q 90,40 84,52 Z" fill="#A1693A" stroke="#3a210c" stroke-width="2" stroke-linejoin="round"/>
      <path d="M 84,50 Q 120,58 156,50 L 156,54 Q 120,62 84,54 Z" fill="#3a210c"/>
      <path d="M 120,52 l 2,5 5,1 -4,3 1,5 -4,-3 -4,3 1,-5 -4,-3 5,-1 z" fill="#F5D77A" stroke="#3a210c" stroke-width="0.5"/>
    </g>`,
    chef:()=>`
    <g class="accessory" data-zone="head">
      <rect x="78" y="48" width="84" height="14" rx="3" fill="#f5f5f5" stroke="#3D2A1F" stroke-width="2"/>
      <circle cx="88" cy="32" r="18" fill="#fafafa" stroke="#3D2A1F" stroke-width="2"/>
      <circle cx="120" cy="22" r="22" fill="#fafafa" stroke="#3D2A1F" stroke-width="2"/>
      <circle cx="152" cy="32" r="18" fill="#fafafa" stroke="#3D2A1F" stroke-width="2"/>
      <rect x="78" y="48" width="84" height="14" rx="3" fill="#f5f5f5" stroke="#3D2A1F" stroke-width="2"/>
      <path d="M 86,55 L 94,55 M 102,55 L 110,55 M 118,55 L 126,55 M 134,55 L 142,55 M 150,55 L 154,55" stroke="#3D2A1F" stroke-width="1" opacity="0.4"/>
      <ellipse cx="82" cy="26" rx="5" ry="3" fill="white" opacity="0.9"/>
      <ellipse cx="115" cy="14" rx="6" ry="3" fill="white" opacity="0.9"/>
    </g>`,
    tophat:()=>`
    <g class="accessory" data-zone="head">
      <ellipse cx="120" cy="62" rx="54" ry="5" fill="black" opacity="0.22"/>
      <path d="M 60,56 Q 70,50 120,50 Q 170,50 180,56 Q 175,64 120,64 Q 65,64 60,56 Z" fill="#1a1a1f" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
      <rect x="88" y="-2" width="64" height="54" rx="3" fill="#22222a" stroke="#000" stroke-width="2"/>
      <rect x="88" y="42" width="64" height="10" fill="#4F6BFF"/>
      <rect x="88" y="42" width="64" height="10" fill="none" stroke="#000" stroke-width="1.2"/>
      <path d="M 96,4 L 96,40" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.25"/>
    </g>`,
    wizard:()=>`
    <g class="accessory" data-zone="head">
      <ellipse cx="120" cy="58" rx="56" ry="5" fill="black" opacity="0.22"/>
      <path d="M 58,56 Q 70,48 120,48 Q 170,48 182,56 Q 175,64 120,64 Q 65,64 58,56 Z" fill="#3b2168" stroke="#190a36" stroke-width="2" stroke-linejoin="round"/>
      <path d="M 88,52 Q 105,40 100,8 Q 130,18 152,52 Z" fill="#5b3aa3" stroke="#190a36" stroke-width="2" stroke-linejoin="round"/>
      <path d="M 100,8 Q 96,2 92,4" stroke="#190a36" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M 115,36 l 1,3 3,0.5 -2.5,2 0.5,3 -2,-1.5 -2,1.5 0.5,-3 -2.5,-2 3,-0.5 z" fill="#FCD34D"/>
      <path d="M 135,28 l 1,3 3,0.5 -2.5,2 0.5,3 -2,-1.5 -2,1.5 0.5,-3 -2.5,-2 3,-0.5 z" fill="#FCD34D"/>
      <circle cx="105" cy="44" r="1.5" fill="#FCD34D"/>
    </g>`,
    party:()=>`
    <g class="accessory" data-zone="head">
      <ellipse cx="120" cy="58" rx="38" ry="4" fill="black" opacity="0.22"/>
      <path d="M 88,58 L 120,4 L 152,58 Z" fill="#EC4899" stroke="#7d1d4a" stroke-width="2" stroke-linejoin="round"/>
      <path d="M 102,38 L 138,38" stroke="#FBBF24" stroke-width="4" stroke-linecap="round"/>
      <path d="M 110,22 L 130,22" stroke="#FBBF24" stroke-width="3" stroke-linecap="round"/>
      <circle cx="120" cy="2" r="7" fill="#FBBF24" stroke="#7d1d4a" stroke-width="2"/>
      <path d="M 116,-2 L 113,-5 M 124,-2 L 127,-5 M 120,-5 L 120,-8 M 114,2 L 110,2 M 126,2 L 130,2" stroke="#FBBF24" stroke-width="2" stroke-linecap="round"/>
    </g>`,
    hardhat:()=>`
    <g class="accessory" data-zone="head">
      <ellipse cx="120" cy="62" rx="58" ry="5" fill="black" opacity="0.22"/>
      <path d="M 62,60 Q 70,55 120,55 Q 170,55 178,60 Q 174,68 120,68 Q 66,68 62,60 Z" fill="#FBBF24" stroke="#5a3d00" stroke-width="2" stroke-linejoin="round"/>
      <path d="M 76,58 Q 80,18 120,16 Q 160,18 164,58 Z" fill="#FCD34D" stroke="#5a3d00" stroke-width="2" stroke-linejoin="round"/>
      <path d="M 120,18 Q 118,38 120,58" stroke="#5a3d00" stroke-width="1.5" fill="none"/>
      <rect x="92" y="40" width="6" height="3" rx="1" fill="#5a3d00"/>
      <rect x="142" y="40" width="6" height="3" rx="1" fill="#5a3d00"/>
      <rect x="108" y="32" width="24" height="10" rx="2" fill="#0a0a0a"/>
      <text x="120" y="40" text-anchor="middle" font-family="Inter,sans-serif" font-size="7" font-weight="700" fill="#FBBF24" letter-spacing="0.5">KLAUT</text>
      <path d="M 88,30 Q 94,22 104,20" stroke="white" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.5"/>
    </g>`,
    grad:()=>`
    <g class="accessory" data-zone="head">
      <ellipse cx="120" cy="54" rx="40" ry="8" fill="#0c0c12" stroke="#000" stroke-width="1"/>
      <path d="M 60,42 L 120,28 L 180,42 L 120,56 Z" fill="#1a1a22" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
      <path d="M 70,42 L 120,32 L 170,42" stroke="#3a3a45" stroke-width="1" fill="none"/>
      <circle cx="120" cy="38" r="3" fill="#4F6BFF"/>
      <path d="M 120,38 Q 165,38 168,62" stroke="#D4A93C" stroke-width="2" fill="none"/>
      <path d="M 164,60 L 172,60 L 170,76 L 166,76 Z" fill="#D4A93C"/>
      <path d="M 165,72 L 164,80 M 168,72 L 168,80 M 171,72 L 172,80" stroke="#8a6a1f" stroke-width="1" stroke-linecap="round"/>
    </g>`,
    beret:()=>`
    <g class="accessory" data-zone="head">
      <ellipse cx="120" cy="60" rx="50" ry="5" fill="black" opacity="0.22"/>
      <ellipse cx="120" cy="50" rx="42" ry="10" fill="#1a1a1f" stroke="#000" stroke-width="2"/>
      <ellipse cx="126" cy="32" rx="40" ry="22" fill="#2a2a30" stroke="#000" stroke-width="2"/>
      <circle cx="154" cy="16" r="4" fill="#1a1a1f" stroke="#000" stroke-width="1.5"/>
      <path d="M 100,18 Q 110,8 130,8" stroke="white" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.3"/>
    </g>`,
    santa:()=>`
    <g class="accessory" data-zone="head">
      <ellipse cx="120" cy="62" rx="54" ry="5" fill="black" opacity="0.22"/>
      <path d="M 64,52 Q 120,68 176,52 Q 176,64 168,68 Q 120,76 72,68 Q 64,64 64,52 Z" fill="#fafafa" stroke="#3a210c" stroke-width="2" stroke-linejoin="round"/>
      <path d="M 78,52 Q 100,8 168,2 Q 180,12 156,28 Q 130,42 162,52 Z" fill="#DC2626" stroke="#5C0A0A" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="172" cy="4" r="9" fill="#fafafa" stroke="#3a210c" stroke-width="2"/>
      <circle cx="82" cy="60" r="1.5" fill="#d4d4d4"/>
      <circle cx="100" cy="66" r="1.5" fill="#d4d4d4"/>
      <circle cx="140" cy="68" r="1.5" fill="#d4d4d4"/>
      <circle cx="160" cy="62" r="1.5" fill="#d4d4d4"/>
      <circle cx="168" cy="2" r="1.5" fill="#d4d4d4"/>
      <circle cx="175" cy="8" r="1.5" fill="#d4d4d4"/>
      <path d="M 96,42 Q 110,28 130,20" stroke="white" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.35"/>
    </g>`,
    flowers:()=>`
    <g class="accessory" data-zone="head">
      <path d="M 60,56 Q 120,46 180,56" stroke="#3F6E3F" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M 78,54 Q 70,46 82,44 Q 86,50 78,54 Z" fill="#5DA85D" stroke="#1F4F1F" stroke-width="1.2"/>
      <path d="M 162,54 Q 170,46 158,44 Q 154,50 162,54 Z" fill="#5DA85D" stroke="#1F4F1F" stroke-width="1.2"/>
      <g transform="translate(72 50)"><circle r="4.5" cx="-4" cy="0" fill="#F472B6"/><circle r="4.5" cx="4" cy="0" fill="#F472B6"/><circle r="4.5" cx="0" cy="-4" fill="#F472B6"/><circle r="4.5" cx="0" cy="4" fill="#F472B6"/><circle r="2.5" fill="#FBBF24"/></g>
      <g transform="translate(98 46)"><circle r="5.5" cx="-5" cy="0" fill="#fafafa" stroke="#3F6E3F" stroke-width="1"/><circle r="5.5" cx="5" cy="0" fill="#fafafa" stroke="#3F6E3F" stroke-width="1"/><circle r="5.5" cx="0" cy="-5" fill="#fafafa" stroke="#3F6E3F" stroke-width="1"/><circle r="5.5" cx="0" cy="5" fill="#fafafa" stroke="#3F6E3F" stroke-width="1"/><circle r="3" fill="#FBBF24"/></g>
      <g transform="translate(124 44)"><circle r="5" cx="-4.5" cy="0" fill="#EC4899"/><circle r="5" cx="4.5" cy="0" fill="#EC4899"/><circle r="5" cx="0" cy="-4.5" fill="#EC4899"/><circle r="5" cx="0" cy="4.5" fill="#EC4899"/><circle r="2.8" fill="#FBBF24"/></g>
      <g transform="translate(150 46)"><circle r="4.5" cx="-4" cy="0" fill="#7B8FFF"/><circle r="4.5" cx="4" cy="0" fill="#7B8FFF"/><circle r="4.5" cx="0" cy="-4" fill="#7B8FFF"/><circle r="4.5" cx="0" cy="4" fill="#7B8FFF"/><circle r="2.5" fill="#FBBF24"/></g>
      <g transform="translate(172 50)"><circle r="4" cx="-3.5" cy="0" fill="#F472B6"/><circle r="4" cx="3.5" cy="0" fill="#F472B6"/><circle r="4" cx="0" cy="-3.5" fill="#F472B6"/><circle r="4" cx="0" cy="3.5" fill="#F472B6"/><circle r="2" fill="#FBBF24"/></g>
    </g>`,
    eyepatch:()=>`
    <g class="accessory" data-zone="eyes">
      <path d="M 56,118 Q 100,108 160,122 Q 184,128 198,138" stroke="#1a1a1f" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="145" cy="132" rx="18" ry="14" fill="#1a1a1f" stroke="#000" stroke-width="2"/>
      <circle cx="145" cy="130" r="4" fill="#fafafa"/>
      <circle cx="143.5" cy="129.5" r="0.8" fill="#1a1a1f"/>
      <circle cx="146.5" cy="129.5" r="0.8" fill="#1a1a1f"/>
      <path d="M 142,133 L 144,134 L 146,133 L 148,134" stroke="#1a1a1f" stroke-width="0.8" fill="none"/>
    </g>`,
    vr:()=>`
    <g class="accessory" data-zone="eyes">
      <path d="M 42,128 Q 50,118 90,116 L 150,116 Q 190,118 198,128" stroke="#1a1a1f" stroke-width="4" fill="none" stroke-linecap="round"/>
      <rect x="56" y="114" width="128" height="36" rx="8" fill="#22222a" stroke="#000" stroke-width="2.5"/>
      <path d="M 110,150 Q 120,142 130,150" fill="#22222a" stroke="#000" stroke-width="2.5" stroke-linejoin="round"/>
      <ellipse cx="90" cy="130" rx="14" ry="10" fill="#4F6BFF" stroke="#000" stroke-width="1.5"/>
      <ellipse cx="150" cy="130" rx="14" ry="10" fill="#4F6BFF" stroke="#000" stroke-width="1.5"/>
      <ellipse cx="86" cy="126" rx="4" ry="2" fill="white" opacity="0.7"/>
      <ellipse cx="146" cy="126" rx="4" ry="2" fill="white" opacity="0.7"/>
      <circle cx="175" cy="122" r="2" fill="#22c55e"/>
    </g>`,
    aviator:()=>`
    <g class="accessory" data-zone="eyes">
      <path d="M 110,122 L 130,122" stroke="#D4A93C" stroke-width="2" stroke-linecap="round"/>
      <path d="M 110,128 L 130,128" stroke="#D4A93C" stroke-width="2" stroke-linecap="round"/>
      <path d="M 72,120 Q 76,114 100,116 Q 116,118 114,130 Q 112,144 92,148 Q 72,148 70,136 Q 68,124 72,120 Z" fill="#3a3a4a" opacity="0.85" stroke="#D4A93C" stroke-width="2.2"/>
      <path d="M 168,120 Q 164,114 140,116 Q 124,118 126,130 Q 128,144 148,148 Q 168,148 170,136 Q 172,124 168,120 Z" fill="#3a3a4a" opacity="0.85" stroke="#D4A93C" stroke-width="2.2"/>
      <path d="M 72,124 Q 62,122 54,126" stroke="#D4A93C" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M 168,124 Q 178,122 186,126" stroke="#D4A93C" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M 80,124 L 90,122" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
      <path d="M 150,124 L 160,122" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
    </g>`,
    goggles:()=>`
    <g class="accessory" data-zone="eyes">
      <path d="M 40,128 Q 50,122 80,120 L 160,120 Q 190,122 200,128" stroke="#EC4899" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M 40,128 Q 50,122 80,120 L 160,120 Q 190,122 200,128" stroke="#9D174D" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-dasharray="4 4"/>
      <path d="M 56,116 Q 60,108 120,108 Q 180,108 184,116 Q 188,140 178,148 Q 120,156 62,148 Q 52,140 56,116 Z" fill="#1a1a1f" stroke="#000" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M 64,118 Q 68,114 120,114 Q 172,114 176,118 Q 178,138 170,144 Q 120,150 70,144 Q 62,138 64,118 Z" fill="#60A5FA"/>
      <path d="M 76,122 Q 88,118 100,120" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.7" fill="none"/>
      <path d="M 152,142 L 162,140" stroke="white" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
    </g>`,
    necktie:()=>`
    <g class="accessory" data-zone="base">
      <path d="M 112,196 L 128,196 L 132,206 L 108,206 Z" fill="#1E3A8A" stroke="var(--slime-out)" stroke-width="2" stroke-linejoin="round"/>
      <path d="M 108,206 L 132,206 L 138,232 L 120,250 L 102,232 Z" fill="#2E50BD" stroke="var(--slime-out)" stroke-width="2" stroke-linejoin="round"/>
      <path d="M 108,214 L 130,212 M 110,222 L 134,220 M 116,234 L 128,232" stroke="#1E3A8A" stroke-width="2" opacity="0.7"/>
      <path d="M 114,210 L 116,230" stroke="white" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
    </g>`,
    cape:()=>`
    <g class="accessory" data-zone="base">
      <path d="M 38,140 Q 18,170 4,210 Q 20,220 38,205 Q 44,180 48,150 Z" fill="#7C2D12" stroke="var(--slime-out)" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M 202,140 Q 222,170 236,210 Q 220,220 202,205 Q 196,180 192,150 Z" fill="#7C2D12" stroke="var(--slime-out)" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M 42,150 Q 36,170 32,200" stroke="#451a03" stroke-width="3" fill="none" opacity="0.6" stroke-linecap="round"/>
      <path d="M 198,150 Q 204,170 208,200" stroke="#451a03" stroke-width="3" fill="none" opacity="0.6" stroke-linecap="round"/>
      <path d="M 88,128 Q 120,118 152,128 L 156,140 Q 120,134 84,140 Z" fill="#9A3412" stroke="var(--slime-out)" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="120" cy="134" r="6" fill="#F5C84A" stroke="#5C3F00" stroke-width="2"/>
      <circle cx="120" cy="134" r="2.5" fill="#EF4444"/>
      <path d="M 16,200 Q 12,184 18,168" stroke="white" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.25"/>
      <path d="M 224,200 Q 228,184 222,168" stroke="white" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.25"/>
    </g>`,
    lanyard:()=>`
    <g class="accessory" data-zone="base">
      <path d="M 92,150 L 112,200" stroke="#1E3A8A" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M 148,150 L 128,200" stroke="#1E3A8A" stroke-width="4" fill="none" stroke-linecap="round"/>
      <rect x="114" y="196" width="12" height="10" rx="1" fill="#a1a1aa" stroke="var(--slime-out)" stroke-width="1.5"/>
      <rect x="96" y="206" width="48" height="56" rx="4" fill="#fafafa" stroke="var(--slime-out)" stroke-width="2"/>
      <rect x="96" y="206" width="48" height="14" fill="#4F6BFF"/>
      <text x="120" y="217" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" font-weight="700" fill="white" letter-spacing="1.5">KLAUT</text>
      <circle cx="108" cy="234" r="6" fill="#A8EE85" stroke="var(--slime-out)" stroke-width="1.5"/>
      <ellipse cx="108" cy="242" rx="6" ry="3" fill="#A8EE85" stroke="var(--slime-out)" stroke-width="1.5"/>
      <rect x="120" y="230" width="20" height="2.5" rx="1" fill="var(--slime-out)" opacity="0.7"/>
      <rect x="120" y="238" width="16" height="2" rx="1" fill="var(--slime-out)" opacity="0.4"/>
      <rect x="120" y="246" width="14" height="2" rx="1" fill="var(--slime-out)" opacity="0.4"/>
      <g fill="var(--slime-out)"><rect x="100" y="254" width="1" height="4"/><rect x="103" y="254" width="2" height="4"/><rect x="107" y="254" width="1" height="4"/><rect x="110" y="254" width="3" height="4"/><rect x="115" y="254" width="1" height="4"/><rect x="118" y="254" width="2" height="4"/><rect x="122" y="254" width="1" height="4"/><rect x="125" y="254" width="2" height="4"/><rect x="129" y="254" width="3" height="4"/><rect x="134" y="254" width="1" height="4"/><rect x="137" y="254" width="2" height="4"/></g>
    </g>`,
    bandana:()=>`
    <g class="accessory" data-zone="base">
      <path d="M 60,196 L 180,196 L 120,260 Z" fill="#DC2626" stroke="var(--slime-out)" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="100" cy="218" r="2.5" fill="#fafafa" opacity="0.85"/>
      <circle cx="140" cy="218" r="2.5" fill="#fafafa" opacity="0.85"/>
      <circle cx="120" cy="232" r="3" fill="#fafafa" opacity="0.85"/>
      <circle cx="108" cy="244" r="2" fill="#fafafa" opacity="0.85"/>
      <circle cx="132" cy="244" r="2" fill="#fafafa" opacity="0.85"/>
      <path d="M 102,198 Q 120,188 138,198 Q 134,210 120,210 Q 106,210 102,198 Z" fill="#B91C1C" stroke="var(--slime-out)" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M 110,196 Q 120,202 130,196" stroke="var(--slime-out)" stroke-width="1.5" fill="none" opacity="0.6"/>
      <path d="M 110,200 L 118,196" stroke="white" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
    </g>`,
    pearls:()=>`
    <g class="accessory" data-zone="base">
      <path d="M 56,198 Q 120,218 184,198" stroke="var(--slime-out)" stroke-width="1" fill="none" opacity="0.5"/>
      <circle cx="56.0" cy="198.0" r="4.0" fill="#fafafa" stroke="var(--slime-out)" stroke-width="1.2"/><circle cx="55.0" cy="197.0" r="1" fill="white" opacity="0.9"/>
      <circle cx="66.7" cy="199.5" r="4.4" fill="#fafafa" stroke="var(--slime-out)" stroke-width="1.2"/><circle cx="65.7" cy="198.5" r="1" fill="white" opacity="0.9"/>
      <circle cx="77.3" cy="203.5" r="4.7" fill="#fafafa" stroke="var(--slime-out)" stroke-width="1.2"/><circle cx="76.3" cy="202.5" r="1" fill="white" opacity="0.9"/>
      <circle cx="88.0" cy="208.5" r="5.0" fill="#fafafa" stroke="var(--slime-out)" stroke-width="1.2"/><circle cx="87.0" cy="207.5" r="1" fill="white" opacity="0.9"/>
      <circle cx="98.7" cy="213.5" r="5.2" fill="#fafafa" stroke="var(--slime-out)" stroke-width="1.2"/><circle cx="97.7" cy="212.5" r="1" fill="white" opacity="0.9"/>
      <circle cx="109.3" cy="216.5" r="5.3" fill="#fafafa" stroke="var(--slime-out)" stroke-width="1.2"/><circle cx="108.3" cy="215.5" r="1" fill="white" opacity="0.9"/>
      <circle cx="120.0" cy="217.0" r="5.5" fill="#fafafa" stroke="var(--slime-out)" stroke-width="1.2"/><circle cx="119.0" cy="216.0" r="1" fill="white" opacity="0.9"/>
      <circle cx="130.7" cy="216.5" r="5.3" fill="#fafafa" stroke="var(--slime-out)" stroke-width="1.2"/><circle cx="129.7" cy="215.5" r="1" fill="white" opacity="0.9"/>
      <circle cx="141.3" cy="213.5" r="5.2" fill="#fafafa" stroke="var(--slime-out)" stroke-width="1.2"/><circle cx="140.3" cy="212.5" r="1" fill="white" opacity="0.9"/>
      <circle cx="152.0" cy="208.5" r="5.0" fill="#fafafa" stroke="var(--slime-out)" stroke-width="1.2"/><circle cx="151.0" cy="207.5" r="1" fill="white" opacity="0.9"/>
      <circle cx="162.7" cy="203.5" r="4.7" fill="#fafafa" stroke="var(--slime-out)" stroke-width="1.2"/><circle cx="161.7" cy="202.5" r="1" fill="white" opacity="0.9"/>
      <circle cx="173.3" cy="199.5" r="4.4" fill="#fafafa" stroke="var(--slime-out)" stroke-width="1.2"/><circle cx="172.3" cy="198.5" r="1" fill="white" opacity="0.9"/>
      <circle cx="184.0" cy="198.0" r="4.0" fill="#fafafa" stroke="var(--slime-out)" stroke-width="1.2"/><circle cx="183.0" cy="197.0" r="1" fill="white" opacity="0.9"/>
    </g>`,
    medal:()=>`
    <g class="accessory" data-zone="base">
      <path d="M 92,150 L 116,210 L 124,210 L 100,150 Z" fill="#DC2626" stroke="var(--slime-out)" stroke-width="2" stroke-linejoin="round"/>
      <path d="M 148,150 L 124,210 L 116,210 L 140,150 Z" fill="#B91C1C" stroke="var(--slime-out)" stroke-width="2" stroke-linejoin="round"/>
      <rect x="112" y="206" width="16" height="8" rx="1" fill="#7F1D1D" stroke="var(--slime-out)" stroke-width="1.5"/>
      <circle cx="120" cy="234" r="18" fill="#F5C84A" stroke="#5C3F00" stroke-width="2.5"/>
      <circle cx="120" cy="234" r="13" fill="#F5D77A" stroke="#5C3F00" stroke-width="1.5"/>
      <path d="M 120,225 l 2.5,6 6.5,0.8 -4.8,4.2 1.2,6.5 -5.4,-3.4 -5.4,3.4 1.2,-6.5 -4.8,-4.2 6.5,-0.8 z" fill="#FBBF24" stroke="#5C3F00" stroke-width="1"/>
      <path d="M 108,224 Q 112,220 120,220" stroke="white" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.7"/>
    </g>`,
    lightbulb:()=>`
    <g class="accessory" data-zone="float">
      <circle cx="120" cy="4" r="22" fill="#FBBF24" opacity="0.3"/>
      <g stroke="#FBBF24" stroke-width="2.5" stroke-linecap="round">
        <path d="M 120,-22 L 120,-12"/>
        <path d="M 96,-18 L 102,-10"/>
        <path d="M 144,-18 L 138,-10"/>
        <path d="M 80,-4 L 90,0"/>
        <path d="M 160,-4 L 150,0"/>
      </g>
      <path d="M 108,-6 Q 108,-20 120,-22 Q 132,-20 132,-6 Q 132,8 124,12 L 116,12 Q 108,8 108,-6 Z" fill="#FCD34D" stroke="var(--slime-out)" stroke-width="2" stroke-linejoin="round"/>
      <path d="M 114,2 Q 120,-6 126,2" stroke="#D97706" stroke-width="1.5" fill="none"/>
      <rect x="114" y="12" width="12" height="6" fill="#71717a" stroke="var(--slime-out)" stroke-width="1.5"/>
      <path d="M 114,16 L 126,16 M 114,20 L 126,20" stroke="var(--slime-out)" stroke-width="1" opacity="0.6"/>
      <ellipse cx="116" cy="-12" rx="3" ry="5" transform="rotate(-20 116 -12)" fill="white" opacity="0.8"/>
    </g>`,
    snowflake:()=>`
    <g class="accessory" data-zone="float" transform="translate(120 8)">
      <g stroke="#60A5FA" stroke-width="3" stroke-linecap="round" fill="none">
        <path d="M 0,-22 L 0,22"/>
        <path d="M -19,-11 L 19,11"/>
        <path d="M -19,11 L 19,-11"/>
      </g>
      <g stroke="#60A5FA" stroke-width="2" stroke-linecap="round" fill="none">
        <path d="M 0,-22 L -4,-18 M 0,-22 L 4,-18"/>
        <path d="M 0,22 L -4,18 M 0,22 L 4,18"/>
        <path d="M -19,-11 L -16,-15 M -19,-11 L -15,-7"/>
        <path d="M 19,11 L 16,15 M 19,11 L 15,7"/>
        <path d="M -19,11 L -16,15 M -19,11 L -15,7"/>
        <path d="M 19,-11 L 16,-15 M 19,-11 L 15,-7"/>
      </g>
      <circle r="3" fill="#fafafa" stroke="#3B82F6" stroke-width="1.5"/>
      <g transform="translate(36 -14) scale(0.4)" stroke="#93C5FD" stroke-width="3" stroke-linecap="round"><path d="M 0,-20 L 0,20"/><path d="M -17,-10 L 17,10"/><path d="M -17,10 L 17,-10"/></g>
      <g transform="translate(-40 12) scale(0.3)" stroke="#93C5FD" stroke-width="3" stroke-linecap="round"><path d="M 0,-20 L 0,20"/><path d="M -17,-10 L 17,10"/><path d="M -17,10 L 17,-10"/></g>
    </g>`,
    raincloud:()=>`
    <g class="accessory" data-zone="float">
      <ellipse cx="90" cy="-2" rx="18" ry="14" fill="#94a3b8" stroke="var(--slime-out)" stroke-width="2"/>
      <ellipse cx="120" cy="-10" rx="24" ry="18" fill="#94a3b8" stroke="var(--slime-out)" stroke-width="2"/>
      <ellipse cx="150" cy="-2" rx="18" ry="14" fill="#94a3b8" stroke="var(--slime-out)" stroke-width="2"/>
      <ellipse cx="120" cy="6" rx="40" ry="10" fill="#94a3b8" stroke="var(--slime-out)" stroke-width="2"/>
      <ellipse cx="108" cy="-14" rx="8" ry="4" fill="#cbd5e1" opacity="0.8"/>
      <ellipse cx="130" cy="-12" rx="6" ry="3" fill="#cbd5e1" opacity="0.6"/>
      <g fill="#60A5FA" stroke="var(--slime-out)" stroke-width="1.2" stroke-linejoin="round">
        <path d="M 96,20 Q 92,28 96,34 Q 100,28 96,20 Z"/>
        <path d="M 112,26 Q 108,34 112,40 Q 116,34 112,26 Z"/>
        <path d="M 128,20 Q 124,28 128,34 Q 132,28 128,20 Z"/>
        <path d="M 144,26 Q 140,34 144,40 Q 148,34 144,26 Z"/>
      </g>
    </g>`,
    star:()=>`
    <g class="accessory" data-zone="float">
      <circle cx="120" cy="6" r="20" fill="#FCD34D" opacity="0.35"/>
      <path d="M 120,-18 L 126,0 L 146,2 L 130,14 L 136,32 L 120,22 L 104,32 L 110,14 L 94,2 L 114,0 Z" fill="#FBBF24" stroke="#92400E" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M 116,-10 L 118,2 L 108,4 Z" fill="#FEF3C7" opacity="0.85"/>
      <path d="M 80,-12 l 1,3 3,1 -3,1 -1,3 -1,-3 -3,-1 3,-1 z" fill="#FCD34D"/>
      <path d="M 162,16 l 1,3 3,1 -3,1 -1,3 -1,-3 -3,-1 3,-1 z" fill="#FCD34D" opacity="0.8"/>
    </g>`,
    speech:()=>`
    <g class="accessory" data-zone="float">
      <path d="M 144,-22 Q 220,-22 220,2 Q 220,22 156,22 L 148,34 L 144,22 Q 132,20 134,4 Q 132,-22 144,-22 Z" fill="#fafafa" stroke="var(--slime-out)" stroke-width="2.5" stroke-linejoin="round"/>
      <text x="178" y="6" text-anchor="middle" font-family="Inter,sans-serif" font-size="18" font-weight="700" fill="var(--slime-out)">hi!</text>
      <path d="M 146,-12 Q 150,-18 158,-18" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.7"/>
    </g>`,
    notify:()=>`
    <g class="accessory" data-zone="float">
      <path d="M 156,-8 Q 156,-26 172,-26 Q 188,-26 188,-8 L 192,4 L 152,4 Z" fill="#FBBF24" stroke="var(--slime-out)" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="172" cy="-28" r="3" fill="#FBBF24" stroke="var(--slime-out)" stroke-width="1.5"/>
      <circle cx="172" cy="8" r="4" fill="#FBBF24" stroke="var(--slime-out)" stroke-width="1.5"/>
      <path d="M 162,-18 Q 164,-22 168,-22" stroke="white" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.7"/>
      <circle cx="192" cy="-20" r="12" fill="#EF4444" stroke="var(--slime-out)" stroke-width="2" opacity="0.4"/>
      <circle cx="192" cy="-20" r="10" fill="#EF4444" stroke="var(--slime-out)" stroke-width="2"/>
      <text x="192" y="-16" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" font-weight="800" fill="white">3</text>
      <path d="M 142,-20 L 136,-22 M 144,-12 L 138,-12" stroke="var(--slime-out)" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
      <path d="M 202,-2 L 208,0 M 200,6 L 206,8" stroke="var(--slime-out)" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
    </g>`,
  };
  const fn=ACCESSORIES[acc]||ACCESSORIES['classic'];
  return fn();
}

/* OB_BODIES — 5 founder-curated canonical silhouettes (founder pick 2026-05-22).
   Trimmed from the 11-body catalog in design/slime-assets-v2.2/slime-hero-shapes.html.
   Discarded: gumdrop, bell, puddle, dollop, mound, lobed.
   All authored for viewBox 0 0 240 240 with shared eye/mouth/blush coordinates so
   the same face rig sits naturally on every body. Default fallback = pebble (neutral). */
const OB_BODIES={
  pebble: 'M 18,196 C 16,128 50,68 120,68 C 190,68 224,128 222,196 C 220,214 170,220 120,220 C 70,220 20,214 18,196 Z',
  onion:  'M 32,176 C 26,118 76,38 120,30 C 164,38 214,118 208,176 C 207,202 170,210 120,210 C 70,210 33,202 32,176 Z',
  cushion:'M 36,80 Q 36,46 70,46 L 170,46 Q 204,46 204,80 L 204,180 Q 204,212 170,212 L 70,212 Q 36,212 36,180 Z',
  cloud:  'M 30,180 C 28,108 60,52 120,52 C 180,52 212,108 210,180 Q 198,202 178,212 Q 158,202 138,212 Q 118,202 98,212 Q 78,202 58,212 Q 38,202 30,180 Z',
  bean:   'M 28,168 C 24,108 70,52 120,52 C 174,52 212,98 210,156 Q 226,196 198,210 C 178,218 134,216 102,210 Q 70,218 38,202 Q 18,190 28,168 Z'
};

/* OB_FACES — 5 canonical expressions ported verbatim from
   design/slime-assets-v2.2/slime-expressions.html FACES dict.
   ${OUTLINE} → var(--slime-out)   ${TONGUE} → #FF7A9B (literal, not a CSS var)
   Each returns the full <g class="face">…</g> fragment so cycleFaces()
   can replace .ob-v2-face innerHTML without touching blush/accessory. */
const OB_FACES={
  // 01 · idle — calm dot eyes, gentle closed smile
  idle:()=>`
    <g class="face">
      <g class="face-eyes">
        <ellipse cx="95"  cy="132" rx="7.5" ry="9.5" fill="var(--slime-out)" />
        <ellipse cx="145" cy="132" rx="7.5" ry="9.5" fill="var(--slime-out)" />
        <ellipse cx="93"  cy="128" rx="2.2" ry="2.8" fill="white" />
        <ellipse cx="143" cy="128" rx="2.2" ry="2.8" fill="white" />
      </g>
      <g class="face-mouth">
        <path d="M 102,172 Q 120,184 138,172" fill="none" stroke="var(--slime-out)" stroke-width="4.5" stroke-linecap="round" />
      </g>
    </g>`,
  // 02 · happy — laughing open mouth, arc eyes (^_^)
  happy:()=>`
    <g class="face">
      <g class="face-eyes">
        <path d="M 84,134 Q 95,118 106,134" fill="none" stroke="var(--slime-out)" stroke-width="5" stroke-linecap="round" />
        <path d="M 134,134 Q 145,118 156,134" fill="none" stroke="var(--slime-out)" stroke-width="5" stroke-linecap="round" />
      </g>
      <g class="face-mouth">
        <path d="M 90,158 Q 120,153 150,158 Q 148,196 120,204 Q 92,196 90,158 Z" fill="var(--slime-out)" />
        <path d="M 102,184 Q 120,206 138,184 Q 134,200 120,202 Q 106,200 102,184 Z" fill="#FF7A9B" />
        <path d="M 113,158 L 117,158 L 116,164 L 114,164 Z" fill="white" opacity="0.9" />
      </g>
    </g>`,
  // 03 · annoyed — angled brows, small frown
  annoyed:()=>`
    <g class="face">
      <g class="face-brows">
        <path d="M 78,114 L 108,124" stroke="var(--slime-out)" stroke-width="5" stroke-linecap="round" />
        <path d="M 132,124 L 162,114" stroke="var(--slime-out)" stroke-width="5" stroke-linecap="round" />
      </g>
      <g class="face-eyes">
        <ellipse cx="95"  cy="136" rx="6.5" ry="8.5" fill="var(--slime-out)" />
        <ellipse cx="145" cy="136" rx="6.5" ry="8.5" fill="var(--slime-out)" />
        <ellipse cx="94"  cy="133" rx="1.8" ry="2.2" fill="white" />
        <ellipse cx="144" cy="133" rx="1.8" ry="2.2" fill="white" />
      </g>
      <g class="face-mouth">
        <path d="M 104,182 Q 120,172 136,182" fill="none" stroke="var(--slime-out)" stroke-width="4.5" stroke-linecap="round" />
      </g>
    </g>`,
  // 04 · thinking — sclera + pupil up-right, tiny "o" mouth, thought dots
  thinking:()=>`
    <g class="face">
      <g class="face-eyes">
        <ellipse cx="95"  cy="132" rx="9"  ry="11" fill="white" stroke="var(--slime-out)" stroke-width="3" />
        <ellipse cx="145" cy="132" rx="9"  ry="11" fill="white" stroke="var(--slime-out)" stroke-width="3" />
        <ellipse cx="98"  cy="126" rx="3.5" ry="4.2" fill="var(--slime-out)" />
        <ellipse cx="148" cy="126" rx="3.5" ry="4.2" fill="var(--slime-out)" />
      </g>
      <g class="face-mouth">
        <ellipse cx="120" cy="184" rx="5.5" ry="7" fill="var(--slime-out)" />
      </g>
      <g class="face-extras">
        <circle cx="178" cy="104" r="3" fill="var(--slime-out)" opacity="0.85" />
        <circle cx="190" cy="92"  r="4" fill="var(--slime-out)" opacity="0.7" />
        <circle cx="206" cy="78"  r="5.5" fill="var(--slime-out)" opacity="0.55" />
      </g>
    </g>`,
  // 05 · blinking — thin curved lines for eyes, soft smile
  blinking:()=>`
    <g class="face">
      <g class="face-eyes">
        <path d="M 84,132 Q 95,127 106,132" fill="none" stroke="var(--slime-out)" stroke-width="4.5" stroke-linecap="round" />
        <path d="M 134,132 Q 145,127 156,132" fill="none" stroke="var(--slime-out)" stroke-width="4.5" stroke-linecap="round" />
      </g>
      <g class="face-mouth">
        <path d="M 102,172 Q 120,184 138,172" fill="none" stroke="var(--slime-out)" stroke-width="4.5" stroke-linecap="round" />
      </g>
    </g>`,
};

/* buildDesignSlime — canonical port: viewBox 0 0 240 240.
   uid==="fab"  → class="fab-eye" on eyes (widget blink target, JS also reads this)
   uid==="prof" → class="prof-eye" on eyes (profile blink target)
   colorOverride = {light,mid,dark,outline,blush} or legacy {base,hi,deep} (auto-bridged)
   accOverride = canonical acc key string (e.g. "wizard", "classic")
   t.body = canonical body silhouette key (see OB_BODIES). Default "pebble". */
function buildDesignSlime(t,uid,colorOverride,accOverride){
  const gradId="ob-sg-"+(uid||Math.random().toString(36).slice(2));
  const rawCol=colorOverride||t.color;
  /* Bridge legacy {base,hi,deep} → canonical 5-key tokens.
     Canonical keys take precedence when both exist. */
  const col={
    light: rawCol.light  || rawCol.hi   || rawCol.base || '#A8EE85',
    mid:   rawCol.mid    || rawCol.base  || '#6CD261',
    dark:  rawCol.dark   || rawCol.deep  || '#3FB14F',
    out:   rawCol.outline|| rawCol.out   || '#14391F',
    blush: rawCol.blush  || '#FF7A9B'
  };
  const acc=(accOverride!==undefined)?accOverride:(t.acc||'classic');
  const eyeClass=(uid==="fab")?' class="fab-eye"':(uid==="prof")?' class="prof-eye"':'';
  return`<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg"
    style="--slime-light:${col.light};--slime-mid:${col.mid};--slime-dark:${col.dark};--slime-out:${col.out};--slime-blush:${col.blush};">
    <defs>
      <linearGradient id="${gradId}" x1="20%" y1="8%" x2="80%" y2="100%">
        <stop offset="0%"  stop-color="var(--slime-light)" />
        <stop offset="50%" stop-color="var(--slime-mid)" />
        <stop offset="100%" stop-color="var(--slime-dark)" />
      </linearGradient>
      <radialGradient id="${gradId}-hl" cx="35%" cy="30%" r="60%">
        <stop offset="0%" stop-color="white" stop-opacity="0.75" />
        <stop offset="100%" stop-color="white" stop-opacity="0" />
      </radialGradient>
      <filter id="${gradId}-blur" x="-20%" y="-50%" width="140%" height="200%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
      <clipPath id="${gradId}-clip"><path d="${OB_BODIES[t.body]||OB_BODIES.pebble}"/></clipPath>
    </defs>
    <!-- contact shadow -->
    <ellipse cx="120" cy="222" rx="74" ry="6" fill="black" opacity="0.22" filter="url(#${gradId}-blur)" />
    <!-- body — selected from OB_BODIES per t.body (default pebble) -->
    <path d="${OB_BODIES[t.body]||OB_BODIES.pebble}"
          fill="url(#${gradId})"
          stroke="var(--slime-out)" stroke-width="4.5" stroke-linejoin="round" />
    <!-- rim light -->
    <path d="M 50,202 C 80,210 160,210 190,202" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.18" />
    <!-- glossy highlights — clipped to body silhouette so they don't bleed outside wider bodies -->
    <g clip-path="url(#${gradId}-clip)">
      <ellipse cx="82" cy="96" rx="30" ry="16" transform="rotate(-32 82 96)" fill="url(#${gradId}-hl)" />
      <ellipse cx="62" cy="128" rx="5" ry="10" transform="rotate(-30 62 128)" fill="white" opacity="0.45" />
    </g>
    <!-- blush cheeks -->
    <ellipse cx="73" cy="160" rx="14" ry="7" fill="var(--slime-blush)" opacity="0.45" />
    <ellipse cx="167" cy="160" rx="14" ry="7" fill="var(--slime-blush)" opacity="0.45" />
    <!-- face group: swapped by cycleFaces() — initial render = idle -->
    <g class="ob-v2-face">${OB_FACES.idle()}</g>
    <!-- accessory -->
    ${obAccSvg(acc)}
  </svg>`;
}

/* Block 4: expression engine */
let slimeEmo="idle", _emoTmr=null;
function setEmo(e,holdMs){
  slimeEmo=e;
  document.querySelectorAll(".s-slime").forEach(s=>s.dataset.emo=e);
  clearTimeout(_emoTmr);
  if(holdMs) _emoTmr=setTimeout(()=>setEmo("idle"),holdMs);
}
function slimeAnim(cls){
  if(_prm) return;
  document.querySelectorAll(".s-slime").forEach(s=>{
    s.classList.remove(cls); void s.offsetWidth; s.classList.add(cls);
    setTimeout(()=>s.classList.remove(cls),1000);
  });
}
function slimeBlink(){
  if(slimeEmo==="happy") return;
  // v2 face rig: swap to data-emo="blink" briefly, restore previous emo
  const ss=document.querySelectorAll(".s-slime");
  const prev=new Map();
  ss.forEach(s=>{ prev.set(s, s.dataset.emo||"idle"); s.dataset.emo="blink"; });
  setTimeout(()=>ss.forEach(s=>{ if(s.dataset.emo==="blink") s.dataset.emo=prev.get(s)||"idle"; }),150);
  // legacy design slime widget (#ai-fab .fab-eye) — keep behaviour if present
  const fab=$("ai-fab"); if(!fab) return;
  fab.querySelectorAll(".fab-eye").forEach(e=>e.classList.add("fab-blink"));
  setTimeout(()=>fab.querySelectorAll(".fab-eye").forEach(e=>e.classList.remove("fab-blink")),150);
}
function slimeEmote(kind){
  if(kind==="happy"){ setEmo("happy",2600); slimeAnim("j"); }
  else if(kind==="celebrate"){ setEmo("happy",3000); slimeAnim("spin"); }
  else if(kind==="annoyed"){ setEmo("annoyed",2200); slimeAnim("shake"); }
  else if(kind==="think"){ setEmo("think"); }
  else setEmo("idle");
}
/* ============================================================
   cycleFaces() — rotates .ob-v2-face innerHTML across all rendered
   design slimes. Weighted random per personality (FACE_WEIGHTS_BY_MOOD).
   280ms opacity fade between swaps. Never repeats same face twice in a row.
   Respects prefers-reduced-motion (no-op when reduced).
   Single shared interval — not per-instance. Scheduled by aiInit().
   ============================================================ */
const FACE_WEIGHTS_BY_MOOD={
  cheerful:{idle:30,happy:50,blinking:15,thinking:5, annoyed:0 },
  calm:    {idle:60,happy:5, blinking:25,thinking:10,annoyed:0 },
  sassy:   {idle:30,happy:25,blinking:10,thinking:15,annoyed:20},
  focused: {idle:30,happy:5, blinking:20,thinking:45,annoyed:0 },
  curious: {idle:35,happy:20,blinking:10,thinking:35,annoyed:0 },
  bold:    {idle:30,happy:30,blinking:5, thinking:10,annoyed:25},
};
let _obCurrentFace="idle";
let _obCycleInterval=null;
function cycleFaces(){
  // No-op when reduced-motion is active; face stays on idle
  if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion:reduce)").matches) return;
  // Resolve current personality from onboarding.slime
  const sl=(onboarding&&onboarding.slime)||{};
  const typeKey=sl.type||"";
  const t=(typeof OB_TYPES!=="undefined")&&OB_TYPES[typeKey];
  const mood=sl.mood||sl.personality||(t&&t.personality)||"cheerful";
  const weights=FACE_WEIGHTS_BY_MOOD[mood]||FACE_WEIGHTS_BY_MOOD.cheerful;
  // Build pool excluding current face, then weighted-random pick
  const faces=Object.keys(weights);
  const pool=faces.filter(k=>k!==_obCurrentFace&&weights[k]>0);
  const poolTotal=pool.reduce((s,k)=>s+weights[k],0);
  let r=Math.random()*poolTotal;
  let next="idle";
  for(const k of pool){ r-=weights[k]; if(r<=0){ next=k; break; } }
  _obCurrentFace=next;
  const faceFn=OB_FACES[next];
  if(!faceFn) return;
  const faceHtml=faceFn();
  document.querySelectorAll(".ob-v2-face").forEach(el=>{
    el.style.opacity="0.4";
    setTimeout(()=>{ el.innerHTML=faceHtml; el.style.opacity="1"; },140);
  });
}
/* ============================================================
   FAB_QUIPS + _showFabBubble() — widget chat bubble API.
   _showFabBubble(text, ms) shows the .fab-bubble for ms milliseconds
   (default 4500). Idempotent: re-call resets the hide timer.
   Auto-quip loop starts in aiInit() after 5s, fires every 8-15s.
   Paused pre-hatch (egg doesn't talk) and while panel is open.
   ============================================================ */

/* Block 5: quip / bubble system */
/* Per-personality quip pool. Merged from the original FAB_QUIPS + the profile
   bubble's _idleByMood lines (now retired — the profile bubble was removed
   per founder direction 2026-05-22 and its variety surfaces here instead). */
const FAB_QUIPS={
  cheerful:[
    "let's get to it.","what's next?","i'm ready when you are.","ohhh, look at you.",
    "hi — i'm right here. ★","you've got things to do today. wanna start the easy one?",
    "i remembered everything you told me. truly.","we're going to get along great, i can tell.",
  ],
  calm:[
    "here when you need me.","no rush.","i've been thinking…","all good.",
    "still here. take your time.","you have tasks. no rush.",
    "i remembered the things you said.","quiet good work.",
  ],
  sassy:[
    "finally.","took you long enough.","i had a thought.","ok ok, what now?",
    "oh, you again. let's go.","oh, you're back. about time.",
    "tasks. don't tell me you forgot.","i remember everything. yes, even that.","don't blow it.",
  ],
  focused:[
    "status: ready.","queue clear.","next.","noted.",
    "ready.","tasks due today.","memory: locked in.","streak. keep.",
  ],
  curious:[
    "what if, though?","interesting…","have you tried…","hmm.",
    "i've been thinking…","what if we tried something different today?",
    "i noticed something. want to hear it?","still exploring. so much to learn.",
  ],
  bold:[
    "let's go.","i'm in.","say less.","first thing first.",
    "ready? let's go.","no hesitation. move.","bold choices only.","full send.",
  ],
};
/* ============================================================
   getAiSummaries() — pulls real app state + deterministic fallbacks
   to feed the widget bubble. Returns array of ≤6 short strings (≤60
   chars each). Always produces at least the time-of-day + day-of-week
   pair. All content is deterministic given app state — no PRNG.
   ============================================================ */
function getAiSummaries(){
  const out=[];
  // 1. Native tasks count (real localStorage data)
  try{
    const raw=localStorage.getItem("compass_native_tasks");
    if(raw){
      const tasks=JSON.parse(raw);
      if(Array.isArray(tasks)){
        const n=tasks.filter(t=>t.status!=="done").length;
        if(n>0) out.push(`don't forget you have ${n} task${n===1?"":"s"} today`);
      }
    }
  }catch(e){}
  // 2. Upcoming calendar events — check known demo calendar globals
  try{
    const cal=window.demoCal||window._demoCalendar||null;
    if(Array.isArray(cal)&&cal.length){
      const now=Date.now();
      const next=cal.filter(e=>e.start>now).sort((a,b)=>a.start-b.start)[0];
      if(next){
        const mins=Math.round((next.start-now)/60000);
        if(mins>0&&mins<180) out.push(`your next meeting is in ${mins} minute${mins===1?"":"s"}`);
      }
    }
  }catch(e){}
  // 3. Unread notifications — DOM count or localStorage flag
  try{
    const domCount=document.querySelectorAll(".notif-pop .notif-item").length;
    const lsCount=parseInt(localStorage.getItem("notif_unread")||"0",10);
    const n=domCount||lsCount;
    if(n>0) out.push(`${n} unread notification${n===1?"":"s"}`);
  }catch(e){}
  // 4. Hatch reminder — multiple variants so the egg widget doesn't repeat
  // the same line every 8-15s. Pushed multiple times so the random picker
  // weights them above the time-of-day/day-of-week fallbacks below.
  const sl=(onboarding&&onboarding.slime)||{};
  if(!sl.hatched){
    out.push("don't forget to crack your egg.");
    out.push("your slime's waiting inside the egg.");
    out.push("ready when you are — let's hatch.");
    out.push("3 taps and we're partners.");
  }
  // 5. Profile naming reminder (hatched but still using default type name)
  else{
    const typeKey=sl.type||"";
    const t=(typeof OB_TYPES!=="undefined")&&OB_TYPES[typeKey];
    const defaultName=t&&t.name;
    if(defaultName&&sl.name===defaultName) out.push("i'd love a name when you have a moment");
  }
  // 6. Always-present deterministic fallbacks
  const now=new Date();
  const h=now.getHours();
  const days=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  const weekday=days[now.getDay()];
  out.push(`happy ${weekday}. let's go.`);
  if(h<12)      out.push("good morning. coffee first?");
  else if(h<17) out.push("halfway through. nice.");
  else           out.push("big day. small wins.");
  // End-of-month: last 3 days of month
  const lastDay=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
  if(now.getDate()>=lastDay-2) out.push("final stretch. month wraps up soon.");
  // Cap at 6
  return out.slice(0,6);
}
let _fabBubbleTmr=null;
/* _showFabBubble(text, ms, source)
   source="self" → eyebrow = slime name (default behavior)
   source="ai"   → eyebrow = "Compass AI" + indigo dot icon */
function _showFabBubble(text,ms,source){
  const bb=$("fab-bubble"); if(!bb) return;
  const ey=$("fab-bubble-eyebrow");
  const tx=$("fab-bubble-txt");
  const sl=(onboarding&&onboarding.slime)||{};
  if(ey){
    if(source==="ai"){
      ey.textContent="Compass AI";
    } else {
      ey.textContent=sl.name||"Compass";
    }
  }
  if(tx) tx.textContent=text;
  bb.classList.add("show");
  clearTimeout(_fabBubbleTmr);
  _fabBubbleTmr=setTimeout(()=>bb.classList.remove("show"),ms||4500);
}
// Quiet-mode preference: user can toggle off random auto-quip bubbles via the
// "Chat bubble" switch in the slime customizer tray. Default = enabled.
// Reaction bubbles (color/accessory/mood change) ignore this and still fire —
// they're explicit feedback to user action, not background nudges.
const _FAB_QUIPS_KEY="compass_fab_quips_enabled";
function _isFabQuipsEnabled(){
  try{ const v=localStorage.getItem(_FAB_QUIPS_KEY); return v===null?true:v==="1"; }catch(e){ return true; }
}
function _setFabQuipsEnabled(on){
  try{ localStorage.setItem(_FAB_QUIPS_KEY, on?"1":"0"); }catch(e){}
}
let _fabQuipInterval=null;
function _startFabQuipLoop(){
  if(_fabQuipInterval) return; // guard: only one loop
  const fire=()=>{
    // Respect quiet-mode toggle — keep the loop alive but skip firing.
    if(!_isFabQuipsEnabled()){ reschedule(); return; }
    const sl=(onboarding&&onboarding.slime)||{};
    // Pause only while the chat panel is open. Pre-hatch (egg state) still
    // gets AI summary nudges (e.g. "crack your egg when you're ready") so
    // the egg widget reminds the user to hatch instead of going silent.
    const panelOpen=($("ai-fab")&&$("ai-fab").dataset.state==="open")||chatOpen||false;
    if(panelOpen){ reschedule(); return; }
    const isHatched=!!sl.type;
    const mood=sl.mood||sl.personality||"cheerful";
    if(!isHatched){
      // Egg state: force AI summary path (contains hatch reminder via
      // getAiSummaries()'s !hatched branch). Personality quips skipped —
      // no slime persona to speak as until the egg cracks.
      const summaries=getAiSummaries();
      if(summaries.length){
        const idx=Math.floor(Math.random()*summaries.length);
        _showFabBubble(summaries[idx],4800,/*source*/"ai");
      }
      reschedule(); return;
    }
    // Hatched: 60% AI summary, 40% personality quip
    if(Math.random()<0.6){
      const summaries=getAiSummaries();
      if(summaries.length){
        const idx=Math.floor(Math.random()*summaries.length);
        _showFabBubble(summaries[idx],4800,/*source*/"ai");
      } else {
        const pool=FAB_QUIPS[mood]||FAB_QUIPS.cheerful;
        _showFabBubble(pool[Math.floor(Math.random()*pool.length)],4500+Math.random()*500,"self");
      }
    } else {
      const pool=FAB_QUIPS[mood]||FAB_QUIPS.cheerful;
      _showFabBubble(pool[Math.floor(Math.random()*pool.length)],4500+Math.random()*500,"self");
    }
    reschedule();
  };
  const reschedule=()=>{ _fabQuipInterval=setTimeout(fire,8000+Math.random()*7000); };
  reschedule();
}

/* Block 6: FAB rendering + aiInit */
const _FAB_COLOR_TOKENS={
  indigo:{base:'#4F6BFF',hi:'#a5b4fc',deep:'#4338ca',light:'#D8CFFE',mid:'#9C8FFA',dark:'#5346E0',outline:'#1B1850',blush:'#FF7A9B'},
  aqua:  {base:'#22d3ee',hi:'#a5f3fc',deep:'#0891b2',light:'#A8DEFF',mid:'#5DB8F2',dark:'#2E80D6',outline:'#0F2A48',blush:'#FF7A9B'},
  mint:  {base:'#34d399',hi:'#a7f3d0',deep:'#059669',light:'#A8EE85',mid:'#6CD261',dark:'#3FB14F',outline:'#14391F',blush:'#FF7A9B'},
  coral: {base:'#fb7185',hi:'#fecdd3',deep:'#be123c',light:'#FCD7E9',mid:'#F49DC5',dark:'#E5408C',outline:'#4A0D2D',blush:'#C53030'},
  amber: {base:'#fbbf24',hi:'#fde68a',deep:'#b45309',light:'#FFE68C',mid:'#FBBF24',dark:'#D97706',outline:'#3A2200',blush:'#C53030'},
  lilac: {base:'#7B8FFF',hi:'#BFCBFF',deep:'#7e22ce',light:'#D8CFFE',mid:'#9C8FFA',dark:'#5346E0',outline:'#1B1850',blush:'#FF7A9B'},
  slate: {base:'#94a3b8',hi:'#e2e8f0',deep:'#475569',light:'#E2E8F0',mid:'#94A3B8',dark:'#475569',outline:'#0F172A',blush:'#FF7A9B'},
};
const _FAB_TYPE_DEFAULT_COLOR={glow:'amber',drift:'aqua',spark:'coral',steady:'indigo',wisp:'lilac',ember:'coral'};
// Ephemeral in-memory preview channel for the hatch ceremony — set by
// ob_renderReveal()/reroll so the widget previews the chosen slime BEFORE
// onboarding.slime.type is persisted in ob_finish(). Cleared in ob_finish().
let _obPreviewSlime=null;
function refreshFabSlime(){
  const fab=$("ai-fab"); if(!fab) return;
  // Prefer in-flight hatch preview; fall back to persisted onboarding.slime.
  const sl=_obPreviewSlime||((onboarding&&onboarding.slime)||{});
  // Prefer the design-slime path (matches profile exactly). Fall back to the
  // legacy engine path defensively if OB_TYPES isn't loaded or the user
  // hasn't hatched (no sl.type).
  let html;
  const typeKey=sl.type;
  const t=(typeof OB_TYPES!=="undefined") ? OB_TYPES[typeKey] : null;
  if(t){
    const colorKey=sl.colorLabel||_FAB_TYPE_DEFAULT_COLOR[typeKey];
    const col=(colorKey && _FAB_COLOR_TOKENS[colorKey]) || undefined;
    // Accessory resolution: align with the big stage (slStoreEquippedAcc) so
    // widget + profile + store all read the same source. Skip the store
    // resolution during hatch preview — store state doesn't apply yet then.
    let acc;
    if(!_obPreviewSlime && typeof slStoreEquippedAcc==='function' && typeof slStoreGetDemoState==='function'){
      try{ acc=slStoreEquippedAcc(slStoreGetDemoState(),typeKey); }catch(e){}
    }
    if(acc===undefined && sl.acc!==undefined) acc=sl.acc;
    html=buildDesignSlime(t,"fab",col,acc);
  } else {
    // Pre-hatch: render an EGG, not a slime. The slime hatches via the
    // onboarding ceremony — until then the widget represents the mystery
    // egg waiting to be cracked. Matches the egg art in renderOnboardHatch.
    const eggId="fab-egg-"+Math.random().toString(36).slice(2,8);
    // Square viewBox matches the widget aspect (1:1) so SVG doesn't overflow.
    // Egg wrapped in scale(0.62) so it sits at ~60% of widget area with breathing room.
    html=`<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
      <defs>
        <radialGradient id="${eggId}" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stop-color="#BFCBFF"/>
          <stop offset="55%" stop-color="#a5b4fc"/>
          <stop offset="100%" stop-color="#3854E5"/>
        </radialGradient>
      </defs>
      <g transform="translate(58, 38) scale(0.62)">
        <ellipse cx="100" cy="252" rx="56" ry="6" fill="black" opacity="0.28"/>
        <path d="M 100 6 C 36 6 18 130 18 178 C 18 232 56 254 100 254 C 144 254 182 232 182 178 C 182 130 164 6 100 6 Z" fill="url(#${eggId})"/>
        <ellipse cx="74" cy="76" rx="18" ry="32" fill="rgba(255,255,255,0.45)" transform="rotate(-18 74 76)"/>
        <circle cx="60"  cy="80"  r="3"   fill="rgba(255,255,255,0.35)"/>
        <circle cx="140" cy="110" r="2.5" fill="rgba(255,255,255,0.3)"/>
        <circle cx="80"  cy="180" r="2"   fill="rgba(255,255,255,0.45)"/>
        <circle cx="125" cy="200" r="3"   fill="rgba(255,255,255,0.28)"/>
      </g>
    </svg>`;
  }
  // Swap any existing inner SVG / .slimewrap so the eye-class & data-mood
  // CSS rules can take effect on the fresh markup.
  const existing=fab.querySelector(".slimewrap, svg");
  if(existing) existing.outerHTML=html;
  else fab.insertAdjacentHTML("afterbegin",html);
  // Mood: set only if not already set (don't clobber a live profile change)
  if(!fab.dataset.mood){
    const mood=(sl.personality)||(t&&t.personality)||"cheerful";
    fab.dataset.mood=mood;
  }
  const tp=slimeTemp();
  fab.dataset.temp=tp?tp.key:"";
  applySlime();
}

let _aiInit=false;
// syncDesignSlimeToEngine: kept defined but widget no longer uses the engine path.
// refreshFabSlime() renders the widget via buildDesignSlime() instead.
function syncDesignSlimeToEngine(){
  const sl=(onboarding&&onboarding.slime)||{};
  if(!sl.type) return; // no design slime hatched yet — leave as-is
  // OB_TYPES body → nearest BODY_PATHS key
  const BODY_BRIDGE={round:"round",droop:"drop",angular:"pebble",tall:"tall",small:"squat",flame:"bumpy"};
  // colorLabel (7 semantic colours + 6 type-fallback labels) → THEMES key
  const COLOR_BRIDGE={
    indigo:"indigo",aqua:"sky",mint:"aurora",coral:"rose",amber:"sunset",lilac:"violet",slate:"graphite",
    glow:"sunset",drift:"sky",spark:"rose",steady:"indigo",wisp:"violet",ember:"sunset"
  };
  const t=(typeof OB_TYPES!=="undefined")&&OB_TYPES[sl.type];
  if(!t) return;
  const derivedModel=BODY_BRIDGE[t.body]||"drop";
  const derivedTheme=COLOR_BRIDGE[sl.colorLabel||sl.type]||"indigo";
  // Write back so curSlime() and applySlime() read the correct engine values
  onboarding.slime=Object.assign(sl,{model:derivedModel,theme:derivedTheme});
  // Do NOT saveOB() here — these are derived, not user-authored; they will be
  // re-derived on each aiInit() call so changes from the profile tray propagate.
}

/* syncAiPanelTitle — chat panel header `<b id="ai-panel-title">` reflects the
   user's slime name (e.g. "Spark") instead of generic "Compass Copilot".
   Falls back to "Compass Copilot" pre-hatch / when name unavailable.
   Called from aiInit() on load and from the name input handler on edit. */
function syncAiPanelTitle(){
  const el=document.getElementById("ai-panel-title"); if(!el) return;
  const sl=(typeof onboarding!=='undefined'&&onboarding&&onboarding.slime)||{};
  const nm=(sl.hatched&&sl.name)?String(sl.name).trim():"";
  el.textContent=nm||"Compass Copilot";
}
function aiInit(){
  if(_aiInit) return; _aiInit=true;
  const fab=$("ai-fab"); if(!fab) return;
  // Widget now uses buildDesignSlime() — identical to profile slime by construction.
  // syncDesignSlimeToEngine() + slimeSVG() engine path no longer drives the widget.
  refreshFabSlime();
  syncAiPanelTitle();
  if(!_prm){
    let raf=0;
    addEventListener("mousemove",e=>{
      if(raf) return;
      raf=requestAnimationFrame(()=>{
        raf=0;
        const r=fab.getBoundingClientRect();
        const cx=r.left+r.width/2, cy=r.top+r.height/2;
        const dx=e.clientX-cx, dy=e.clientY-cy;
        const d=Math.hypot(dx,dy)||1, k=Math.min(1,d/300)*4;
        const gx=(dx/d*k).toFixed(2)+"px", gy=(dy/d*k).toFixed(2)+"px";
        document.querySelectorAll(".s-face").forEach(f=>{
          f.style.setProperty("--gx",gx); f.style.setProperty("--gy",gy); });
      });
    },{passive:true});
    const blink=()=>{ slimeBlink(); setTimeout(blink,2600+Math.random()*4200); };
    setTimeout(blink,3200);
    // Expression-only idle: only face/emo changes allowed — no positional movement
    setInterval(()=>{
      if(!(slimeEmo==="idle"&&aiState==="idle"&&!chatOpen&&!document.hidden)) return;
      const tp=slimeTemp(), k=tp?tp.key:"none", r=Math.random();
      if(k==="cheery"){ if(r<.54){ setEmo("happy",1200); } }
      else if(k==="focused"){ if(r<.17) setEmo("think",1100); }
      // calm/bold/default: no idle expression change (neutral/idle held)
    },9000);
    // wander loop removed — widget is position-locked per founder requirement
  }
  const nd=$("ai-nudge");
  if(nd && !sessionStorage.getItem("aiNudged")){
    const h=new Date().getHours();
    const part=h<12?"Morning":h<18?"Afternoon":"Evening";
    const nm=((window.__user&&window.__user.name)||(DATA&&DATA.user&&DATA.user.name)||"there").split(" ")[0];
    nd.textContent=part+", "+nm+" — need a hand?";
    setTimeout(()=>{ if(!chatOpen){ nd.classList.add("show");
      setTimeout(()=>nd.classList.remove("show"),6500); } },6200);
    try{ sessionStorage.setItem("aiNudged","1"); }catch(e){}
  }
  // Expression cycling: fire once after 4s (user sees idle briefly), then loop every ~5-8s
  setTimeout(()=>{ cycleFaces(); _obCycleInterval=setInterval(cycleFaces,5500+Math.random()*3000); },4000);
  // Widget chat bubble: auto-quip loop starts after 5s initial delay
  setTimeout(_startFabQuipLoop,5000);
}


/* ── end engine ── */
document.getElementById=_realGet;

/* ── Pricing-page panel wiring ── */
(function(){
  const $=(id)=>_patchedGet(id);  /* local $ also routes slime IDs */

    /* CTA tables — both langs; runtime pick via window.__slimeLang */
  var SLIME_CTAS_EN=[
    {label:"See product",   action:"link",   href:"/why-klaut"},
    {label:"Book a demo",   action:"mail",   href:"mailto:demo@klaut.id?subject=Compass%20demo"},
    {label:"Talk to sales", action:"mail",   href:"mailto:sales@klaut.id"},
    {label:"Sign in / Try", action:"link",   href:"https://compass-app.klaut.id/dashboard/"},
    {label:"Read FAQ",      action:"link",   href:"/faq.html"},
    {label:"Switch to ID",  action:"link",   href:"/id/"},
  ];
  var SLIME_CTAS_ID=[
    {label:"Lihat produk",  action:"link",   href:"/why-klaut"},
    {label:"Pesan demo",    action:"mail",   href:"mailto:demo@klaut.id?subject=Compass%20demo"},
    {label:"Hubungi sales", action:"mail",   href:"mailto:sales@klaut.id"},
    {label:"Masuk / Coba",  action:"link",   href:"https://compass-app.klaut.id/dashboard/"},
    {label:"Baca FAQ",      action:"link",   href:"/id/faq.html"},
    {label:"Switch to EN",  action:"link",   href:"/"},
  ];
  var COMPASS_CHAT_CTAS=(window.__slimeLang==='id')?SLIME_CTAS_ID:SLIME_CTAS_EN;

  var _cscOpen=false;
  var _cscPanel=_realGet("compass-slime-chat");
  var _aiFab=_realGet("slime-fab");

  function _cscNavTo(cta){
    if(cta.action==="link"||cta.action==="mail"){window.location.href=cta.href;}
    else if(cta.action==="anchor"){
      var el=document.querySelector(cta.href);
      if(el)el.scrollIntoView({behavior:"smooth",block:"start"});
    }
    _cscToggle(false);
  }

  function _cscToggle(forceOpen){
    _cscOpen=(forceOpen!==undefined)?forceOpen:!_cscOpen;
    if(!_cscPanel)return;
    if(_cscOpen){
      _cscPanel.style.display="flex";
      _cscPanel.getBoundingClientRect();
      _cscPanel.classList.add("csc-open");
      _cscPanel.setAttribute("aria-hidden","false");
      if(_aiFab)_aiFab.toggleAttribute("data-open",true);
      var inp=_realGet("csc-input");
      if(inp)setTimeout(function(){inp.focus();},220);
    }else{
      _cscPanel.classList.remove("csc-open");
      _cscPanel.setAttribute("aria-hidden","true");
      if(_aiFab)_aiFab.removeAttribute("data-open");
      setTimeout(function(){if(!_cscOpen&&_cscPanel)_cscPanel.style.display="none";},240);
    }
    var n=_realGet("slime-nudge");if(n)n.classList.remove("show");
  }

  (function(){
    var grid=_realGet("csc-cta-grid");if(!grid)return;
    COMPASS_CHAT_CTAS.forEach(function(cta){
      var btn=document.createElement("button");
      btn.className="compass-slime-chat-cta";
      btn.textContent=cta.label;
      btn.addEventListener("click",function(){_cscNavTo(cta);});
      grid.appendChild(btn);
    });
  })();

  var _cscCloseBtn=_realGet("csc-close");
  if(_cscCloseBtn)_cscCloseBtn.addEventListener("click",function(){_cscToggle(false);});

  var _cscSendBtn=_realGet("csc-send");
  var _cscInput=_realGet("csc-input");
  function _cscSubmit(){
    var v=(_cscInput&&_cscInput.value||"").trim();
    if(!v)return;
    if(_cscInput)_cscInput.value="";
    toast("Coming soon -- full chat assistant is in development.");
  }
  if(_cscSendBtn)_cscSendBtn.addEventListener("click",_cscSubmit);
  if(_cscInput)_cscInput.addEventListener("keydown",function(e){
    if(e.key==="Enter"){e.preventDefault();_cscSubmit();}
  });

  document.addEventListener("click",function(e){
    if(!_cscOpen||!_cscPanel)return;
    if(!_cscPanel.contains(e.target)&&e.target!==_aiFab&&(!_aiFab||!_aiFab.contains(e.target)))
      _cscToggle(false);
  });

  if(_aiFab)_aiFab.addEventListener("click",function(){
    _aiFab.blur();
    var fc=(_aiFab._fc=_aiFab._fc||[]);
    var now=Date.now();
    _aiFab._fc=fc.filter(function(t){return now-t<2600;});
    _aiFab._fc.push(now);
    if(_aiFab._fc.length>=4&&typeof slimeEmote==="function"){slimeEmote("annoyed");_aiFab._fc=[];}
    _cscToggle();
  });

  var _aiX=_realGet("ai-x"),_aiPanel=_realGet("ai-panel");
  if(_aiX&&_aiPanel)_aiX.addEventListener("click",()=>{
    chatOpen=false;_aiPanel.classList.remove("open");
    _aiPanel.setAttribute("aria-hidden","true");if(_aiFab)_aiFab.removeAttribute("data-open");
  });
  var _aiFm=_realGet("ai-form");
  if(_aiFm)_aiFm.addEventListener("submit",ev=>{ev.preventDefault();toast("Coming soon -- full chat assistant is in development.");});
  document.querySelectorAll(".ai-chip").forEach(c=>
    c.addEventListener("click",()=>toast("Coming soon -- full chat assistant is in development.")));

  /* aiInit expects $("ai-fab") to resolve — re-enable patch for this call only */
  document.getElementById=_patchedGet;
  aiInit();
  document.getElementById=_realGet;
})();

})();