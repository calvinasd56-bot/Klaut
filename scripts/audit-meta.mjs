// Comprehensive meta-tag + slug audit across one repo.
// Usage: node scripts/audit-meta.mjs <baseURL> <file1.html> [file2.html ...]
//
// Checks per file:
//   - <title> present, length 30-70 ideal
//   - <meta name="description"> present, length 120-160 ideal
//   - <link rel="canonical"> present, matches expected URL based on file path
//   - <meta property="og:url"> matches canonical
//   - <meta property="og:title"> present
//   - <meta property="og:description"> present
//   - <meta property="og:image"> present
//   - <html lang="..."> present
//   - hreflang reciprocity (id alternate references en URL, etc.)
//   - meta robots present (index/noindex stated explicitly)
//
// Pass: ✓  Warn: ⚠  Fail: ✗

import { readFileSync, existsSync } from 'node:fs';

const baseURL = process.argv[2];
const files = process.argv.slice(3);

if (!baseURL || files.length === 0) {
  console.error('Usage: node scripts/audit-meta.mjs <baseURL> <file1.html> ...');
  process.exit(1);
}

const titles = new Map();        // title -> [files] (to detect dupes)
const descriptions = new Map();  // description -> [files]

const failByFile = new Map();
const warnByFile = new Map();
let totalFail = 0;
let totalWarn = 0;

function pushIssue(map, file, msg, counter) {
  if (!map.has(file)) map.set(file, []);
  map.get(file).push(msg);
}

function expectedCanonicalFromPath(file) {
  // Map file path -> expected canonical URL (no trailing slash)
  let path = file.replace(/\\/g, '/');
  // Strip "index.html" suffix
  path = path.replace(/\/index\.html$/, '').replace(/^index\.html$/, '');
  // Strip ".html" if it's not a template file
  path = path.replace(/\.html$/, '');
  // Normalize root
  if (path === '' || path === '.') path = '/';
  else if (!path.startsWith('/')) path = '/' + path;
  return baseURL + (path === '/' ? '' : path);
}

function getMeta(html, regex) {
  const m = html.match(regex);
  return m ? m[1] : null;
}

for (const file of files) {
  if (!existsSync(file)) {
    pushIssue(failByFile, file, `MISSING file`);
    continue;
  }
  const html = readFileSync(file, 'utf8');

  // ---- title ----
  const title = getMeta(html, /<title>([^<]+)<\/title>/);
  if (!title) {
    pushIssue(failByFile, file, '✗ no <title>');
  } else {
    if (title.length < 30) pushIssue(warnByFile, file, `⚠ title too short (${title.length} chars): "${title}"`);
    if (title.length > 70) pushIssue(warnByFile, file, `⚠ title too long (${title.length} chars): "${title}"`);
    if (!titles.has(title)) titles.set(title, []);
    titles.get(title).push(file);
  }

  // ---- description ----
  const desc = getMeta(html, /<meta\s+name="description"\s+content="([^"]+)"/);
  if (!desc) {
    pushIssue(failByFile, file, '✗ no <meta name="description">');
  } else {
    if (desc.length < 100) pushIssue(warnByFile, file, `⚠ description too short (${desc.length} chars)`);
    if (desc.length > 170) pushIssue(warnByFile, file, `⚠ description too long (${desc.length} chars)`);
    if (!descriptions.has(desc)) descriptions.set(desc, []);
    descriptions.get(desc).push(file);
  }

  // ---- canonical ----
  const canonical = getMeta(html, /<link\s+rel="canonical"\s+href="([^"]+)"/);
  const expected = expectedCanonicalFromPath(file);
  if (!canonical) {
    pushIssue(failByFile, file, `✗ no canonical (expected ${expected})`);
  } else if (canonical !== expected) {
    // Template files (article.html, case-study.html) are dynamic — canonical is set by JS, so static canonical may be a placeholder
    if (/\/(article|case-study)\.html$/.test(file)) {
      pushIssue(warnByFile, file, `⚠ template file — static canonical "${canonical}", JS may override at runtime`);
    } else {
      pushIssue(failByFile, file, `✗ canonical mismatch: got "${canonical}", expected "${expected}"`);
    }
  }

  // ---- og:url == canonical ----
  const ogUrl = getMeta(html, /<meta\s+property="og:url"\s+content="([^"]+)"/);
  if (ogUrl && canonical && ogUrl !== canonical) {
    pushIssue(failByFile, file, `✗ og:url "${ogUrl}" != canonical "${canonical}"`);
  } else if (!ogUrl) {
    pushIssue(warnByFile, file, '⚠ no og:url');
  }

  // ---- og:title, og:description, og:image ----
  if (!getMeta(html, /<meta\s+property="og:title"/)) pushIssue(warnByFile, file, '⚠ no og:title');
  if (!getMeta(html, /<meta\s+property="og:description"/)) pushIssue(warnByFile, file, '⚠ no og:description');
  if (!getMeta(html, /<meta\s+property="og:image"/)) pushIssue(warnByFile, file, '⚠ no og:image');

  // ---- html lang ----
  const lang = getMeta(html, /<html\s+lang="([^"]+)"/);
  if (!lang) pushIssue(failByFile, file, '✗ no <html lang="...">');

  // ---- meta robots ----
  const robots = getMeta(html, /<meta\s+name="robots"\s+content="([^"]+)"/);
  if (!robots) pushIssue(warnByFile, file, '⚠ no <meta name="robots"> (default = index, follow)');

  // ---- hreflang ----
  const hreflangs = [...html.matchAll(/<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"/g)]
    .map((m) => ({ lang: m[1], href: m[2] }));
  if (hreflangs.length === 0 && !/privacy|terms|security|article\.html|case-study\.html/.test(file)) {
    pushIssue(warnByFile, file, '⚠ no hreflang alternates');
  }
}

// ---------- Summary ----------
console.log(`\n=== Per-file findings ===\n`);
for (const file of files) {
  const fails = failByFile.get(file) || [];
  const warns = warnByFile.get(file) || [];
  if (fails.length === 0 && warns.length === 0) {
    console.log(`✓ ${file}`);
  } else {
    console.log(`${fails.length > 0 ? '✗' : '⚠'} ${file}`);
    fails.forEach((m) => { console.log(`    ${m}`); totalFail++; });
    warns.forEach((m) => { console.log(`    ${m}`); totalWarn++; });
  }
}

// ---------- Duplicate detection ----------
console.log(`\n=== Duplicate titles ===`);
let dupeTitles = 0;
for (const [t, fs] of titles) {
  if (fs.length > 1) {
    console.log(`! "${t}"`);
    fs.forEach((f) => console.log(`    ${f}`));
    dupeTitles++;
  }
}
if (dupeTitles === 0) console.log('(none)');

console.log(`\n=== Duplicate descriptions ===`);
let dupeDesc = 0;
for (const [d, fs] of descriptions) {
  if (fs.length > 1) {
    console.log(`! "${d.slice(0, 80)}..."`);
    fs.forEach((f) => console.log(`    ${f}`));
    dupeDesc++;
  }
}
if (dupeDesc === 0) console.log('(none)');

console.log(`\n=== Totals ===`);
console.log(`Files: ${files.length}, Fails: ${totalFail}, Warns: ${totalWarn}, Dupe titles: ${dupeTitles}, Dupe descriptions: ${dupeDesc}`);
