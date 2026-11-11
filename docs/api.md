# API i MCP (Worker `sknm-api`)

Osobny Cloudflare Worker w `api/` pozwala zewnętrznej AI (Claude, skrypty)
generować grafiki dokładnie tak, jak robi to aplikacja: z tych samych
szablonów, tym samym kodem renderu i eksportu. Wynik to PNG zapisany
w Supabase Storage plus wpis we wspólnej historii (`source = 'ai'`).

## Jak to działa

```
klient (curl / Claude)
   │  POST /api/render  albo  MCP /mcp
   ▼
Worker sknm-api ──► pobiera/dekoduje zdjęcia, sprawdza limity
   │
   ├─► Browser Rendering otwiera <RENDER_URL> (strona /render aplikacji),
   │   przekazuje dane, strona rysuje plakat tymi samymi komponentami
   │   i zwraca PNG (html-to-image, jak przycisk "Pobierz")
   │
   └─► Supabase (service_role): zdjęcia -> bucket sknm-poster-assets,
       PNG -> bucket sknm-ai-images, wiersz w tabeli historii
   ▼
odpowiedź: publiczny URL obrazu + id wpisu w historii
```

Endpointy:

| Ścieżka | Metoda | Opis |
| --- | --- | --- |
| `/api/templates` | GET | katalog szablonów (pola, schematy kolorów, opcje) |
| `/api/render` | POST | wygenerowanie grafiki |
| `/mcp` | POST | serwer MCP (klucz w nagłówku `Authorization`) |
| `/mcp/<klucz>` | POST | serwer MCP (klucz w ścieżce, dla claude.ai) |

