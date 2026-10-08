# Architektura

## Warstwy

```
src/
├── App.tsx              powłoka: składa WSZYSTKIE hooki stanu, trasę i akcje; przekazuje je stronom
├── main.tsx             bootstrap: /poster/<klucz> → PosterPreviewPage, reszta → App
├── index.css            wejście Tailwind + tokeny kolorów aplikacji (patrz stylowanie.md)
├── types.ts             wspólne typy (FormValues, FormUpdate, PosterProps, wiersze bazy, ...)
│
├── editor/             stan edytora
│   ├── useEditor.ts       szablony z lokalnej bazy, formularz, kolorystyka (zapis robi workspace/)
│   ├── usePosterExport.ts medium, format, orientacja, typ pliku i sam eksport
│   └── formState.ts       EMPTY_FORM + czyste przekształcenia formularza (setField, addGraphics, ...)
│
├── pages/               jedna strona = jeden plik (patrz „Powłoka i trasy")
│   ├── EditorPage         pasek projektu + zakładki + podgląd (zawsze w drzewie)
│   ├── ProjectsPage / AssetsPage / HistoryPage / NotesPage   strony poboczne
│   └── PosterPreviewPage  podgląd jednego szablonu pod /poster/<klucz> (poza App)
│
├── components/          elementy UI
│   ├── AppShell           szkielet: górny pasek + edytor (stale w drzewie) + strona poboczna
│   ├── TopBar             nazwa, nawigacja stron, pomoc, język plakatu, konto
│   ├── PageFrame          rama strony pobocznej: tytuł, opis, akcje, treść
│   ├── EditorTabs         zakładki Szablon / Treść / Wygląd (panele zawsze zamontowane)
│   ├── ProjectBar         pasek projektu: nazwa, status zapisu, „Zapisz", „Nowy projekt", „Pobierz"
│   ├── PreviewPane        ExportBar nad sceną + podgląd dopasowany do sceny (useElementSize + fit.ts)
│   ├── ExportBar          format, orientacja, typ pliku; DownloadButton („Pobierz") osobno
│   ├── PosterPreview      podgląd na żywo (ref do eksportu)
│   ├── PosterScaled       plakat w rozmiarze układu przeskalowany CSS transform do podglądu
│   ├── TemplateSelector   przełącznik „Social media i druk" / „Baner" + kafelki layoutów
│   ├── SchemeSelector     wybór kolorystyki i akcentu (zakładka Szablon)
│   ├── ImageUpload        pole na grafikę z podglądem (zdjęcie z kadrowaniem)
│   ├── LogoPicker         logotypy z wspólnej biblioteki do wstawienia na plakat
│   ├── ProjectsList / HistoryList / AssetTile / NotesPanel   treść stron pobocznych
│   ├── RemotePanel        rama danych z Supabase (logowanie / ładowanie / błąd)
│   ├── cards.tsx          CardSection, EmptyNote - wspólne elementy stron z kartami
│   ├── cardStyles.ts      klasy kart i siatki (CARD_GRID, cardClass, THUMB_FIELD)
│   ├── ShortcutsHelp      wysuwane okienko ze skrótami klawiszowymi (w górnym pasku)
│   ├── AuthControl/Dialog logowanie w górnym pasku
│   ├── TicketDialog       modal zgłoszeń (błąd / zapotrzebowanie na plakat)
│   ├── ui/                prymitywy: Button, Field, Input, Tabs, Popover, Icon, ... (stylowanie.md)
│   └── styles.ts          klasy Tailwinda powtarzane w kilku komponentach (m.in. OFFSCREEN)
│
├── forms/              zawartość zakładek Treść i Wygląd
│   ├── EditorPanels       ContentPanel i LookPanel - jedyny styk powłoki edytora z formularzami
│   ├── PosterForm         szkielet Treści layoutu: teksty, własne grupy, zdjęcia, kod QR
│   ├── fields.ts          FieldSpec + gotowe pola (FIELDS, badgeField)
│   ├── FormWyklad...      po jednym pliku na layout: lista pól dla PosterForm
│   ├── FormBanner         Treść zakładki „Baner" (wspólna dla layoutów)
│   ├── LookFields         zakładka Wygląd (wspólna dla layoutów i banera): rozmiar tekstu + logotypy
│   ├── TitleTextScaleFields, ScaleSlider   suwaki rozmiaru
│   ├── LogosField         logo PK i grafiki stopki
│   ├── QrField            link do kodu QR
│   ├── PhotoGalleryField  galeria 0..N zdjęć, opakowuje ImageUpload
│   ├── FormField          pole tekstowe + checkbox widoczności
│   └── FormGroup          nagłówek grupy + PANEL_STACK (odstępy między grupami)
│
├── posters/           renderowanie plakatów
│   ├── registry.ts       poster_key → { name, Component, Banner, Form, bannerPhoto? }
│   ├── PosterWyklad...    9 komponentów layoutów (style inline, patrz stylowanie.md)
│   ├── banners/          banerowe wersje layoutów (BannerWyklad, ...) + wspólna stopka (common.tsx)
│   ├── blocks/           współdzielone bloki plakatu (PosterFrame, Sygnet, Badge, FooterLogos, ...)
│   ├── copy.ts           wbudowany tekst PL/EN (nazwa koła, branding, domyślne plakietki)
│   ├── theme.ts          tokeny wizualne plakatów (kolory, typografia)
│   ├── schemes.ts        schematy kolorów per layout + resolveScheme() + schemesFor() + oś akcentu (accentsFor)
│   ├── fallback.ts       PLACEHOLDERS + withPlaceholders() (dane przykładowe)
│   ├── logos.ts          warianty sygnetu SKNM i logo PK
│   ├── shape.ts          kształty plakatu (kwadrat, papier, banery) + kontekst kształtu
│   ├── formats.ts        formaty eksportu (social, papier, banery)
│   └── export.ts         downloadPoster() - html-to-image, drabinka dpi, PNG/PDF
│
├── supabase/          klient Supabase, sesja (useSession), listy z serwera (useRemoteList)
├── history/           wspólna historia: zapytania + useHistory
├── notes/             wspólne notatki: zapytania + useNotes
├── projects/          projekty w chmurze (tabela sknm_projects): zapytania + useProjects
│
├── snapshot/          snapshot.ts - wersjonowany opis całego stanu plakatu (bez obrazów)
├── assets/            wgrane grafiki adresowane treścią: IndexedDB + Storage + rejestr + biblioteka
├── workspace/         kopia robocza: syncState (decyzje), syncEngine (harmonogram), useWorkspace
├── shortcuts/         rejestr skrótów klawiszowych + useShortcuts
│
├── db/                lokalna baza SQLite (sql.js) w przeglądarce: tylko szablony
│   ├── client.ts         pojedyncza instancja bazy, zapis do IndexedDB
│   ├── schema.ts         DEFAULT_TEMPLATES, CREATE TABLE, syncTemplates()
│   ├── templates.ts      listTemplates()
│   └── drafts.ts         odczyt starego draftu (tylko migracja, nic już go nie zapisuje)
│
└── utils/             drobne narzędzia: route.ts (trasy), uiState.ts (zakładki edytora), fit.ts
                       (dopasowanie podglądu), useElementSize / useMediaQuery / useStoredState,
                       daty, kodowanie kolorystyki, URL-e zgłoszeń
```

