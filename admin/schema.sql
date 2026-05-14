-- Klaut Articles schema
-- Run this in Supabase: SQL Editor → New query → paste → Run
-- Idempotent: safe to re-run when adding new columns.

create extension if not exists "pgcrypto";

create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_id text not null,
  title_en text,
  excerpt_id text,
  excerpt_en text,
  content_id jsonb,
  content_en jsonb,
  cover_image_url text,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- SEO fields (added later — idempotent for existing tables)
alter table articles add column if not exists seo_title_id text;
alter table articles add column if not exists seo_title_en text;
alter table articles add column if not exists seo_description_id text;
alter table articles add column if not exists seo_description_en text;
alter table articles add column if not exists author text default 'Klaut';
alter table articles add column if not exists noindex boolean not null default false;

create index if not exists articles_published_idx on articles (published, published_at desc);
create index if not exists articles_slug_idx on articles (slug);

-- Keep updated_at fresh
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_articles_updated_at on articles;
create trigger trg_articles_updated_at
before update on articles
for each row execute function set_updated_at();

-- Row Level Security
alter table articles enable row level security;

drop policy if exists "public read published" on articles;
create policy "public read published"
  on articles for select
  to anon, authenticated
  using (published = true);

drop policy if exists "auth full read" on articles;
create policy "auth full read"
  on articles for select
  to authenticated
  using (true);

drop policy if exists "auth insert" on articles;
create policy "auth insert"
  on articles for insert
  to authenticated
  with check (true);

drop policy if exists "auth update" on articles;
create policy "auth update"
  on articles for update
  to authenticated
  using (true) with check (true);

drop policy if exists "auth delete" on articles;
create policy "auth delete"
  on articles for delete
  to authenticated
  using (true);
