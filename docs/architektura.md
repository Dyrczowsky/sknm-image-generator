# Architektura

## Warstwy

```
src/
├── App.tsx              układ strony edytora; spina hooki stanu z komponentami
├── main.tsx             bootstrap + prosty routing: App albo PosterPreviewPage
├── index.css            wejście Tailwind + tokeny kolorów aplikacji (patrz stylowanie.md)
├── types.ts             wspólne typy (FormValues, FormUpdate, PosterProps, wiersze bazy, ...)
│
├── editor/             stan edytora
│   ├── useEditor.ts       szablony z lokalnej bazy, formularz, kolorystyka (zapis robi workspace/)
│   ├── usePosterExport.ts zakładka, format, orientacja, typ pliku i sam eksport
│   └── formState.ts       EMPTY_FORM + czyste przekształcenia formularza (setField, addGraphics, ...)
│
├── components/          elementy UI edytora
│   ├── TemplateSelector   zakładki „Social media" / „Baner" + kafelki layoutów
│   ├── SchemeSelector     pasek wyboru kolorystyki (renderowany pod podglądem)
│   ├── ExportBar          format eksportu, orientacja, typ pliku, przycisk „Pobierz"
│   ├── PosterPreview      podgląd na żywo (ref do eksportu)
│   ├── PosterScaled       plakat w rozmiarze układu przeskalowany CSS transform do podglądu
│   ├── ImageUpload        pole na grafikę z podglądem (zdjęcie z kadrowaniem)
│   ├── HistoryList        wspólna historia wygenerowanych grafik (miniatury ze snapshotu)
│   ├── ProjectBar         pasek pod nagłówkiem: nazwa projektu, status zapisu, „Zapisz", konflikt
│   ├── ProjectsList       panel „Projekty": własne i udostępnione, nazwa, udostępnianie, usuwanie
│   ├── LogoPicker         logotypy z wspólnej biblioteki do wstawienia na plakat
│   ├── ShortcutsHelp      okienko ze skrótami klawiszowymi
│   ├── NotesPanel         wspólna lista zadań
│   ├── RemotePanel        rama paneli z danymi z Supabase (logowanie / ładowanie / błąd)
│   ├── AuthControl/Dialog logowanie w nagłówku
│   ├── TicketDialog       modal zgłoszeń (błąd / zapotrzebowanie na plakat)
│   └── styles.ts          klasy Tailwinda powtarzane w kilku komponentach
│
├── forms/              formularze layoutów
│   ├── PosterForm         wspólny szkielet: suwaki, pola, grafiki + QR, galeria zdjęć
│   ├── fields.ts          FieldSpec + gotowe pola (FIELDS, badgeField)
│   ├── FormWyklad...      po jednym pliku na layout: lista pól dla PosterForm
│   ├── FormBanner         wspólny formularz zakładki „Baner"
│   ├── FormField          pole tekstowe + checkbox widoczności
│   ├── GraphicsField      logo PK, grafiki stopki, link do kodu QR
│   └── PhotoGalleryField  galeria 0..N zdjęć, opakowuje ImageUpload
│
├── posters/           renderowanie plakatów
│   ├── registry.ts       poster_key → { name, Component, Banner, Form }
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
└── utils/             drobne narzędzia (daty, kodowanie kolorystyki, URL-e zgłoszeń, hooki)
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
   - `Form` renderuje się w panelu "2. Uzupełnij dane".
   - `Component` renderuje się w `PosterPreview` z tymi samymi danymi (`form`) i `scheme`.
   - Pasek kolorystyki: `schemesFor(poster_key)` z `schemes.ts` (kolejność = kolejność
     zapisu; layout z jednym schematem nie pokazuje paska). Zmiana szablonu lub
     schematu przechodzi przez `fitColorsToLayout()` (`utils/colorScheme.ts`), które
     dobiera domyślny schemat i odpina niedozwolony akcent.
4. Dane formularza są **globalne** i przeżywają zmianę layoutu - zmienia się tylko,
   który `Form` je edytuje i który `Component` je rysuje.
5. "Pobierz" → `usePosterExport().download()` → `downloadPoster(posterRef.current, ...)`,
   a po udanym zapisie pliku - jeśli użytkownik jest zalogowany - najpierw
   `workspace.uploadAssets()` wgrywa grafiki snapshotu do Storage, potem
   `useHistory().record()` dopisuje wpis (z pełnym snapshotem) do wspólnej
   historii w Supabase.

Logowanie, wspólna historia, projekty, biblioteka grafik i notatki: [supabase.md](./supabase.md).

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
opis, czy działa w polach tekstowych): Ctrl/⌘+S „Zapisz projekt", Ctrl/⌘+Enter
„Pobierz plakat", `?` „Pokaż skróty". Korzystają z niego `useShortcuts` (jeden
nasłuch `keydown`; skrót bez handlera jest pomijany, z handlerem blokuje
domyślną akcję przeglądarki) i okienko pomocy `ShortcutsHelp`, więc nowy skrót
dopisuje się w jednym miejscu. Handlery podaje `App.tsx`; bez Supabase skrót
zapisu jest wyłączony. Przy otwartym `<dialog>` skróty nie działają.


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

## Zakładki: Social media / Baner

Panel „1. Wybierz szablon" ma dwie zakładki (`Medium` = `social` | `banner`,
stan w `usePosterExport`, zapisywany w snapshocie jako `export.medium`, domyślnie `social`). Baner to **ten sam szablon w innym
medium**, nie osobny wpis: rejestr trzyma przy każdym layoucie drugi komponent
(`Banner`, pliki w `src/posters/banners/`). Zmiana zakładki zostawia wybrany
layout, dane formularza, kolorystykę i akcent - zmienia się komponent, kształt
i lista formatów eksportu (`formatsFor(medium)` w `formats.ts`). Banery wołają
`resolveScheme` z tym samym kluczem co plakat, więc nie mają własnych schematów.

Baner to wizytówka koła, nie plakat wydarzenia: niesie **stałą treść** z
`posters/copy.ts` (`CLUB_NAME[lang]` - pełna nazwa koła „Studenckie Koło Naukowe
Matematyków Politechniki Krakowskiej", zawsze w całości, bez haseł i opisów) i nie czyta
tytułu, prelegenta ani daty z formularza. Z danych formularza bierze tylko
logotypy, kod QR, zdjęcia i suwaki rozmiaru. Dlatego zakładka „Baner" ma jeden
wspólny formularz `forms/FormBanner.tsx` zamiast formularza layoutu; dane
wydarzenia zostają w stanie i wracają po przejściu na „Social media".

Oba kształty banera mają wspólną wysokość układu (624 px) - baner projektuje
się raz i jest płynny tylko na szerokość. `useBannerLayout()` oddaje boczny
margines treści `padX`: tekst, logo i QR siedzą w środkowej kolumnie
`BANNER_SAFE_W` (1096 px), bo Facebook na telefonie przycina okładkę strony do
środkowych ~68% szerokości; na marginesy wychodzi tylko dekoracja i zdjęcia.

W zakładce „Baner" podgląd przenosi się na górę i zajmuje całą szerokość
kreatora (rozmiar z `useElementWidth`). Swatche kolorystyki i miniatury historii
zostają kwadratowe; medium, format, orientacja i typ pliku są częścią snapshotu
(`export`), więc wracają razem z projektem i wpisem historii.

## Zwijane panele kreatora

Panele „1. Wybierz szablon", „2. Uzupełnij dane", „Projekty", „Historia" i
„Notatki" to `CollapsiblePanel` — zwinięta treść dostaje `hidden` (nie jest odmontowana,
więc stan formularza zostaje). Stan zwinięcia leży w `localStorage` pod
`sknm-collapsed-panels` (`src/utils/collapsedPanels.ts`); zepsuty wpis =
wszystko rozwinięte. Panel „Projekty" (`ProjectsList`) pokazuje własne projekty
zalogowanej osoby i te, które inni udostępnili zespołowi; własne można
otworzyć, przemianować, udostępnić (przełącznik „Udostępnij zespołowi") i
usunąć, cudze tylko otworzyć jako kopię. Rozwinięcie panelu odświeża listę.
