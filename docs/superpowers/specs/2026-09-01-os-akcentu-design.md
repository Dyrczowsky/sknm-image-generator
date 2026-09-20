# Oś akcentu — wybór koloru akcentu obok schematu

## Cel

Dziś kilka schematów per layout różni się **tylko** kolorem akcentu
(`czernZolta` / `czernPomaranczowa` / `czernGranatowa` — to samo czarne tło,
ten sam sygnet negatywny) albo akcentem + sygnetem (`okazjonalnyZloty` /
`okazjonalnySrebrny`). Zamiast mnożyć swatche: **jeden schemat „Czerń" +
osobna kontrolka koloru akcentu** obok paska kolorystyki.

Kontrolka: zawsze widoczna, wyłączona (wyszarzona) dla layoutów bez
„pojedynczego akcentu" (`data` — trzy różnokolorowe trójkąty).

Opcje akcentu: **Domyślny · Żółty · Pomarańczowy · Granatowy · Złoty
(okazjonalny) · Srebrny (okazjonalny)**. Wybór „Złoty"/„Srebrny" dodatkowo
przełącza sygnet SKNM na złoty/srebrny.

„W razie czego wróci się do commita" — akceptowana utrata lokalnego
draftu/historii przy resecie wersji schematu.

## Stan wyjściowy

`src/posters/schemes.ts`:
- `resolveScheme(layoutKey, name?)` → `{ ...baseBlock, ...namedBlock }` → CSS
  vars (`roleToVar`, `NON_CSS = {sygnet, logoVariant}`).
- `schemesFor(layoutKey)` = `Object.keys`.
- `SCHEME_LABELS: Record<string,string>`.
- 8 layoutów. Role „akcentowe" per layout (te, które niosą kolor akcentu):

| Layout | Role akcentowe | Uwagi |
|---|---|---|
| `ogloszenie` | `accent` | |
| `gosc` | `accent` | + `sygnetBg` gdy metal (złoto/srebro na trójkącie = niewidoczne bez tego) |
| `wyklad` | `badgeFill` `badgeText` `speaker` `chips` | `washTop`/`wedge*` stałe w bloku `czern` |
| `konferencja` | `headerBadge` `lineFirst` `footerBadge` | `lineRest` stała rgba w `czern` |
| `rekrutacja` | `band` `footerText` `badgeColor` `qrBorder` `qrText` | jasne bandy → `logoVariant: 'light'`, ciemne → `'dark'` |
| `warsztat` | `badgeFill` `badgeText` `pillFill` `pillText` | `title` = `cream` stałe w `czern` |
| `gala` | `gold` (nazwa roli) | akcent steruje całą identyfikacją Gali |
| `data` | `tri1`/`tri2`/`tri3` (wielokolorowe) | **BEZ recepty — kontrolka wyłączona** |

`src/components/SchemeSelector.tsx` — pasek swatchy (przyciski z miniaturą
plakatu), `if (schemeList.length <= 1) return null`.

`src/App.tsx` — `selectedScheme: string | undefined`, `handleSelectScheme`,
`persistDraft(form, templateId, schemeName)`, `defaultSchemeFor`.

`src/db/schema.ts` — `SCHEMA_VERSION = 4`, `resetIfStale` zrzuca tabele przy
starszej wersji. `draft.color_scheme` / `generated_images.color_scheme` TEXT.

## Architektura

### `AccentName`

`src/types.ts`:
```ts
export type AccentName = 'zolty' | 'pomaranczowy' | 'granatowy' | 'zloty' | 'srebrny'
```

### Recepty akcentu — `src/posters/schemes.ts`

