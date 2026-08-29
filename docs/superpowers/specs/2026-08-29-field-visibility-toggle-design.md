# Przełącznik widoczności pól + przeniesienie wyboru kolorystyki

## Cel

1. Przenieść pasek wyboru kolorystyki z panelu „1. Wybierz szablon" pod podgląd
   plakatu (panel „Podgląd").
2. Dać każdemu polu tekstowemu formularza przełącznik widoczności. Ukryte pole
   **nie znika z DOM plakatu** — jego element dostaje `opacity: 0`, żeby zachować
   flexową konstrukcję bloków (`justify-content: space-between` itd.).

## Część 1 — SchemeSelector pod podglądem

- Z `TemplateSelector` wydzielony nowy komponent `src/components/SchemeSelector.tsx`.
  `TemplateSelector` renderuje odtąd wyłącznie kafelki layoutów.
- `SchemeSelector` przyjmuje `poster: RegistryEntry | null`, `selectedScheme`,
  `onSelectScheme`. Sam liczy `schemeList` i `SwatchComponent`. Renderuje `null`,
  gdy `schemes.length <= 1`.
- `App` renderuje `<SchemeSelector>` w sekcji „Podgląd", pod `<PosterPreview>`.
  Propsy `selectedScheme` / `onSelectScheme` już istnieją.

## Część 2 — widoczność pól

### Model danych

- `FormValues.visibility: Partial<Record<FormTextField, boolean>>`
  - brak klucza lub `true` → pole widoczne
  - `false` → pole ukryte (`opacity: 0` na plakacie)
- `RawPosterData` niesie `visibility` automatycznie (klucz `FormValues`).
- `EMPTY_FORM.visibility = {}`.

### Trwałość

- Tabela `draft`: nowa kolumna `visibility TEXT` (JSON string, domyślnie `'{}'`).
- `SCHEMA_VERSION` 2 → 3. `resetIfStale` zrzuca tabele (dane lokalne są jednorazowe,
  zgodnie z istniejącym komentarzem w `schema.ts`).
- `DraftRow.visibility: string | null`. `getDraft` zwraca surowy string;
  `App` parsuje przez `JSON.parse` w bloku `try` (fallback `{}`).
- `saveDraft` serializuje `JSON.stringify(draft.visibility ?? {})`.
- Historia (`generated_images`) — bez zmian.

### Helper w `fallback.ts`

`withPlaceholders(data)` dodatkowo zwraca:

```ts
fx: (name: FormTextField): CSSProperties | undefined =>
  data.visibility?.[name] === false ? { opacity: 0 } : undefined
hidden: (name: FormTextField): boolean =>
  data.visibility?.[name] === false
```

### Plakaty (8×)

Każde pole tekstowe renderowane bezpośrednio: dostaje `...fx('<name>')` w `style`.
Przykład (`PosterWyklad`):

```tsx
<div style={{ fontSize: 120, ..., ...fx('title') }}>{title}</div>
<div style={{ fontSize: 36, ..., ...fx('speaker') }}>{speaker}</div>
<Badge ... style={{ fontSize: 24, ...fx('badge') }}>{badge || 'WYKŁAD OTWARTY'}</Badge>
<BigDateNumber event_date={event_date} style={fx('event_date')} />
```

`Badge` i `BigDateNumber` już mają prop `style` — bez zmian w blokach.

### `InfoLine` — per-part opacity

Dziś: `parts.filter(Boolean).join(' · ')` → jeden string.
Nowość: każda część w osobnym `<span>`; część + poprzedzający separator objęte
wspólnym `<span style={{ opacity: hidden ? 0 : undefined }}>`.

```ts
interface InfoLinePart { text: string | null | undefined | false; hidden?: boolean }
parts: ReadonlyArray<string | null | undefined | false | InfoLinePart>   // string nadal działa
secondLine?: ReactNode
secondLineHidden?: boolean
```

- Normalizacja: `string` → `{ text, hidden: false }`.
- Puste (`!text`) części nadal pomijane całkowicie (jak dziś).
- Separator dołączony do części o indeksie > 0, wewnątrz tego samego `<span>` co
  wartość — ukrycie chowa jedno i drugie, szerokość zostaje.
- `secondLine` owinięte w `<span>` z `opacity` gdy `secondLineHidden`.

Wywołania w plakatach przekazują `{ text: event_time, hidden: hidden('event_time') }` itd.

### `FormField` — checkbox widoczności

Nowe propsy:

```ts
name: FormTextField
visibility?: Partial<Record<FormTextField, boolean>>
onVisibilityChange?: (name: FormTextField, visible: boolean) => void
```

- Gdy `onVisibilityChange` podane: przed etykietą widoczny `<input type="checkbox">`
  (`checked = visibility?.[name] !== false`).
- Odznaczenie → `onVisibilityChange(name, false)`.
- Bez `onVisibilityChange` — checkbox się nie renderuje (kompatybilność wstecz).

### `App`

- `handleVisibilityChange(name, visible)`: aktualizuje `form.visibility`, wywołuje
  `persistDraft`.
- Przekazuje `onVisibilityChange` do aktywnego `SelectedForm` (rozszerzenie `FormProps`).
- `handleRestoreHistoryEntry` ustawia `visibility: {}` (historia nie zapisuje widoczności).

### `FormProps`

Dochodzi `onVisibilityChange: (name: FormTextField, visible: boolean) => void`.

### Formularze (8×)

Każde `<FormField>` dostaje `name="<pole>"`, `visibility={value.visibility}`,
`onVisibilityChange={onVisibilityChange}`. Pola listy (agenda w `FormKonferencja`)
— poza zakresem.

## Pliki

`src/types.ts`, `src/posters/fallback.ts`, `src/posters/blocks/InfoLine.tsx`,
`src/posters/Poster{Wyklad,Gosc,Warsztat,Rekrutacja,Data,Konferencja,Gala,Ogloszenie}.tsx`,
`src/forms/FormField.tsx`,
`src/forms/Form{Wyklad,Gosc,Warsztat,Rekrutacja,Data,Konferencja,Gala,Ogloszenie}.tsx`,
`src/App.tsx`, `src/components/TemplateSelector.tsx`,
`src/components/SchemeSelector.tsx` (nowy), `src/db/drafts.ts`, `src/db/schema.ts`.

## Weryfikacja

- `npm run build` (tsc + vite), `npm test`, `npm run lint`
- przeglądarka: przełączanie widoczności pól na Wykład / Gość / Konferencja,
  sprawdzenie że blok zachowuje pozycję (nie przeskakuje), eksport PNG z ukrytym
  polem (opacity:0 w rasteryzacji), wybór kolorystyki pod podglądem
- odświeżenie strony — stan widoczności wraca z draftu

## Poza zakresem

- Widoczność logo/zdjęć (mają własne `enabled`)
- Widoczność elementów listy (agenda)
- Zapis widoczności w historii
