-- ============================================================
-- Klaut · case_studies migration
-- ============================================================
-- Cara pakai:
--   1. Buka Supabase Dashboard → SQL Editor → New query
--   2. Paste seluruh file ini → Run
--   3. Lalu buat Storage bucket (instruksi di bawah)
--
-- Idempotent: aman di-run ulang.
-- ============================================================


-- ---------- Tabel utama --------------------------------------
create table if not exists public.case_studies (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,

  -- Klasifikasi (semua nullable — tidak semua dokumen punya semua dimensi)
  doc_type              text,   -- case_study | audit | whitepaper | roadmap | reference | attestation | brief | template | spec | rubric | protocol
  service_line          text,   -- consultation | build_agents | audited_code | on_premise
  industry              text,   -- financial_services | inventory_supply | healthcare | energy | government | professional_services
  agent_class           text,   -- doc_extraction | workflow_classification | autonomous_research | rag | on_prem_llm | multi_agent | eval_observability

  -- Metadata dokumen
  client_label          text,            -- "Tier-1 retail bank, Jakarta"
  geography             text,            -- "Jakarta" / "Surabaya" / "Singapore"
  page_count            integer,
  vintage_date          date,            -- bulan/tahun shipped
  version               text,            -- "v2.1"
  pdf_url               text,            -- public URL ke file di Storage
  cover_image_url       text,

  -- Featured (per cluster — satu dokumen bisa featured di lebih dari satu cluster)
  featured_in_service   boolean not null default false,
  featured_in_industry  boolean not null default false,
  featured_in_system    boolean not null default false,

  -- Konten bilingual (Tiptap JSON — sama persis seperti articles)
  title_id              text,
  title_en              text,
  excerpt_id            text,
  excerpt_en            text,
  content_id            jsonb,
  content_en            jsonb,

  -- SEO bilingual
  seo_title_id          text,
  seo_title_en          text,
  seo_description_id    text,
  seo_description_en    text,

  author                text default 'Klaut',
  noindex               boolean not null default false,
  published             boolean not null default false,
  published_at          timestamptz,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

drop trigger if exists trg_case_studies_updated on public.case_studies;
create trigger trg_case_studies_updated
  before update on public.case_studies
  for each row execute function public.touch_updated_at();

-- Index biar query cluster cepat
create index if not exists case_studies_service_idx     on public.case_studies(service_line)  where published = true;
create index if not exists case_studies_industry_idx    on public.case_studies(industry)      where published = true;
create index if not exists case_studies_agent_idx       on public.case_studies(agent_class)   where published = true;
create index if not exists case_studies_published_idx   on public.case_studies(published_at desc) where published = true;


-- ---------- Tabel join many-to-many: case_study ↔ article ----
create table if not exists public.case_study_articles (
  case_study_id  uuid not null references public.case_studies(id) on delete cascade,
  article_id     uuid not null references public.articles(id)     on delete cascade,
  position       smallint not null default 0,   -- urutan tampil
  created_at     timestamptz not null default now(),
  primary key (case_study_id, article_id)
);

create index if not exists csa_article_idx     on public.case_study_articles(article_id);
create index if not exists csa_case_study_idx  on public.case_study_articles(case_study_id);


-- ---------- Row Level Security -------------------------------
alter table public.case_studies        enable row level security;
alter table public.case_study_articles enable row level security;

-- Public boleh baca yang published
drop policy if exists "public reads published case_studies" on public.case_studies;
create policy "public reads published case_studies"
  on public.case_studies for select
  using (published = true);

-- Authenticated (admin) boleh baca semua + tulis
drop policy if exists "auth reads all case_studies" on public.case_studies;
create policy "auth reads all case_studies"
  on public.case_studies for select
  to authenticated using (true);

drop policy if exists "auth writes case_studies" on public.case_studies;
create policy "auth writes case_studies"
  on public.case_studies for all
  to authenticated using (true) with check (true);

-- Join table: public bisa baca, auth bisa tulis
drop policy if exists "public reads case_study_articles" on public.case_study_articles;
create policy "public reads case_study_articles"
  on public.case_study_articles for select
  using (true);

drop policy if exists "auth writes case_study_articles" on public.case_study_articles;
create policy "auth writes case_study_articles"
  on public.case_study_articles for all
  to authenticated using (true) with check (true);


-- ============================================================
-- STORAGE BUCKET — buat manual via Dashboard
-- ============================================================
-- Supabase Dashboard → Storage → New bucket
--   Name:   case-study-pdfs
--   Public: ✓ (centang — biar URL PDF bisa di-download tanpa auth)
--
-- Lalu tambahkan policy di Storage → Policies → case-study-pdfs:
--
--   Policy 1 — "Public can read PDFs"
--     Allowed operation: SELECT
--     Target roles:      public
--     USING expression:  bucket_id = 'case-study-pdfs'
--
--   Policy 2 — "Authenticated can upload/update/delete"
--     Allowed operation: INSERT, UPDATE, DELETE
--     Target roles:      authenticated
--     USING expression:  bucket_id = 'case-study-pdfs'
--     WITH CHECK:        bucket_id = 'case-study-pdfs'
-- ============================================================