```ts
// Recepta zwraca nadpisania ról „akcentowych" danego layoutu dla wybranego
// koloru akcentu. `ctx` = blok już scalony (baza + nazwany schemat), żeby
// recepta mogła zależeć od tła (granat: navyLight na ciemnym, navy na jasnym).
type AccentRecipe = (accent: AccentName, ctx: SchemeBlock) => SchemeBlock

const DARK_BGS = new Set<string>([colors.black, colors.ink, colors.navy, colors.inkPanel, colors.navyDark])

// Kolor „granatowego" akcentu zależy od tła; reszta jest stała.
function accentColor(accent: AccentName, ctx: SchemeBlock): string {
  switch (accent) {
    case 'zolty': return colors.lime
    case 'pomaranczowy': return colors.coral
    case 'granatowy': return DARK_BGS.has(ctx.pageBg ?? '') ? colors.navyLight : colors.navy
    case 'zloty': return colors.gold
    case 'srebrny': return colors.silver
  }
}

// Tekst na wypełnionej plakietce/pigułce w kolorze akcentu — TYLKO dla
// nie-metali. Sparowany tekst dla złota/srebra różni się per layout
// (wyklad: cream/ink, warsztat: ink/ink), więc recepty podają go jawnie.
function accentText(accent: 'zolty' | 'pomaranczowy' | 'granatowy'): string {
  return accent === 'zolty' ? colors.limeText : colors.cream
}

// Recepta dokłada sygnet tylko dla metali; dla żółty/pomarańczowy/granatowy
// zostawia sygnet ze schematu.
function accentSygnet(accent: AccentName): Partial<SchemeBlock> {
  if (accent === 'zloty') return { sygnet: 'zloty' }
  if (accent === 'srebrny') return { sygnet: 'srebrny' }
  return {}
}

const accentRecipes: Record<string, AccentRecipe | undefined> = {
  ogloszenie: (a, ctx) => ({ accent: accentColor(a, ctx), ...accentSygnet(a) }),

  gosc: (a, ctx) => ({
    accent: accentColor(a, ctx),
    ...accentSygnet(a),
    // złoto/srebro na trójkącie zniknęłoby pod złotym/srebrnym sygnetem —
    // ciemna podkładka trójkąta tylko wtedy.
    ...((a === 'zloty' || a === 'srebrny') && { sygnetBg: colors.navy }),
  }),

  wyklad: (a, ctx) => {
    const c = accentColor(a, ctx)
    const t = a === 'zloty' ? colors.cream : a === 'srebrny' ? colors.ink : accentText(a)
    return { badgeFill: c, badgeText: t, speaker: c, chips: c, ...accentSygnet(a) }
  },

  konferencja: (a, ctx) => {
    const c = accentColor(a, ctx)
    return { headerBadge: c, lineFirst: c, footerBadge: c, ...accentSygnet(a) }
  },

  warsztat: (a, ctx) => {
    const c = accentColor(a, ctx)
    const t = a === 'zloty' || a === 'srebrny' ? colors.ink : accentText(a)
    return { badgeFill: c, badgeText: t, pillFill: c, pillText: t, ...accentSygnet(a) }
  },

  rekrutacja: (a, ctx) => {
    const c = accentColor(a, ctx)
    const lightBand = a === 'zolty' || a === 'pomaranczowy' || a === 'zloty' || a === 'srebrny'
    return {
      band: c,
      footerText: a === 'srebrny' || a === 'zloty' ? colors.ink : lightBand ? colors.limeText : colors.cream,
      badgeColor: a === 'srebrny' ? colors.ink : lightBand ? colors.black : colors.cream,
      qrBorder: lightBand ? 'rgba(18,18,18,.4)' : 'rgba(244,242,237,.55)',
      qrText: lightBand ? 'rgba(18,18,18,.6)' : 'rgba(244,242,237,.75)',
      logoVariant: lightBand ? 'light' : 'dark',
      ...accentSygnet(a),
    }
  },

  gala: (a, ctx) => ({
    gold: accentColor(a, ctx),
    sygnet: a === 'zloty' ? 'zloty' : a === 'srebrny' ? 'srebrny' : 'negatywny',
  }),

  data: undefined,
}
```

