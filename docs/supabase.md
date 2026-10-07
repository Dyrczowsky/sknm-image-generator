# Supabase: logowanie, wspólna historia i notatki

Generator działa bez Supabase (szablony, formularz, podgląd, eksport, lokalny
draft). Supabase dokłada trzy rzeczy dostępne po zalogowaniu:

- **logowanie** członków koła (e-mail + hasło, konta tylko z zaproszenia),
- **wspólną historię** wygenerowanych plakatów (tabela `sknm_poster_history`),
- **wspólne notatki** - listę zadań z odhaczaniem (tabela `sknm_notes`).

Niezalogowany użytkownik nadal może robić i pobierać plakaty; jego eksporty
nie trafiają do historii.

## Jednorazowa konfiguracja projektu

1. Załóż projekt na [supabase.com](https://supabase.com).
2. **SQL Editor** → wklej i uruchom po kolei pliki z `supabase/migrations/`:
   `20261007000000_history_and_notes.sql`, potem
   `20261007010000_members_allowlist.sql`.
3. **Authentication → Sign In / Providers** → wyłącz „Allow new users to sign
   up". Konta powstają wyłącznie z zaproszeń.
4. **Authentication → URL Configuration**:
   - Site URL: `https://dyrczowsky.github.io/sknm-image-generator/`
   - Redirect URLs: dodaj `http://localhost:5173/sknm-image-generator/`
5. **Authentication → Users → Invite user** dla każdej osoby z zarządu. Link
   z maila otwiera generator z formularzem „Ustaw hasło".
6. Dopisz zaproszoną osobę do listy członków (**SQL Editor**):

   ```sql
   insert into public.sknm_members (user_id)
   select id from auth.users where email = 'osoba@example.com';
   ```

   Bez tego wpisu zalogowana osoba widzi puste listy i nie zapisze niczego.
   Odebranie dostępu: `delete from public.sknm_members where user_id = ...`.

## Zmienne

| Zmienna | Skąd |
|---|---|
| `VITE_SUPABASE_URL` | Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Project Settings → API → klucz `anon` / publishable |

- **Lokalnie:** skopiuj `.env.example` do `.env.local` i uzupełnij.
- **GitHub Pages:** repozytorium → Settings → Secrets and variables → Actions →
  zakładka **Variables** → dodaj obie. `deploy.yml` przekazuje je do builda.

Klucz anon jest publiczny z założenia (trafia do zbudowanego JS). Dostępu
pilnuje RLS: rola `anon` nie ma żadnej polityki, a zalogowani muszą być na
liście `sknm_members`, więc bez tego nie da się niczego odczytać ani zapisać. **Nigdy nie wstawiaj tu klucza
`service_role`.**

Build bez tych zmiennych nie pokazuje przycisku „Zaloguj" ani paneli
„Historia" i „Notatki".

## Kto co może

| Tabela | Zalogowany członek | Zalogowany spoza listy | Niezalogowany |
|---|---|---|---|
| `sknm_poster_history` | czyta, dodaje, usuwa | nic | nic |
| `sknm_notes` | czyta, dodaje, zmienia treść i stan, usuwa | nic | nic |

„Członek" to osoba wpisana do tabeli `sknm_members`. Projekt Supabase jest
współdzielony z inną aplikacją, więc samo zalogowanie nie wystarcza - polityki
RLS sprawdzają listę funkcją `sknm_is_member()`. Samej listy nie da się
odczytać ani zmienić z aplikacji, tylko z SQL Editora.

Autora (`created_by`, a w notatkach też `author_email`) uzupełnia baza z sesji.
Nie ma ról - każdy członek może wszystko z powyższej tabeli.

## Jak to działa w kodzie

- `src/supabase/client.ts` - klient (`null` bez konfiguracji);
  `useSession.ts` - stan sesji i akcje logowania; `useRemoteList.ts` - lista
  wczytywana z serwera dla zalogowanej osoby (ładowanie / błąd / ponowienie).
- `src/history/` - `remoteHistory.ts` (zapytania) + `useHistory.ts`.
  Wpis trzyma `poster_key`, pola wydarzenia i kolorystykę - bez grafik i zdjęć.
  Historia pokazuje 50 najnowszych wpisów.
- `src/notes/` - `remoteNotes.ts` (zapytania, sortowanie) + `useNotes.ts`.
- `components/RemotePanel.tsx` - wspólna rama paneli: zachęta do logowania,
  ładowanie, błąd, treść. `AuthControl` / `AuthDialog` - logowanie w nagłówku.

Eksport najpierw zapisuje plik, potem dopisuje wpis do historii. Gdy zapis do
historii się nie uda, plik zostaje, a pod przyciskiem pojawia się informacja.

Nie ma synchronizacji na żywo: listy odświeżają się po zalogowaniu, po każdej
własnej zmianie, a notatki także po rozwinięciu panelu.

## Zmiana schematu

Nowa migracja = nowy plik w `supabase/migrations/` (z datą w nazwie),
uruchomiony w SQL Editorze. Kolumny czytane przez aplikację są wypisane w
stałych `COLUMNS` w `remoteHistory.ts` i `remoteNotes.ts`.
