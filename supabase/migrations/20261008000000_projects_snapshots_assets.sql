-- Projekty użytkowników, pełny stan plakatu w historii i magazyn wgranych grafik.
-- Stan edytora (`snapshot`) to JSON bez obrazów: zdjęcia i logotypy leżą
-- w Storage, a snapshot trzyma tylko ich nazwy (`<sha256>.<rozszerzenie>`).

create table public.sknm_projects (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  owner       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Wypełniane przez bazę z tokenu sesji - do podpisu udostępnionych projektów.
  owner_email text not null default (auth.jwt() ->> 'email'),
  name        text not null check (char_length(name) between 1 and 120),
  -- Udostępniony projekt widzą wszyscy członkowie (tylko do odczytu).
  shared      boolean not null default false,
  -- Rośnie przy każdej zmianie `snapshot`; zapis podaje wersję, którą wczytał,
  -- więc druga karta nie nadpisze po cichu nowszego stanu.
  revision    integer not null default 1,
  -- Limit rozmiaru pilnuje, żeby obraz (data URL) nigdy nie trafił do wiersza.
  snapshot    jsonb not null
    check (jsonb_typeof(snapshot) = 'object' and octet_length(snapshot::text) <= 65536)
);

create index sknm_projects_updated_at_idx on public.sknm_projects (updated_at desc);

create function public.sknm_projects_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.snapshot is distinct from old.snapshot then
    new.revision := old.revision + 1;
    new.updated_at := now();
  end if;
  return new;
end;
$$;

revoke all on function public.sknm_projects_touch() from public, anon, authenticated;

create trigger sknm_projects_touch
  before update on public.sknm_projects
  for each row execute function public.sknm_projects_touch();

alter table public.sknm_projects enable row level security;

create policy "members read own and shared projects" on public.sknm_projects
  for select to authenticated
  using ((select public.sknm_is_member()) and (owner = (select auth.uid()) or shared));
create policy "members add own projects" on public.sknm_projects
  for insert to authenticated
  with check (
    (select public.sknm_is_member())
    and owner = (select auth.uid())
    and owner_email = ((select auth.jwt()) ->> 'email')
  );
create policy "owners update projects" on public.sknm_projects
  for update to authenticated
  using ((select public.sknm_is_member()) and owner = (select auth.uid()))
  with check ((select public.sknm_is_member()) and owner = (select auth.uid()));
create policy "owners delete projects" on public.sknm_projects
  for delete to authenticated
  using ((select public.sknm_is_member()) and owner = (select auth.uid()));

-- Klient podaje tylko nazwę, stan i udostępnienie; właściciela, wersję i daty
-- ustawia baza.
revoke insert, update on public.sknm_projects from authenticated;
grant insert (name, shared, snapshot) on public.sknm_projects to authenticated;
grant update (name, shared, snapshot) on public.sknm_projects to authenticated;
revoke all on public.sknm_projects from anon;

-- Historia: pełny stan eksportu. Stare wpisy mają NULL i przywracają się
-- z dotychczasowych kolumn, które nadal są wypełniane.
alter table public.sknm_poster_history
  add column snapshot jsonb
    check (snapshot is null or (jsonb_typeof(snapshot) = 'object' and octet_length(snapshot::text) <= 65536));

-- Prywatny magazyn grafik. Pliki są adresowane treścią i niezmienne: nie ma
-- polityk update/delete, a ponowne wgranie tego samego pliku kończy się 409.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sknm-poster-assets', 'sknm-poster-assets', false, 5242880,
        array['image/jpeg', 'image/png', 'image/svg+xml'])
on conflict (id) do nothing;

-- Polityki na `storage.objects` są wspólne dla całego projektu Supabase,
-- stąd zawężenie do kubełka i prefiks w nazwie.
create policy "sknm members read poster assets" on storage.objects
  for select to authenticated
  using (bucket_id = 'sknm-poster-assets' and (select public.sknm_is_member()));
create policy "sknm members add poster assets" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'sknm-poster-assets'
    and (select public.sknm_is_member())
    and name ~ '^[0-9a-f]{64}\.(jpg|png|svg)$'
  );

-- Wspólna biblioteka wgranych grafik: jeden wiersz na plik w Storage.
-- Usunięcie wiersza chowa grafikę z biblioteki, ale pliku nie rusza -
-- projekty i historia mogą się do niego odwoływać.
create table public.sknm_assets (
  ref          text primary key check (ref ~ '^[0-9a-f]{64}\.(jpg|png|svg)$'),
  created_at   timestamptz not null default now(),
  created_by   uuid not null default auth.uid() references auth.users (id),
  author_email text not null default (auth.jwt() ->> 'email'),
  kind         text not null check (kind in ('logo', 'photo')),
  name         text not null default '' check (char_length(name) <= 120)
);

create index sknm_assets_kind_created_at_idx on public.sknm_assets (kind, created_at desc);

alter table public.sknm_assets enable row level security;

create policy "members read assets" on public.sknm_assets
  for select to authenticated
  using ((select public.sknm_is_member()));
create policy "members add assets" on public.sknm_assets
  for insert to authenticated
  with check (
    (select public.sknm_is_member())
    and created_by = (select auth.uid())
    and author_email = ((select auth.jwt()) ->> 'email')
  );
create policy "uploaders rename assets" on public.sknm_assets
  for update to authenticated
  using ((select public.sknm_is_member()) and created_by = (select auth.uid()))
  with check ((select public.sknm_is_member()) and created_by = (select auth.uid()));
create policy "uploaders remove assets" on public.sknm_assets
  for delete to authenticated
  using ((select public.sknm_is_member()) and created_by = (select auth.uid()));

revoke insert, update on public.sknm_assets from authenticated;
grant insert (ref, kind, name) on public.sknm_assets to authenticated;
grant update (name) on public.sknm_assets to authenticated;
revoke all on public.sknm_assets from anon;