## Przepływ danych

1. `useEditor()` przy starcie woła `getDb()` → `listTemplates()`. Stan plakatu
   (formularz, szablon, kolorystyka, język, ustawienia eksportu) wczytuje
   `useWorkspace()` z kopii roboczej - patrz „Snapshot i kopia robocza" niżej.
2. Formularz zgłasza zmianę jako przekształcenie (`onChange(setField('title', v))`,
   funkcje z `editor/formState.ts`), a edytor podaje je do `setForm`. Zapisu
   nie robi formularz ani `useEditor`: `useWorkspace` po każdej zmianie składa
   z całego stanu snapshot i oddaje go silnikowi zapisu.
3. Wybrany szablon + rejestr → `poster` = `{ Component, Banner, Form }`.
   - `Form` renderuje się w zakładce „Treść" (przez `ContentPanel`); zakładkę „Wygląd"
     (rozmiar tekstu, logotypy) rysuje wspólny `LookFields`, nie `Form`.
   - `Component` (w zakładce „Baner" - `Banner`) renderuje się w `PosterPreview` z tymi
     samymi danymi (`form`) i `scheme`.
   - Pasek kolorystyki: `schemesFor(poster_key)` z `schemes.ts` (kolejność = kolejność
     zapisu; layout z jednym schematem nie pokazuje paska). Zmiana szablonu lub
     schematu przechodzi przez `fitColorsToLayout()` (`utils/colorScheme.ts`), które
     dobiera domyślny schemat i odpina niedozwolony akcent.
4. Dane formularza są **globalne** i przeżywają zmianę layoutu - zmienia się tylko,
   który `Form` je edytuje i który `Component` je rysuje.
5. "Pobierz" (przycisk w pasku projektu albo Ctrl/⌘+Enter) → `handleDownload` w
   `App` → `usePosterExport().download()` → `downloadPoster(posterRef.current, ...)`,
   a po udanym zapisie pliku - jeśli użytkownik jest zalogowany - najpierw
   `workspace.uploadAssets()` wgrywa grafiki snapshotu do Storage, potem
   `useHistory().record()` dopisuje wpis (z pełnym snapshotem) do wspólnej
   historii w Supabase.

Logowanie, wspólna historia, projekty, biblioteka grafik i notatki: [supabase.md](./supabase.md).

## Powłoka i trasy

`App.tsx` składa w jednym miejscu **wszystkie** hooki stanu (`useEditor`,
`usePosterExport`, `useSession`, `useWorkspace`, `useHistory`, `useNotes`,
`useProjects`, `useAssetLibrary`) oraz akcje łączące je ze sobą (zapis, pobranie,
otwarcie projektu lub wpisu historii). Strony dostają dane i akcje wyłącznie
przez propsy, więc stan edytora przeżywa przejście na inną stronę, a strona
nie zna hooków innych stron. Nowy stan, który ma przeżyć nawigację, dopisuje się
w `App`, nie w stronie.

```
App
└── AssetLibraryContext
    ├── AppShell
    │   ├── TopBar            nazwa, nawigacja stron, pomoc (skróty), język plakatu, konto
    │   ├── EditorPage        ZAWSZE w drzewie
    │   └── strona poboczna   Projekty / Grafiki / Historia / Notatki (tylko gdy aktywna)
    ├── TicketDialog
    └── AuthDialog
```

### Trasy w hashu

Strona wynika z `location.hash` (`src/utils/route.ts`, `useHashRoute`):

| Hash | Strona |
|---|---|
| `#/` (i wszystko nierozpoznane) | Edytor |
| `#/projekty` | Projekty |
| `#/grafiki` | Grafiki |
| `#/historia` | Historia |
| `#/notatki` | Notatki |

Tablica `PAGES` jest jedynym źródłem nazw, hashy i kolejności w nawigacji
(`TopBar` rysuje z niej zwykłe odnośniki `<a href="#/...">`, więc działają
wstecz / dalej i odświeżenie). `parseRoute` nigdy nie rzuca i ignoruje wielkość
liter, końcowy `/` i sufiks `?...`.

**Dlaczego hash, a nie ścieżki.** Aplikacja stoi na GitHub Pages pod
`/sknm-image-generator/` (`base` w `vite.config.ts`). To statyczny hosting bez
przepisywania adresów: głęboki link typu `/projekty` kończyłby się 404 po
odświeżeniu, a hash nigdy nie trafia na serwer. Drugi powód: linki z Supabase
(zaproszenie, reset hasła) wracają na adres aplikacji z tokenami w hashu
(`#access_token=...&type=recovery`, patrz `arrivedToSetPassword` w
`supabase/client.ts`). Nie są one ścieżkami, więc `parseRoute` zwraca dla nich
edytor, a ekran ustawiania hasła pokazuje `AuthDialog`, gdy sesja ma status `settingPassword`.

Bez Supabase (`session.status === 'unconfigured'`) nie ma stron z danymi
wspólnymi: `TopBar` nie rysuje nawigacji, a `App` wymusza stronę edytora, nawet
gdy hash mówi co innego. Wejście na stronę poboczną (zalogowany) odświeża jej
listę - nie ma synchronizacji na żywo. Tytuł karty to „<strona> — Generator
obrazów SKNM". `/poster/<klucz>[/<schemat>]` to osobny, ścieżkowy podgląd
szablonu (`main.tsx` → `PosterPreviewPage`), działający poza `App`.

### Edytor zostaje zamontowany, schowany przez `inert`

`AppShell` renderuje stronę edytora **zawsze**. Poza edytorem dostaje klasę
`OFFSCREEN` (`styles.ts`: `fixed`, `left-[-200vw]`, `pointer-events-none`) i
atrybut `inert`; strona poboczna pojawia się obok, w drugim `div`.

**Dlaczego tak, a nie `display: none` albo odmontowanie.** Eksport
rasteryzuje *żywy* węzeł plakatu z podglądu (`posterRef`, `html-to-image`),
a skrót Ctrl/⌘+Enter „Pobierz plakat" działa z każdej strony. Węzeł musi więc
istnieć i mieć układ:

- `display: none` - przeglądarka nie rozwiązuje wtedy obliczonych stylów, które
  eksport kopiuje do klona; plik wychodził z minimalnie innym wygładzaniem
  tekstu;
- `visibility: hidden` - dziedziczy się na klon i daje **pusty plik**;
- odmontowanie - znika `posterRef`, a z nim źródło pliku.

Dlatego element schowany ma zostać w układzie, tylko poza oknem, i dostać
`inert` (bez tego zostałby w kolejce fokusu i dla czytników ekranu). Ta sama
zasada obowiązuje w dwóch innych miejscach i **każda zmiana, która chowa
podgląd, musi ją zachować**:

- `AppShell`: schowany edytor trzyma wysokość, jaką ma pod górnym paskiem
  (`h-[calc(100dvh-3.5rem)]` od 900 px), żeby `PreviewPane` zmierzył się tak samo
  i podgląd po powrocie nie zmienił rozmiaru;
- `EditorPage` poniżej 900 px: panel podglądu w widoku „Edycja" dostaje
  `NARROW_OFFSCREEN` + `inert`, żeby „Pobierz" z dolnego paska dawał ten sam plik
  co przy widocznym podglądzie. Zakładkom wystarcza zwykłe `max-[900px]:hidden`
  (nic z nich nie jest rasteryzowane).

Zakładki edytora (`Tabs`/`TabPanel`) również zostawiają nieaktywny panel w
drzewie (`hidden`), więc wpisane dane, stan pól i otwarte okienka nie giną.
Zwykły `hidden` jest tu bezpieczny, bo w panelach nie ma węzła plakatu.

## Strona edytora

`EditorPage` (`src/pages/EditorPage.tsx`) od góry:

1. **Pasek projektu** (`ProjectBar`): nazwa projektu (albo „Wersja robocza")
   z ołówkiem do zmiany nazwy, status zapisu (`SaveStatus`, tekst + ikona),
   „Zapisz" (tylko z Supabase, w konflikcie zastąpione wyborem „Wczytaj wersję z
   chmury" / „Nadpisz"), „Nowy projekt" i **„Pobierz"**. Pod spodem komunikat
   kopii roboczej i informacja o brakujących grafikach. „Pobierz" jest
   `DownloadButton` z `ExportBar.tsx`, przekazanym jako `action` - to jedyna akcja
   `primary` edytora, od 900 px zawsze widoczna w tym pasku.
2. **Zakładki** (`EditorTabs`, lewy panel): **Szablon** (`TemplateSelector`:
   przełącznik rodzaju grafiki „Social media i druk" / „Baner" i kafelki
   layoutów, `SchemeSelector`: kolorystyka i akcent), **Treść** (`ContentPanel`)
   i **Wygląd** (`LookPanel` → `LookFields`: „Rozmiar tekstu" i „Logotypy").
   Wszystkie trzy panele są stale zamontowane; aktywną zakładkę pamięta `App`
   (`localStorage`, `sknm-editor-tab`, `utils/uiState.ts`; nieznana wartość =
   „Szablon"), a skróty Alt/⌥+1/2/3 przełączają ją z każdej strony (wracają też
   do edytora). Każda zakładka przewija się osobno.
3. **Podgląd** (`PreviewPane`, prawy panel): `ExportBar` (format, a dla papieru
   orientacja i typ pliku), pod nim scena z podglądem i ewentualnym komunikatem
   eksportu (`exporter.note`).

`ContentPanel` i `LookPanel` (`forms/EditorPanels.tsx`) to cały styk powłoki z
formularzami: powłoka nie wie, co jest w środku. Treść to `poster.Form` layoutu
(w trybie „Baner" - `FormBanner`), a Wygląd jest taki sam dla każdego layoutu i
banera.

**Podgląd dopasowany do sceny.** `PreviewPane` mierzy scenę
(`useElementSize`, `ResizeObserver`) i liczy szerokość podglądu `fitWidth(scena,
kształt, stagePadding(scena))` z `utils/fit.ts`: największą, przy której plakat
mieści się w scenie w OBU wymiarach (kwadrat, pion, poziom, oba banery), z
marginesem 4% krótszego boku (8-28 px). Dzięki temu podgląd nie jest przycięty i
nie wymusza przewijania. Pomiar zerowy jest pomijany, więc ukryty element
zachowuje ostatni rozmiar. `PosterScaled` skaluje plakat CSS transform; węzeł
pod `posterRef` zawsze ma pełny rozmiar układu (patrz „Kształty i formaty").
Od 900 px scena bierze resztę wysokości panelu; węziej ma proporcje plakatu, ale
nie więcej niż zostaje w oknie telefonu.

**Układ zależny od szerokości** (próg 900 px, `min-[900px]:`):

- **od 900 px** - aplikacja ma wysokość okna i sama się nie przewija; dwie kolumny
  (zakładki `clamp(340px,38%,480px)` | podgląd), przewija się tylko treść zakładki;
- **poniżej 900 px** - przewija się dokument. Przełącznik „Edycja | Podgląd" (stan
  lokalny `EditorPage`) pokazuje jeden panel naraz, a przyklejony dolny pasek
  trzyma podsumowanie formatu (przycisk przełączający na podgląd) i „Pobierz".
  Pasek projektu ma wtedy przycisk „Pobierz" ukryty (`max-[900px]:hidden`), żeby nie
  było dwóch. Dolny pasek nie ma własnej logiki: woła ten sam `onDownload`.

**Wariant banera.** Gdy rodzaj grafiki to „Baner" (`exporter.medium ===
'banner'`), kolejność paneli się odwraca: podgląd idzie na górę (`40dvh`, min.
`16rem`) na całą szerokość, a zakładki pod nim zajmują resztę i przewijają się
pod podglądem. Kolejność w DOM jest zamieniana, żeby Tab szedł za kolejnością na
ekranie; panele mają stałe `key`, więc React je przenosi, nie odmontowuje (stan
zostaje), a fokus przełącznika rodzaju jest przywracany po zamianie.

## Strony poboczne

Wszystkie opakowuje `PageFrame` (tytuł, jednozdaniowy opis, akcje po prawej,
treść w kolumnie do 1040 px), a treść list — `RemotePanel` (niezalogowany:
zaproszenie do logowania; ładowanie; błąd z „Spróbuj ponownie"). Strony
nie mają własnych hooków danych - dostają je z `App`.

| Strona | Co pokazuje |
|---|---|
| **Projekty** (`ProjectsPage`) | własne projekty zalogowanej osoby i te udostępnione zespołowi (`ProjectsList`); własne można otworzyć, przemianować, udostępnić („Udostępnij zespołowi") i usunąć, cudze tylko otworzyć jako kopię. Akcja „Nowy projekt". Udane otwarcie przenosi do edytora, nieudane zostaje na liście, a powód pokazuje komunikat kopii roboczej nad stroną |
| **Grafiki** (`AssetsPage`) | wspólna biblioteka logotypów i zdjęć (`AssetTile`), filtr Wszystkie / Logotypy / Zdjęcia; własne grafiki można przemianować i usunąć; „Dodaj logotyp" wgrywa logotyp bez robienia plakatu |
| **Historia** (`HistoryPage`) | każdy pobrany plakat zespołu (`HistoryList`, miniatura ze snapshotu). „Przywróć" otwiera wpis w edytorze jako nową, niezapisaną wersję roboczą - nie nadpisuje otwartego projektu |
| **Notatki** (`NotesPage`) | wspólna lista zadań (`NotesPanel`); liczba otwartych pokazuje się jako pigułka przy „Notatki" w górnym pasku |

Karty i siatki: [stylowanie.md](./stylowanie.md#strony-i-karty).

## Snapshot i kopia robocza

### Snapshot - jedyny opis stanu plakatu

`src/snapshot/snapshot.ts` definiuje `EditorSnapshot` (`v`, `poster_key`,
`color_scheme`, `lang`, `export`, `form`) - wersjonowany JSON, który opisuje
wszystko, co wpływa na wygląd plakatu i jego eksport: pola tekstowe,
widoczność, suwaki, grafiki stopki, zdjęcia z kadrem, listy, kod QR, szablon,
kolorystykę, język oraz ustawienia eksportu (medium, format, orientacja, typ
pliku). Ten sam kształt trzymają lokalna kopia robocza, projekty w chmurze
(`sknm_projects.snapshot`) i wpisy historii (`sknm_poster_history.snapshot`).
`toSnapshot` / `fromSnapshot` przekładają stan edytora na snapshot i z
powrotem; `parseSnapshot` sprawdza JSON z niezaufanego źródła (baza,
IndexedDB).

**Nowe pole `FormValues` albo nowe ustawienie eksportu musi trafić do
snapshotu.** Wymuszają to typy i test:

- `SnapshotForm` wynika z `FormValues`, a `parseForm` zwraca literał z każdym
  polem wymienionym z osobna - nowe pole formularza się nie skompiluje, dopóki
  go tam nie dopiszesz (z domyślną wartością z `EMPTY_FORM`). Ustawienia
  eksportu tak samo: `normalizeExportSettings` w `posters/formats.ts` zwraca
  literał typu `ExportSettings`.
- `snapshot.test.ts` ma wzorzec `FULL_FORM` / `FULL_EXPORT`, który musi
  pokrywać każdy klucz `EMPTY_FORM` / `DEFAULT_EXPORT_SETTINGS` wartością inną
  niż domyślna, i sprawdza, że każdy klucz przeżywa obieg stan → snapshot →
  stan. Pole dopisane tylko do `EMPTY_FORM` zatrzyma ten test.

Bez tego pole działałoby w edytorze, ale znikałoby po odświeżeniu, w
projekcie i w historii. Zmiana kształtu snapshotu, której stare dane nie
przeżyją, wymaga podbicia `SNAPSHOT_VERSION`: starsza aplikacja odmawia
wtedy otwarcia nowszego snapshotu (`reason: 'newer'`), zamiast go zgadywać.
Odmowa dotyczy też nieznanego layoutu (`unknownLayout`); wszystko inne jest
naprawiane wartościami domyślnymi.

W snapshocie nie ma obrazów, tylko ich nazwy (refy) - patrz „Grafiki".
Limit rozmiaru wiersza w bazie to 64 KB, więc snapshot musi pozostać małym JSON-em.

### Zapis: najpierw lokalnie, potem w chmurze

`useWorkspace` (`src/workspace/`) spina edytor, ustawienia eksportu i język w
jeden snapshot. Decyzje (co jest czyją pracą, kiedy jest konflikt) leżą w
czystych funkcjach `syncState.ts`, harmonogram zapisów w `syncEngine.ts`
(bez Reacta, wejście/wyjście wstrzykiwane), a hook tylko je łączy z Reactem,
IndexedDB i Supabase.

- **Kopia lokalna** - zawsze. 400 ms po zmianie (a przy chowaniu karty i
  `pagehide` od razu) snapshot trafia do IndexedDB pod kluczem
  `sknm-workspace` (`workspaceStore.ts`, ta sama baza idb-keyval co SQL i
  grafiki; wspólna dla kart przeglądarki - wygrywa ostatni zapis). Razem ze
  snapshotem leży przypięcie do projektu (`project`: id, nazwa, właściciel,
  `revision`) i flaga `dirty`. Błąd IndexedDB nie zatrzymuje edytora.
- **Chmura** - tylko gdy kopia jest przypięta do projektu i zalogowany jest
  jego właściciel. 2 s po zmianie (`SYNC_DELAY_MS`) silnik wgrywa grafiki do
  Storage, potem zapisuje wiersz. Pierwszy „Zapisz" (przycisk albo Ctrl/⌘+S)
  tworzy projekt z nazwą z tytułu i przypina do niego kopię. Niezalogowanemu
  „Zapisz" otwiera logowanie. Jedno żądanie naraz; zmiany w trakcie żądania
  zostają `dirty` i idą następnym zapisem. Nieudany zapis ponawia się po 15 s.
- **Wersja robocza** (`project: null`) nie wychodzi poza to urządzenie.
  Otwarcie innego dokumentu (projekt, wpis historii, „Nowy projekt") pyta o
  potwierdzenie, jeśli wersja robocza ma treść (`isBlank`), a otwarty projekt
  najpierw dopycha do chmury (`flush`) - gdy się nie uda, zostaje otwarty.
  Wpis historii zawsze otwiera się jako nowa, niezapisana praca, nie
  nadpisuje otwartego projektu. Cudzy, udostępniony projekt otwiera się jako
  kopia bez przypięcia.
- **Start**: kopia lokalna; gdy jej nie ma, ale jest stary draft z SQLite
  (`db/drafts.ts`), `snapshotFromLegacyDraft` robi z niego wersję roboczą.
  Tabela `draft` jest od teraz tylko do odczytu i tylko do tej migracji.
  Przypięty projekt jest po starcie porównywany z wierszem w chmurze
  (`bootDecision`): ta sama wersja → nic; w chmurze nowsza, lokalnie bez
  zmian → wczytaj z chmury; lokalne zmiany na tej samej wersji → wyślij;
  lokalne zmiany, a chmura poszła dalej → konflikt; wiersza nie ma → zostaje
  wersja robocza.

Status zapisu (`SaveStatus`, pokazywany w `ProjectBar`) liczy
`reduceSaveStatus`: `local` (wersja robocza), `saved`, `dirty` (czeka na
autozapis), `saving`, `error` (zostanie ponowiony), `conflict` i `paused`
(projekt przypięty, ale nikt uprawniony nie jest zalogowany).

**Konflikt dwóch kart.** Wiersz projektu ma `revision`, który baza podbija przy
każdej zmianie snapshotu; zapis podaje wersję, którą wczytał
(`saveProject(..., revision, ...)`). Jeśli w bazie jest już inna, rzuca
`ProjectConflictError`, status przechodzi w `conflict` i autozapis stoi. Zanim
zapytamy użytkownika, hook sprawdza wiersz: jeśli ma dokładnie naszą treść
(zapis doszedł, odpowiedź nie), konflikt znika sam. Inaczej `ProjectBar`
daje wybór: „Wczytaj wersję z chmury" (porzuca lokalne zmiany) albo
„Nadpisz" (bieżąca treść idzie na wersję z chmury).

**Logowanie i wylogowanie.** Zmiana zalogowanej osoby przechodzi przez
`reconcileBinding`: właściciel → synchronizacja rusza (i porównanie z chmurą);
nikt → projekt zostaje przypięty, status `paused`, zapis lokalny trwa; ktoś
inny → przypięcie jest zdejmowane, a treść zostaje jako niezapisana wersja
robocza (cudzego projektu nie wolno zapisać ani po cichu wyrzucić). Jawne
„Wyloguj" idzie przez `workspace.signOut`: otwarty projekt jest najpierw
zapisywany; udało się → edytor czyści się do pustego plakatu (w tym samym
layoucie), nie udało się → treść zostaje na urządzeniu jako wersja robocza z
komunikatem.

**Snapshot z nowszej wersji aplikacji.** Gdy kopia lokalna, projekt albo wpis
historii ma `v` większe niż `SNAPSHOT_VERSION` (albo nieznany layout), nie jest
wczytywany ani nadpisywany. Kopia lokalna zostaje wtedy zablokowana do zapisu
(`localLocked`), edytor startuje pusty z komunikatem „Odśwież stronę...", a
projekt z listy nie ma przycisku „Otwórz". Wersji z chmury, której nie umiemy
odczytać, nie nadpisuje też „Nadpisz".

### Grafiki

`src/assets/` obsługuje wgrane zdjęcia i logotypy. Plik jest zmniejszany
(`prepare.ts`; limit w kubełku to 5 MB), a jego nazwą staje się skrót
SHA-256 treści z rozszerzeniem: `<sha256>.<jpg|png|svg>` (`hash.ts`). Ta sama
grafika ma więc zawsze tę samą nazwę i wgrywa się ją raz. Bajty leżą lokalnie
w IndexedDB (`localStore.ts`, klucze `sknm-asset:<nazwa>`, ze znacznikiem
`remote`) i - po zalogowaniu - w prywatnym kubełku Storage (`remoteStore.ts`).

**Stan trzyma data URL-e, snapshot trzyma refy.** Plakat wpisuje adres obrazu
do `url(...)`, a eksport (`html-to-image`) pomija osadzanie tylko dla data
URL-i, więc formularze i plakaty dalej dostają data URL (`importImage`
zwraca go jak wcześniej `readAsDataUrl`). Dwukierunkową mapę nazwa ↔ data URL
trzyma `registry.ts` w pamięci; `toSnapshot` / `fromSnapshot` to pojedynczy
odczyt z niej, bez liczenia skrótów przy każdej zmianie. Obraz bez refa
wypada ze snapshotu (do bazy nie może trafić data URL).

- `hydrate(refs, client)` przed wczytaniem snapshotu wypełnia rejestr: z
  rejestru, z IndexedDB, na końcu ze Storage. Plik pobrany ze Storage jest
  sprawdzany - jego skrót musi zgadzać się z nazwą, bo Storage tego nie
  pilnuje. Refy, których nie udało się znaleźć, trafiają do `missing`:
  `ProjectBar` pokazuje, ile grafik brakuje, a `retainMissing` dopisuje je z
  powrotem do każdego zapisywanego snapshotu, żeby autozapis nie usunął ich z
  projektu. „Usuń je z projektu" porzuca je świadomie.
- `ensureUploaded` wgrywa do Storage to, czego tam jeszcze nie ma (przed
  zapisem projektu i przed wpisem do historii), a każdą świeżo wgraną
  grafikę dopisuje do wspólnej biblioteki (`remoteLibrary.ts`, tabela
  `sknm_assets`; `LogoPicker` pokazuje logotypy). Ponowne wgranie tego samego
  pliku (duplikat w Storage albo w tabeli) liczy się jako sukces.
- `gcLocal` przy starcie usuwa lokalne kopie, których kopia robocza nie
  używa, ale tylko te już wgrane do Storage.

## Skróty klawiszowe

Jedyny rejestr to `SHORTCUTS` w `src/shortcuts/shortcuts.ts` (id, kombinacja,
opis, czy działa w polach tekstowych):

| Skrót | Akcja | W polach tekstowych |
|---|---|---|
| Ctrl/⌘+S | Zapisz projekt | tak |
| Ctrl/⌘+Enter | Pobierz plakat | tak |
| Alt/⌥+1 / 2 / 3 | Zakładka „Szablon" / „Treść" / „Wygląd" | tak |
| `?` | Pokaż skróty klawiszowe | nie |

Skróty zakładek porównują fizyczny klawisz (`code`), bo ⌥1 na Macu wpisuje „¡".
Korzystają z rejestru `useShortcuts` (jeden nasłuch `keydown`; skrót bez handlera
jest pomijany, z handlerem blokuje domyślną akcję przeglądarki) i okienko pomocy
`ShortcutsHelp` (wysuwane z górnego paska), więc nowy skrót dopisuje się w
jednym miejscu. Handlery podaje `App.tsx`; bez Supabase skrót zapisu nie robi
nic (nadal blokuje okno zapisu przeglądarki) i nie jest pokazany w pomocy.
Skróty zakładek i pobierania działają z każdej strony (zakładka najpierw wraca do
edytora). Przy otwartym `<dialog>` skróty nie działają.

## Widoczność pól

Każde pole tekstowe ma w formularzu checkbox widoczności. Stan siedzi w
`FormValues.visibility` (per-pole `false` = ukryte; brak klucza = widoczne) i jest
zapisywany w snapshocie (`form.visibility`). `withPlaceholders(data)`
zwraca helpery `fx(name)` (styl `{ display: 'none' }` lub `undefined`) i `hidden(name)`
(bool) - plakat rozlewa `...fx('title')` na element danego pola. Ukryte pole
**znika z układu** (`display: none`), a flexowa konstrukcja bloków sama domyka
lukę - plakat się przekłada zamiast zostawiać puste miejsce. `InfoLine` w ogóle
nie renderuje ukrytych części ani osieroconych separatorów. Widoczność jest
częścią snapshotu (`form.visibility`), więc wraca z kopii roboczej, projektu i
historii; wpisy historii sprzed snapshotów jej nie mają (wszystko widoczne).

## Schematy kolorów (skrót)

`Component` woła `resolveScheme(layoutKey, schemeName, accent?)` → `{ cssVars, sygnet, logoVariant }`.
`cssVars` (np. `--page-bg`, `--accent`) są rozlewane na `PosterFrame`, a każdy potomek
używa `var(--rola)` w stylu inline. Szczegóły: [dodawanie-schematu-kolorow.md](./dodawanie-schematu-kolorow.md).

### Oś akcentu

Trzeci parametr `resolveScheme` to `accent` (`AccentName`). Recepty per layout w
`schemes.ts` (`accentRecipes`) nakładają nadpisania ról „akcentowych" nad scalonym
schematem. Który schemat ma oś akcentu — mówi sam blok schematu (pola `accents` /
`defaultAccent`); `accentsFor(layoutKey, scheme)` je odczytuje, `data` (brak
recepty) nie ma osi w ogóle. Wybór jest kodowany w kolumnie `color_scheme` jako
`schemat~akcent` (helpery `encodeScheme`/`decodeScheme` w `utils/colorScheme.ts`).

## Baza / wersjonowanie

Lokalna baza SQLite (sql.js) trzyma już tylko listę szablonów. Stan pracy
leży w kopii roboczej (patrz wyżej), a nie tutaj.

- `SCHEMA_VERSION` w `src/db/schema.ts` - podbij przy zmianie kształtu tabel;
  `resetIfStale()` zrzuca wtedy tabele (dane lokalne SQLite są uznane za
  jednorazowe). Dotyczy to też starego `draft` - jeśli nie zdążył jeszcze
  zostać zmigrowany do kopii roboczej, przepada. Kopia robocza (`sknm-workspace`)
  i grafiki to osobne klucze IndexedDB i tego zrzutu nie dotyczą.
- `syncTemplates()` dogrywa brakujące wpisy z `DEFAULT_TEMPLATES` po `poster_key`
  przy każdym starcie - nowy szablon pojawia się automatycznie także w istniejących bazach.

## Kształty i formaty eksportu

Plakat renderuje się w jednym z pięciu kształtów (`src/posters/shape.ts`):

| Kształt | Układ (px) | Kiedy |
|---|---|---|
| `square` | 1080 × 1080 | Kwadrat, Story, miniatury plakatów, swatche, historia |
| `portrait` | 1080 × 1528 | A4/A3/A2 w pionie |
| `landscape` | 1528 × 1080 | A4/A3/A2 w poziomie |
| `cover` | 1640 × 624 | baner: okładka strony na Facebooku |
| `event` | 1192 × 624 | baner: okładka wydarzenia na Facebooku (eksport 1920 × 1005) |

Kształt niesie kontekst Reacta (`PosterShapeContext`), ustawiany przez
`PosterScaled`; `PosterFrame` i szablony czytają go przez `usePosterShape()`.
Bez providera obowiązuje kwadrat. Format papieru (A4/A3/A2) nie zmienia
układu — tylko rozdzielczość eksportu (`src/posters/formats.ts`).

Eksport (`src/posters/export.ts`):

- **Kwadrat / Story** — PNG z układu 1080×1080, jak dotychczas.
- **Banery (Facebook)** — PNG: układ banera rasteryzowany wprost do rozmiaru
  formatu (1640×624 albo 1920×1005).
- **A4 / A3 / A2** — rasteryzacja do rozmiaru papieru w px przy 300 dpi;
  gdy przeglądarka nie udźwignie canvasu, drabinka schodzi na 200 i 150 dpi
  (`dpiLadder.ts`), a kreator pokazuje, która rozdzielczość się udała.
- **PNG** i **PDF** — RGB (sRGB), te same kolory co w podglądzie. PDF: piksele
  bez alfy (`rgb.ts`), spakowane natywnym `CompressionStream('deflate')`
  i osadzone jako jeden obraz na stronie o wymiarach papieru (`pdf.ts`, bez
  biblioteki).

**Kolory w druku:** PDF nie jest w CMYK. Przeliczenie robi drukarnia własnym
profilem - wcześniejsza konwersja po naszej stronie, bez profilu ICC, dawała
wyraźnie zmatowiałe kolory już w samym pliku. Najbardziej nasycone kolory
marki (limonka) leżą poza gamutem CMYK, więc w druku i tak wyjdą nieco
spokojniej niż na ekranie. Tekst w PDF nie jest zaznaczalny (to obraz).
Bez spadów i znaczników cięcia.

## Rodzaj grafiki: Social media i druk / Baner

Przełącznik w zakładce „Szablon" (`TemplateSelector`; `Medium` = `social` | `banner`,
stan w `usePosterExport`, zapisywany w snapshocie jako `export.medium`, domyślnie
`social`). Baner to **ten sam szablon w innym medium**, nie osobny wpis: rejestr
trzyma przy każdym layoucie drugi komponent (`Banner`, pliki w
`src/posters/banners/`). Zmiana medium zostawia wybrany layout, dane formularza,
kolorystykę i akcent - zmienia się komponent, kształt i lista formatów eksportu
(`formatsFor(medium)` w `formats.ts`). Banery wołają `resolveScheme` z tym samym
kluczem co plakat, więc nie mają własnych schematów.

Baner to wizytówka koła, nie plakat wydarzenia: niesie **stałą treść** z
`posters/copy.ts` (`CLUB_NAME[lang]` - pełna nazwa koła „Studenckie Koło Naukowe
Matematyków Politechniki Krakowskiej", zawsze w całości, bez haseł i opisów) i nie czyta
tytułu, prelegenta ani daty z formularza. Z danych formularza bierze tylko
logotypy, kod QR, zdjęcia i suwaki rozmiaru. Dlatego w trybie „Baner" zakładka
„Treść" pokazuje wspólny `forms/FormBanner.tsx` (zdjęcie - gdy wpis rejestru ma
`bannerPhoto` - i kod QR) zamiast formularza layoutu; dane wydarzenia zostają w
stanie i wracają po przejściu na „Social media i druk". Zakładka „Wygląd" jest
ta sama co przy plakacie.

Oba kształty banera mają wspólną wysokość układu (624 px) - baner projektuje
się raz i jest płynny tylko na szerokość. `useBannerLayout()` oddaje boczny
margines treści `padX`: tekst, logo i QR siedzą w środkowej kolumnie
`BANNER_SAFE_W` (1096 px), bo Facebook na telefonie przycina okładkę strony do
środkowych ~68% szerokości; na marginesy wychodzi tylko dekoracja i zdjęcia.

Układ edytora w trybie banera: patrz „Strona edytora". Swatche kolorystyki i
miniatury historii zostają kwadratowe; medium, format, orientacja i typ pliku są
częścią snapshotu (`export`), więc wracają razem z projektem i wpisem historii.
