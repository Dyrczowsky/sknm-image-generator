-- Plakaty generowane przez API (Cloudflare Worker): wpisy AI we wspólnej
-- historii i publiczny kubełek z ich PNG-ami. Worker pisze kluczem
-- `service_role` (omija RLS), więc nie potrzebuje żadnych polityk.

-- Publiczny kubełek na wyniki. Nazwy plików: <RRRR-MM-DD>/<uuid>.png. Odczyt
-- publiczny idzie linkiem (kubełek `public`), zapis tylko z `service_role`:
-- celowo nie ma polityk na `storage.objects` dla `authenticated` ani `anon`.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sknm-ai-images', 'sknm-ai-images', true, 10485760, array['image/png'])
on conflict (id) do nothing;

-- Skąd pochodzi wpis i gdzie leży jego obraz. Dotychczasowe wpisy dostają
-- `source = 'app'`.
alter table public.sknm_poster_history
  add column source text not null default 'app' check (source in ('app', 'ai')),
  add column image_url text check (image_url is null or char_length(image_url) <= 500);

-- Wpis AI nie ma autora. Wpis z aplikacji nadal musi go mieć.
alter table public.sknm_poster_history
  alter column created_by drop not null,
  add constraint sknm_poster_history_author_check
    check (source = 'ai' or created_by is not null);

-- Członek może dodać tylko wpis z aplikacji i bez obrazu: wpisów AI nie da się
-- podrobić z klienta (te dodaje wyłącznie `service_role`).
drop policy "members add history" on public.sknm_poster_history;
create policy "members add history" on public.sknm_poster_history
  for insert to authenticated
  with check (
    (select public.sknm_is_member())
    and created_by = (select auth.uid())
    and source = 'app'
    and image_url is null
  );