> Recepty są autorskie **przede wszystkim pod kontekst ciemny** (`czern`).
> Kombinacje akcent × schemat na jasnym tle (`jasny`/`szary`/`limonka`/
> `default`-kremowy) mogą wymagać dostrojenia — patrz „Weryfikacja".
> `rekrutacja.limonka` + `żółty` (limonkowa banda na limonkowej stronie) to
> znany słaby przypadek do rozpatrzenia w przeglądzie renderów.

### Resolver

```ts
export function resolveScheme(
  layoutKey: string,
  name: string | undefined,
  accent?: AccentName,
): ResolvedScheme {
  const layout = schemes[layoutKey] ?? {}
  const merged: SchemeBlock = { ...baseBlock(layout), ...(name ? layout[name] ?? {} : {}) }
  const recipe = accentRecipes[layoutKey]
  const withAccent: SchemeBlock = accent && recipe ? { ...merged, ...recipe(accent, merged) } : merged
  const cssVars: Record<`--${string}`, string> = {}
  for (const [k, v] of Object.entries(withAccent)) {
    if (v !== undefined && !NON_CSS.has(k)) cssVars[roleToVar(k)] = v
  }
  return { cssVars, sygnet: withAccent.sygnet, logoVariant: withAccent.logoVariant }
}
```

`accent` **undefined = brak nakładki** → schemat renderuje się jak dziś.

### `accentsFor`

```ts
export const ACCENT_NAMES: AccentName[] = ['zolty', 'pomaranczowy', 'granatowy', 'zloty', 'srebrny']

// Puste = kontrolka akcentu wyłączona dla tego layoutu.
export function accentsFor(layoutKey: string): AccentName[] {
  return accentRecipes[layoutKey] ? ACCENT_NAMES : []
}

export const ACCENT_LABELS: Record<AccentName, string> = {
  zolty: 'Żółty',
  pomaranczowy: 'Pomarańczowy',
  granatowy: 'Granatowy',
  zloty: 'Złoty (okazjonalny)',
  srebrny: 'Srebrny (okazjonalny)',
}

// Kolor kropki w kontrolce (podgląd akcentu).
export const ACCENT_DOT: Record<AccentName, string> = {
  zolty: colors.lime, pomaranczowy: colors.coral, granatowy: colors.navy,
  zloty: colors.gold, srebrny: colors.silver,
}
```

## Zmiany w blokach schematów — `src/posters/schemes.ts`

Dla **6 layoutów** (`ogloszenie`, `gosc`, `wyklad`, `konferencja`,
`rekrutacja`, `warsztat`):

- **Usuń** `czernZolta`, `czernPomaranczowa`, `czernGranatowa`,
  `okazjonalnyZloty`, `okazjonalnySrebrny`.
- **Dodaj** jeden `czern` = dotychczasowy `czernZolta` tego layoutu
  (czarne/ciemne tło, akcent żółty wbudowany, sygnet negatywny, dark logo,
  `mutedText` itd.). To „domyślny" wygląd Czerni; recepta daje warianty.
- Kolejność kluczy: `default` (lub `limonka`), `czern`, `jasny`, `szary`.

**`gala`:**
- Był: `okazjonalnyZloty`, `okazjonalnySrebrny`.
- Jest: jeden `default` = dotychczasowy `okazjonalnyZloty` (ink, `gold: gold`,
  sygnet zloty, dark). Recepta `gala` daje warianty akcentu.

**`data`:** bez zmian (6 schematów, brak recepty).

**Konsekwencja (zaakceptowana):** w `ogloszenie`/`gosc`/`konferencja`/
`warsztat` dotychczasowy `okazjonalnyZloty` miał inne tło niż czerń
(navy/ink). Po zmianie „Czerń + akcent złoty" = to samo ciemne tło co
`czern` (czarne). Te layouty tracą złoty wariant na navy/ink.

## `SCHEME_LABELS`

