# Pasek formatowania tekstu (plakaty, banery, slajdy) — projekt

## Po co

Użytkownik chce formatować fragmenty tekstu tak jak w Wordzie: zaznacza
fragment, nad zaznaczeniem wyskakuje mały pasek i jednym kliknięciem
pogrubia, pochyla, podkreśla, przekreśla albo wyrównuje. Zmiana dotyczy
**tylko zaznaczonego fragmentu**, nie całego pola. Ma działać wszędzie, gdzie
edytuje się tekst grafiki: slajdy, plakaty, banery.

Dziś każdy tekst to zwykły string bez formatowania. Slajdy edytuje się na
slajdzie (`EditableText`, `contentEditable="plaintext-only"`), plakaty i banery
tylko przez pola formularza z boku (`FormField` → `Input`/`Textarea`).

## Cele

1. **Pływający pasek przy zaznaczeniu** (niepuste zaznaczenie w edytowalnym
   tekście grafiki), zakotwiczony nad zaznaczeniem. Przyciski:
   - pogrubienie, kursywa, podkreślenie, przekreślenie: przełączniki stylu
     zaznaczonego fragmentu, pokazujące stan (wciśnięty, gdy cały fragment ma
     dany styl);
   - **kolor akcentu**: fragment w kolorze akcentu bieżącego schematu
     (plakat: `var(--accent)`, slajd: `accent` motywu slajdu); przełącznik;
   - **wyczyść formatowanie**: usuwa style znakowe z zaznaczenia (wyrównania
     akapitów nie rusza; decyzja autora projektu);
   - **wyrównanie do lewej / do środka / do prawej**: dotyczy akapitów
     (wierszy rozdzielonych Enterem), których dotyka zaznaczenie; pozostałe
     akapity pola zostają bez zmian. Stan: wciśnięte, gdy wszystkie dotknięte
     akapity mają to wyrównanie.
2. **Skróty klawiszowe** Ctrl/⌘+B, I, U w edytowalnym tekście grafiki robią
   to samo co przyciski (decyzja autora projektu).
3. **Edycja tekstu na podglądzie plakatu i banera**: kliknięcie tekstu na
   podglądzie pozwala go edytować w miejscu, tak jak na slajdach, i formatować
   paskiem. Dotyczy wszystkich pól wolnego tekstu wszystkich 9 layoutów
   plakatów i 10 banerów.
4. **Formularz z boku zostaje.** Pola tekstowe formularza (plakat) i pola
   panelu właściwości (slajd, np. pozycje list) pokazują **czysty tekst bez
   znaczników**. Edycja w formularzu zachowuje formatowanie fragmentów,
   których nie zmieniono (patrz „Edycja czystego tekstu”).
5. **Formatowanie widać wszędzie, gdzie trafia tekst**: podgląd, eksport
   PNG/PDF plakatów, eksport slajdów (HTML z odtwarzaczem, obrazy), miniatury
   slajdów, lista projektów, historia.

## Poza zakresem

- Pola, które nie są wolnym tekstem: data, godzina, link QR, wartości wyboru
  (select), suwaki. Nie dostają paska ani edycji na podglądzie.
- Teksty wbudowane w szablon (`copy.ts`: branding, nazwa koła, `SITE_URL`)
  nie są edytowalne.
- Inne style: rozmiar fontu, krój, dowolne kolory, listy, linki,
  wyjustowanie. Pasek ma dokładnie te przyciski z punktu 1.
- Zmiana wyglądu formularza (bez edytora WYSIWYG w panelu bocznym).

## Antycele (porażka, nawet jeśli „działa”)

- Stare projekty, szkice, historia albo wpisy w Supabase wyglądają inaczej
  niż przed zmianą (inny tekst, zgubione łamania wierszy, widoczne znaczniki
  albo encje typu `&amp;`).
- Znaczniki formatowania widać gdziekolwiek w UI: formularz, nazwy, `aria-label`.
- Eksport plakatu łapie artefakty edycji: obrys pola, kursor, zaznaczenie,
  placeholder edytora, pasek.
- Wklejenie tekstu z Worda/strony WWW wnosi obce style, fonty albo HTML.
- Wpisanie `<`, `&`, `*` albo innych znaków specjalnych w tekst psuje
  formatowanie albo wstrzykuje HTML (XSS przez dane projektu z chmury).
- Formatowanie działa na całe pole, gdy zaznaczono fragment.
- Skróty edytora (Delete usuwa slajd, strzałki, Ctrl+Enter = Pobierz) odpalają
  się w trakcie pisania na podglądzie plakatu.

## Ograniczenia i to, co już jest

- React 19, TypeScript, Vite, style inline w komponentach grafik (patrz
  `docs/stylowanie.md`), testy vitest z SSR (`renderToStaticMarkup`).
  Komentarze i nazwy po polsku, zgodnie z kodem.
