-- Wspólna historia wygenerowanych plakatów i wspólna lista zadań.
-- Prefiks `sknm_`: projekt Supabase jest współdzielony z inną aplikacją.
-- Rola `anon` nie ma żadnej polityki, więc sam klucz anon niczego nie odczyta.
-- Polityki poniżej wpuszczają każdego zalogowanego; kolejna migracja
-- (`20261007010000_members_allowlist.sql`) zawęża je do listy członków.

create table public.sknm_poster_history (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  created_by   uuid not null default auth.uid() references auth.users (id),
  -- Klucz layoutu z rejestru plakatów (np. `wyklad`), wspólny dla wszystkich urządzeń.
  poster_key   text not null check (char_length(poster_key) <= 40),
  title        text not null default '' check (char_length(title) <= 500),
  subtitle     text not null default '' check (char_length(subtitle) <= 500),
  speaker      text not null default '' check (char_length(speaker) <= 200),
  -- Data i godzina w formacie pól formularza: `RRRR-MM-DD` / `GG:MM` albo puste.
  event_date   text not null default '' check (char_length(event_date) <= 10),
  event_time   text not null default '' check (char_length(event_time) <= 5),
  location     text not null default '' check (char_length(location) <= 200),
  -- `schemat` albo `schemat~akcent`.
  color_scheme text check (char_length(color_scheme) <= 80)
);

create table public.sknm_notes (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  created_by   uuid not null default auth.uid() references auth.users (id),
  -- Wypełniane przez bazę z tokenu sesji - klient nie poda cudzego adresu.
  author_email text not null default (auth.jwt() ->> 'email'),
  text         text not null check (char_length(text) between 1 and 500),
  done         boolean not null default false
);

create index sknm_poster_history_created_at_idx on public.sknm_poster_history (created_at desc);
create index sknm_notes_done_created_at_idx on public.sknm_notes (done, created_at desc);

alter table public.sknm_poster_history enable row level security;
alter table public.sknm_notes enable row level security;

create policy "members read history" on public.sknm_poster_history
  for select to authenticated using (true);
create policy "members add history" on public.sknm_poster_history
  for insert to authenticated with check (created_by = (select auth.uid()));
create policy "members delete history" on public.sknm_poster_history
  for delete to authenticated using (true);

create policy "members read notes" on public.sknm_notes
  for select to authenticated using (true);
create policy "members add notes" on public.sknm_notes
  for insert to authenticated
  with check (created_by = (select auth.uid()) and author_email = ((select auth.jwt()) ->> 'email'));
create policy "members update notes" on public.sknm_notes
  for update to authenticated using (true) with check (true);
create policy "members delete notes" on public.sknm_notes
  for delete to authenticated using (true);

-- Edycja notatki zmienia tylko treść i stan; autor i data zostają.
revoke update on public.sknm_notes from authenticated;
grant update (text, done) on public.sknm_notes to authenticated;

-- Niezalogowani nie mają tu nic do zrobienia - poza brakiem polityk RLS
-- zdejmujemy im też same uprawnienia do tabel.
revoke all on public.sknm_poster_history from anon;
revoke all on public.sknm_notes from anon;
