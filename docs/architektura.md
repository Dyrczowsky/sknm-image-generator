# Architektura

## Warstwy

```
src/
├── App.tsx              stan edytora (formularz, wybrany szablon, schemat), spina całość
├── main.tsx             bootstrap + prosty routing: App albo PosterPreviewPage
├── index.css            wejście Tailwind + tokeny kolorów aplikacji (patrz stylowanie.md)
│
├── components/          elementy UI edytora
│   ├── TemplateSelector   kafelki layoutów
│   ├── SchemeSelector     pasek wyboru kolorystyki (renderowany pod podglądem)
│   ├── PosterPreview      podgląd na żywo (ref do eksportu PNG)
│   ├── PosterScaled       plakat 1080×1080 przeskalowany CSS transform do podglądu
│   ├── ImageUpload        uniwersalne pole na grafikę (logo / zdjęcie z kadrowaniem)
│   └── HistoryList        lista wygenerowanych grafik
│
├── forms/              po jednym komponencie formularza na layout (FormWyklad, FormGala, ...)
│   ├── FormField          wrapper <label><input> + checkbox widoczności pola
│   ├── LogoField          slot logo (checkbox + upload), opakowuje ImageUpload
│   └── PhotoGalleryField  galeria 0..N zdjęć, opakowuje ImageUpload
│
├── posters/           renderowanie plakatów
│   ├── registry.ts       poster_key → { name, Component, Form }
│   ├── PosterWyklad...    8 komponentów layoutów (style inline, patrz stylowanie.md)
│   ├── blocks/           współdzielone bloki plakatu (PosterFrame, Badge, LogoRow, ...)
│   ├── theme.ts          tokeny wizualne plakatów (kolory, typografia)
│   ├── schemes.ts        schematy kolorów per layout + resolveScheme() + schemesFor()
│   ├── fallback.ts       PLACEHOLDERS + withPlaceholders() (dane przykładowe)
│   ├── logos.ts          warianty sygnetu SKNM i logo PK
│   └── export.ts         downloadPosterAsPng() - html-to-image + formaty eksportu
│
└── db/                warstwa SQLite (sql.js) w przeglądarce
    ├── client.ts         pojedyncza instancja bazy, zapis do IndexedDB
    ├── schema.ts         DEFAULT_TEMPLATES, CREATE TABLE, syncTemplates()
    ├── templates.ts      listTemplates()
    ├── drafts.ts         zapis/odczyt roboczej wersji formularza
    └── history.ts        wpisy historii wygenerowanych grafik
```

## Przepływ danych

1. `App` przy starcie woła `getDb()` → `listTemplates()` + `getDraft()` i ustawia stan.
2. Zmiana pola formularza → `setForm()` + `persistDraft()` (debounce 400 ms → tabela `draft`).
3. Wybrany szablon (`selectedTemplateId`) + rejestr → `selectedPoster` = `{ Component, Form }`.
   - `Form` renderuje się w panelu "2. Uzupełnij dane".
   - `Component` renderuje się w `PosterPreview` z tymi samymi danymi (`form`) i `scheme`.
   - Pasek kolorystyki: `schemesFor(poster_key)` z `schemes.ts` (kolejność = kolejność
     zapisu; layout z jednym schematem nie pokazuje paska).
4. Dane formularza są **globalne** i przeżywają zmianę layoutu - zmienia się tylko,
   który `Form` je edytuje i który `Component` je rysuje.
5. "Pobierz PNG" → `downloadPosterAsPng(posterRef.current, ...)` + `addHistoryEntry()`.

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

`Component` woła `resolveScheme(layoutKey, schemeName)` → `{ cssVars, sygnet, logoVariant }`.
`cssVars` (np. `--page-bg`, `--accent`) są rozlewane na `PosterFrame`, a każdy potomek
używa `var(--rola)` w stylu inline. Szczegóły: [dodawanie-schematu-kolorow.md](./dodawanie-schematu-kolorow.md).

## Baza / wersjonowanie

- `SCHEMA_VERSION` w `src/db/schema.ts` - podbij przy zmianie kształtu tabel;
  `resetIfStale()` zrzuca wtedy tabele (dane lokalne są uznane za jednorazowe).
- `syncTemplates()` dogrywa brakujące wpisy z `DEFAULT_TEMPLATES` po `poster_key`
  przy każdym starcie - nowy szablon pojawia się automatycznie także w istniejących bazach.
