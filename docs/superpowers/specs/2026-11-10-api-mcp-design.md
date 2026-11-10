# API i serwer MCP do generowania grafik — projekt

Data: 2026-11-10

## Po co

Chcę móc poprosić zewnętrzne AI (Claude w claude.ai, Claude Desktop, Claude
Code — przez serwer MCP) o przygotowanie posta na Facebooka: daję mu zdjęcia
i temat, AI pisze treść posta i **samo robi grafikę**, która wygląda dokładnie
tak, jak zrobiona ręcznie w generatorze. Dostaję tekst posta i link do gotowego
obrazu.

Grafika ma też trafić do wspólnej **Historii** z oznaczeniem „AI", żeby każdy
z zespołu mógł ją otworzyć w edytorze i poprawić ręcznie (literówka, kadr
zdjęcia, kolorystyka).

## Cele

1. Endpoint HTTP na Cloudflare, który z danych (szablon, kolorystyka, kształt,
   teksty, zdjęcia) robi PNG **tymi samymi komponentami i tym samym eksportem**
   co aplikacja.
2. PNG ląduje w Supabase Storage w publicznym kubełku; API zwraca publiczny URL.
3. Serwer MCP wbudowany w ten sam Worker — jeden adres dodawany jako connector
   w claude.ai / Claude Desktop / Claude Code.
4. Każda wygenerowana grafika zapisuje się w `sknm_poster_history` z pełnym
   snapshotem i oznaczeniem źródła `ai`; w aplikacji wpis ma plakietkę „AI"
   i otwiera się w edytorze jak każdy inny.
5. Kształty: **kwadrat** (1080×1080) i **Story** (1080×1920). AI wybiera samo,
   chyba że prośba mówi, który.

## Poza zakresem (non-goals)

- Banery (cover/event), formaty druku, PDF.
- Pisanie treści posta przez API — tekst pisze zewnętrzne AI.
- Publikowanie na Facebooku.
- Kilka grafik w jednym wywołaniu (AI może wywołać narzędzie kilka razy).
- Sprzątanie starych plików w kubełku.
- Logowanie członków w API — dostęp to jeden sekretny klucz.

## Anty-cele (porażka, nawet jeśli „działa")

- Grafika z API wygląda inaczej niż ta sama grafika z aplikacji (inne fonty,
  dopasowanie tekstu, kadr). Dlatego **nie** przepisujemy szablonów na
  Satori/canvas — renderuje prawdziwa przeglądarka.
- Klucz `service_role` Supabase trafia do builda aplikacji albo do przeglądarki.
- Endpoint otwarty dla każdego (zużycie minut przeglądarki, zaśmiecanie kubełka
  i historii).
- Wpis w historii, którego nie da się otworzyć w edytorze (brakujące zdjęcia).

## Ograniczenia

- Hosting: Cloudflare (aplikacja to Worker ze statycznymi assetami,
  `wrangler.jsonc`, deploy z `.github/workflows/deploy.yml`, który celowo nie
  uruchamia kodu z repo w jobie z tokenem).
- Plakaty to komponenty React mierzące się w DOM (`PosterAutoFit`,
  `agendaFit`), eksport przez `html-to-image` (`src/posters/export.ts`).
  W Workerze nie ma DOM → **Cloudflare Browser Rendering** (headless Chrome
  z Workera, `@cloudflare/puppeteer`). Zgoda na ewentualny plan Workers Paid
  (~5 USD/mies.), jeśli darmowy limit nie wystarczy — limity sprawdzić przy
  implementacji.
- Supabase: kubełek `sknm-poster-assets` jest prywatny, pliki adresowane
  SHA-256 (`<sha256>.(jpg|png|svg)`), limit 5 MB, typy jpeg/png/svg.
  Snapshot ≤ 64 KB, bez data URL-i.
- `sknm_poster_history.created_by` jest `not null default auth.uid()` —
  zapis z `service_role` nie ma `auth.uid()`.

## Jak to działa

