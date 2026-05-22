# Prompt — Add `Service` structured data to Klaut home pages

**Use this prompt when:** you want an AI agent to add Schema.org `Service` JSON-LD blocks to `index.html` (English) and `id/index.html` (Bahasa) so Google can understand Klaut's four services as distinct offerings.

**Important context to remember when running this prompt:**
- Klaut bilingual edits never auto-sync — but `Service` schema is structured metadata, not visible copy. Mirroring it across both files (with localized names/descriptions) is correct.
- The home pages already have `Organization` + `WebSite` JSON-LD. Don't duplicate, don't replace — **add** the new `Service` blocks.
- Do not change any visible HTML content. Schema-only change.

---

## Paste this prompt into a fresh Claude session

```
You're working on the Klaut bilingual marketing site at:
C:\Users\ASUS\Documents\Claude\Projects\Klaut Website\klaut-landing\

Goal: Add Schema.org `Service` JSON-LD entries to both home pages so Google can index
Klaut's four offerings as discrete services connected to the Organization.

Files to edit (both — schema goes in both languages):
- index.html        (English, served at https://klaut.id/)
- id/index.html     (Bahasa, served at https://klaut.id/id)

Klaut's four services (verify exact current names from the home page hero/services
section before writing — the brand names below are correct as of 2026-05-22 but check
in case copy has evolved):

1. AI Consulting
   - 2-week fixed-scope diagnostic / opportunity map
   - URL anchor: https://klaut.id/#services (or wherever the home page anchors it)
   - Bahasa name: Konsultasi AI

2. Chief AI Officer (CAO)
   - Embedded executive AI leadership engagement
   - Bahasa name: Chief AI Officer

3. Klaut Compass  (note: this card was renamed from "Klaut Governance" — verify)
   - AI workspace / operating layer product
   - Lives at compass.klaut.id (different subdomain — link out, not internal anchor)
   - Bahasa name: Klaut Compass

4. AI Audit
   - Code + system audit, security and governance review
   - Bahasa name: Audit AI

For each service, add a JSON-LD `<script type="application/ld+json">` block in the
<head> just after the existing Organization/WebSite blocks. Structure each as:

{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "<localized service name>",
  "description": "<one-sentence localized description, ~150 chars>",
  "provider": {
    "@type": "Organization",
    "name": "Klaut",
    "url": "https://klaut.id/"
  },
  "areaServed": { "@type": "Country", "name": "Indonesia" },
  "serviceType": "<e.g. AI Consulting | Executive Advisory | AI Platform | AI Security Audit>",
  "url": "<URL to the relevant section or product page>"
}

For Klaut Compass specifically, also add `"sameAs": "https://compass.klaut.id/"`.

Hard constraints:
1. SCHEMA ONLY — do NOT change any visible HTML, copy, classes, scripts, or styles.
2. Mirror the schema in both index.html and id/index.html — use English text in
   the EN file and Bahasa text in the ID file. Keep `Organization`/`WebSite`
   blocks intact.
3. Don't duplicate the same Service block twice. One block per service per file.
4. Preserve existing CRLF line endings (this is a Windows project).
5. After editing both files, verify by running:
     grep -c "@type\\": \\"Service\\"" index.html id/index.html
   Expected output: each file shows 4.
6. Commit message format:
     Add Service JSON-LD on home pages (EN + ID)

     4 services declared as Schema.org Service entities:
     - AI Consulting / Konsultasi AI
     - Chief AI Officer
     - Klaut Compass (sameAs compass.klaut.id)
     - AI Audit / Audit AI

     Schema-only change. No visible copy modified.

Push to main after committing — Vercel auto-deploys.
```

---

## Why this prompt is structured this way

- **Explicit file paths** — agent doesn't have to guess which files are bilingual home pages.
- **Verification step (the grep)** — gives the agent a concrete pass/fail check before pushing.
- **"Verify exact current names" instruction** — protects against stale assumptions if the home copy has evolved (e.g., "Klaut Governance" → "Klaut Compass" already happened once).
- **Hard constraints block** — explicit guard-rails on what NOT to change.
- **Commit message template** — keeps history scannable.

## After the agent runs

Test on the Rich Results validator before assuming Google picks it up:
- https://search.google.com/test/rich-results
- Paste `https://klaut.id/` and `https://klaut.id/id` once deployed
- Each should report 4 valid `Service` items in addition to `Organization` + `WebSite`
