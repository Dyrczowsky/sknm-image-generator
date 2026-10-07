# Supabase: logowanie, historia, projekty, biblioteka grafik i notatki

Generator działa bez Supabase (szablony, formularz, podgląd, eksport, lokalna
kopia robocza z autozapisem w przeglądarce). Supabase dokłada rzeczy dostępne
po zalogowaniu:

- **logowanie** członków koła (e-mail + hasło, konta tylko z zaproszenia),
- **wspólną historię** wygenerowanych plakatów (tabela `sknm_poster_history`),
  z pełnym stanem plakatu (kolumna `snapshot`),
- **prywatne projekty** w chmurze z autozapisem (tabela `sknm_projects`),
  które można udostępnić zespołowi tylko do odczytu,
- **wspólną bibliotekę grafik** (tabela `sknm_assets` + kubełek Storage
  `sknm-poster-assets`),
- **wspólne notatki** - listę zadań z odhaczaniem (tabela `sknm_notes`).

Niezalogowany użytkownik nadal może robić i pobierać plakaty, a jego praca
zapisuje się lokalnie w przeglądarce; jego eksporty nie trafiają do historii.

## Jednorazowa konfiguracja projektu

1. Załóż projekt na [supabase.com](https://supabase.com).
2. **SQL Editor** → wklej i uruchom po kolei pliki z `supabase/migrations/`:
   `20261007000000_history_and_notes.sql`,
   `20261007010000_members_allowlist.sql`, potem
   `20261008000000_projects_snapshots_assets.sql` (projekty, kolumna
   `snapshot` w historii, kubełek i biblioteka grafik).

   **Najnowszą migrację trzeba wykonać przed wdrożeniem tej wersji kodu.**
   Aplikacja czyta kolumnę `snapshot` w historii i tabele `sknm_projects` /
   `sknm_assets`; bez migracji lista historii i projektów kończy się błędem.
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
- **GitHub Pages:** repozytorium → Settings → Environments → `github-pages` →
  **Environment secrets** → dodaj obie. `deploy.yml` przekazuje je do builda
  (zadanie `build` działa w tym środowisku). Po zmianie wartości trzeba
  uruchomić deploy ponownie - są wkompilowane w build.

Klucz anon jest publiczny z założenia (trafia do zbudowanego JS). Dostępu
pilnuje RLS: rola `anon` nie ma żadnej polityki, a zalogowani muszą być na
liście `sknm_members`, więc bez tego nie da się niczego odczytać ani zapisać. **Nigdy nie wstawiaj tu klucza
`service_role`.**

Build bez tych zmiennych nie pokazuje przycisku „Zaloguj" ani paneli
„Projekty", „Historia" i „Notatki".

## Kto co może

| Zasób | Zalogowany członek | Zalogowany spoza listy | Niezalogowany |
|---|---|---|---|
| `sknm_poster_history` | czyta, dodaje, usuwa | nic | nic |
| `sknm_notes` | czyta, dodaje, zmienia treść i stan, usuwa | nic | nic |
| `sknm_projects` | czyta własne i udostępnione; dodaje, zmienia i usuwa tylko własne | nic | nic |
| `sknm_assets` | czyta wszystkie, dodaje; zmienia nazwę i usuwa tylko własne wpisy | nic | nic |
| Storage `sknm-poster-assets` | czyta wszystkie pliki, dodaje nowe (nie nadpisuje, nie usuwa) | nic | nic |

„Członek" to osoba wpisana do tabeli `sknm_members`. Projekt Supabase jest
współdzielony z inną aplikacją, więc samo zalogowanie nie wystarcza - polityki
RLS sprawdzają listę funkcją `sknm_is_member()`. Samej listy nie da się
odczytać ani zmienić z aplikacji, tylko z SQL Editora.

Autora (`created_by`, a w notatkach też `author_email`) uzupełnia baza z sesji.
Historia i notatki: każdy członek może wszystko z tabeli. **Projekty tego nie
dziedziczą:** projekt należy do osoby, która go utworzyła (`owner`), tylko ona
go zmienia, przemianowuje, udostępnia i usuwa. `shared = true` pokazuje go
pozostałym członkom wyłącznie do odczytu - w aplikacji otwierają go jako
kopię. Klient podaje tylko `name`, `shared` i `snapshot`; właściciela, daty i
`revision` ustawia baza (kolumnowe `grant`). Biblioteka grafik: wpis może
zmienić nazwę albo usunąć tylko ten, kto go dodał; usunięcie wpisu chowa
grafikę z biblioteki, ale pliku w Storage nie rusza.

### Projekty: `revision`

`revision` rośnie w triggerze za każdym razem, gdy zmienia się `snapshot`
(zmiana samej nazwy lub `shared` go nie rusza). Zapis aplikacji ma warunek
`where id = ... and revision = <wczytana>` - gdy druga karta zapisała w
międzyczasie, nie zmienia nic i aplikacja zgłasza konflikt (opis w
[architektura.md](./architektura.md#snapshot-i-kopia-robocza)). Wiersz
projektu i historii ma limit 64 KB na `snapshot` (check w bazie).

### Kubełek `sknm-poster-assets`

- Prywatny, bez folderów; limit pliku **5 MB**, dozwolone typy
  `image/jpeg`, `image/png`, `image/svg+xml`. Nazwa pliku musi pasować do
  `<sha256>.(jpg|png|svg)` (polityka insert), a pliki są niezmienne - nie ma
  polityk update ani delete, ponowne wgranie tej samej nazwy to „już istnieje".
- Nazwa to skrót SHA-256 treści, ale Storage tego nie sprawdza: każdy członek
  może wgrać dowolne bajty pod dowolną zgodną z wzorcem nazwą. Dlatego klient
  przy pobraniu liczy skrót i odrzuca plik, którego treść nie zgadza się z
  nazwą.
- **Każdy członek czyta każdy plik w kubełku.** Prywatność projektu dotyczy
  wiersza w `sknm_projects`, nie jego obrazów: kto zna (lub zdobędzie z
  udostępnionego snapshotu, historii czy biblioteki) nazwę pliku, pobierze go,
  także gdy projekt jest prywatny. Nazwy plików są niezgadywalne (skrót), ale
  to nie kontrola dostępu.
- **Brak czyszczenia osieroconych plików.** Usunięcie projektu, wpisu historii
  czy wpisu z biblioteki nie usuwa plików. Rosną tylko, a aplikacja nie ma na
  to roli ani joba.
- **Limit miejsca Storage jest wspólny** z drugą aplikacją w tym projekcie
  Supabase. Wgrywane zdjęcia są zmniejszane (dłuższy bok do 3000 px dla JPEG,
  2000 px dla PNG), ale warto zaglądać w zużycie.
- Polityki na `storage.objects` są wspólne dla całego projektu, dlatego mają
  zawężenie do `bucket_id` i prefiks `sknm` w nazwie.

### Do sprawdzenia na żywym projekcie

Dwie rzeczy nie były dotąd zweryfikowane na prawdziwym Supabase:

1. **Tworzenie polityk na `storage.objects` z SQL Editora.** Migracja robi
   `create policy ... on storage.objects`. Jeśli SQL Editor odmówi (brak
   uprawnień do tej tabeli), polityki (`sknm members read poster assets`,
   `sknm members add poster assets`) trzeba dodać w panelu
   **Storage → Policies** o tych samych warunkach, a resztę migracji
   uruchomić bez nich.
2. **Rozpoznawanie odpowiedzi „plik już istnieje".** `isDuplicateUpload` w
   `src/assets/remoteStore.ts` uznaje za duplikat HTTP 409, `statusCode`
   „409" (Storage potrafi odpowiedzieć 400 z takim kodem w treści),
   `ResourceAlreadyExists` albo komunikat z „already exists" / „duplicate".
   Jeśli prawdziwa odpowiedź wygląda inaczej, ponowne wgranie istniejącego
   pliku zakończy się błędem zamiast cichym sukcesem.

## Jak to działa w kodzie

- `src/supabase/client.ts` - klient (`null` bez konfiguracji);
  `useSession.ts` - stan sesji i akcje logowania; `useRemoteList.ts` - lista
  wczytywana z serwera dla zalogowanej osoby (ładowanie / błąd / ponowienie).
- `src/history/` - `remoteHistory.ts` (zapytania) + `useHistory.ts`.
  Wpis trzyma pełny stan plakatu w kolumnie `snapshot` (suwaki, format,
  orientację, widoczność, zdjęcia i grafiki jako nazwy plików w Storage) oraz,
  obok, wąskie kolumny (`poster_key`, pola wydarzenia, kolorystyka) dla listy.
  Stare wpisy mają `snapshot` równy NULL i przywracają się tylko z wąskich
  kolumn. Historia pokazuje 50 najnowszych wpisów.
- `src/projects/` - `remoteProjects.ts` (zapytania, `ProjectConflictError`) +
  `useProjects.ts`; zapisem steruje kopia robocza (`src/workspace/`).
- `src/assets/` - `remoteStore.ts` (wgrywanie / pobieranie z kubełka),
  `remoteLibrary.ts` (tabela `sknm_assets`, limit 200 wpisów) + `useAssetLibrary.ts`.
- `src/notes/` - `remoteNotes.ts` (zapytania, sortowanie) + `useNotes.ts`.
- `components/RemotePanel.tsx` - wspólna rama paneli: zachęta do logowania,
  ładowanie, błąd, treść. `AuthControl` / `AuthDialog` - logowanie w nagłówku.

Eksport najpierw zapisuje plik, potem wgrywa grafiki do Storage i dopisuje
wpis do historii. Gdy wgranie albo zapis do historii się nie uda, plik zostaje, a pod przyciskiem pojawia się informacja.

Nie ma synchronizacji na żywo: listy odświeżają się po zalogowaniu, po każdej
własnej zmianie, a notatki także po rozwinięciu panelu.

## Zmiana schematu

Nowa migracja = nowy plik w `supabase/migrations/` (z datą w nazwie),
uruchomiony w SQL Editorze. Kolumny czytane przez aplikację są wypisane w
stałych `COLUMNS` w `remoteHistory.ts`, `remoteNotes.ts`, `remoteProjects.ts`
i `remoteLibrary.ts`. Migracje trzeba wykonać przed wdrożeniem kodu, który z
nich korzysta.
