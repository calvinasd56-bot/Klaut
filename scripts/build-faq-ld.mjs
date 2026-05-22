// Build FAQPage JSON-LD from the FAQ array embedded in faq.html / id/faq.html.
// Re-run this whenever the FAQ array is updated.
//   node _build_faq_ld.mjs faq.html
//   node _build_faq_ld.mjs id/faq.html
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = process.argv[2];
if (!FILE) {
  console.error('Usage: node _build_faq_ld.mjs <path-to-faq.html>');
  process.exit(1);
}

let html = readFileSync(FILE, 'utf8');

// Extract the FAQ array using a non-greedy match terminated by a line with `];`
const m = html.match(/const FAQ\s*=\s*(\[[\s\S]+?\n\]);/);
if (!m) {
  console.error('Could not find `const FAQ = [...];` in ' + FILE);
  process.exit(1);
}

// Safely evaluate the array literal (it only contains object literals + template strings)
let FAQ;
try {
  FAQ = new Function('return ' + m[1])();
} catch (e) {
  console.error('Failed to parse FAQ array:', e.message);
  process.exit(1);
}

// Strip HTML to plain text for JSON-LD answer text (Google accepts simple HTML but
// plain text is the most portable & most reliable for rich-result eligibility)
const toPlain = (h) => h
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/p>/gi, '\n\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

const ld = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: toPlain(f.a),
    },
  })),
};

const block =
  '<!-- Structured Data: FAQPage (auto-generated; re-run _build_faq_ld.mjs if the FAQ array changes) -->\n' +
  '<script type="application/ld+json">\n' +
  JSON.stringify(ld, null, 2) +
  '\n</script>\n';

// Remove any previously-generated block so we don't duplicate
html = html.replace(
  /<!-- Structured Data: FAQPage[\s\S]*?<\/script>\n?/,
  ''
);

// Insert before </head>
if (!html.includes('</head>')) {
  console.error('No </head> tag in ' + FILE);
  process.exit(1);
}
html = html.replace('</head>', block + '</head>');

writeFileSync(FILE, html);
console.log(`${FILE}: wrote FAQPage JSON-LD with ${FAQ.length} questions.`);
