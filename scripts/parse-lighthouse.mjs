// Parse Lighthouse JSON output and print structured scores + failed audits.
// Usage: node parse-lighthouse.mjs <path-to-lh-json>
import { readFileSync } from 'node:fs';

const path = process.argv[2];
if (!path) { console.error('Usage: node parse-lighthouse.mjs <path>'); process.exit(1); }

const r = JSON.parse(readFileSync(path, 'utf8'));
const c = r.categories;

console.log('URL:           ', r.finalDisplayedUrl || r.requestedUrl);
console.log('Strategy:      ', r.configSettings?.formFactor || 'mobile');
console.log('---');
for (const key of ['performance', 'accessibility', 'best-practices', 'seo']) {
  if (!c[key]) continue;
  const score = c[key].score != null ? Math.round(c[key].score * 100) : 'n/a';
  console.log(`${key.padEnd(16)}: ${score}`);
}
console.log('---');

// Failed audits per category
for (const key of ['seo', 'accessibility', 'best-practices', 'performance']) {
  if (!c[key]) continue;
  const refs = c[key].auditRefs.filter(a => a.weight > 0);
  const fails = [];
  for (const ref of refs) {
    const a = r.audits[ref.id];
    if (!a) continue;
    if (a.score != null && a.score < 1) {
      fails.push({ id: ref.id, title: a.title, score: a.score, weight: ref.weight });
    }
  }
  if (fails.length > 0) {
    console.log(`\n[${key}] Failed / partial audits:`);
    for (const f of fails) {
      const scorePct = f.score != null ? Math.round(f.score * 100) + '%' : 'N/A';
      console.log(`  ${scorePct.padEnd(5)} (weight ${f.weight}): ${f.title} [${f.id}]`);
    }
  }
}
