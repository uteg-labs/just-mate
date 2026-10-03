-- embedding + z cache for the ml stretch (ML-MATCHING.md §6 cache table)
create extension if not exists vector;

create table users (
  id text primary key,
  embedding vector(1536),
  z vector(128),
  updated_at timestamptz not null default now()
);
