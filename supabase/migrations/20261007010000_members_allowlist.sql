-- Lista członków z dostępem do wspólnej historii i notatek.
-- Projekt Supabase jest współdzielony z inną aplikacją, więc sama rola
-- `authenticated` to za mało: obejmuje też konta tamtej aplikacji. Dostęp ma
-- wyłącznie osoba wpisana do `sknm_members`.

create table public.sknm_members (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);

-- Tabelą zarządza się tylko z SQL Editora: RLS bez żadnej polityki i bez
-- uprawnień dla ról klienckich.
alter table public.sknm_members enable row level security;
revoke all on public.sknm_members from anon, authenticated;

-- Czy zalogowana osoba jest na liście. `security definer`, bo role klienckie
-- nie mają dostępu do `sknm_members`.
create function public.sknm_is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.sknm_members where user_id = (select auth.uid()));
$$;

revoke all on function public.sknm_is_member() from public, anon;
grant execute on function public.sknm_is_member() to authenticated;

drop policy "members read history" on public.sknm_poster_history;
drop policy "members add history" on public.sknm_poster_history;
drop policy "members delete history" on public.sknm_poster_history;
drop policy "members read notes" on public.sknm_notes;
drop policy "members add notes" on public.sknm_notes;
drop policy "members update notes" on public.sknm_notes;
drop policy "members delete notes" on public.sknm_notes;

create policy "members read history" on public.sknm_poster_history
  for select to authenticated using ((select public.sknm_is_member()));
create policy "members add history" on public.sknm_poster_history
  for insert to authenticated
  with check ((select public.sknm_is_member()) and created_by = (select auth.uid()));
create policy "members delete history" on public.sknm_poster_history
  for delete to authenticated using ((select public.sknm_is_member()));

create policy "members read notes" on public.sknm_notes
  for select to authenticated using ((select public.sknm_is_member()));
create policy "members add notes" on public.sknm_notes
  for insert to authenticated
  with check (
    (select public.sknm_is_member())
    and created_by = (select auth.uid())
    and author_email = ((select auth.jwt()) ->> 'email')
  );
create policy "members update notes" on public.sknm_notes
  for update to authenticated
  using ((select public.sknm_is_member()))
  with check ((select public.sknm_is_member()));
create policy "members delete notes" on public.sknm_notes
  for delete to authenticated using ((select public.sknm_is_member()));
