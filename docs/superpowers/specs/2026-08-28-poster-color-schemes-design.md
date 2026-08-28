# Schematy kolorów plakatów — jeden layout, wiele kolorystyk

Data: 2026-08-28
Status: zatwierdzony do planowania

## Problem

Każdy layout plakatu (Wykład, Gość, Warsztat, Data, Konferencja, Rekrutacja,
Ogłoszenie) ma dziś 4–5 niemal identycznych plików `Poster1x*.jsx`, różniących
się garstką kolorów, wyborem sygnetu i `variant="light|dark"` na logo. To ~28
plików wariantów + 4 zbędne kopie formularza Wykładu. Dodanie koloru = przepisanie
całego layoutu. Klucze szablonów to nic nie mówiące `1a`, `1b-czern`, `1h`.

Cel: **jeden plik na layout**, kolorystyka wyciągnięta do jednego, łatwego do
edycji zestawu schematów. Wybór koloru = przekazanie nazwy schematu; brakujące
role spadają na schemat `default`.

## Model

### Schematy kolorów — `src/posters/schemes.js` (nowy)

Czysty obiekt danych + resolver. Nazwany schemat wpisuje **tylko to, co się różni**
od `base`; reszta ról spada na `base`.

```js
import { colors } from './theme'

const base = {
  pageBg: colors.cream,
  pageText: colors.ink,
  mutedText: colors.textMuted,
  accent: colors.navy,          // podstawowy akcent (tytuł/badge/narożnik wg layoutu)
  accentText: colors.cream,     // tekst/wypełnienie NA akcencie
  accent2: colors.lime,         // wtórny akcent (pills, trójkąty deko, drugi badge)
  accent2Text: colors.limeText,
  panel: colors.navy,           // kontrastowy pas/płyta (nagłówek Konferencji, płyta Gali)
  panelText: colors.cream,
  line: colors.creamMuted,      // włoskowate linie / obramowania listy (agenda)
  sygnet: 'negatywny',          // nazwa assetu: negatywny|granat|zloty|szary|czarny
  logoVariant: 'light',         // 'light' | 'dark'
}

export const schemes = {
  default: {},                                    // = base; etykieta „Granat"
  czern: {
    pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
    accent: colors.gold, accentText: colors.cream,
    accent2: colors.gold, accent2Text: colors.black,
    panel: colors.slate,
    line: 'color-mix(in srgb, var(--page-text) 20%, transparent)',
    sygnet: 'zloty', logoVariant: 'dark',
  },
  zloto: {
    pageBg: colors.navy, pageText: colors.cream, mutedText: colors.creamMuted,
    accent: colors.gold, accentText: colors.cream,
    accent2: colors.gold, accent2Text: colors.navy,
    panel: colors.inkPanel,
    sygnet: 'zloty', logoVariant: 'dark',
  },
  jasny: { pageBg: colors.paper },
  szary: {
    pageBg: colors.paper, pageText: colors.slate, mutedText: colors.textMuted,
    accent: colors.grayDark, accent2: colors.gray, accent2Text: colors.cream,
    panel: colors.grayDark, sygnet: 'szary',
  },
  limonka: {                                       // domyślny dla Rekrutacji
    pageBg: colors.lime, pageText: colors.limeText,
    accent: colors.navy, accentText: colors.cream,
    accent2: colors.navy, accent2Text: colors.cream,
    panel: colors.navy,
  },
}

const CSS_VAR = {
  pageBg: '--page-bg', pageText: '--page-text', mutedText: '--muted-text',
  accent: '--accent', accentText: '--accent-text',
  accent2: '--accent-2', accent2Text: '--accent-2-text',
  panel: '--panel', panelText: '--panel-text', line: '--line',
}

export function resolveScheme(name) {
  const merged = { ...base, ...(schemes[name] ?? {}) }
  const cssVars = {}
  for (const [k, cssName] of Object.entries(CSS_VAR)) cssVars[cssName] = merged[k]
  return { cssVars, sygnet: merged.sygnet, logoVariant: merged.logoVariant }
}

export const SCHEME_LABELS = {
  default: 'Granat', limonka: 'Limonka', czern: 'Czerń',
  zloto: 'Złoto', jasny: 'Jasny', szary: 'Szary',
}
```

