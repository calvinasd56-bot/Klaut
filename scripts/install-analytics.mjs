// Install Google Analytics (GA4) + Vercel Web Analytics on a list of HTML files.
//
// - GA4 snippet goes just before </head> (early loading, async).
// - Vercel insights script goes just before </body> if missing.
// - Idempotent: re-running on a file that already has GA / Vercel does nothing.
//
// Usage: node scripts/install-analytics.mjs <file1.html> <file2.html> ...
//
// Privacy notes:
// - GA4 anonymizes IPs by default (no `anonymize_ip` config needed; that's GA3).
// - cookie_flags set to SameSite=None;Secure for cross-site compatibility.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const GA_ID = 'G-59BT0YK7NH';

const GA_SNIPPET =
  '<!-- Google tag (gtag.js) -->\n' +
  `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>\n` +
  '<script>\n' +
  '  window.dataLayer = window.dataLayer || [];\n' +
  '  function gtag(){dataLayer.push(arguments);}\n' +
  '  gtag(\'js\', new Date());\n' +
  `  gtag('config', '${GA_ID}', {\n` +
  '    cookie_flags: \'SameSite=None;Secure\'\n' +
  '  });\n' +
  '</script>\n';

const VERCEL_SNIPPET =
  '<!-- Vercel Web Analytics -->\n' +
  '<script defer src="/_vercel/insights/script.js"></script>\n';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node scripts/install-analytics.mjs <file1.html> ...');
  process.exit(1);
}

let totalGaAdded = 0;
let totalVercelAdded = 0;
let totalSkipped = 0;
let totalErrors = 0;

for (const file of files) {
  if (!existsSync(file)) {
    console.error(`! MISSING: ${file}`);
    totalErrors++;
    continue;
  }
  let html = readFileSync(file, 'utf8');
  const wasGa = html.includes(GA_ID);
  const wasVercel = html.includes('_vercel/insights/script.js');

  // Add GA4 before </head>
  if (!wasGa) {
    if (!html.includes('</head>')) {
      console.error(`! NO </head> in ${file}`);
      totalErrors++;
      continue;
    }
    html = html.replace('</head>', GA_SNIPPET + '</head>');
    totalGaAdded++;
  }

  // Add Vercel before </body> if missing
  if (!wasVercel) {
    if (html.includes('</body>')) {
      html = html.replace('</body>', VERCEL_SNIPPET + '</body>');
      totalVercelAdded++;
    } else {
      // No </body>? Append (defensive — should not happen on valid HTML)
      html += '\n' + VERCEL_SNIPPET;
      totalVercelAdded++;
    }
  }

  if (wasGa && wasVercel) {
    console.log(`= ${file} (already has both)`);
    totalSkipped++;
  } else {
    const tags = [
      !wasGa ? '+GA' : '',
      !wasVercel ? '+Vercel' : '',
    ].filter(Boolean).join(' ');
    console.log(`✓ ${file} (${tags})`);
    writeFileSync(file, html);
  }
}

console.log(
  `\nDone. GA added: ${totalGaAdded}, Vercel added: ${totalVercelAdded}, ` +
  `unchanged: ${totalSkipped}, errors: ${totalErrors}`
);