Usuń `czernZolta`, `czernPomaranczowa`, `czernGranatowa`, `okazjonalnyZloty`,
`okazjonalnySrebrny`. Zostaje:
```ts
{ default: 'Granat', limonka: 'Limonka', czern: 'Czerń', jasny: 'Jasny', szary: 'Szary' }
```
(`data` nadal ma `okazjonalnyZloty`/`okazjonalnySrebrny` jako klucze — dopisz
je z powrotem albo zostaw „surowy klucz" na swatchu Daty. **Decyzja:**
zostawiamy `okazjonalnyZloty: 'Okazjonalny złoty'`, `okazjonalnySrebrny:
'Okazjonalny srebrny'` w `SCHEME_LABELS` — używa ich tylko Data.)

## UI — `src/components/SchemeSelector.tsx`

Pod paskiem swatchy nowy blok „Akcent":
- Zawsze renderowany (nawet gdy `accentsFor` puste).
- Rządek: opcja **„Domyślny"** (bez kropki) + 5 kropek koloru z `ACCENT_DOT`,
  podpisy/tooltipy z `ACCENT_LABELS`.
- Zaznaczony = `selectedAccent ?? 'domyślny'`.
- `disabled` gdy `accentsFor(posterKey).length === 0` → wyszarzone +
  hint „Ten szablon nie ma wariantów akcentu".
- Klik → `onSelectAccent(name | undefined)`.

Props: `+ selectedAccent?: AccentName`, `+ onSelectAccent: (a: AccentName | undefined) => void`.

`PosterProps` (`src/types.ts`) i wszystkie `Poster*` + `PosterPreview` +
`SchemeSelector` swatche: przekazać `accent` obok `scheme`. Każdy
`Poster*` woła `resolveScheme(layout, scheme, accent)`.

```ts
export interface PosterProps { data: RawPosterData; scheme?: string; accent?: AccentName }
```

## `src/App.tsx`

- `const [selectedAccent, setSelectedAccent] = useState<AccentName | undefined>(undefined)`
- `handleSelectAccent(a)` → set + `persistDraft(form, templateId, selectedScheme, a)`
- `handleSelectScheme` / `handleSelectTemplate` / restore z historii — czyszczą
  albo ustawiają `selectedAccent` z zapisu.
- `persistDraft` + `addHistoryEntry` — `color_scheme` kodowane:
  `encodeScheme(scheme, accent)` = `accent ? \`${scheme}~${accent}\` : scheme`.
- Odczyt: `decodeScheme(raw)` → `{ scheme, accent }` (`raw.split('~')`,
  walidacja `accent` względem `ACCENT_NAMES`).
- `<PosterPreview ... accent={selectedAccent} />`, `<SchemeSelector ... selectedAccent onSelectAccent />`.

## Persystencja / migracja — `src/db/schema.ts`

Kodowanie `~akcent` mieści się w istniejącej kolumnie TEXT — **bez zmiany
kształtu tabel**. Ale stare klucze schematów (`czernZolta`, …) w zapisanym
draftcie/historii przestają istnieć → `resolveScheme` spadłby do bazy.
Dlatego: **`SCHEMA_VERSION` 4 → 5**, `resetIfStale` czyści draft/historię
przy starcie (precedens v4). Komentarz: `v5: oś akcentu — usunięte klucze
czernZolta/okazjonalny* z niektórych layoutów`.

(Alternatywa odrzucona: layout-aware remap starych kluczy przy odczycie —
kruche, a dane i tak deklarowane jako zbywalne.)

## Testy — `src/posters/schemes.test.ts`

- Przepisz asercje `czernZolta`/`czernPomaranczowa`/… → `resolveScheme(layout, 'czern', <accent>)`.
- **Invariant (rozszerzony):** dla każdego layoutu × każdego schematu ×
  `[undefined, ...ACCENT_NAMES]`: wartość `=== colors.gold` ⇒ `sygnet === 'zloty'`;
  `=== colors.silver` ⇒ `sygnet === 'srebrny'`.
- **Invariant:** dla każdego layoutu × schematu × akcentu — `sygnet` prawdziwy,
  `logoVariant ∈ {light,dark}`, `cssVars` niepuste.
