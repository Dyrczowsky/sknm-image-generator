# Szablon „Ciekawostka" („Czy wiesz, że…?") — projekt

Data: 2026-11-06

## Po co

SKNM chce publikować na Facebooku i Instagramie serię historycznych postów
„Czy wiesz, że…?" — zdjęcie + pytanie + kilka zdań historii, np.:

> **Czy wiesz, że SKNM powstało z inicjatywy studentów?**
> W związku z nieustannie rosnącym zapotrzebowaniem, w grudniu 2001 roku
> pojawiła się studencka inicjatywa utworzenia koła naukowego matematyków.
> Inicjatorami koła byli X, Y, Z przy pomocy prof. XXXX, który został także
> jej pierwszym opiekunem.

Najbliższy istniejący szablon, „Gość", jest zbudowany wokół wydarzenia
(pudełko z datą, prelegent, sala, „Wstęp wolny") i nie ma miejsca na akapit
tekstu. Potrzebny jest nowy szablon.

## Cele

1. Nowy layout `ciekawostka` (nazwa w kafelku: **„Ciekawostka"**) w zakładce
   „Social media i druk".
2. Jeden szablon, **trzy układy** wybierane przełącznikiem „Układ" w zakładce
   „Treść" (te same dane, zmienia się tylko wygląd):
   - **A — „Zdjęcie u góry"**: stare zdjęcie grupowe jako główny element
     (~połowa kwadratu, od krawędzi do krawędzi), pod nim złota linia
     (gradient jak w Gali), etykieta, pytanie-tytuł, opis, stopka.
   - **B — „Panorama"**: tekst prowadzi; zdjęcie to cienki pas od krawędzi do
     krawędzi (proporcja ok. 5:1, np. panorama Politechniki Krakowskiej) między
     tytułem a opisem. Najwięcej miejsca na dłuższy opis.
   - **C — „Archiwum"**: zdjęcie jako „odbitka" (jasna ramka, lekki obrót
     ok. −2°) obok tytułu, pod spodem opis; opcjonalny duży **rok** (np. „2001")
     w kolorze akcentu, półprzezroczysty, w tle.
   Domyślny układ: A.
3. Pola treści (wspólne dla wszystkich układów):
   - etykieta (`badge`) — domyślnie „CZY WIESZ, ŻE…" / „DID YOU KNOW…",
     kicker z trójkątem jak w mockupie (mono, wersaliki, kolor akcentu);
   - tytuł (`title`) — pytanie, np. „SKNM powstało z inicjatywy studentów?";
   - opis (`body`) — akapit, wielowierszowy (textarea), automatyczne łamanie;
   - rok (nowe pole tekstowe, np. `year`) — używany tylko w układzie C;
     pusty = brak roku; w A i B pole jest ignorowane (nie znika z formularza
     – decyzja buildera, czy je ukryć przy A/B);
   - linia w stopce (`badge2`) — domyślnie adres `sknm.pk.edu.pl` (`SITE_URL`);
   - zdjęcie (galeria jak w Gościu, etykieta „Zdjęcie").
   Wszystkie teksty edytowalne na podglądzie przez `PosterText`, z ukrywaniem
   pól (`fx`/`hidden`) jak w innych szablonach.
4. **Stopka** jak w pozostałych szablonach (`PosterFooter`): logo PK (przełącznik
   „Logo PK" w „Wyglądzie"), logotypy wgrane w „Wyglądzie" (tu użytkownik dodaje
   logo SKNM, jak w innych szablonach), opcjonalny kod QR, sygnet SKNM w
   rogu/nagłówku jak w pozostałych szablonach.
5. **Kolory** — schematy jak w szablonach ze zdjęciem: `default` (jasny,
   krem + granat), `czern`, `szary`, `okazjonalny` (ink + metal, akcent
   złoty/srebrny). **Szczególnie złoty akcent.** Oś akcentu (recepta w
   `accentRecipes`) jak w Gościu/Komunikacie.
6. **Dwa formaty, oba dopracowane**:
   - **Kwadrat 1080×1080** (Facebook, Instagram);
   - **Story 1080×1920** — PRAWDZIWY wysoki układ, nie kwadrat z dostawką tła.
     Wybierany istniejącym formatem eksportu „Story · 1080×1920"; podgląd w
     edytorze też pokazuje wysoki układ. Wszystkie trzy układy (A/B/C) mają
     wersję wysoką (więcej miejsca na zdjęcie i tekst, ta sama kolejność
     elementów).

7. **Długi opis — automatyczne dopasowanie** (decyzja użytkownika): kadr ma
   stałą wysokość (kwadrat 1080, Story 1920 — bez `grow`). Gdy opis się nie
   mieści, jego font sam się zmniejsza (od rozmiaru wynikającego z suwaka
   „Rozmiar tekstu" w dół) do minimum czytelności (≈ 22 px w kwadracie,
   ≈ 26 px w Story — decyzja buildera w tych okolicach). Jeśli nawet przy
   minimum się nie mieści — w edytorze widoczne ostrzeżenie (np. pod
   podglądem / przy polu opisu: „Opis nie mieści się — skróć tekst"), a eksport
   działa (tekst przycięty do kadru, bez wychodzenia na stopkę). Wzorce w
   repo: `AutoFit` w `src/slides/komponenty/_tekst.tsx` (slajdy, zgłasza
   „nie mieści się") oraz `src/posters/agendaFit.ts` (program Konferencji
   zawsze mieści się w kadrze). Dopasowanie musi być gotowe przed
   rasteryzacją eksportu (PNG/PDF), żeby plik wyglądał jak podgląd.

## Nie-cele

- Druk (A4/A3/A2, pion/poziom) i banery Facebooka (okładka 1640×624,
  wydarzenie 1920×1005) **nie są projektowane**. Aplikacja wymaga, żeby każdy
  szablon je obsługiwał, więc dostają minimalną, poprawnie działającą wersję
  (nic nie wychodzi poza kadr, nic się nie wysypuje), bez dopracowania.
  Baner: zdjęcie z jednej strony, etykieta + tytuł z drugiej, bez opisu.
- Inne szablony **nie** dostają wysokiego Story — dla nich format Story działa
  jak dotychczas (kwadrat + dostawka tła).
- Bez daty/godziny/sali/prelegenta — to nie jest ogłoszenie wydarzenia.
- Bez zmian w globalnym `colors.gold` (używa go wiele szablonów).

## Anty-cele (porażka, nawet jeśli „działa")

- Story wyglądające jak kwadrat na środku z pustymi pasami.
- Długi opis (przykład powyżej, ~300 znaków) nachodzący na stopkę albo ucięty
  w którymkolwiek układzie/formacie przy domyślnym rozmiarze tekstu.
- Złoty akcent mętny / nieczytelny na ciemnym tle obok starego zdjęcia.
- Regresja w innych szablonach (snapshoty, eksport Story innych layoutów).

## Ograniczenia (z projektu)

- Postępuj wg `docs/dodawanie-szablonu.md` i `docs/stylowanie.md`: style inline
  + role CSS `var(--rola)` z `schemes.ts`; każda rola użyta przez plakat musi
  być w bloku `default` layoutu; teksty dwujęzyczne w `src/posters/copy.ts`
  (`[lang]`); bloki z `src/posters/blocks/`.
- `registry.ts`: wpis wymaga `Banner` i `Form`.
- Kształty to `PosterShape` + `SHAPE_SIZE` (`src/posters/shape.ts`); format
  Story to dziś `shapeFor(...) → 'square'` z dostawką tła w `export.ts`.
- Testy: `vitest`; istniejące testy (schemes, formats, shape, export,
  snapshoty) muszą przechodzić.

## Decyzje użytkownika

- Jeden szablon z przełącznikiem trzech układów (A/B/C), nie trzy szablony.
- Formaty: tylko kwadrat i prawdziwy wysoki Story; druk/baner minimalnie.
- Stopka z logo PK i logo SKNM.
- Kolory: dodać schematy, w szczególności złoty akcent.

## Decyzje moje (do sprawdzenia przez użytkownika)

- Nazwa „Ciekawostka" / klucz `ciekawostka`.
- Domyślny schemat: `okazjonalny` ze złotym akcentem (historia = uroczyście);
  kolejność w bloku: `okazjonalny`, `default`, `czern`, `szary`.
- **Jaśniejsze złoto tylko w tym szablonie**: na ciemnym tle recepta mapuje
  `zloty` na nowy token (np. `colors.goldBright ≈ #C9A961`), bo `#84754E`
  (3,8:1 na ink) jest za ciemne dla małego tekstu. Globalny `colors.gold`
  bez zmian.
- Mechanizm wysokiego Story: nowy `PosterShape` `'story'` (1080×1920) +
  flaga w rejestrze (np. `storyShape: true`); `shapeFor` dostaje klucz
  layoutu i zwraca `'story'` tylko dla layoutów z flagą. Pozostałe ścieżki
  (`SnapshotThumb`, `PreviewPane`, `usePosterExport`, `export.ts`) muszą
  przekazać layout.
- Zdjęcie rysujemy bez filtrów (żadnej sepii) — użytkownik sam przygotowuje
  zdjęcie.
- **Akcenty na schematach**: złoto tylko na ciemnych tłach.
  `okazjonalny`: `['zloty', 'srebrny']`, domyślnie `zloty`;
  `czern`: `'all'`, domyślnie `zloty`;
  `default` (krem): `['granatowy', 'pomaranczowy']`, domyślnie `granatowy`
  (złoto na kremie jest nieczytelne jako mały tekst);
  `szary`: bez osi (stały, jak w Gościu).
- **Zakres `goldBright`**: na ciemnym tle akcent `zloty` w tym szablonie =
  `goldBright` dla WSZYSTKICH elementów w kolorze akcentu (etykieta, linia
  gradientowa, rok, linia w stopce, trójkąt kickera). Sygnet zostaje
  wariantem `zloty` (istniejąca grafika), kropka w kontrolce akcentu
  zostaje `colors.gold` (wspólna dla wszystkich szablonów).
- **Bezpieczne strefy Story**: w układzie 1080×1920 nic ważnego (tekst,
  sygnet, logo, QR) w górnych 250 px i dolnych 340 px (tam UI Instagrama);
  w tych strefach może być tylko tło/zdjęcie/dekoracja.
- **Kadr zdjęcia wspólny** dla A/B/C (jeden `PhotoValue` x/y/zoom). Przełączenie
  układu może wymagać poprawienia kadru — akceptowalne, użytkownik zwykle
  wybiera jeden układ na post.

## Zostawione builderowi

- Dokładne wymiary, marginesy, rozmiary fontów (wg skali z `theme.ts` i
  mockupów w `.superpowers/brainstorm-mockup/layout.html`).
- Nazwa pola z wyborem układu w `FormValues` i kontrolka (segmenty/select)
  w `FormCiekawostka`.
- Jak dokładnie wygląda minimalny druk i baner.
- Testy jednostkowe (schematy, `shapeFor`, rejestr) i ewentualne snapshoty.
