# Oś akcentu — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zamiast osobnych schematów różniących się tylko akcentem (`czernZolta`/`czernPomaranczowa`/`czernGranatowa`, `okazjonalnyZloty`/`okazjonalnySrebrny`) — jeden schemat „Czerń" + kontrolka koloru akcentu (Domyślny / Żółty / Pomarańczowy / Granatowy / Złoty / Srebrny) obok paska kolorystyki.

**Architecture:** `resolveScheme` dostaje 3. parametr `accent?`. Każdy layout ma `AccentRecipe` (funkcja `(accent, ctx) => nadpisania ról akcentowych`), pobieraną z mapy `accentRecipes`; `data` ma `undefined` → kontrolka wyłączona. Recepta dla `zloty`/`srebrny` dokłada `sygnet`. Akcent kodowany w istniejącej kolumnie `color_scheme` jako `"<schemat>~<akcent>"` (helper `encodeScheme`/`decodeScheme`); `SCHEMA_VERSION` bump czyści stare, nieistniejące już klucze.

**Tech Stack:** React 19 + TS, Vite 8, Vitest 4 (`environment: 'node'`, `include: src/**/*.test.ts`), Tailwind v4, oxlint, sql.js.

**Spec:** `docs/superpowers/specs/2026-09-01-os-akcentu-design.md`

## Global Constraints

