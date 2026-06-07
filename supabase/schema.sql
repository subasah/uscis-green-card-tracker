-- USCIS Green Card Tracker — community chat
-- 1. In Supabase Dashboard: Authentication → Providers → enable Anonymous sign-ins
-- 2. Run this SQL in the SQL editor
-- 3. Database → Replication → ensure chat_messages is in supabase_realtime publication

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  author_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  body text not null check (char_length(body) between 1 and 2000),
  case_tag text
);

create index if not exists chat_messages_created_at_idx
  on public.chat_messages (created_at desc);

alter table public.chat_messages enable row level security;

drop policy if exists "Read messages from last 15 days" on public.chat_messages;
create policy "Read messages from last 15 days"
  on public.chat_messages
  for select
  to authenticated
  using (created_at >= (now() - interval '15 days'));

drop policy if exists "Insert own messages" on public.chat_messages;
create policy "Insert own messages"
  on public.chat_messages
  for insert
  to authenticated
  with check (auth.uid() = author_id);

-- Realtime (skip if already added)
do $$
begin
  alter publication supabase_realtime add table public.chat_messages;
exception
  when duplicate_object then null;
end $$;

-- Optional: schedule daily cleanup (requires pg_cron extension on paid plans)
create or replace function public.cleanup_old_chat_messages()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.chat_messages
  where created_at < (now() - interval '15 days');
$$;
