// Klaut Supabase client — shared between admin & public article pages.
// Replace the two values below with your own from Supabase → Settings → API.
// These keys are safe to expose in the browser (anon key + RLS protects writes).

export const SUPABASE_URL  = "https://uvwhlrlgzabzjodosoni.supabase.co";
export const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2d2hscmxnemFiempvZG9zb25pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3ODA0ODksImV4cCI6MjA5NDM1NjQ4OX0.Z73H6dqd_MOHC6gTnpHj4YWrNfBmPphHfDhqy-6vxxQ";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: true, autoRefreshToken: true }
});

// Tiptap JSON → safe HTML for public pages.
// Supports: doc, paragraph, heading(1-3), bold, italic, link, bulletList,
// orderedList, listItem, hardBreak, image, blockquote, codeBlock, hr.
export function tiptapToHtml(node) {
  if (!node) return "";
  if (Array.isArray(node)) return node.map(tiptapToHtml).join("");

  const esc = (s) => String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  const renderMarks = (text, marks) => {
    let out = esc(text);
    if (!marks) return out;
    for (const m of marks) {
      if (m.type === "bold")   out = `<strong>${out}</strong>`;
      if (m.type === "italic") out = `<em>${out}</em>`;
      if (m.type === "code")   out = `<code>${out}</code>`;
      if (m.type === "link") {
        const href = esc(m.attrs?.href || "#");
        const target = m.attrs?.target === "_blank" ? ' target="_blank" rel="noopener"' : "";
        out = `<a href="${href}"${target}>${out}</a>`;
      }
    }
    return out;
  };

  const children = (n) => (n.content || []).map(tiptapToHtml).join("");

  switch (node.type) {
    case "doc":         return children(node);
    case "paragraph":   return `<p>${children(node)}</p>`;
    case "heading": {
      const lvl = Math.min(Math.max(node.attrs?.level || 2, 1), 3);
      return `<h${lvl}>${children(node)}</h${lvl}>`;
    }
    case "bulletList":  return `<ul>${children(node)}</ul>`;
    case "orderedList": return `<ol>${children(node)}</ol>`;
    case "listItem":    return `<li>${children(node)}</li>`;
    case "blockquote":  return `<blockquote>${children(node)}</blockquote>`;
    case "codeBlock":   return `<pre><code>${esc((node.content || []).map(c => c.text || "").join(""))}</code></pre>`;
    case "horizontalRule": return `<hr/>`;
    case "hardBreak":   return `<br/>`;
    case "image": {
      const src = esc(node.attrs?.src || "");
      const alt = esc(node.attrs?.alt || "");
      return `<img src="${src}" alt="${alt}" loading="lazy"/>`;
    }
    case "text":        return renderMarks(node.text, node.marks);
    default:            return children(node);
  }
}

// Slugify a title → URL-safe slug.
export function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function formatDate(iso, locale = "id-ID") {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(locale, {
      year: "numeric", month: "long", day: "numeric"
    });
  } catch { return ""; }
}

// Extract plain text from Tiptap JSON for word counting.
function extractText(node) {
  if (!node) return "";
  if (Array.isArray(node)) return node.map(extractText).join(" ");
  if (typeof node.text === "string") return node.text;
  if (node.content) return extractText(node.content);
  return "";
}

// Reading time in minutes (200 wpm). Returns at least 1 if there is any content.
export function readingTime(tiptapJson) {
  const text = extractText(tiptapJson).trim();
  if (!text) return 0;
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

// Truncate string to max length with ellipsis. Useful for Google snippet preview.
export function truncate(s, max) {
  if (!s) return "";
  s = String(s);
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}
