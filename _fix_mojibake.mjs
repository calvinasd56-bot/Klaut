import fs from 'node:fs';
import path from 'node:path';

// Mojibake = UTF-8 bytes once read as CP1252 then re-encoded as UTF-8.
// Each entry maps the CORRUPTED UTF-8 byte sequence -> the ORIGINAL char.
const FIXES = [
  // 3-byte original (em/en dash, smart quotes, ellipsis)
  [Buffer.from([0xC3,0xA2,0xE2,0x82,0xAC,0xE2,0x80,0x9D]), '—'], // — em dash
  [Buffer.from([0xC3,0xA2,0xE2,0x82,0xAC,0xE2,0x80,0x9C]), '–'], // – en dash
  [Buffer.from([0xC3,0xA2,0xE2,0x82,0xAC,0xE2,0x84,0xA2]), '’'], // ' right single
  [Buffer.from([0xC3,0xA2,0xE2,0x82,0xAC,0xCB,0x9C]),      '‘'], // ' left single
  [Buffer.from([0xC3,0xA2,0xE2,0x82,0xAC,0xC5,0x93]),      '“'], // " left double
  [Buffer.from([0xC3,0xA2,0xE2,0x82,0xAC,0xC2,0x9D]),      '”'], // " right double
  [Buffer.from([0xC3,0xA2,0xE2,0x82,0xAC,0xC2,0x9E]),      '„'], // „ low-9 quote
  [Buffer.from([0xC3,0xA2,0xE2,0x82,0xAC,0xC2,0xA6]),      '…'], // … ellipsis
  [Buffer.from([0xC3,0xA2,0xE2,0x82,0xAC,0xC2,0xA2]),      '•'], // • bullet
  [Buffer.from([0xC3,0xA2,0xE2,0x82,0xAC,0xE2,0x80,0xA0]), '†'], // † dagger
  // 2-byte originals (Latin-1 supplement) — C3 82 XX patterns
  [Buffer.from([0xC3,0x82,0xC2,0xA0]), ' '], // NBSP
  [Buffer.from([0xC3,0x82,0xC2,0xA9]), '©'], // ©
  [Buffer.from([0xC3,0x82,0xC2,0xAE]), '®'], // ®
  [Buffer.from([0xC3,0x82,0xC2,0xB0]), '°'], // °
  [Buffer.from([0xC3,0x82,0xC2,0xB1]), '±'], // ±
  [Buffer.from([0xC3,0x82,0xC2,0xB7]), '·'], // · middle dot
];

function bufReplaceAll(buf, needle, replacement) {
  const replBuf = Buffer.from(replacement, 'utf-8');
  const out = [];
  let i = 0, count = 0;
  while (i < buf.length) {
    if (i + needle.length <= buf.length && buf.subarray(i, i+needle.length).equals(needle)) {
      out.push(replBuf);
      i += needle.length;
      count++;
    } else {
      out.push(buf.subarray(i, i+1));
      i++;
    }
  }
  return { buf: Buffer.concat(out), count };
}

function walk(dir, exts, skip) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes:true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, exts, skip));
    else if (exts.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

const ROOT = '.';
const files = walk(ROOT, new Set(['.html']), new Set(['.git','node_modules','.vercel','_fix_mojibake.mjs']));

let totalFiles = 0, totalReplacements = 0;
const perFile = [];
for (const file of files) {
  let buf = fs.readFileSync(file);
  let fileCount = 0;
  for (const [needle, repl] of FIXES) {
    const r = bufReplaceAll(buf, needle, repl);
    buf = r.buf;
    fileCount += r.count;
  }
  if (fileCount > 0) {
    fs.writeFileSync(file, buf);
    totalFiles++;
    totalReplacements += fileCount;
    perFile.push([file, fileCount]);
  }
}
perFile.sort((a,b)=>b[1]-a[1]);
console.log(`Files changed: ${totalFiles}`);
console.log(`Total replacements: ${totalReplacements}`);
console.log('Top files:');
for (const [f,c] of perFile.slice(0,20)) console.log(`  ${c}  ${f}`);