Dokładna lista ról i ich wartości per schemat są **domknięte w trakcie
implementacji** przez czytanie każdej pary wariantów (bazowy vs `*Czern` itd.).
Powyższe to punkt wyjścia. Role nie muszą pasować 1:1 do wszystkich layoutów —
każdy layout sam decyduje, który element bierze którą rolę (patrz „Ryzyka").

### Ścieżka renderowania — CSS custom properties

`PosterFrame` przyjmuje `vars` i emituje je na korzeniu 1080×1080, plus tło/kolor
z `var()`:

```jsx
export function PosterFrame({ vars, padding = 0, style, children }) {
  return (
    <div style={{
      ...posterBaseStyle, ...vars,
      background: 'var(--page-bg)', color: 'var(--page-text)',
      padding, display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between', ...style,
    }}>
      {children}
    </div>
  )
}
```

Każdy `Poster*` na górze:

```jsx
export function PosterGosc({ data, scheme }) {
  const { title, /* … */ } = withPlaceholders(data)
  const s = resolveScheme(scheme)
  return (
    <PosterFrame vars={s.cssVars} padding={72}>
      {/* colors.navy → 'var(--accent)', colors.textMuted → 'var(--muted-text)' itd. */}
      <img src={sygnetByName[s.sygnet]} alt="SKNM" />
      <Badge color="var(--accent)">{badge || 'SEMINARIUM SKNM'}</Badge>
      <LogoSlot logo={logos.pk} variant={s.logoVariant} />
    </PosterFrame>
  )
}
```

- **Bloki (`Badge`, `InfoLine`, `BigDateNumber`, `BrandingText`, `LogoRow`,
  `LogoSlot`, `PlaceholderBox`) — bez zmian.** Dostają string `"var(--accent)"`
  zamiast hexa. `getComputedStyle` rozwiązuje go przy renderze i przy eksporcie
  (`html-to-image` inline'uje już rozwiązany kolor RGB).
- `src/posters/logos.js` — nowa mapa `sygnetByName = { negatywny, granat, zloty,
  szary, czarny }`.
- Wartości stałe między schematami (np. koralowa plakietka z datą w Gość/Data:
  `colors.coral` / `colors.cream`) zostają literałami z `theme.js`. Promocja do
  roli w `schemes.js` dopiero gdy jakiś schemat naprawdę chce je zmienić (YAGNI).
- Dekoracje wpisane dziś na sztywno per-wariant (trójkąty Wykładu `#1E1E1E` /
  `#0A0A0A`, kliny stopki, tła `rgba(...)`): domyślnie **wyliczane** przez
  `color-mix(in srgb, var(--page-bg) 88%, #000)` itp. Gdy któryś schemat wygląda
  źle → dopisuje własny override w `schemes.js` (np. `deco1`, `deco2`). To jest
  „wierność na życzenie".

### Registry — `src/posters/registry.js`

Znika `family` / `familyLabel` / `colorLabel`. Dochodzi lista schematów per layout
(pierwszy = domyślny):

```js
export const posterRegistry = {
  wyklad:     { name: 'Wykład', Component: PosterWyklad, Form: FormWyklad,
                schemes: ['default', 'zloto', 'czern', 'jasny', 'szary'] },
  gosc:       { name: 'Gość', Component: PosterGosc, Form: FormGosc,
                schemes: ['default', 'czern', 'zloto', 'jasny', 'szary'] },
  warsztat:   { name: 'Warsztat', Component: PosterWarsztat, Form: FormWarsztat,
                schemes: ['default', 'czern', 'zloto', 'jasny', 'szary'] },
  data:       { name: 'Data', Component: PosterData, Form: FormData,
                schemes: ['default', 'czern', 'zloto', 'jasny', 'szary'] },
  konferencja:{ name: 'Konferencja', Component: PosterKonferencja, Form: FormKonferencja,
                schemes: ['default', 'czern', 'zloto', 'jasny', 'szary'] },
  rekrutacja: { name: 'Rekrutacja', Component: PosterRekrutacja, Form: FormRekrutacja,
                schemes: ['limonka', 'czern', 'zloto', 'jasny', 'szary'] },
  gala:       { name: 'Gala', Component: PosterGala, Form: FormGala },  // brak schemes
  ogloszenie: { name: 'Ogłoszenie', Component: PosterOgloszenie, Form: FormOgloszenie,
                schemes: ['default', 'czern', 'zloto', 'jasny', 'szary'] },
}
```

Layout bez `schemes` (Gala) renderuje się z `resolveScheme(undefined)` → `base`
i nie pokazuje paska kolorów.

### Nazewnictwo — klucze i pliki

| `poster_key` | Layout | Komponent (export) | Formularz (export) |
|---|---|---|---|
| `wyklad` | Wykład | `PosterWyklad.jsx` | `FormWyklad.jsx` |
| `gosc` | Gość | `PosterGosc.jsx` | `FormGosc.jsx` |
| `warsztat` | Warsztat | `PosterWarsztat.jsx` | `FormWarsztat.jsx` |
| `data` | Data | `PosterData.jsx` | `FormData.jsx` |
| `konferencja` | Konferencja | `PosterKonferencja.jsx` | `FormKonferencja.jsx` |
| `rekrutacja` | Rekrutacja | `PosterRekrutacja.jsx` | `FormRekrutacja.jsx` |
| `gala` | Gala | `PosterGala.jsx` | `FormGala.jsx` |
| `ogloszenie` | Ogłoszenie | `PosterOgloszenie.jsx` | `FormOgloszenie.jsx` |

Klucze i nazwy plików ASCII, lowercase (bez znaków diakrytycznych).

Mapowanie ze starych plików:
- `Poster1a` → `PosterWyklad`, `Poster1b` → `PosterGosc`, `Poster1c` →
  `PosterWarsztat`, `Poster1d` → `PosterData`, `Poster1e` → `PosterKonferencja`,
  `Poster1f` → `PosterRekrutacja`, `Poster1g` → `PosterGala`, `Poster1l` →
  `PosterOgloszenie`.
- Analogicznie `Form1a`…`Form1l` → `FormWyklad`…`FormOgloszenie`.

**Kasowane (32 pliki):**
- Warianty plakatów: `Poster1{b,c,d,e,f,l}{Czern,Zloto,Jasny,Szary}.jsx` (24) +
  `Poster1{h,i,j,k}.jsx` (4).
- Formularze: `Form1{h,i,j,k}.jsx` (4) — bajt w bajt identyczne z `Form1a`,
  Wykład używa `FormWyklad`.

## Stan aplikacji i baza

### `App.jsx`

- Nowy stan `selectedScheme`.
- `handleSelectScheme(name)` — ustawia scheme + `persistDraft`.
- Przy zmianie layoutu: scheme resetuje się do `registry[key].schemes?.[0]`
  (`undefined` dla Gali).
- `selectedScheme` przekazywany do `PosterPreview` i do węzła eksportu.
- Przywracanie wpisu historii przywraca też `color_scheme`.

### `src/db/schema.js`

- `DEFAULT_TEMPLATES` → 8 wpisów: `wyklad`, `gosc`, `warsztat`, `data`,
  `konferencja`, `rekrutacja`, `gala`, `ogloszenie`.
- `createSchema` — kolumna `color_scheme TEXT` w tabelach `draft` i
  `generated_images`.
- Migracja przez `PRAGMA user_version`: stała `SCHEMA_VERSION = 2`. Jeśli
  odczytana wersja `< 2` → `DROP TABLE templates; DROP TABLE draft; DROP TABLE
  generated_images;` → `createSchema` → `syncTemplates` → `PRAGMA user_version = 2`.
  (Zatwierdzona zgoda na wyczyszczenie danych — bez ostrożnego remapu FK.)
- `migrateDraftColumns` można usunąć (zastąpione resetem wersji) albo zostawić
  bez szkody; decyzja w planie.

### `src/db/drafts.js`

`color_scheme` w `INSERT ... ON CONFLICT ... DO UPDATE` i w odczycie (`SELECT *`
już go zwróci).

### `src/db/history.js`

`addHistoryEntry` zapisuje `color_scheme`; `listHistory` dodaje `g.color_scheme`
do `SELECT`.

### `src/db/templates.js`

Bez zmian (`SELECT id, name, poster_key`).

## UI

### `src/components/TemplateSelector.jsx`

- Znika `groupByFamily`. Jedna kafelka na wiersz `templates`, miniatura w
  domyślnym schemacie: `<Component data={{}} scheme={registry[key].schemes?.[0]} />`.
- Pod kafelkami, jeśli wybrany layout ma `schemes.length > 1` — pasek swatchy:
  każdy swatch renderuje `<Component data={{}} scheme={name} />` w skali +
  podpis z `SCHEME_LABELS[name]`. Klik → `onSelectScheme(name)`.
- Nowe propsy: `selectedScheme`, `onSelectScheme`.

### `src/components/PosterPreview.jsx`

Przekazuje `scheme` do `<Component data={data} scheme={scheme} />`.

### `src/components/HistoryList.jsx`

Obok nazwy layoutu pokazuje `SCHEME_LABELS[entry.color_scheme]`, gdy ustawione.

### `src/pages/PosterPreviewPage.jsx` + `src/main.jsx`

- Regex trasy: `^/poster/([^/]+)(?:/([^/]+))?/?$` → `posterKey`, opcjonalny
  `scheme`.
- `/poster/gosc` = domyślny schemat, `/poster/gosc/czern` = wariant.
- Strona renderuje `<Component data={data} scheme={scheme} />`.

### `src/posters/blocks/README.md`

Aktualizacja: sekcja o `schemes.js` i rolach `var(--*)`, przykłady z nowymi
nazwami plików, `/poster/gosc/czern` zamiast `/poster/1h`.

## Ryzyka i obszary otwarte

- **Niejednorodne mapowanie akcentów.** Layouty różnie interpretują „akcent" —
  Gość: `accent` = navy (tekst badge, narożnik); Warsztat: tytuł + wypełnienie
  badge to `accent`, a pills to `accent2`; Wykład: wypełniony badge + nazwa
  prelegenta to `accent2`. Dlatego schemat oferuje **paletę ról**, a nie sztywny
  szablon — każdy `Poster*` sam podpina `var(--accent)` / `var(--accent-2)` /
  `var(--panel)` pod swoje elementy. Gdzie rola nie pasuje → override w
  `schemes.js` lub literał w komponencie.
- **`color-mix` w `html-to-image`.** Eksport polega na tym, że `getComputedStyle`
  zwraca rozwiązany kolor RGB. Do zweryfikowania w kroku eksportu; fallback =
  wpisanie konkretnych wartości deko do schematów zamiast `color-mix`.
- **Miniatury z pustymi danymi.** `resolveScheme(undefined)` musi zwracać `base`
  (już zwraca — `schemes[undefined] ?? {}`).
- **Drobny drift.** Np. nazwa prelegenta w Wykład-zloto: dziś `cream`, po zmianie
  `accent2` (złoto). Akceptowalne wg ustalonej „hybrydy"; korekta przez override
  gdyby raziło.

## Weryfikacja

Brak test runnera w projekcie. Ręcznie:
1. `npm run dev` → `/poster/<layout>/<scheme>` dla każdej pary (8 layoutów ×
   ich schematy) — wizualny przegląd driftu dekoracji względem `git stash` starej
   wersji.
2. W aplikacji: wybór layoutu + swatcha, podgląd na żywo, `Pobierz PNG` —
   sprawdzenie że PNG ma rozwiązane kolory (nie surowe `var(...)` / czerń).
3. Reset IndexedDB (DevTools) → pierwsze uruchomienie buduje 8 szablonów, draft
   i historia działają z `color_scheme`.
4. `npm run build` i `npm run lint` czyste.
