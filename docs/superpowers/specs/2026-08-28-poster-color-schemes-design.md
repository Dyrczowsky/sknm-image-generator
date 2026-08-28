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
edycji pliku. Wybór koloru = przekazanie nazwy schematu; brakujące role spadają
na schemat `default` **tego layoutu**.

## Model

### Schematy kolorów — `src/posters/schemes.js` (nowy)

Kolory są **zależne od layoutu** (patrz „Ryzyka" — „Granat" Wykładu to biały
tekst na granacie, „Granat" Warsztatu to granatowy tekst na kremie). Dlatego
`schemes.js` jest **zagnieżdżony per layout**: każdy layout ma komplet swoich
ról w bloku `default` + nazwane schematy nadpisujące tylko to, co się różni.
Kolory dekoracji (trójkąty, kliny, tła `rgba`) wpisane **wprost** przy każdym
schemacie — pełna wierność, bez `color-mix`.

```js
import { colors } from './theme'

// Każdy layout: `default` = pełny zestaw ról tego layoutu; nazwane schematy
// nadpisują tylko różnice. Role są dowolne per layout — patrz plan implementacji
// po dokładne tabele ról i wartości wyciągnięte z dzisiejszych wariantów.
const wyklad = {
  default: {
    pageBg: colors.navy, pageText: colors.cream, mutedText: colors.cream,
    badgeFill: colors.lime, badgeText: colors.limeText,
    speaker: colors.lime, chips: colors.lime,
    washTop: 'rgba(255,255,255,.055)', wedgeBr: colors.navyLight, wedgeBl: colors.navyDark,
    sygnet: 'negatywny', logoVariant: 'dark',
  },
  zloto: { badgeFill: colors.gold, badgeText: colors.cream, speaker: colors.cream,
           chips: colors.gold, sygnet: 'zloty' },
  czern: { pageBg: colors.black, badgeFill: colors.gold, badgeText: colors.cream,
           speaker: colors.gold, chips: colors.gold,
           washTop: 'rgba(255,255,255,.04)', wedgeBr: '#1E1E1E', wedgeBl: '#0A0A0A',
           sygnet: 'zloty' },
  jasny: { pageBg: colors.cream, pageText: colors.limeText, mutedText: colors.textMuted,
           badgeFill: colors.navy, badgeText: colors.cream, speaker: colors.navy,
           chips: colors.navy, washTop: 'rgba(60,69,155,.05)',
           wedgeBr: '#E2DED3', wedgeBl: '#DAD5C8', sygnet: 'granat', logoVariant: 'light' },
  szary: { pageBg: colors.paper, pageText: colors.slate, mutedText: colors.textMuted,
           badgeFill: colors.grayDark, badgeText: colors.cream, speaker: colors.grayDark,
           chips: colors.gray, washTop: 'rgba(138,141,143,.08)',
           wedgeBr: '#D8D4CA', wedgeBl: '#CFCAC0', sygnet: 'szary', logoVariant: 'light' },
}

const gosc = { /* … */ }
// warsztat, data, konferencja, rekrutacja, gala, ogloszenie — analogicznie

export const schemes = { wyklad, gosc, warsztat, data, konferencja, rekrutacja, gala, ogloszenie }

// camelCase → --kebab, żeby layout mógł dodać dowolną rolę bez zmiany resolvera.
const roleToVar = (k) => '--' + k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
const NON_CSS = new Set(['sygnet', 'logoVariant'])

export function resolveScheme(layoutKey, name) {
  const layout = schemes[layoutKey] ?? {}
  const merged = { ...(layout.default ?? {}), ...(layout[name] ?? {}) }
  const cssVars = {}
  for (const [k, v] of Object.entries(merged)) {
    if (!NON_CSS.has(k)) cssVars[roleToVar(k)] = v
  }
  return { cssVars, sygnet: merged.sygnet, logoVariant: merged.logoVariant }
}

export const SCHEME_LABELS = {
  default: 'Granat', limonka: 'Limonka', czern: 'Czerń',
  zloto: 'Złoto', jasny: 'Jasny', szary: 'Szary',
}
```

Dokładne tabele ról i wartości per layout (wyciągnięte z dzisiejszych par
wariantów: bazowy vs `*Czern` / `*Zloto` / `*Jasny` / `*Szary` oraz `1h`–`1k`
dla Wykładu) są w planie implementacji — po jednej tabeli na task layoutu.
Powyższy `wyklad` to gotowy wzór.

Poster zna swój klucz layoutu, więc woła `resolveScheme('wyklad', scheme)`.

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

Każdy `Poster*` na górze (przykład Wykład):

```jsx
export function PosterWyklad({ data, scheme }) {
  const { title, /* … */ } = withPlaceholders(data)
  const s = resolveScheme('wyklad', scheme)
  return (
    <PosterFrame vars={s.cssVars} padding={72}>
      {/* colors.navy → 'var(--page-bg)', colors.lime → 'var(--badge-fill)' / 'var(--speaker)' / 'var(--chips)' wg roli */}
      <img src={sygnetByName[s.sygnet]} alt="SKNM" />
      <Badge background="var(--badge-fill)" color="var(--badge-text)">{badge || 'WYKŁAD OTWARTY'}</Badge>
      <div style={{ color: 'var(--speaker)' }}>{speaker}</div>
      <LogoSlot logo={logos.pk} variant={s.logoVariant} />
      <div style={{ background: 'var(--wedge-bl)', /* clip-path */ }} />
    </PosterFrame>
  )
}
```

- **Bloki (`Badge`, `InfoLine`, `BigDateNumber`, `BrandingText`, `LogoRow`,
  `LogoSlot`, `PlaceholderBox`) — bez zmian.** Dostają string `"var(--badge-fill)"`
  zamiast hexa. `getComputedStyle` rozwiązuje go przy renderze i przy eksporcie
  (`html-to-image` inline'uje już rozwiązany kolor RGB).
- `src/posters/logos.js` — nowa mapa `sygnetByName = { negatywny, granat, zloty,
  szary, czarny }`.
- Wartości stałe między schematami (np. koralowa plakietka z datą w Gość/Data:
  `colors.coral` / `colors.cream`) zostają literałami z `theme.js`. Promocja do
  roli w `schemes.js` dopiero gdy jakiś schemat naprawdę chce je zmienić (YAGNI).
- Dekoracje (trójkąty Wykładu `#1E1E1E`/`#0A0A0A`, kliny stopki, tła `rgba(...)`)
  dostają **własne role** w schemacie danego layoutu z konkretną wartością per
  schemat (`wedgeBl`, `washTop`, …). Bez `color-mix` — pełna wierność 1:1.

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

Layout bez `schemes` (Gala) renderuje się z `resolveScheme('gala', undefined)` →
`schemes.gala.default` i nie pokazuje paska kolorów. `schemes.gala` ma tylko
blok `default`.

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
  domyślnym schemacie: `<Component data={{}} scheme={registry[poster_key].schemes?.[0]} />`.
- Pod kafelkami, jeśli wybrany layout ma `schemes` z >1 pozycją — pasek swatchy:
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

- **Kolory zależne od layoutu.** „Granat" Wykładu = biały tekst na granacie;
  „Granat" Warsztatu = granat na kremie. „Jasny" = `cream` dla Wykładu/Ogłoszenia,
  `paper` dla reszty. Wypełniona plakietka „czerń": tekst `cream` (Wykład) vs
  `czarny` (Warsztat), oba na złocie. Dlatego `schemes.js` jest zagnieżdżony per
  layout — każdy layout ma pełny `default` + własne role. Zero prób uwspólnienia
  na siłę. Cena: powtórzenia w `schemes.js` (ta sama czerń tła w 8 blokach
  `czern`), ale każda zmiana ma jedno oczywiste miejsce.
- **Nazwy ról per layout.** Każdy layout deklaruje swoje role (`badgeFill`,
  `speaker`, `wedgeBl`, `panel`, `line`, `pillFill`…). Plan implementacji ma
  tabelę ról dla każdego z 8 layoutów, wyciągniętą z par wariantów. Wspólny rdzeń:
  `pageBg`, `pageText`, `mutedText`.
- **`resolveScheme` w `html-to-image`.** Eksport polega na tym, że
  `getComputedStyle` zwraca rozwiązany kolor RGB dla `var(--x)`. Do sprawdzenia
  w kroku eksportu (Task „PNG"); wartości ról są konkretnymi hexami/rgba, więc
  ryzyko małe.
- **Miniatury z pustymi danymi / Gala.** `resolveScheme('gala', undefined)` musi
  zwracać `schemes.gala.default` (zwraca — `layout[undefined] ?? {}`).

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
