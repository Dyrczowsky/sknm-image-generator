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
│   ├── useEditor.ts       lokalna baza, szablony, formularz, kolorystyka + autozapis draftu
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
│   ├── HistoryList        wspólna historia wygenerowanych grafik
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
│
├── db/                lokalna baza SQLite (sql.js) w przeglądarce: szablony i draft
│   ├── client.ts         pojedyncza instancja bazy, zapis do IndexedDB
│   ├── schema.ts         DEFAULT_TEMPLATES, CREATE TABLE, syncTemplates()
│   ├── templates.ts      listTemplates()
│   └── drafts.ts         zapis/odczyt roboczej wersji formularza
│
└── utils/             drobne narzędzia (daty, kodowanie kolorystyki, URL-e zgłoszeń, hooki)
```

## Przepływ danych

1. `useEditor()` przy starcie woła `getDb()` → `listTemplates()` + `getDraft()` i ustawia stan.
2. Formularz zgłasza zmianę jako przekształcenie (`onChange(setField('title', v))`,
   funkcje z `editor/formState.ts`), a edytor podaje je do `setForm`. Draft zapisuje
   się sam: `useEditor` porównuje zserializowaną treść draftu i po 400 ms bez zmian
   woła `saveDraft()` (tabela `draft`). Do draftu trafiają pola tekstowe, widoczność,
   szablon i kolorystyka; grafiki, zdjęcia, listy i suwaki są sesyjne.
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
   a po udanym zapisie pliku - jeśli użytkownik jest zalogowany - `useHistory().record()`
   dopisuje wpis do wspólnej historii w Supabase.

Logowanie, wspólna historia i notatki: [supabase.md](./supabase.md).

## Widoczność pól

Każde pole tekstowe ma w formularzu checkbox widoczności. Stan siedzi w
`FormValues.visibility` (per-pole `false` = ukryte; brak klucza = widoczne) i jest
zapisywany w draftcie (kolumna `draft.visibility`, JSON). `withPlaceholders(data)`
zwraca helpery `fx(name)` (styl `{ display: 'none' }` lub `undefined`) i `hidden(name)`
(bool) - plakat rozlewa `...fx('title')` na element danego pola. Ukryte pole
**znika z układu** (`display: none`), a flexowa konstrukcja bloków sama domyka
lukę - plakat się przekłada zamiast zostawiać puste miejsce. `InfoLine` w ogóle
nie renderuje ukrytych części ani osieroconych separatorów. Historia nie zapisuje
widoczności.

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

- `SCHEMA_VERSION` w `src/db/schema.ts` - podbij przy zmianie kształtu tabel;
  `resetIfStale()` zrzuca wtedy tabele (dane lokalne są uznane za jednorazowe).
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
  biblioteki). Obraz jest oznaczony osadzonym profilem ICC sRGB
  (`srgbProfile.ts`, budowany w kodzie), więc drukarnia wie, z jakiej
  przestrzeni przelicza.

**Kolory w druku:** PDF nie jest w CMYK. Przeliczenie robi drukarnia własnym
profilem - wcześniejsza konwersja po naszej stronie, bez profilu ICC, dawała
wyraźnie zmatowiałe kolory już w samym pliku. Najbardziej nasycone kolory
marki (limonka) leżą poza gamutem CMYK, więc w druku i tak wyjdą nieco
spokojniej niż na ekranie. Tekst w PDF nie jest zaznaczalny (to obraz).
Bez spadów i znaczników cięcia.

## Zakładki: Social media / Baner

Panel „1. Wybierz szablon" ma dwie zakładki (`Medium` = `social` | `banner`,
stan sesyjny w `usePosterExport`, domyślnie `social`). Baner to **ten sam szablon w innym
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
zostają kwadratowe; historia nie zapisuje medium.

## Zwijane panele kreatora

Panele „1. Wybierz szablon", „2. Uzupełnij dane" i „Historia" to
`CollapsiblePanel` — zwinięta treść dostaje `hidden` (nie jest odmontowana,
więc stan formularza zostaje). Stan zwinięcia leży w `localStorage` pod
`sknm-collapsed-panels` (`src/utils/collapsedPanels.ts`); zepsuty wpis =
wszystko rozwinięte.