Narzędzia MCP: `list_templates`, `generate_image`, `list_photos` i `save_photo`.
`save_photo` zapisuje zdjęcie w oryginale w bibliotece grafik (strona „Grafiki"
w aplikacji, autor „AI"); `list_photos` zwraca zdjęcia z biblioteki, a
`generate_image` przyjmuje je jako `{"ref": ...}` (obok `url` i `data`; w REST
też). Wymaga migracji `20261111000000_ai_assets.sql`. Do czatu `generate_image`
zwraca mały podgląd (JPEG, połowa rozmiaru), pełny PNG jest pod zwróconym
adresem. Z `"save": false` zwraca tylko podgląd i niczego nie zapisuje.

## Konfiguracja jednorazowa

1. **Migracja bazy.** Uruchom ją PRZED zmergowaniem i wdrożeniem tej wersji:
   `supabase/migrations/20261110000000_ai_history.sql` (kolumny `source`
   i `image_url`, bucket `sknm-ai-images`). Aplikacja ma zabezpieczenie na
   wypadek wdrożenia przed migracją (historia wraca do starych kolumn), ale
   wpisy AI i ich obrazy pojawią się dopiero po migracji. Szczegóły:
   [supabase.md](./supabase.md).
2. **Klucz API.** Wygeneruj długi losowy klucz:

   ```bash
   openssl rand -hex 32
   ```

3. **Sekrety Workera** (wartości wpisujesz po pytaniu, nie w poleceniu):

   ```bash
   npx wrangler secret put SKNM_API_KEY -c api/wrangler.jsonc
   npx wrangler secret put SUPABASE_URL -c api/wrangler.jsonc
   npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY -c api/wrangler.jsonc
   ```

   Klucz `service_role` ma pełny dostęp do bazy. Trzymaj go tylko jako sekret
   Workera: nigdy w `VITE_*`, w repozytorium ani w przeglądarce.
4. **Adres.** W `api/wrangler.jsonc` dodaj trasę albo domenę własną, np.
   `"routes": [{ "pattern": "api.sknm.example/*", "custom_domain": true }]`
   (domena musi być w tej samej strefie Cloudflare). Bez tego Worker jest
   dostępny pod `sknm-api.<konto>.workers.dev`. Zmienna `RENDER_URL` wskazuje
   stronę `/render` wdrożonej aplikacji.
5. **Plan.** Browser Rendering może wymagać planu Workers Paid.
6. **Wdrożenie.** Robi je CI (`deploy-api` w
   `.github/workflows/deploy.yml`) po wdrożeniu aplikacji; Worker jest
   pakowany w osobnym jobie `build-api` (Node 22, bez sekretów), a job
   z tokenem wysyła gotowy plik (`--no-bundle`) i nie uruchamia kodu z repo.
   Aplikacja nie zależy od Workera.

Lokalnie (`wrangler dev`) sekrety trzymaj w `api/.dev.vars` (w `.gitignore`).

## Rotacja klucza

1. `openssl rand -hex 32` i `npx wrangler secret put SKNM_API_KEY -c api/wrangler.jsonc`.
2. Stary klucz przestaje działać od razu. Zaktualizuj go w claude.ai
   (adres konektora), Claude Desktop i Claude Code.

Gdy klucz wyciekł (np. w historii czatu lub logach), rotuj go od razu.

## REST

Klucz w nagłówku `Authorization: Bearer <klucz>`.

```bash
# katalog szablonów
curl -H "Authorization: Bearer $SKNM_API_KEY" https://<api>/api/templates

# grafika z polami tekstowymi
curl -X POST https://<api>/api/render \
  -H "Authorization: Bearer $SKNM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"template":"wyklad","shape":"square","fields":{"title":"Wykład o AI"}}'

# ze zdjęciem z adresu https
curl -X POST https://<api>/api/render \
  -H "Authorization: Bearer $SKNM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"template":"wyklad","photos":{"photo":[{"url":"https://example.com/foto.jpg"}]}}'
```

Odpowiedź: `{ "url", "width", "height", "historyId" }`. Z `"save": false` grafika
nie trafia do Storage ani historii, a odpowiedź to `{ "width", "height", "png" }`
(PNG w base64) - do wersji roboczych. Nazwy szablonów, pól
i schematów kolorów zwraca `/api/templates`. Zdjęcia: `{"url": ...}` (preferowane)
albo `{"data": "<base64>"}`, opcjonalnie `x`, `y`, `zoom`.

## Podłączenie AI (MCP)

Zamiast `<api>` wstaw adres Workera, a `<klucz>` swój klucz.

- **claude.ai** (Ustawienia, Konektory, Dodaj konektor niestandardowy): URL
  `https://<api>/mcp/<klucz>`. claude.ai nie pozwala ustawić nagłówka, dlatego
  klucz jest w ścieżce.
- **Claude Desktop:** konektor niestandardowy można dodać tym samym adresem
  z kluczem w ścieżce (niesprawdzone; to, czy konektor z claude.ai jest
  widoczny w aplikacji, zależy od wersji i planu).
- **Claude Code:**

  ```bash
  claude mcp add --transport http sknm https://<api>/mcp \
    --header "Authorization: Bearer <klucz>"
  ```

**Bezpieczeństwo klucza:**

- Gdzie się da, używaj nagłówka `Authorization: Bearer <klucz>` (Claude Code,
  skrypty, `curl`). Klucz w ścieżce `/mcp/<klucz>` zostaw tylko dla claude.ai.
- Adres `https://<api>/mcp/<klucz>` jest sekretem, równoważnym hasłu. Nie
  wklejaj go do czatów, zgłoszeń ani repozytorium. Jeśli się ujawni, zrób
  rotację klucza.
- Worker nie loguje adresów żądań ani kluczy: w `api/wrangler.jsonc` logi
  wywołań (`invocation_logs`) są wyłączone, zostają tylko komunikaty błędów
  z kodu. Nie włączaj `invocation_logs`, póki używasz klucza w ścieżce.
- Klucz z `openssl rand -hex 32` (64 znaki) jest nie do zgadnięcia; klucz
  porównywany jest w stałym czasie, a bez ustawionego sekretu Worker odrzuca
  każde wywołanie (401).

## Limity

- Kształty: tylko `square` (1080x1080) i `story` (1080x1920).
- Zdjęcia: JPEG/PNG (rozpoznawane po bajtach, nie po deklarowanym typie),
  do 5 MB każde, do 6 na wywołanie, do 15 MB łącznie.
- Treść żądania do 25 MB. Pole tekstowe do 2000 znaków, agenda do 20 pozycji.
- `titleScale` i `textScale`: 0,7 do 1,3.
- Snapshot w historii do 60000 bajtów (baza dopuszcza 65536 bajtów tekstu
  jsonb, który jest dłuższy od JSON-a, stąd zapas; zbyt duży zwraca błąd
  `too_large`, nic nie jest obcinane).
- Render: 30 s. Pobranie zdjęcia z URL: 10 s.
- Limit wywołań: 10 na 60 s, wspólny dla całego klucza. Liczy tylko zapisy:
  generowanie obrazów (`POST /api/render`, MCP `generate_image`) i MCP
  `save_photo`; katalog szablonów, `list_photos` i inne wywołania MCP go nie zużywają. Licznik działa osobno
  w każdej lokalizacji Cloudflare, więc limit jest przybliżony.
- Usunięcie wpisu AI z historii w aplikacji nie usuwa jego PNG z bucketu
  `sknm-ai-images` (plik zostaje, trzeba go skasować ręcznie w Supabase).

## Kody błędów

Błąd ma postać `{ "code", "message" }` (`message` po polsku).

| Kod | HTTP | Znaczenie |
| --- | --- | --- |
| `unauthorized` | 401 | brak lub zły klucz |
| `rate_limited` | 429 | przekroczony limit 10 generowań / 60 s (w MCP jako wynik narzędzia z `isError`, nie HTTP 429) |
| `bad_request` | 400/404/405/413 | zły JSON, brak wymaganych danych, nieznana ścieżka lub metoda, za duże żądanie |
| `unknown_template` | 400 | nie ma takiego szablonu |
| `invalid_scheme` | 400 | schemat kolorów nie pasuje do szablonu |
| `invalid_field` | 400 | niedozwolone pole lub wartość (np. za długi tekst, skala poza zakresem) |
| `photo_not_image` | 400 | zdjęcie nie jest JPEG ani PNG |
| `photo_too_large` | 400 | zdjęcie ponad 5 MB lub zdjęcia razem ponad 15 MB |
| `photo_fetch_failed` | 400 | nie udało się pobrać zdjęcia z URL |
| `too_many_photos` | 400 | więcej niż 6 zdjęć |
| `too_large` | 400 | dane (np. snapshot) przekraczają limit rozmiaru |
| `render_unavailable` | 503 | Browser Rendering chwilowo niedostępny, można ponowić |
| `render_failed` | 500 | render się nie powiódł |
| `storage_failed` | 500 | zapis w Supabase się nie powiódł, można ponowić |