```
AI (MCP client)
  │  tools/call generate_image {...}
  ▼
Worker `sknm-api`  (/mcp, /api/render, /api/templates)
  1. sprawdza klucz API
  2. pobiera/dekoduje zdjęcia, waliduje (jpeg/png, ≤ 5 MB)
  3. Browser Rendering → otwiera https://sknm.dyrczowsky.win/render
     → przekazuje dane → strona rysuje plakat i zwraca PNG
  4. wgrywa zdjęcia do `sknm-poster-assets` (<sha256>.<ext>, jak aplikacja)
  5. wgrywa PNG do publicznego kubełka `sknm-ai-images`
  6. dopisuje wpis do `sknm_poster_history` (source = 'ai', snapshot)
  7. zwraca { url, width, height, historyId }
```

### 1. Strona renderująca w aplikacji (`/render`)

- Nowa ścieżka w `src/main.tsx` obok `/poster/<klucz>`: `/render` montuje
  `RenderPage` poza `App` (bez Supabase, bez workspace).
- Strona wystawia `window.sknmRender(input) => Promise<string>` (PNG jako
  data URL / base64). Worker woła ją przez `page.evaluate`. Strona sama nic
  nie pobiera z sieci poza własnymi assetami (fonty, logotypy).
- `input` = stan edytora w kształcie `EditorState` z `src/snapshot/snapshot.ts`
  (obrazy jako data URL-e) + kształt. Strona składa `FormValues` od
  `EMPTY_FORM`, renderuje `posterRegistry[key].Component` przez to samo co
  `PosterPreview`, czeka na fonty i dopasowanie (`PosterAutoFit` ustabilizowane)
  i rasteryzuje **istniejącą ścieżką eksportu** (`export.ts`, format `square`
  albo `story`, z logiką kształtu `story`/dostawki tła z `formats.ts`).