- `accentsFor('data') === []`; `accentsFor('wyklad').length === 5`.
- `resolveScheme('wyklad', 'czern', 'pomaranczowy').cssVars['--badge-fill'] === colors.coral`.
- `resolveScheme('wyklad', 'czern', 'zloty').sygnet === 'zloty'`.
- `resolveScheme('gala', 'default', 'granatowy')` — `--gold` = navyLight/navy, sygnet negatywny.
- `resolveScheme('ogloszenie', 'jasny', 'granatowy').cssVars['--accent'] === colors.navy` (jasne tło → navy nie navyLight).
- `encodeScheme` / `decodeScheme` round-trip; `decodeScheme('czern~bzdura')` → `{ scheme: 'czern', accent: undefined }`.

## Dokumentacja

`docs/dodawanie-schematu-kolorow.md` + `docs/architektura.md` — dopisać oś
akcentu (recepta per layout, `resolveScheme` 3. parametr, `accentsFor`).
`docs/dodawanie-szablonu.md` — nowy layout może dodać wpis w `accentRecipes`
albo zostawić `undefined` (kontrolka wyłączona).

## Pliki

| Plik | Zmiana |
|---|---|
| `src/types.ts` | `+ AccentName`, `PosterProps.accent?` |
| `src/posters/schemes.ts` | recepty, `resolveScheme` 3. param, `accentsFor`/`ACCENT_*`, przebudowa 6 bloków + gala, `SCHEME_LABELS` |
| `src/posters/schemes.test.ts` | przepisane asercje + rozszerzone invarianty + `encode/decodeScheme` |
| `src/utils/colorScheme.ts` (nowy) | `encodeScheme` / `decodeScheme` (czyste, testowalne) |
| `src/components/SchemeSelector.tsx` | blok „Akcent" |
| `src/App.tsx` | stan `selectedAccent`, montaż, kodowanie w draft/historii |
| `src/components/PosterPreview.tsx` | przekazuje `accent` |
| `src/posters/Poster*.tsx` (8) | `resolveScheme(layout, scheme, accent)` |
| `src/db/schema.ts` | `SCHEMA_VERSION` 5 + komentarz |
| `docs/*` | oś akcentu |

## Weryfikacja

- `npm test` / `npm run typecheck` / `npm run lint` / `npm run build` — zielone.
- **Przegląd renderów na żywo (Twój):** dla layoutów z receptą przejść
  `Czerń` × 5 akcentów, oraz `default`/`jasny`/`szary`/`limonka` × akcenty —
  kontrast, sparowany tekst plakietek, czytelność sygnetu (metal na trójkącie
  Gościa), `logoVariant` na bandach Rekrutacji, `limonka` + żółty/granatowy,
  Gala × 5. Dostroić recepty tam, gdzie kombinacja wygląda źle.
- Kontrolka akcentu wyszarzona przy szablonie „Data".

## Poza zakresem

- Osobny akcent per element (to robi „nadpisania kolorów" / `FormColorField`).
- Akcent w URL-u podglądu (`/poster/:key/:scheme`) — można dołożyć `?accent=`
  w follow-upie; teraz podgląd bez akcentu.
- Dostrojenie każdej kombinacji akcent × jasny-schemat w tym zadaniu —
  mechanizm + recepty pod ciemny kontekst; jasny kontekst tuning w przeglądzie.
- Enum `RoleType` z `akcent-schemat-wip` — nieużywany, gałąź zostaje osobno.

## Ryzyka

- Powierzchnia kombinatoryczna (~7 layoutów × ~4 schematy × 5 akcentów) —
  mechanizm deterministyczny, ale wygląd części kombinacji do dostrojenia.
- Utrata złotego tła navy/ink w 4 layoutach (świadome).
- Reset lokalnego draftu/historii przy starcie po deployu.
- `PosterProps.accent` dotyka wszystkich 8 komponentów plakatów +
  miniatur/podglądu — szeroka, ale mechaniczna zmiana.