- Dane plakatu: `RawPosterData`/`FormValues` (`src/types.ts`), rysowane przez
  `withPlaceholders()` (`src/posters/fallback.ts`). Puste pole rysuje
  wartość przykładową (`PLACEHOLDERS`). Ukryte pole (`fx(name)` →
  `display: none`) znika z układu.
- Dane slajdu: stringi pod ścieżkami (`heading`, `cards.2.title`),
  zmieniane przez `onText(path, text)` z `useSlideEdit()`.
- Zapis: snapshot (`src/snapshot/snapshot.ts`), kopia robocza, projekty
  i historia w Supabase, talie slajdów (`deckStore`). Wszystkie trzymają
  stringi pól.
- Podgląd plakatu jest **tym samym węzłem**, który eksportuje
  `downloadPoster(posterRef.current)` (html-to-image), i jest przeskalowany
  CSS `transform` (`PosterScaled`).
- Część szablonów przekształca tekst przed narysowaniem: np. podtytuł w
  Komunikacie/Ogłoszeniu to `subtitle.toUpperCase()` z prefiksem `— `.
  Wykład rysuje podtytuł z `white-space: pre` (bez zawijania).
- Ręczne łamanie wierszy (Enter) musi działać jak dotąd
  (`src/posters/lineBreaks.test.ts`).
- AutoFit slajdów obserwuje mutacje DOM (`_tekst.tsx`); edycja na plakacie
  nie może się z tym gryźć.

## Decyzje autora projektu (do sprawdzenia przez użytkownika)

1. **Zapis: string z lekkim, ograniczonym znacznikowaniem**, a nie osobna
   struktura. Typy danych (`string`) zostają, więc snapshot, Supabase
   i talie nie zmieniają schematu. Wymagania wobec formatu:
   - stary zwykły string (bez formatowania) rysuje się **identycznie** jak
     dziś, także gdy zawiera `<`, `&`, `*`, `_`, `~`. Format wzbogacony musi
     się więc odróżniać od zwykłego tekstu bez zgadywania, np. niewidocznym
     prefiksem-wersją albo znakiem z prywatnego obszaru Unicode. Wybór
     należy do wykonawcy;
   - wiersze dalej rozdziela `\n`, żeby czysty tekst (formularz) i łamanie
     wierszy działały jak dotąd;
   - dozwolone są tylko: pogrubienie, kursywa, podkreślenie, przekreślenie,
     akcent (znakowe, mogą się zagnieżdżać i nakładać) oraz wyrównanie
     wiersza (`left` domyślnie, `center`, `right`);
   - parser jest odporny: nieznane albo uszkodzone znaczniki stają się
     zwykłym tekstem, a rysowanie zawsze idzie przez elementy React (nigdy
     `dangerouslySetInnerHTML` z danych).
   - Jedno wspólne źródło prawdy: moduł (np. `src/richText/`) z parserem,
     serializerem, rzutowaniem na czysty tekst i komponentem `RichText`
     używanym przez plakaty, banery i slajdy.
2. **Wyrównanie wiersza** rysuje się jako blok na wiersz tylko wtedy, gdy pole
   ma jakiekolwiek niestandardowe wyrównanie. Pole bez wyrównań rysuje się
   jak dziś (jeden element z `white-space: pre-line`), żeby nie zmieniać
   układu istniejących grafik. Wyrównanie „do lewej” = brak wyrównania, czyli
   dziedziczy wyrównanie szablonu (np. tytuł wyśrodkowany w Gali dalej jest
   wyśrodkowany). Jawne „do lewej” na wierszu w polu wyśrodkowanym przez
   szablon nadpisuje szablon.
3. **Edycja czystego tekstu** (formularz plakatu, panel właściwości slajdu):
   pole pokazuje rzut na czysty tekst. Po zmianie liczymy wspólny prefiks
   i sufiks starego i nowego czystego tekstu. Formatowanie poza zmienionym
   środkiem zostaje, wstawiony tekst dziedziczy style znaku przed nim (jak
   w Wordzie), a usunięty tekst zabiera swoje formatowanie. Wyrównania
   wierszy idą za wierszami.
4. **Przekształcenia szablonu** (`toUpperCase`, prefiks `— `) działają na
   tekście wewnątrz formatowania, a nie na znacznikach. W trakcie edycji na
   podglądzie takie pole pokazuje tekst przekształcony przez CSS
   (`text-transform: uppercase`), żeby to, co wpisujesz, było tym, co się
   zapisze. Prefiks zostaje poza polem edycji.
5. **Puste pole na podglądzie**: pokazuje wartość przykładową jak dziś. Po
   kliknięciu i wpisaniu tekstu wartość przykładowa znika (zachowanie jak
   placeholder slajdów). Pole ukryte okiem nie jest edytowalne (nie ma go
   w układzie).