- **Cała logika aplikacji zostaje na stronie, nie w Workerze.** *(moja
  decyzja)* Worker nie importuje kodu aplikacji (rejestr importuje React).
  Worker robi tylko lekką walidację kształtu JSON-a, pobiera/dekoduje zdjęcia
  i podaje je stronie jako data URL-e **z oryginalnych bajtów** (bez
  ponownego kodowania). Strona:
  - waliduje wejście kodem aplikacji (`posterRegistry`, `schemesFor`,
    `accentsFor`, `FORM_TEXT_FIELDS`) i zwraca czytelny błąd,
  - liczy refy zdjęć istniejącym kodem z `src/assets/hash.ts` (ten sam skrót co
    w aplikacji → brak duplikatów w Storage),
  - buduje snapshot przez `toSnapshot` i sprawdza limit 64 KB (za duży →
    błąd, bez przycinania),
  - zwraca `{ png, snapshot, assets: [{ ref, mime }] }`; Worker wgrywa bajty
    zdjęć pod podanymi refami (409 „już istnieje" = OK).
- Logotypy domyślne (`showPkLogo`, `pkLogo`, `showSknmLogo`) są wbudowane
  w komponenty, nie są refami; `graphics` (własne grafiki stopki) API nie
  przyjmuje. Zdjęcia: tylko JPEG/PNG (SVG odrzucane).
- Lista szablonów dla `list_templates` powstaje przy buildzie aplikacji jako
  statyczny plik (np. `dist/api/templates.json`, generowany z rejestru
  skryptem w `scripts/`); Worker go pobiera i cache'uje.
- Refaktor `export.ts`: wydzielić funkcję zwracającą Blob/PNG bez `saveAs`, żeby
  `downloadPoster` i `RenderPage` dzieliły ten sam kod. Zachowanie przycisku
  „Pobierz" bez zmian.
- Strona nie robi nic szkodliwego, gdy ktoś otworzy ją w zwykłej przeglądarce
  (pusta strona z krótką informacją). Nie przyjmuje danych z URL.

### 2. Worker `sknm-api`

- **Osobny Worker** w katalogu `api/` z własnym `wrangler.jsonc` (binding
  `browser`, sekrety), pod np. `https://sknm-api.<…>` albo trasą
  `sknm.dyrczowsky.win/api/*` i `/mcp*`. *(moja decyzja: osobny Worker, żeby
  sekret `service_role` nie siedział w Workerze serwującym aplikację i żeby nie
  zmieniać obecnego modelu deployu statycznego)*
- Sekrety (`wrangler secret put`): `SKNM_API_KEY`, `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`. Adres aplikacji do renderu w zmiennej
  `RENDER_URL`.
- Endpointy:
  - `GET /api/templates` — lista szablonów do wyboru przez AI (patrz niżej).
  - `POST /api/render` — JSON jak argumenty `generate_image`; odpowiedź
    `{ url, width, height, historyId }` albo błąd `{ error, message }`
    z czytelnym opisem (np. „nieznany szablon", „zdjęcie > 5 MB",
    „pole `title` jest wymagane").
  - `POST /mcp` — serwer MCP (Streamable HTTP) z dwoma narzędziami
    poniżej, wołającymi tę samą logikę co endpointy REST.
- **Autoryzacja:** nagłówek `Authorization: Bearer <SKNM_API_KEY>`. Ponieważ
  custom connector w claude.ai nie pozwala wpisać własnego nagłówka, MCP
  przyjmuje też klucz w ścieżce: `/mcp/<SKNM_API_KEY>`. *(moja decyzja;
  porównanie w stałym czasie; klucz nie trafia do logów)* Jeden wspólny klucz
  dla REST i MCP; zmiana klucza = `wrangler secret put` i nowy adres
  connectora. Osobne klucze na osobę — poza zakresem.
- `RENDER_URL` domyślnie produkcja (`https://sknm.dyrczowsky.win/render`,
  strona jest publiczna, bez Cloudflare Access); lokalnie
  `wrangler dev --remote` z `RENDER_URL` wskazującym na podgląd. *(moja
  decyzja)*
- Limity: jedno zdjęcie ≤ 5 MB, max 6 zdjęć na wywołanie, timeout renderu
  ~30 s; prosty limit wywołań na minutę. *(moja decyzja, liczby do korekty)*
- Jedna sesja przeglądarki na wywołanie; jeśli Browser Rendering pozwala,
  ponowne użycie sesji (`puppeteer.sessions()`/`connect`) dla szybkości.

### 3. Narzędzia MCP

**`list_templates`** — bez argumentów. Zwraca dla każdego layoutu z
`posterRegistry` (bez `bannerOnly`): `key`, `name`, krótki opis kiedy go
używać, listę pól tekstowych z opisem (np. `title` — tytuł, `event_date` —
`RRRR-MM-DD`), pola zdjęć (klucze z `photos`), listy (np. agenda konferencji),
dozwolone kolorystyki i akcenty (`schemesFor`, `accentsFor`), czy ma własny
układ Story. Generowane z kodu aplikacji przy buildzie (jeden plik JSON), żeby
nie rozjechało się z rejestrem. Opisy „kiedy używać" pisze się ręcznie raz.

**`generate_image`** — argumenty:

| Pole | Opis |
|---|---|
| `template` | klucz layoutu (wymagane) |
| `shape` | `square` \| `story`, domyślnie `square` |
| `scheme` | kolorystyka (`schemat` albo `schemat~akcent`); brak = domyślna layoutu |
| `lang` | `pl` \| `en`, domyślnie `pl` |
| `fields` | obiekt z polami tekstowymi z `FORM_TEXT_FIELDS` (zwykły tekst) |
| `photos` | `{ [poleZdjęcia]: [{ url?, data?, mime?, x?, y?, zoom? }] }` — zdjęcie jako publiczny URL **albo** base64 |
| `lists` | listy layoutu (np. punkty agendy), jeśli layout je ma |
| `options` | opcjonalnie: `qrUrl`, `showPkLogo`, `pkLogo`, `showSknmLogo`, `wideSubtitle`, `ciekawostkaLayout`, `titleScale`, `textScale` |

Pola tekstowe, których AI nie podało, są **ukrywane** (`visibility: false`),
a nie wypełniane przykładowym tekstem z `PLACEHOLDERS` — wyjątek: `badge`
i `badge2` zostają z domyślną etykietą layoutu. *(moja decyzja)* Pozostałe
brakujące pola dostają wartości z `EMPTY_FORM` (domyślne logotypy jak w
nowym projekcie w aplikacji). Opis narzędzia mówi AI: wybierz `story`, gdy
prośba dotyczy relacji/Story, w przeciwnym razie `square`; zdjęcia podawaj
jako URL, jeśli je masz, a base64 tylko gdy klient nie ma URL-a.

Wynik: tekst z linkiem do PNG + `historyId`; dodatkowo obraz jako blok
`image` w odpowiedzi MCP, żeby AI mogło zobaczyć efekt i ewentualnie
poprawić wywołanie. *(moja decyzja)*

### 4. Supabase — migracja

Nowa migracja w `supabase/migrations/`:

- Publiczny kubełek `sknm-ai-images` (public = true, tylko `image/png`, limit
  np. 10 MB). Zapis tylko przez `service_role` (brak polityk insert dla
  `authenticated`/`anon`). Nazwa pliku: `<RRRR-MM-DD>/<uuid>.png`.
- `sknm_poster_history`:
  - kolumna `source text not null default 'app' check (source in ('app','ai'))`;
  - `created_by` dopuszcza `null` tylko dla `source = 'ai'`
    (`check (source = 'ai' or created_by is not null)`);
  - kolumna `image_url text null` (link do PNG z kubełka; dla wpisów z
    aplikacji pusta).
  - Polityki RLS bez zmian (członkowie czytają i usuwają wszystkie wpisy,
    także AI; insert z aplikacji nadal wymaga `created_by = auth.uid()`
    i domyślnie dostaje `source = 'app'`). Polityka insert dla
    `authenticated` dostaje dodatkowo `source = 'app'`, więc z aplikacji nie
    da się udawać wpisu AI. Wpis AI ma `created_by = null` (lista historii
    i tak nie czyta `created_by` — sprawdzić przy implementacji).
- Zdjęcia z wywołania wgrywa Worker do `sknm-poster-assets` pod
  `<sha256>.<jpg|png>` — tak samo jak aplikacja, więc snapshot wpisu otwiera
  się w edytorze. Bez wpisu do `sknm_assets` (nie zaśmiecamy biblioteki
  grafik). *(moja decyzja)*

Dokumentacja w `docs/supabase.md`: kolejność migracji, nowy kubełek, kto co
może, nowe sekrety.

### 5. Aplikacja — historia

- `src/history/`: czytać `source` (i `image_url`); typy w `types.ts`.
- `HistoryList`: wpis z `source = 'ai'` ma plakietkę „AI" (komponent `Badge`
  z `components/ui`). Otwieranie wpisu działa bez zmian (snapshot).
- Ewentualnie link „Otwórz obraz" przy wpisie AI, jeśli `image_url` jest.

### 6. Deploy

- Nowy job / workflow dla `api/`: build i testy w jobie bez tokenu, deploy
  w osobnym jobie (zgodnie z obecnym wzorcem w `deploy.yml`). Sekrety Workera
  ustawiane ręcznie raz przez `wrangler secret put` (opisać w docs).
- Aplikację (`/render`) trzeba wdrożyć przed API.

### 7. Kolejność: najpierw spike

Pierwszy krok planu to szybki spike (do wyrzucenia): Worker z bindingiem
Browser Rendering otwiera `/poster/wyklad` i robi PNG. Sprawdza, że to działa,
ile trwa jedno wywołanie i jakie są aktualne limity darmowego planu. Zgoda na
Workers Paid już jest, więc spike nie blokuje projektu, tylko ustala limity.

### 8. Testy

- Jednostkowe (vitest): walidacja wejścia `generate_image` → `EditorState`
  (nieznany szablon, zła kolorystyka, za duże zdjęcie, brak pól), budowa
  snapshotu i wpisu historii, porównanie klucza, generowanie `list_templates`
  z rejestru.
- `RenderPage`: render w testDom dla każdego layoutu z danymi przykładowymi.
- Ręcznie: to samo wejście wygenerowane przez API i przez aplikację daje
  wizualnie ten sam PNG (kwadrat i Story, layout ze zdjęciem i bez).
  Wystarcza porównanie na oko (te same fonty z `src/assets/fonts`, ten sam
  układ i łamanie tekstu); różnice wygładzania na poziomie pojedynczych
  pikseli są akceptowalne. *(moja decyzja)*

## Zostawione budowniczemu

- Dokładny podział plików w `api/`, biblioteka MCP (np. `@modelcontextprotocol/sdk`
  albo `agents` od Cloudflare), sposób czekania na stabilne dopasowanie tekstu.
- Domena/trasa Workera API.
- Wartości limitów (rozmiar, liczba zdjęć, rate limit, timeout).
- Treść opisów szablonów dla AI.
