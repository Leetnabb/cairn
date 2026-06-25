-- Per-kind rate limiting for AI edge functions.
-- Existing rows (which were all strategic-picture generations) default to 'generate'.
alter table generation_log
  add column if not exists kind text not null default 'generate';

-- Index supporting the per-user, per-kind, windowed COUNT in the edge functions.
create index if not exists generation_log_user_kind_date
  on generation_log (user_id, kind, created_at);