- `AccentName = 'zolty' | 'pomaranczowy' | 'granatowy' | 'zloty' | 'srebrny'` (w `src/types.ts`).
- Invariant (test): dla każdego layout × schemat × `[undefined, ...ACCENT_NAMES]` — wartość cssVar `=== colors.gold` ⇒ `sygnet === 'zloty'`; `=== colors.silver` ⇒ `sygnet === 'srebrny'`.
- Invariant (test): każdy taki resolve zwraca prawdziwy `sygnet`, `logoVariant ∈ {'light','dark'}`, niepusty `cssVars`.
- `accent` undefined w `resolveScheme` = brak nakładki (schemat renderuje się jak dziś).
- `granatowy` akcent: `colors.navyLight` na ciemnym tle (`DARK_BGS`), `colors.navy` na jasnym.
- `accentRecipes.data === undefined` → `accentsFor('data') === []` → kontrolka wyłączona.
- Kodowanie `color_scheme`: `accent ? \`${scheme}~${accent}\` : scheme`. Dekodowanie waliduje akcent względem `ACCENT_NAMES` (nieznany → `undefined`).
- Bloki `czern` = dotychczasowy `czernZolta` danego layoutu (żółty akcent wbudowany = „Domyślny" wygląd Czerni).
- Utrata złotego tła navy/ink w `ogloszenie`/`gosc`/`konferencja`/`warsztat` (świadome — „Czerń + złoty" ma czarne tło).
- `data` bez zmian w blokach (6 schematów).
- Polski, pełna ortografia. Komponenty bez testów (konwencja repo). Testowane: `schemes.ts`, `colorScheme.ts`.
- `npm test` / `npm run typecheck` / `npm run lint` / `npm run build` — zielone.
- Commity po polsku + stopka:
  ```
  Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_012PMGNREmRTX2LiLpQzTm6q
  ```
- Branch: `akcent-os` (utworzony z `main`, spec zacommitowany `a2b0f56`).

## Stan wyjściowy (fakty z kodu)

- `src/posters/schemes.ts`: `resolveScheme(layoutKey, name?)` → `{ ...baseBlock, ...layout[name] }` → cssVars (`roleToVar`, `NON_CSS = new Set(['sygnet','logoVariant'])`). `baseBlock` = `layout.default ?? layout[Object.keys(layout)[0]] ?? {}`. `schemesFor` = `Object.keys`. `SCHEME_LABELS`.
- 8 layoutów. Klucze dziś: `ogloszenie/gosc/wyklad/konferencja/warsztat` mają `default, czernZolta, czernPomaranczowa, czernGranatowa, okazjonalnyZloty, okazjonalnySrebrny, jasny, szary`; `rekrutacja` to samo z `limonka` zamiast `default` (baza = pierwszy klucz); `data` ma `default, czern, okazjonalnyZloty, okazjonalnySrebrny, jasny, szary`; `gala` ma `okazjonalnyZloty, okazjonalnySrebrny`.
- Role akcentowe: `ogloszenie/gosc` → `accent`; `wyklad` → `badgeFill/badgeText/speaker/chips`; `konferencja` → `headerBadge/lineFirst/footerBadge`; `rekrutacja` → `band/footerText/badgeColor/qrBorder/qrText/logoVariant`; `warsztat` → `badgeFill/badgeText/pillFill/pillText`; `gala` → `gold`.
- `gosc.okazjonalny*` mają `sygnetBg: colors.navy` (żeby metaliczny sygnet nie zniknął na metalicznym trójkącie — `PosterGosc` rysuje sygnet w `var(--sygnet-bg, var(--accent))`).
- `src/types.ts`: `PosterProps { data: RawPosterData; scheme?: string }`. `DraftRow.color_scheme: string | null`, `HistoryRow.color_scheme: string | null`.
- `src/components/SchemeSelector.tsx`: `if (schemeList.length <= 1 || !SwatchComponent) return null`. Props `{ poster, posterKey, selectedScheme, onSelectScheme }`.
- `src/components/PosterPreview.tsx`: renderuje `<Component data={data} scheme={scheme} />`.
- `src/pages/PosterPreviewPage.tsx`: `<Component data={data} scheme={scheme} />` (bez akcentu — poza zakresem).
- `src/components/HistoryList.tsx:48`: `SCHEME_LABELS[entry.color_scheme] ?? entry.color_scheme` w podpisie.
- `src/App.tsx`: `selectedScheme` state; `persistDraft(form, templateId, schemeName)` → `saveDraft(..., color_scheme: schemeName ?? null)`; `handleSelectScheme(name)`; `handleSelectTemplate` → `defaultSchemeFor(id)`; `handleRestoreHistoryEntry` → `entry.color_scheme ?? defaultSchemeFor(...)`; `addHistoryEntry(..., color_scheme: selectedScheme)`; render `<PosterPreview ... scheme={selectedScheme} />` i `<SchemeSelector ... />`. `App` ma już `import { SCHEME_LABELS } from './posters/schemes'` (bugContext ticketów) i `schemeKey`/`schemeLabel` w `bugContext`.
- `src/db/schema.ts`: `SCHEMA_VERSION = 4`. `schema.test.ts` używa `SCHEMA_VERSION` symbolicznie (bump nie wymaga zmiany testu).
- `db/drafts.ts` / `db/history.ts`: `color_scheme` to zwykły string, przepływa bez parsowania.

## File Structure

| Plik | Zmiana | Task |
|---|---|---|
| `src/types.ts` | `+ AccentName`; `PosterProps.accent?` | 1, 3 |
| `src/posters/schemes.ts` | recepty, `resolveScheme` 3. param, `accentsFor`/`ACCENT_*`, przebudowa 7 bloków, `SCHEME_LABELS` | 1 |
| `src/posters/schemes.test.ts` | przepisane asercje + rozszerzone invarianty | 1 |
| `src/utils/colorScheme.ts` (nowy) | `encodeScheme` / `decodeScheme` | 2 |
| `src/utils/colorScheme.test.ts` (nowy) | testy kodowania | 2 |
| `src/posters/PosterOgloszenie.tsx` … `PosterWarsztat.tsx` (8) | `resolveScheme(layout, scheme, accent)` | 3 |
| `src/components/PosterPreview.tsx` | przekazuje `accent` | 3 |
| `src/components/SchemeSelector.tsx` | blok „Akcent" | 4 (A) |
| `src/App.tsx` | `selectedAccent`, montaż, kodowanie w draft/historii, restore | 4 (B) |
| `src/components/HistoryList.tsx` | podpis z dekodowanym schematem+akcentem | 4 (B) |
| `src/db/schema.ts` | `SCHEMA_VERSION` 5 + komentarz | 4 (B) |
| `docs/dodawanie-schematu-kolorow.md`, `docs/architektura.md` | oś akcentu | 1, 4 (B) |

---

## Task 1: `schemes.ts` — recepty akcentu, resolver, przebudowa bloków

**Files:**
- Modify: `src/types.ts` (`+ AccentName`)
- Modify: `src/posters/schemes.ts`
- Modify: `src/posters/schemes.test.ts`
- Modify: `docs/dodawanie-schematu-kolorow.md`

**Interfaces:**
- Produces:
  - `src/types.ts`: `export type AccentName = 'zolty' | 'pomaranczowy' | 'granatowy' | 'zloty' | 'srebrny'`
  - `src/posters/schemes.ts`:
    - `export const ACCENT_NAMES: AccentName[]`
    - `export const ACCENT_LABELS: Record<AccentName, string>`
    - `export const ACCENT_DOT: Record<AccentName, string>`
    - `export function accentsFor(layoutKey: string): AccentName[]`
    - `export function resolveScheme(layoutKey: string, name: string | undefined, accent?: AccentName): ResolvedScheme` (3. parametr dodany, sygnatura wstecznie zgodna)
    - `resolveScheme`/`schemesFor`/`SCHEME_LABELS` — pozostałe bez zmian sygnatury
    - klucze schematów po zmianie: `ogloszenie/gosc/wyklad/konferencja/warsztat` = `default, czern, jasny, szary`; `rekrutacja` = `limonka, czern, jasny, szary`; `gala` = `default`; `data` = `default, czern, okazjonalnyZloty, okazjonalnySrebrny, jasny, szary` (bez zmian)
- Consumes: nic

- [ ] **Step 1: `AccentName` w `src/types.ts`**

Obok `SygnetName` / `LogoVariant` (sekcja „--- Schematy kolorów ---"):
```ts
export type AccentName = 'zolty' | 'pomaranczowy' | 'granatowy' | 'zloty' | 'srebrny'
```

- [ ] **Step 2: Przepisz `src/posters/schemes.test.ts` (test najpierw — poleci)**

Zastąp cały plik:

```ts
import { describe, expect, it } from 'vitest'
import {
  ACCENT_LABELS,
  ACCENT_NAMES,
  SCHEME_LABELS,
  accentsFor,
  resolveScheme,
  schemes,
  schemesFor,
} from './schemes'
import { colors } from './theme'
import type { AccentName } from '../types'

describe('resolveScheme — baza (bez akcentu)', () => {
  it('nieznany layout/schemat → pusty wynik', () => {
    const s = resolveScheme('nieistnieje', 'tez-nie')
    expect(s.cssVars).toEqual({})
    expect(s.sygnet).toBeUndefined()
    expect(s.logoVariant).toBeUndefined()
  })

  it('roleToVar: camelCase → --kebab, NON_CSS pomijane', () => {
    schemes.__probe = { default: { pageBg: '#000', badgeFill: '#111', tri1: '#333', logoVariant: 'dark' } }
    const s = resolveScheme('__probe', undefined)
    expect(s.cssVars['--page-bg']).toBe('#000')
    expect(s.cssVars['--badge-fill']).toBe('#111')
    expect(s.cssVars['--tri1']).toBe('#333')
    expect(s.cssVars['--logo-variant']).toBeUndefined()
    expect(s.logoVariant).toBe('dark')
    delete schemes.__probe
  })

  it('Ogłoszenie: default + czern + jasny + szary', () => {
    expect(schemesFor('ogloszenie')).toEqual(['default', 'czern', 'jasny', 'szary'])
    const d = resolveScheme('ogloszenie', undefined)
    expect(d.cssVars['--page-bg']).toBe(colors.navy)
    expect(d.cssVars['--accent']).toBe(colors.lime)
    const cz = resolveScheme('ogloszenie', 'czern')
    expect(cz.cssVars['--page-bg']).toBe(colors.black)
    expect(cz.cssVars['--accent']).toBe(colors.lime)          // żółty wbudowany
    expect(cz.cssVars['--page-text']).toBe(colors.cream)      // z default
    expect(cz.sygnet).toBe('negatywny')
    expect(cz.logoVariant).toBe('dark')
  })

  it('Gala: jeden schemat default (ink, złoto, sygnet zloty)', () => {
    expect(schemesFor('gala')).toEqual(['default'])
    const d = resolveScheme('gala', undefined)
    expect(d.cssVars['--page-bg']).toBe(colors.ink)
    expect(d.cssVars['--gold']).toBe(colors.gold)
    expect(d.sygnet).toBe('zloty')
  })

  it('Data: bez zmian, 6 schematów', () => {
    expect(schemesFor('data')).toEqual(['default', 'czern', 'okazjonalnyZloty', 'okazjonalnySrebrny', 'jasny', 'szary'])
    expect(resolveScheme('data', 'okazjonalnyZloty').cssVars['--tri1']).toBe(colors.gold)
    expect(resolveScheme('data', 'okazjonalnyZloty').sygnet).toBe('zloty')
  })

  it('Rekrutacja: baza limonka, klucze limonka/czern/jasny/szary', () => {
    expect(schemesFor('rekrutacja')).toEqual(['limonka', 'czern', 'jasny', 'szary'])
    expect(resolveScheme('rekrutacja', 'limonka').cssVars['--band']).toBe(colors.navy)
    expect(resolveScheme('rekrutacja', 'czern').cssVars['--band']).toBe(colors.lime)   // żółty wbudowany
  })
})

describe('accentsFor', () => {
  it('data → puste (kontrolka wyłączona)', () => {
    expect(accentsFor('data')).toEqual([])
  })
  it('layouty z receptą → 5 akcentów', () => {
    for (const l of ['ogloszenie', 'gosc', 'wyklad', 'konferencja', 'rekrutacja', 'warsztat', 'gala']) {
      expect(accentsFor(l)).toEqual(ACCENT_NAMES)
    }
  })
  it('ACCENT_LABELS ma polskie podpisy', () => {
    expect(ACCENT_LABELS.zolty).toBe('Żółty')
    expect(ACCENT_LABELS.zloty).toBe('Złoty (okazjonalny)')
  })
})

describe('resolveScheme — z akcentem', () => {
  it('Wykład Czerń × akcenty — role plakietki', () => {
    expect(resolveScheme('wyklad', 'czern', 'zolty').cssVars['--badge-fill']).toBe(colors.lime)
    expect(resolveScheme('wyklad', 'czern', 'pomaranczowy').cssVars['--badge-fill']).toBe(colors.coral)
    expect(resolveScheme('wyklad', 'czern', 'pomaranczowy').cssVars['--speaker']).toBe(colors.coral)
    expect(resolveScheme('wyklad', 'czern', 'granatowy').cssVars['--chips']).toBe(colors.navyLight)
    const zl = resolveScheme('wyklad', 'czern', 'zloty')
    expect(zl.cssVars['--badge-fill']).toBe(colors.gold)
    expect(zl.cssVars['--badge-text']).toBe(colors.cream)
    expect(zl.sygnet).toBe('zloty')
    const sr = resolveScheme('wyklad', 'czern', 'srebrny')
    expect(sr.cssVars['--badge-text']).toBe(colors.ink)
    expect(sr.sygnet).toBe('srebrny')
  })

  it('Gość: metaliczny akcent dokłada sygnetBg (granat)', () => {
    expect(resolveScheme('gosc', 'czern', 'zloty').cssVars['--sygnet-bg']).toBe(colors.navy)
    expect(resolveScheme('gosc', 'czern', 'srebrny').cssVars['--sygnet-bg']).toBe(colors.navy)
    expect(resolveScheme('gosc', 'czern', 'pomaranczowy').cssVars['--sygnet-bg']).toBeUndefined()
  })

  it('granatowy: navyLight na ciemnym tle, navy na jasnym', () => {
    expect(resolveScheme('ogloszenie', 'czern', 'granatowy').cssVars['--accent']).toBe(colors.navyLight)
    expect(resolveScheme('ogloszenie', 'jasny', 'granatowy').cssVars['--accent']).toBe(colors.navy)
  })

  it('Gala × akcent: rola --gold niesie kolor akcentu, sygnet dopasowany', () => {
    expect(resolveScheme('gala', 'default', 'granatowy').cssVars['--gold']).toBe(colors.navyLight)
    expect(resolveScheme('gala', 'default', 'granatowy').sygnet).toBe('negatywny')
    expect(resolveScheme('gala', 'default', 'srebrny').cssVars['--gold']).toBe(colors.silver)
    expect(resolveScheme('gala', 'default', 'srebrny').sygnet).toBe('srebrny')
  })

  it('Rekrutacja × akcent: banda + logoVariant', () => {
    expect(resolveScheme('rekrutacja', 'czern', 'granatowy').cssVars['--band']).toBe(colors.navyLight)
    expect(resolveScheme('rekrutacja', 'czern', 'granatowy').logoVariant).toBe('dark')
    expect(resolveScheme('rekrutacja', 'czern', 'zloty').cssVars['--band']).toBe(colors.gold)
    expect(resolveScheme('rekrutacja', 'czern', 'zloty').logoVariant).toBe('light')
    expect(resolveScheme('rekrutacja', 'czern', 'zloty').sygnet).toBe('zloty')
  })

  it('data ignoruje akcent (brak recepty)', () => {
    const a = resolveScheme('data', 'czern', 'zloty')
    const b = resolveScheme('data', 'czern', undefined)
    expect(a.cssVars).toEqual(b.cssVars)
    expect(a.sygnet).toBe(b.sygnet)
  })
})

describe('invarianty', () => {
  const layoutsAndSchemes = () =>
    Object.keys(schemes).flatMap((layout) =>
      [undefined, ...schemesFor(layout)].map((name) => ({ layout, name })),
    )
  const accents: (AccentName | undefined)[] = [undefined, ...ACCENT_NAMES]

  it('każdy layout × schemat × akcent: sygnet + logoVariant + niepusty cssVars', () => {
    for (const { layout, name } of layoutsAndSchemes()) {
      for (const acc of accents) {
        const s = resolveScheme(layout, name, acc)
        expect(s.sygnet, `${layout}/${name}/${acc}: brak sygnet`).toBeTruthy()
        expect(['light', 'dark'], `${layout}/${name}/${acc}: zły logoVariant`).toContain(s.logoVariant)
        expect(Object.keys(s.cssVars).length, `${layout}/${name}/${acc}: pusty cssVars`).toBeGreaterThan(0)
      }
    }
  })

  it('gold tylko z sygnetem zloty, silver tylko ze srebrny — po nałożeniu akcentu', () => {
    for (const { layout, name } of layoutsAndSchemes()) {
      for (const acc of accents) {
        const s = resolveScheme(layout, name, acc)
        const vals = Object.values(s.cssVars).map((v) => v.toLowerCase())
        if (vals.includes(colors.gold.toLowerCase()))
          expect(s.sygnet, `${layout}/${name}/${acc}: gold bez sygnetu zloty`).toBe('zloty')
        if (vals.includes(colors.silver.toLowerCase()))
          expect(s.sygnet, `${layout}/${name}/${acc}: silver bez sygnetu srebrny`).toBe('srebrny')
      }
    }
  })
})

it('SCHEME_LABELS', () => {
  expect(SCHEME_LABELS.czern).toBe('Czerń')
  expect(SCHEME_LABELS.default).toBe('Granat')
  expect(SCHEME_LABELS.czernZolta).toBeUndefined()
  expect(SCHEME_LABELS.okazjonalnyZloty).toBe('Okazjonalny złoty')   // nadal dla Daty
})
```

- [ ] **Step 3: Uruchom — poleci**

Run: `npx vitest run src/posters/schemes.test.ts`
Expected: FAIL (brak `accentsFor`/`ACCENT_*`, klucze `czernZolta` wciąż istnieją, `resolveScheme` 2-arg).

- [ ] **Step 4: Infrastruktura akcentu w `src/posters/schemes.ts`**

Import typu: `import type { AccentName, LogoVariant, ResolvedScheme, SygnetName } from '../types'`.

Wstaw PRZED `export const schemes` (po bloku `warsztat`):

```ts
// --- Oś akcentu ---
// Recepta zwraca nadpisania ról „akcentowych" danego layoutu dla wybranego
// koloru akcentu. `ctx` = blok już scalony (baza + nazwany schemat) — żeby
// „granatowy" mógł zależeć od tła. Metal (zloty/srebrny) dokłada `sygnet`.
type AccentRecipe = (accent: AccentName, ctx: SchemeBlock) => SchemeBlock

const DARK_BGS = new Set<string>([colors.black, colors.ink, colors.navy, colors.inkPanel, colors.navyDark])

function accentColor(accent: AccentName, ctx: SchemeBlock): string {
  switch (accent) {
    case 'zolty': return colors.lime
    case 'pomaranczowy': return colors.coral
    case 'granatowy': return DARK_BGS.has(ctx.pageBg ?? '') ? colors.navyLight : colors.navy
    case 'zloty': return colors.gold
    case 'srebrny': return colors.silver
  }
}

// Sparowany tekst na wypełnionej plakietce — tylko nie-metale (metal per recepta).
function accentText(accent: 'zolty' | 'pomaranczowy' | 'granatowy'): string {
  return accent === 'zolty' ? colors.limeText : colors.cream
}

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

// Kolor kropki-podglądu akcentu w kontrolce.
export const ACCENT_DOT: Record<AccentName, string> = {
  zolty: colors.lime,
  pomaranczowy: colors.coral,
  granatowy: colors.navy,
  zloty: colors.gold,
  srebrny: colors.silver,
}
```

- [ ] **Step 5: `resolveScheme` — 3. parametr**

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
  return {
    cssVars,
    sygnet: withAccent.sygnet,
    logoVariant: withAccent.logoVariant,
  }
}
```

- [ ] **Step 6: Przebuduj bloki — `ogloszenie`**

```ts
const ogloszenie: LayoutSchemes = {
  default: { pageBg: colors.navy, pageText: colors.cream, accent: colors.lime,
             sygnet: 'negatywny', logoVariant: 'dark' },
  czern: { pageBg: colors.black, accent: colors.lime, sygnet: 'negatywny' },
  jasny: { pageBg: colors.cream, pageText: colors.limeText, accent: colors.navy,
           sygnet: 'granat', logoVariant: 'light' },
  szary: { pageBg: colors.paper, pageText: colors.slate, accent: colors.grayDark,
           sygnet: 'szary', logoVariant: 'light' },
}
```

- [ ] **Step 7: `gala`**

```ts
// Gala — jeden schemat `default` (ink + złoto). Recepta `gala` mapuje akcent
// na rolę `gold` (i przełącza sygnet). Brak swatcha — tylko oś akcentu.
const gala: LayoutSchemes = {
  default: {
    pageBg: colors.ink, pageText: colors.goldPanelText, mutedText: colors.creamMuted,
    gold: colors.gold, panelBr: colors.inkPanel,
    sygnet: 'zloty', logoVariant: 'dark',
  },
}
```

- [ ] **Step 8: `gosc`**

```ts
const gosc: LayoutSchemes = {
  default: { pageBg: colors.cream, pageText: colors.ink, mutedText: colors.textMuted,
             accent: colors.navy, sygnet: 'negatywny', logoVariant: 'light' },
  czern: { pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
           accent: colors.lime, sygnet: 'negatywny', logoVariant: 'dark' },
  jasny: { pageBg: colors.paper },
  szary: { pageBg: colors.paper, pageText: colors.slate, accent: colors.grayDark },
}
```

- [ ] **Step 9: `data` — bez zmian**

Zostaw blok `data` dokładnie jak jest (6 schematów).

- [ ] **Step 10: `wyklad`**

```ts
const wyklad: LayoutSchemes = {
  default: {
    pageBg: colors.navy, pageText: colors.cream,
    badgeFill: colors.lime, badgeText: colors.limeText,
    speaker: colors.lime, chips: colors.lime,
    washTop: 'rgba(255,255,255,.055)', wedgeBr: colors.navyLight, wedgeBl: colors.navyDark,
    sygnet: 'negatywny', logoVariant: 'dark',
  },
  czern: { pageBg: colors.black, badgeFill: colors.lime, badgeText: colors.limeText,
           speaker: colors.lime, chips: colors.lime,
           washTop: 'rgba(255,255,255,.04)', wedgeBr: '#1E1E1E', wedgeBl: '#0A0A0A',
           sygnet: 'negatywny' },
  jasny: { pageBg: colors.cream, pageText: colors.limeText,
           badgeFill: colors.navy, badgeText: colors.cream, speaker: colors.navy, chips: colors.navy,
           washTop: 'rgba(60,69,155,.05)', wedgeBr: '#E2DED3', wedgeBl: '#DAD5C8',
           sygnet: 'granat', logoVariant: 'light' },
  szary: { pageBg: colors.paper, pageText: colors.slate,
           badgeFill: colors.grayDark, badgeText: colors.cream, speaker: colors.grayDark, chips: colors.gray,
           washTop: 'rgba(138,141,143,.08)', wedgeBr: '#D8D4CA', wedgeBl: '#CFCAC0',
           sygnet: 'szary', logoVariant: 'light' },
}
```

- [ ] **Step 11: `konferencja`**

```ts
const konferencja: LayoutSchemes = {
  default: {
    pageBg: colors.cream, pageText: colors.ink, mutedText: colors.textMuted,
    panel: colors.navy, panelText: colors.cream, headerBadge: colors.lime,
    lineFirst: colors.navy, lineRest: colors.creamMuted, footerBadge: colors.navy,
    sygnet: 'negatywny', logoVariant: 'light',
  },
  czern: {
    pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
    panel: colors.inkPanel, headerBadge: colors.lime,
    lineFirst: colors.lime, lineRest: 'rgba(244,242,237,.2)', footerBadge: colors.lime,
    sygnet: 'negatywny', logoVariant: 'dark',
  },
  jasny: { pageBg: colors.paper },
  szary: {
    pageBg: colors.paper, pageText: colors.slate,
    panel: colors.grayDark, headerBadge: colors.cream,
    lineFirst: colors.grayDark, footerBadge: colors.grayDark,
    sygnet: 'szary',
  },
}
```

- [ ] **Step 12: `rekrutacja`**

```ts
const rekrutacja: LayoutSchemes = {
  limonka: {
    pageBg: colors.lime, pageText: colors.limeText,
    band: colors.navy, subColor: colors.navyDark, footerText: colors.cream,
    badgeColor: colors.lime,
    qrBorder: 'rgba(244,242,237,.55)', qrText: 'rgba(244,242,237,.75)',
    sygnet: 'granat', logoVariant: 'dark',
  },
  czern: {
    pageBg: colors.black, pageText: colors.cream,
    band: colors.lime, subColor: colors.creamMuted, footerText: colors.limeText,
    badgeColor: colors.black,
    qrBorder: 'rgba(18,18,18,.4)', qrText: 'rgba(18,18,18,.6)',
    sygnet: 'negatywny', logoVariant: 'light',
  },
  jasny: {
    pageBg: colors.paper, pageText: colors.navy,
    subColor: colors.textMuted, badgeColor: colors.lime,
    sygnet: 'granat',
  },
  szary: {
    pageBg: colors.paper, pageText: colors.slate,
    band: colors.grayDark, subColor: colors.textMuted, badgeColor: colors.cream,
    sygnet: 'szary',
  },
}
```
> `limonka` MUSI zostać pierwszym kluczem (baza layoutu — `baseBlock` bierze pierwszy klucz gdy brak `default`).

- [ ] **Step 13: `warsztat`**

```ts
const warsztat: LayoutSchemes = {
  default: {
    pageBg: colors.cream, pageText: colors.ink, mutedText: colors.textMuted,
    title: colors.navy, badgeFill: colors.navy, badgeText: colors.lime,
    pillFill: colors.lime, pillText: colors.limeText, slotBg: colors.cream,
    qrBorder: colors.placeholderBorder, qrText: colors.placeholderText,
    sygnet: 'granat', logoVariant: 'light',
  },
  czern: {
    pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
    title: colors.cream, badgeFill: colors.lime, badgeText: colors.limeText,
    pillFill: colors.lime, pillText: colors.limeText, slotBg: colors.black,
    qrBorder: 'rgba(244,242,237,.3)', qrText: 'rgba(244,242,237,.7)',
    sygnet: 'negatywny', logoVariant: 'dark',
  },
  jasny: { pageBg: colors.paper, slotBg: colors.paper },
  szary: {
    pageBg: colors.paper, pageText: colors.slate,
    title: colors.slate, badgeFill: colors.grayDark, badgeText: colors.cream,
    pillFill: colors.gray, pillText: colors.slate, slotBg: colors.paper,
    sygnet: 'szary',
  },
}
```

- [ ] **Step 14: `SCHEME_LABELS`**

```ts
export const SCHEME_LABELS: Record<string, string> = {
  default: 'Granat',
  limonka: 'Limonka',
  czern: 'Czerń',
  jasny: 'Jasny',
  szary: 'Szary',
  // używane wyłącznie przez layout „Data" (ma osobne schematy złoto/srebro):
  okazjonalnyZloty: 'Okazjonalny złoty',
  okazjonalnySrebrny: 'Okazjonalny srebrny',
}
```

- [ ] **Step 15: Zaktualizuj komentarze bloków w `schemes.ts`**

Komentarze nad `gala`/`wyklad`/`konferencja`/`rekrutacja` wymieniają usunięte klucze (`czernZolta`, `okazjonalny*`, „ośmiu wariantach", „sześciu wariantach") — przeredaguj zwięźle pod nowy stan (jeden `czern`, oś akcentu daje warianty). Styl jak reszta pliku.

- [ ] **Step 16: Uruchom testy — mają przejść**

Run: `npx vitest run src/posters/schemes.test.ts`
Expected: PASS (wszystkie `describe`, oba invarianty).

- [ ] **Step 17: Typecheck + pełny test + lint**

Run: `npm run typecheck && npm test && npm run lint`
Expected: zielone.

- [ ] **Step 18: `docs/dodawanie-schematu-kolorow.md` — sekcja „Oś akcentu"**

Dopisz krótką sekcję: `resolveScheme(layout, name, accent?)`, `accentRecipes[layout]` (funkcja `(accent, ctx) => nadpisania ról`), `accentsFor` (puste = kontrolka wyłączona, jak `data`). Styl jak reszta dokumentu.

- [ ] **Step 19: Commit**

```bash
git add src/types.ts src/posters/schemes.ts src/posters/schemes.test.ts docs/dodawanie-schematu-kolorow.md
git commit -m "$(cat <<'EOF'
Oś akcentu: recepty per layout + resolveScheme(accent), jeden schemat Czerń

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012PMGNREmRTX2LiLpQzTm6q
EOF
)"
```

---

## Task 2: `src/utils/colorScheme.ts` — kodowanie schemat+akcent

**Files:**
- Create: `src/utils/colorScheme.ts`
- Create: `src/utils/colorScheme.test.ts`

**Interfaces:**
- Consumes: `ACCENT_NAMES` z `../posters/schemes` (Task 1), `AccentName` z `../types`
- Produces:
  - `export function encodeScheme(scheme: string | undefined, accent?: AccentName): string | undefined`
  - `export function decodeScheme(raw: string | null | undefined): { scheme: string | undefined; accent: AccentName | undefined }`

- [ ] **Step 1: Test najpierw — `src/utils/colorScheme.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { decodeScheme, encodeScheme } from './colorScheme'

describe('encodeScheme', () => {
  it('bez akcentu → sam schemat', () => {
    expect(encodeScheme('czern')).toBe('czern')
    expect(encodeScheme('czern', undefined)).toBe('czern')
  })
  it('z akcentem → schemat~akcent', () => {
    expect(encodeScheme('czern', 'pomaranczowy')).toBe('czern~pomaranczowy')
  })
  it('brak schematu → undefined (akcent bez schematu nie ma sensu)', () => {
    expect(encodeScheme(undefined, 'zloty')).toBeUndefined()
    expect(encodeScheme(undefined)).toBeUndefined()
  })
})

describe('decodeScheme', () => {
  it('null/pusty → oba undefined', () => {
    expect(decodeScheme(null)).toEqual({ scheme: undefined, accent: undefined })
    expect(decodeScheme('')).toEqual({ scheme: undefined, accent: undefined })
  })
  it('sam schemat', () => {
    expect(decodeScheme('czern')).toEqual({ scheme: 'czern', accent: undefined })
  })
  it('schemat~akcent', () => {
    expect(decodeScheme('czern~granatowy')).toEqual({ scheme: 'czern', accent: 'granatowy' })
  })
  it('nieznany akcent → odrzucony, schemat zostaje', () => {
    expect(decodeScheme('czern~bzdura')).toEqual({ scheme: 'czern', accent: undefined })
  })
  it('round-trip z encodeScheme', () => {
    for (const [s, a] of [['czern', 'zolty'], ['default', undefined], ['limonka', 'srebrny']] as const) {
      const enc = encodeScheme(s, a)
      expect(decodeScheme(enc ?? null)).toEqual({ scheme: s, accent: a })
    }
  })
})
```

- [ ] **Step 2: Uruchom — poleci**

Run: `npx vitest run src/utils/colorScheme.test.ts`
Expected: FAIL — brak `./colorScheme`.

- [ ] **Step 3: `src/utils/colorScheme.ts`**

```ts
import { ACCENT_NAMES } from '../posters/schemes'
import type { AccentName } from '../types'

// `color_scheme` w bazie koduje schemat i opcjonalny akcent jako
// `"<schemat>~<akcent>"` (albo sam `"<schemat>"`). Mieści się w istniejącej
// kolumnie TEXT — bez zmiany kształtu tabel.

export function encodeScheme(scheme: string | undefined, accent?: AccentName): string | undefined {
  if (!scheme) return undefined
  return accent ? `${scheme}~${accent}` : scheme
}

export function decodeScheme(raw: string | null | undefined): {
  scheme: string | undefined
  accent: AccentName | undefined
} {
  if (!raw) return { scheme: undefined, accent: undefined }
  const [scheme, rawAccent] = raw.split('~')
  const accent = ACCENT_NAMES.includes(rawAccent as AccentName) ? (rawAccent as AccentName) : undefined
  return { scheme: scheme || undefined, accent }
}
```

- [ ] **Step 4: Uruchom — przejdzie; potem pełny zestaw**

Run: `npx vitest run src/utils/colorScheme.test.ts && npm run typecheck && npm test && npm run lint`
Expected: zielone.

- [ ] **Step 5: Commit**

```bash
git add src/utils/colorScheme.ts src/utils/colorScheme.test.ts
git commit -m "$(cat <<'EOF'
Kodowanie schemat+akcent w kolumnie color_scheme (encodeScheme/decodeScheme)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012PMGNREmRTX2LiLpQzTm6q
EOF
)"
```

---

## Task 3: `PosterProps.accent` + przekazanie przez 8 plakatów i podgląd

**Files:**
- Modify: `src/types.ts` (`PosterProps`)
- Modify: `src/posters/PosterOgloszenie.tsx`, `PosterGala.tsx`, `PosterGosc.tsx`, `PosterData.tsx`, `PosterWyklad.tsx`, `PosterKonferencja.tsx`, `PosterRekrutacja.tsx`, `PosterWarsztat.tsx`
- Modify: `src/components/PosterPreview.tsx`

**Interfaces:**
- Consumes: `AccentName` (Task 1), `resolveScheme(l, name, accent?)` (Task 1)
- Produces: `PosterProps { data: RawPosterData; scheme?: string; accent?: AccentName }`

- [ ] **Step 1: `PosterProps` w `src/types.ts`**

```ts
import type { AccentName } from ... // już w pliku po Task 1
export interface PosterProps { data: RawPosterData; scheme?: string; accent?: AccentName }
```
(`AccentName` jest już w `types.ts` po Task 1 Step 1 — bez nowego importu, ten sam plik.)

- [ ] **Step 2: 8 plakatów — dołóż `accent` do propsów i do `resolveScheme`**

W każdym `src/posters/Poster<Nazwa>.tsx`:
- destrukturyzacja: `export function Poster<Nazwa>({ data, scheme, accent }: PosterProps) {`
- wywołanie: `const s = resolveScheme('<layout>', scheme, accent)`

Layouty i pliki: `ogloszenie`→`PosterOgloszenie.tsx`, `gala`→`PosterGala.tsx`, `gosc`→`PosterGosc.tsx`, `data`→`PosterData.tsx`, `wyklad`→`PosterWyklad.tsx`, `konferencja`→`PosterKonferencja.tsx`, `rekrutacja`→`PosterRekrutacja.tsx`, `warsztat`→`PosterWarsztat.tsx`.

`PosterData` też przyjmuje `accent` (dla spójności typu), ale `resolveScheme('data', scheme, accent)` i tak je zignoruje (brak recepty).

- [ ] **Step 3: `src/components/PosterPreview.tsx`**

```ts
import type { AccentName } from '../types'
// ...
interface PosterPreviewProps {
  posterRef: RefObject<HTMLDivElement | null>
  Component?: ComponentType<PosterProps>
  data: RawPosterData
  scheme?: string
  accent?: AccentName
}
export function PosterPreview({ posterRef, Component, data, scheme, accent }: PosterPreviewProps) {
  if (!Component) return null
  return (
    <div className="...">
      <PosterScaled ref={posterRef} size={PREVIEW_SIZE}>
        <Component data={data} scheme={scheme} accent={accent} />
      </PosterScaled>
    </div>
  )
}
```

- [ ] **Step 4: `PosterPreviewPage` / `SchemeSelector` swatche — bez zmian**

`PosterPreviewPage.tsx` i swatche w `SchemeSelector` renderują `<Component data scheme />` bez `accent` — `accent` jest opcjonalne, kompiluje się. **Nie zmieniać** (podgląd URL poza zakresem; swatche pokazują schemat bez akcentu).

- [ ] **Step 5: Weryfikacja**

Run: `npm run typecheck && npm test && npm run lint && npm run build`
Expected: zielone (testów przybywa 0 — to zmiana typów/propsów).

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/posters/Poster*.tsx src/components/PosterPreview.tsx
git commit -m "$(cat <<'EOF'
PosterProps.accent — przekazanie akcentu do resolveScheme w 8 plakatach

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012PMGNREmRTX2LiLpQzTm6q
EOF
)"
```

---

## Task 4: UI osi akcentu — `SchemeSelector` + `App.tsx` + persystencja + DB v5

Jeden task, jeden commit. `SchemeSelector` z nowymi **wymaganymi** propsami
psuje typecheck `App.tsx`, więc obie zmiany muszą wejść razem.

**Files:**
- Modify: `src/components/SchemeSelector.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/HistoryList.tsx`
- Modify: `src/db/schema.ts`
- Modify: `docs/architektura.md`

**Interfaces:**
- Consumes: `accentsFor`/`ACCENT_LABELS`/`ACCENT_DOT`/`ACCENT_NAMES` (Task 1), `AccentName` (Task 1), `encodeScheme`/`decodeScheme` (Task 2), `PosterPreview.accent` (Task 3)
- Produces: `SchemeSelector` props `+ selectedAccent?: AccentName`, `+ onSelectAccent: (a: AccentName | undefined) => void`; `persistDraft` 4-arg; `SCHEMA_VERSION = 5`

### Część A — `SchemeSelector.tsx`

- [ ] **A1: Przepisz `src/components/SchemeSelector.tsx`**

```tsx
import { ACCENT_DOT, ACCENT_LABELS, ACCENT_NAMES, SCHEME_LABELS, accentsFor, schemesFor } from '../posters/schemes'
import { PosterScaled } from './PosterScaled'
import type { AccentName, RawPosterData, RegistryEntry } from '../types'

const SWATCH_SIZE = 64
const THUMB_DATA: RawPosterData = {}

interface SchemeSelectorProps {
  poster: RegistryEntry | null
  posterKey: string | undefined
  selectedScheme: string | undefined
  onSelectScheme: (name: string) => void
  selectedAccent: AccentName | undefined
  onSelectAccent: (accent: AccentName | undefined) => void
}

// Pasek kolorystyki (swatche schematów) + kontrolka koloru akcentu.
// Swatche znikają dla layoutu z jednym schematem (Gala); kontrolka akcentu
// jest zawsze widoczna, wyszarzona gdy layout nie ma wariantów akcentu (Data).
export function SchemeSelector({
  poster, posterKey, selectedScheme, onSelectScheme, selectedAccent, onSelectAccent,
}: SchemeSelectorProps) {
  const SwatchComponent = poster?.Component
  if (!posterKey || !SwatchComponent) return null

  const schemeList = schemesFor(posterKey)
  const accents = accentsFor(posterKey)
  const accentEnabled = accents.length > 0

  return (
    <div className="mt-[18px] flex flex-col gap-3 border-t border-border pt-[18px]">
      {schemeList.length > 1 && (
        <div className="flex flex-col gap-2.5">
          <span className="text-[0.8rem] font-semibold uppercase tracking-[0.04em] text-muted">Kolorystyka</span>
          <div className="flex flex-wrap gap-2.5">
            {schemeList.map((name) => (
              <button
                key={name}
                type="button"
                className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 bg-transparent p-1 text-[0.72rem] transition-[border-color,transform] hover:-translate-y-0.5 ${
                  name === selectedScheme ? 'border-accent text-fg' : 'border-transparent text-muted'
                }`}
                onClick={() => onSelectScheme(name)}
              >
                <div className="overflow-hidden rounded-[5px] shadow-[0_1px_2px_rgba(0,0,0,0.12)]">
                  <PosterScaled size={SWATCH_SIZE}>
                    <SwatchComponent data={THUMB_DATA} scheme={name} />
                  </PosterScaled>
                </div>
                <span>{SCHEME_LABELS[name] ?? name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-[0.8rem] font-semibold uppercase tracking-[0.04em] text-muted">
          Akcent{!accentEnabled && ' — ten szablon nie ma wariantów akcentu'}
        </span>
        <div className={`flex flex-wrap items-center gap-2 ${accentEnabled ? '' : 'pointer-events-none opacity-40'}`}>
          <button
            type="button"
            disabled={!accentEnabled}
            className={`rounded-full border-2 px-3 py-1 text-[0.72rem] ${
              !selectedAccent ? 'border-accent text-fg' : 'border-border text-muted'
            }`}
            onClick={() => onSelectAccent(undefined)}
          >
            Domyślny
          </button>
          {ACCENT_NAMES.map((a) => (
            <button
              key={a}
              type="button"
              disabled={!accentEnabled}
              title={ACCENT_LABELS[a]}
              aria-label={ACCENT_LABELS[a]}
              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                selectedAccent === a ? 'border-accent' : 'border-transparent'
              }`}
              onClick={() => onSelectAccent(a)}
            >
              <span className="block h-4 w-4 rounded-full" style={{ background: ACCENT_DOT[a] }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

> Komponent nie zwraca już `null` przy 1 schemacie — musi pokazać kontrolkę akcentu (Gala ma 1 schemat, ale ma akcenty). Zwraca `null` tylko bez `posterKey`/komponentu.

### Część B — `App.tsx`, `HistoryList.tsx`, `schema.ts`, docs

- [ ] **B1: `src/db/schema.ts` — `SCHEMA_VERSION` 4 → 5**

```ts
// v4: przemianowane klucze schematów kolorów.
// v5: oś akcentu — usunięte klucze czernZolta/czernPomaranczowa/czernGranatowa/
//     okazjonalnyZloty/okazjonalnySrebrny z większości layoutów; stare
//     color_scheme w draftcie/historii przestały pasować.
export const SCHEMA_VERSION = 5
```

- [ ] **B2: `src/App.tsx` — import + stan**

Importy:
```ts
import { encodeScheme, decodeScheme } from './utils/colorScheme'
import type { AccentName } from './types'
```
Stan (obok `selectedScheme`):
```ts
const [selectedAccent, setSelectedAccent] = useState<AccentName | undefined>(undefined)
```

- [ ] **B3: `persistDraft` — kodowanie**

Zmień sygnaturę i ciało:
```ts
const persistDraft = useCallback(
  (nextForm: FormValues, templateId: number | null, schemeName: string | undefined, accent: AccentName | undefined) => {
    const db = dbRef.current
    if (!db) return
    saveDraft(db, { ...nextForm, template_id: templateId, color_scheme: encodeScheme(schemeName, accent) ?? null })
  },
  [],
)
```
Wszystkie wywołania `persistDraft(next, selectedTemplateId, selectedScheme)` → dodaj 4. argument `selectedAccent`. (Jest ich ~15 — każde w handlerach pól formularza.)

- [ ] **B4: Ładowanie draftu, `handleSelectScheme`, `handleSelectTemplate`, restore**

- Init (linia ~92): `const { scheme, accent } = decodeScheme(draft?.color_scheme)` → `setSelectedScheme(scheme ?? defaultSchemeFor(initialTemplateId, tpls))`, `setSelectedAccent(accent)`.
- `handleSelectScheme(name)`:
  ```ts
  const handleSelectScheme = (name: string) => {
    setSelectedScheme(name)
    persistDraft(form, selectedTemplateId, name, selectedAccent)
  }
  ```
- **Nowy** `handleSelectAccent`:
  ```ts
  const handleSelectAccent = (accent: AccentName | undefined) => {
    setSelectedAccent(accent)
    persistDraft(form, selectedTemplateId, selectedScheme, accent)
  }
  ```
- `handleSelectTemplate(id)`: po zmianie layoutu zresetuj akcent (nowy layout może nie mieć recepty / mieć inny domyślny wygląd):
  ```ts
  const nextScheme = defaultSchemeFor(id, templates)
  setSelectedScheme(nextScheme)
  setSelectedAccent(undefined)
  persistDraft(form, id, nextScheme, undefined)
  ```
- `handleRestoreHistoryEntry(entry)`:
  ```ts
  const { scheme, accent } = decodeScheme(entry.color_scheme)
  const nextScheme = scheme ?? defaultSchemeFor(templateId, templates)
  setSelectedScheme(nextScheme)
  setSelectedAccent(accent)
  persistDraft(next, templateId, nextScheme, accent)
  ```
- `addHistoryEntry` (linia ~318): `color_scheme: encodeScheme(selectedScheme, selectedAccent)`.

- [ ] **B5: Render — przekaż akcent**

```tsx
<PosterPreview posterRef={posterRef} Component={selectedPoster?.Component} data={form} scheme={selectedScheme} accent={selectedAccent} />
<SchemeSelector
  poster={selectedPoster}
  posterKey={selectedTemplate?.poster_key}
  selectedScheme={selectedScheme}
  onSelectScheme={handleSelectScheme}
  selectedAccent={selectedAccent}
  onSelectAccent={handleSelectAccent}
/>
```

`bugContext` (ticketowy) — bez zmian; opcjonalnie dołóż `accent: selectedAccent` do kontekstu błędu jeśli `BugContextInput` to przyjmuje (nie przyjmuje — **pomiń**, poza zakresem).

- [ ] **B6: `src/components/HistoryList.tsx` — podpis z akcentem**

Linia ~48 (`SCHEME_LABELS[entry.color_scheme] ?? entry.color_scheme`):
```tsx
import { decodeScheme } from '../utils/colorScheme'
import { ACCENT_LABELS } from '../posters/schemes'
// ...
{entry.color_scheme && (() => {
  const { scheme, accent } = decodeScheme(entry.color_scheme)
  const label = scheme ? (SCHEME_LABELS[scheme] ?? scheme) : ''
  return ` · ${label}${accent ? ` / ${ACCENT_LABELS[accent]}` : ''}`
})()}
```
(dopasuj do istniejącego JSX — chodzi o to, żeby nie pokazywać surowego `czern~granatowy`).

- [ ] **B7: `docs/architektura.md` — oś akcentu**

Jedno-dwa zdania: `resolveScheme` ma 3. parametr `accent`; recepty per layout w `schemes.ts`; kodowane w `color_scheme` jako `schemat~akcent`.

- [ ] **B8: Weryfikacja**

Run: `npm run typecheck && npm test && npm run lint && npm run build`
Expected: wszystko zielone.

- [ ] **B9: Commit (jeden — Część A + B)**

```bash
git add src/App.tsx src/components/SchemeSelector.tsx src/components/HistoryList.tsx src/db/schema.ts docs/architektura.md
git commit -m "$(cat <<'EOF'
UI osi akcentu: kontrolka w SchemeSelector, stan i persystencja w App, DB v5

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012PMGNREmRTX2LiLpQzTm6q
EOF
)"
```
> Jeden commit obejmuje Część A (`SchemeSelector`) i Część B — inaczej typecheck `App.tsx` nie przechodzi.

---

## Task 5: Weryfikacja końcowa + przegląd renderów

**Files:** brak zmian kodu (chyba że przegląd wykryje korektę recepty).

- [ ] **Step 1: Pełny zestaw**

Run: `npm run typecheck && npm test && npm run lint && npm run build`
Expected: zielone.

- [ ] **Step 2: `npm run dev` — przegląd**

Dla każdego layoutu z receptą (`Ogłoszenie`, `Gość`, `Wykład`, `Warsztat`, `Konferencja`, `Rekrutacja`, `Gala`):
- schemat **Czerń** × 5 akcentów (+ „Domyślny") — kontrast, sparowany tekst plakietek, czytelność sygnetu; dla Gościa metal na trójkącie (sygnetBg granat), dla Rekrutacji logo PK na bandzie.
- schematy **Granat / Jasny / Szary** (+ Limonka dla Rekrutacji) × akcenty — kombinacje na jasnym tle: `limonka` + żółty (limonkowa banda na limonkowej stronie), granat + granatowy (navyLight na navy) — dostroić receptę tam, gdzie źle.
- **Gala**: brak swatcha, kontrolka akcentu 6 opcji, `--gold` niesie kolor akcentu.
- **Data**: swatche jak dziś, kontrolka akcentu **wyszarzona** z hintem.

- [ ] **Step 3: Eksport kontrolny**

PNG dla 2–3 layoutów w „Czerń / Złoty" i „Czerń / Pomarańczowy" — akcent i sygnet poprawne.

- [ ] **Step 4: Korekty (jeśli przegląd coś wykrył)**

Popraw receptę w `schemes.ts` (`accentColor`/`accentText`/recepta layoutu), `npm test`, commit:
```
Korekty recept akcentu po przeglądzie: <opis>
<stopka>
```

- [ ] **Step 5: Podsumowanie dla użytkownika**

Co się zmieniło (lista schematów per layout, jak działa dropdown akcentu), co wymaga decyzji (kombinacje na jasnym tle), reset lokalnego draftu/historii przy pierwszym uruchomieniu po deployu.

---

## Self-Review

**Spec coverage:**

| Sekcja specu | Task / Step |
|---|---|
| `AccentName` | Task 1 Step 1 |
| Recepty akcentu (`accentRecipes`, `accentColor`, `accentText`, `accentSygnet`, `DARK_BGS`) | Task 1 Step 4 |
| `resolveScheme` 3. parametr | Task 1 Step 5 |
| `accentsFor` / `ACCENT_NAMES` / `ACCENT_LABELS` / `ACCENT_DOT` | Task 1 Step 4 |
| Przebudowa bloków (7 layoutów: 5 schematów → `czern`) + `gala` 1 schemat | Task 1 Steps 6–13 |
| `data` bez zmian | Task 1 Step 9 |
| `SCHEME_LABELS` (usunięcia + zostawione dla Daty) | Task 1 Step 14 |
| Kodowanie `color_scheme` (`encodeScheme`/`decodeScheme`) | Task 2 |
| `PosterProps.accent` + 8 plakatów + `PosterPreview` | Task 3 |
| `SchemeSelector` blok „Akcent" (zawsze widoczny, disabled dla Daty) | Task 4 A1 |
| `App.tsx` stan `selectedAccent` + handlery + persystencja + restore | Task 4 B2–B5 |
| `HistoryList` podpis z akcentem | Task 4 B6 |
| `SCHEMA_VERSION` 4 → 5 | Task 4 B1 |
| Testy: przepisane asercje + rozszerzone invarianty + `encode/decode` | Task 1 Step 2, Task 2 Step 1 |
| Dokumentacja | Task 1 Step 18, Task 4 B7 |
| Przegląd renderów | Task 5 |
| Poza zakresem (URL podglądu, akcent per element, enum RoleType) | nietknięte |

Brak luk.

**Placeholder scan:** Wszystkie bloki i recepty podane w całości. Task 4 to jeden task/commit (Część A+B — `SchemeSelector` z wymaganymi propsami psuje typecheck `App` bez Części B). Task 5 Step 4 warunkowy — to gałąź zależna od obserwacji z przeglądu, nie placeholder.

**Type consistency:**
- `AccentName` — `types.ts` (Task 1 S1), używany w `schemes.ts` (S4), `colorScheme.ts` (T2), `PosterProps` (T3 S1), `PosterPreview` (T3 S3), `SchemeSelector` (T4), `App` (T5). Wszędzie ten sam literał `'zolty'|'pomaranczowy'|'granatowy'|'zloty'|'srebrny'`.
- `resolveScheme(layoutKey, name, accent?)` — sygnatura z T1 S5, wołana z `accent` w 8 plakatach (T3 S2). Wstecznie zgodna (3. param opcjonalny) — swatche/`PosterPreviewPage` bez zmian kompilują się.
- `accentsFor(layoutKey): AccentName[]` — T1 S4, wołana w `SchemeSelector` (T4) i teście (T1 S2).
- `encodeScheme(scheme?, accent?): string | undefined` / `decodeScheme(raw): { scheme?, accent? }` — T2 S3, wołane w `App` (T5 S3–S4) i `HistoryList` (T5 S6) i teście (T2 S1).
- `SchemeSelector` props: `poster, posterKey, selectedScheme, onSelectScheme, selectedAccent, onSelectAccent` — T4 S1 vs wywołanie w `App` T5 S5. Zgodne.
- `persistDraft(form, templateId, scheme, accent)` — nowa 4-arg sygnatura (T5 S3); wszystkie ~15 wywołań w handlerach pól + `handleSelectScheme`/`handleSelectAccent`/`handleSelectTemplate`/restore dostają 4. argument.
- `ACCENT_DOT` / `ACCENT_LABELS` — `Record<AccentName, string>` w `schemes.ts` (T1 S4), czytane w `SchemeSelector` (T4) i `HistoryList` (T5 S6).

Zgodne.
