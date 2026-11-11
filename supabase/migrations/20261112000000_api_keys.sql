-- Osobisty klucz API każdego członka (Worker sknm-api: REST i MCP).
-- W bazie jest tylko skrót SHA-256 klucza: odczyt tabeli nie daje klucza.
-- Pełny klucz zna wyłącznie osoba, która go wygenerowała (widzi go raz).

create table public.sknm_api_keys (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  key_hash     text not null unique,
  prefix       text not null,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz
);

-- Klient widzi tylko metadane własnego klucza (bez skrótu) i może go usunąć.
-- Klucz tworzy wyłącznie funkcja niżej: przeglądarka nie wybiera klucza.
alter table public.sknm_api_keys enable row level security;
revoke all on public.sknm_api_keys from anon, authenticated;
grant select (user_id, prefix, created_at, last_used_at), delete on public.sknm_api_keys to authenticated;

create policy "owners read key" on public.sknm_api_keys
  for select to authenticated using (user_id = (select auth.uid()));
create policy "owners delete key" on public.sknm_api_keys
  for delete to authenticated using (user_id = (select auth.uid()));

-- Nowy klucz dla zalogowanego członka; zastępuje poprzedni (stary przestaje
-- działać od razu). Zwraca pełny klucz - jedyny raz, kiedy ktokolwiek go widzi.
create function public.sknm_regenerate_api_key()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  k text;
begin
  if not public.sknm_is_member() then
    raise exception 'Tylko członkowie zespołu mogą mieć klucz API.' using errcode = '42501';
  end if;
  k := 'sknm_' || encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.sknm_api_keys (user_id, key_hash, prefix)
  values ((select auth.uid()), encode(sha256(convert_to(k, 'UTF8')), 'hex'), left(k, 13))
  on conflict (user_id) do update
    set key_hash = excluded.key_hash, prefix = excluded.prefix, created_at = now(), last_used_at = null;
  return k;
end;
$$;

revoke all on function public.sknm_regenerate_api_key() from public, anon;
grant execute on function public.sknm_regenerate_api_key() to authenticated;

-- Dla Workera (service_role): właściciel klucza o danym skrócie, o ile nadal
-- jest członkiem. Usunięcie z `sknm_members` od razu wyłącza jego klucz.
create function public.sknm_api_key_owner(p_hash text)
returns table (user_id uuid, email text)
language sql
volatile
security definer
set search_path = ''
as $$
  update public.sknm_api_keys k
     set last_used_at = now()
    from public.sknm_members m, auth.users u
   where k.key_hash = p_hash and m.user_id = k.user_id and u.id = k.user_id
  returning k.user_id, u.email::text;
$$;

revoke all on function public.sknm_api_key_owner(text) from public, anon, authenticated;
grant execute on function public.sknm_api_key_owner(text) to service_role;
