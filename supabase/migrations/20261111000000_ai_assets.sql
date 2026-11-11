-- Zdjęcia dodane przez AI (Worker sknm-api, narzędzie MCP save_photo) we
-- wspólnej bibliotece grafik. Worker pisze kluczem service_role, więc nie ma
-- `auth.uid()` - takie wiersze mają `source = 'ai'` i puste `created_by`
-- (jak wpisy AI w historii, migracja 20261110000000_ai_history.sql).

alter table public.sknm_assets
  add column source text not null default 'app' check (source in ('app', 'ai'));

alter table public.sknm_assets alter column created_by drop not null;
alter table public.sknm_assets
  add constraint sknm_assets_author_check check (source = 'ai' or created_by is not null);

-- Klienci nadal wpisują tylko (ref, kind, name) - `source` zostaje 'app'
-- (uprawnienia kolumnowe z 20261008000000). Zdjęcie od AI nie ma autora,
-- więc zmienić nazwę albo usunąć je może każdy członek zespołu.
drop policy "uploaders rename assets" on public.sknm_assets;
create policy "uploaders rename assets" on public.sknm_assets
  for update to authenticated
  using ((select public.sknm_is_member()) and (created_by = (select auth.uid()) or source = 'ai'))
  with check ((select public.sknm_is_member()) and (created_by = (select auth.uid()) or source = 'ai'));

drop policy "uploaders remove assets" on public.sknm_assets;
create policy "uploaders remove assets" on public.sknm_assets
  for delete to authenticated
  using ((select public.sknm_is_member()) and (created_by = (select auth.uid()) or source = 'ai'));