6. **Edycja na podglądzie plakatu** to tryb domyślny edytora (zawsze można
   kliknąć). Eksport, miniatury, historia, lista projektów i
   `PosterPreviewPage` rysują wersję statyczną (bez `contentEditable`). Wzór
   kontekstu: jak `SlideEditContext`/`useSlideEdit()`.
7. **Pasek**: jeden wspólny komponent dla slajdów i plakatów, renderowany
   w portalu nad UI (poza węzłem eksportu), pozycjonowany z
   `getBoundingClientRect()` zaznaczenia, więc działa w przeskalowanym
   podglądzie. Chowa się, gdy zaznaczenie zniknie, pole straci fokus albo
   po Escape. Klik w pasek nie zabiera fokusu i nie gubi zaznaczenia. Pasek
   jest dostępny z klawiatury (`role="toolbar"`, etykiety, `aria-pressed`).
   Wygląd w stylu prymitywów z `src/components/ui` i tokenów z `stylowanie.md`.
8. **Wklejanie** zawsze jako czysty tekst (jak dziś). Formatowanie
   zaznaczenia przy kopiowaniu wewnątrz aplikacji nie musi przetrwać.
9. **Cofnij/ponów**: zmiana formatowania na slajdzie to krok historii talii
   (`slides/history.ts`), tak jak zmiana tekstu. **Na podglądzie plakatu
   (decyzja użytkownika) Ctrl/⌘+Z i Ctrl/⌘+Y/Shift+Z nic nie robią**:
   skrót jest przechwytywany i ignorowany, żeby nie zepsuć DOM pola
   i nie wyzwolić niczego innego. Formatowanie zdejmuje się ponownym
   kliknięciem przycisku albo „wyczyść formatowanie”. Historii cofania dla
   plakatów nie budujemy.

10. **Pola wiersza wbudowanego** (np. lokalizacja w `InfoLine` łączona ` · `,
    pigułki Warsztatu, plakietki, wiersze agendy, jednowierszowe pola
    slajdów): pasek pokazuje przyciski wyrównania wyłączone
    (`aria-disabled`, podpowiedź „Wyrównanie niedostępne w tym polu”).
    Pole deklaruje, czy obsługuje wyrównanie (np. prop `align` w
    edytowalnym tekście), a domyślnie go nie obsługuje.
11. **Kolumny i nazwy z czystym tekstem**: kolumny `title`/`subtitle` historii
    w Supabase, nazwy plików, nazwy projektów i `aria-label` dostają rzut na
    czysty tekst. Pełny string z formatowaniem żyje tylko w snapshocie, talii
    i danych pól.
12. **Starsze wersje aplikacji (PWA w pamięci podręcznej)**: format ma się
    degradować do czytelnego tekstu, tzn. stary klient może pokazać kilka
    dodatkowych znaczków, ale nie może zgubić tekstu. Wersja formatu snapshotu
    (`snapshot.ts`) rośnie, więc stary klient, który już sprawdza wersję,
    potraktuje go jak nowszy. Wymuszanie aktualizacji PWA jest poza zakresem.

## Co zostaje wykonawcy

- Dokładna składnia znaczników i sposób odróżnienia formatu od zwykłego tekstu
  (przy wymaganiach z decyzji 1).
- Mechanika edycji wzbogaconej w `contentEditable` (własne operacje na modelu
  zamiast `execCommand`, mapowanie zaznaczenia DOM ↔ pozycje w tekście), pod
  warunkiem że zachowane zostaje to, co dziś daje `EditableField`: kursor nie
  skacze przy renderach, zmiany z zewnątrz (cofnij, panel) nadpisują DOM,
  końcowe `<br>`/NBSP przeglądarki są normalizowane, Enter w polu
  jednowierszowym kończy edycję.
- Które elementy każdego z 19 szablonów są „polami wolnego tekstu” (punkt
  wyjścia: `title`, `subtitle`, `body`, `speaker`, `location`, `badge`,
  `badge2`, pola list/agendy). Wątpliwe przypadki rozstrzyga wykonawca
  i wypisuje je w PR.
- Kolejność prac. Sugestia: moduł formatu + `RichText` w trybie tylko do
  odczytu, potem pasek na slajdach, potem edycja na podglądzie plakatów
  szablon po szablonie.
- Testy: parser, serializer, rzut na czysty tekst i edycja przez formularz
  (unit), zgodność wsteczna (stare stringi z `<`/`&` renderują się bez
  zmian), SSR każdego szablonu z formatowaniem, eksport HTML slajdów.
- Aktualizacja dokumentacji (`docs/architektura.md`, `docs/dodawanie-slajdu.md`,
  `docs/dodawanie-szablonu.md`): jak w nowym szablonie użyć pola z
  formatowaniem.
