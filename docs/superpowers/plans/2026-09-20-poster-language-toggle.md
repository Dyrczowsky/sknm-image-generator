# Poster Language Toggle (PL/EN) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global PL/EN toggle that switches the built-in text baked into generated posters (default badge labels, organization branding lines, date formatting) while leaving the app's own interface and any user-typed content untouched.

**Architecture:** A single `lang: 'pl' | 'en'` state in `App.tsx`, persisted to `localStorage`, threaded as a new optional `lang` prop through `PosterProps` and the components that render posters (`PosterPreview`, `SchemeSelector`'s swatches, `HistoryList`). Each of the 8 poster components swaps its hardcoded PL defaults for a `lang === 'en' ? 'EN' : 'PL'` ternary at the exact spot the default is currently used. Date formatting utilities (`getMonthShort`, `formatFullDate`) grow an optional `lang` parameter with an English month table, defaulting to `'pl'` so every existing call site keeps working unchanged until updated.

**Tech Stack:** React 19 + TypeScript, Vite, Vitest. No new dependencies — this is plain ternaries and a `localStorage` key, not an i18n library.

**Spec:** `docs/superpowers/specs/2026-09-20-poster-language-toggle-design.md`

## Global Constraints

- Do not translate the app's own UI (form labels, buttons, section headers stay Polish).
- Do not translate anything the user types, including custom `badge`/`badge2` overrides.
- Do not translate placeholder/example content: `PLACEHOLDERS.title/speaker/location` (`src/posters/fallback.ts`) and `DEFAULT_AGENDA` (`PosterKonferencja.tsx`) stay Polish regardless of `lang`.
- The language choice is global and stored in `localStorage` only — no SQLite DB schema/version change, no per-poster or per-history-entry language.
- No new npm dependency.
- `lang` is optional everywhere it's threaded (`lang?: PosterLang`) and defaults to Polish behavior when omitted, so every existing call site that doesn't pass it keeps behaving exactly as today.

---

### Task 1: `PosterLang` type + English date formatting

**Files:**
- Modify: `src/types.ts`
- Modify: `src/utils/formatDate.ts`
- Create: `src/utils/formatDate.test.ts`

**Interfaces:**
- Produces: `export type PosterLang = 'pl' | 'en'` (from `src/types.ts`) — imported by every later task.
- Produces: `PosterProps` gains `lang?: PosterLang` (from `src/types.ts`).
- Produces: `getMonthShort(isoDate: string, opts?: { upperCase?: boolean; lang?: PosterLang }): string` (from `src/utils/formatDate.ts`) — signature change, backward compatible (both new fields optional).
- Produces: `formatFullDate(isoDate: string, lang?: PosterLang): string` (from `src/utils/formatDate.ts`) — signature change, backward compatible (new second param optional).
- `getDay` is unchanged.

- [ ] **Step 1: Add the `PosterLang` type and thread it into `PosterProps`**

In `src/types.ts`, find line 76:

```ts
export type AccentName = 'zolty' | 'pomaranczowy' | 'granatowy' | 'zloty' | 'srebrny'
```

Add a new line directly after it:

```ts
export type AccentName = 'zolty' | 'pomaranczowy' | 'granatowy' | 'zloty' | 'srebrny'
export type PosterLang = 'pl' | 'en'
```

Then find (a few lines further down):

```ts
export interface PosterProps { data: RawPosterData; scheme?: string; accent?: AccentName }
```

Replace it with:

```ts
export interface PosterProps { data: RawPosterData; scheme?: string; accent?: AccentName; lang?: PosterLang }
```

- [ ] **Step 2: Run typecheck to confirm this alone doesn't break anything**

Run: `npm run typecheck`
Expected: passes (the new field is optional, so no existing `PosterProps` consumer breaks).

- [ ] **Step 3: Write the failing tests for English date formatting**

Create `src/utils/formatDate.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getDay, getMonthShort, formatFullDate } from './formatDate'

describe('getDay', () => {
  it('nie zależy od języka', () => {
    expect(getDay('2026-09-20')).toBe('20')
  })
  it('pusta/nieprawidłowa data → pusty string', () => {
    expect(getDay('')).toBe('')
  })
})

describe('getMonthShort', () => {
  it('domyślnie (bez lang) zwraca polski skrót, jak dotychczas', () => {
    expect(getMonthShort('2026-09-20')).toBe('wrz')
    expect(getMonthShort('2026-09-20', { upperCase: true })).toBe('WRZ')
  })
  it('lang: "pl" jawnie — to samo, co domyślnie', () => {
    expect(getMonthShort('2026-09-20', { lang: 'pl' })).toBe('wrz')
  })
  it('lang: "en" zwraca angielski skrót', () => {
    expect(getMonthShort('2026-09-20', { lang: 'en' })).toBe('Sep')
    expect(getMonthShort('2026-09-20', { upperCase: true, lang: 'en' })).toBe('SEP')
  })
  it('pusta data → pusty string niezależnie od lang', () => {
    expect(getMonthShort('', { lang: 'en' })).toBe('')
  })
})

describe('formatFullDate', () => {
  it('domyślnie (bez lang) zwraca polską datę — dzień + dopełniacz miesiąca + rok', () => {
    expect(formatFullDate('2026-09-20')).toBe('20 września 2026')
  })
  it('lang: "en" zwraca angielską datę — dzień + pełna nazwa miesiąca + rok', () => {
    expect(formatFullDate('2026-09-20', 'en')).toBe('20 September 2026')
  })
  it('pusta data → pusty string', () => {
    expect(formatFullDate('', 'en')).toBe('')
  })
})
```

- [ ] **Step 4: Run the test file to confirm it fails**

Run: `npx vitest run src/utils/formatDate.test.ts`
Expected: FAIL — the `lang: 'en'` cases return the Polish strings (e.g. `getMonthShort('2026-09-20', { lang: 'en' })` currently returns `'wrz'`, not `'Sep'`, because `formatDate.ts` doesn't read `lang` yet), and `formatFullDate('2026-09-20', 'en')` is a TypeScript error today (the function only takes one parameter) — either way this step must show red before you proceed.

- [ ] **Step 5: Implement English month tables and thread `lang` through**

Replace the full contents of `src/utils/formatDate.ts` with:

```ts
import type { PosterLang } from '../types'

const MONTHS_GENITIVE = [
  'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
]

const MONTHS_SHORT = [
  'sty', 'lut', 'mar', 'kwi', 'maj', 'cze',
  'lip', 'sie', 'wrz', 'paź', 'lis', 'gru',
]

const MONTHS_FULL_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const MONTHS_SHORT_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface ParsedDate { year: number; month: number; day: number }

function parseDate(isoDate: string): ParsedDate | null {
  if (!isoDate) return null
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return null
  return { year, month, day }
}

// "12" - dzień miesiąca bez wiodącego zera (ten sam format w obu językach)
export function getDay(isoDate: string): string {
  const d = parseDate(isoDate)
  return d ? String(d.day) : ''
}

// "lis" / "LIS" (pl) albo "Nov" / "NOV" (en)
export function getMonthShort(isoDate: string, { upperCase = false, lang = 'pl' }: { upperCase?: boolean; lang?: PosterLang } = {}): string {
  const d = parseDate(isoDate)
  if (!d) return ''
  const name = lang === 'en' ? MONTHS_SHORT_EN[d.month - 1] : MONTHS_SHORT[d.month - 1]
  return upperCase ? name.toUpperCase() : name
}

// "18 kwietnia 2026" (pl, dopełniacz) albo "18 April 2026" (en, dzień pierwszy
// jak w pl, żeby układy dopasowane do polskiej daty nie rozjeżdżały się)
export function formatFullDate(isoDate: string, lang: PosterLang = 'pl'): string {
  const d = parseDate(isoDate)
  if (!d) return ''
  const month = lang === 'en' ? MONTHS_FULL_EN[d.month - 1] : MONTHS_GENITIVE[d.month - 1]
  return `${d.day} ${month} ${d.year}`
}
```

- [ ] **Step 6: Run the test file again to confirm it passes**

Run: `npx vitest run src/utils/formatDate.test.ts`
Expected: PASS, all cases green.

- [ ] **Step 7: Run the full test suite and typecheck**

Run: `npm test && npm run typecheck`
Expected: both pass (existing callers of `getMonthShort`/`formatFullDate` don't pass `lang`, so they keep getting Polish output — nothing else in the codebase should change behavior).

- [ ] **Step 8: Commit**

```bash
git add src/types.ts src/utils/formatDate.ts src/utils/formatDate.test.ts
git commit -m "Dodanie typu PosterLang i angielskiego formatowania dat"
```

---

### Task 2: `LangToggle` component + global state wiring

**Files:**
- Create: `src/components/LangToggle.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/PosterPreview.tsx`
- Modify: `src/components/SchemeSelector.tsx`
- Modify: `src/components/HistoryList.tsx`

**Interfaces:**
- Consumes: `PosterLang` from `src/types.ts` (Task 1).
- Produces: `LangToggle({ value: PosterLang, onChange: (lang: PosterLang) => void })` component.
- Produces: `PosterPreviewProps`, `SchemeSelectorProps`, `HistoryListProps` each gain `lang?: PosterLang`.

There is no component-test harness in this codebase (no `@testing-library/react`, no other poster/component has a test file) — verification for this task is `npm run typecheck` plus a manual browser check, matching how the rest of the app's UI layer is verified.

- [ ] **Step 1: Create the `LangToggle` component**

Create `src/components/LangToggle.tsx`:

```tsx
import type { PosterLang } from '../types'

interface LangToggleProps {
  value: PosterLang
  onChange: (lang: PosterLang) => void
}

// Przełącznik języka WBUDOWANEGO TEKSTU PLAKATU (domyślne etykiety, nazwa
// organizacji, format daty — patrz src/posters/*.tsx i utils/formatDate.ts).
// Nie tłumaczy interfejsu aplikacji ani treści wpisanych przez użytkownika.
export function LangToggle({ value, onChange }: LangToggleProps) {
  const base = 'cursor-pointer rounded-md px-3 py-1.5 text-[0.8rem] font-semibold uppercase tracking-[0.04em] transition-colors'
  const active = 'bg-accent text-white'
  const inactive = 'text-muted hover:text-fg'

  return (
    <div className="inline-flex gap-1 rounded-lg border border-field-border bg-field p-1" role="group" aria-label="Język plakatu">
      <button
        type="button"
        className={`${base} ${value === 'pl' ? active : inactive}`}
        aria-pressed={value === 'pl'}
        onClick={() => onChange('pl')}
      >
        PL
      </button>
      <button
        type="button"
        className={`${base} ${value === 'en' ? active : inactive}`}
        aria-pressed={value === 'en'}
        onClick={() => onChange('en')}
      >
        EN
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Wire `lang` state and persistence into `App.tsx`**

In `src/App.tsx`, line 3, change:

```ts
import type { AccentName, FormValues, FormTextField, HistoryRow, TemplateRow } from './types'
```

to:

```ts
import type { AccentName, FormValues, FormTextField, HistoryRow, PosterLang, TemplateRow } from './types'
```

After line 13 (`import { SchemeSelector } from './components/SchemeSelector'`), add:

```ts
import { LangToggle } from './components/LangToggle'
```

Find the `EMPTY_FORM` constant near the top of the file and add this constant directly above it:

```ts
const LANG_STORAGE_KEY = 'sknm-poster-lang'

function loadStoredLang(): PosterLang {
  try {
    return localStorage.getItem(LANG_STORAGE_KEY) === 'en' ? 'en' : 'pl'
  } catch {
    return 'pl'
  }
}

const EMPTY_FORM: FormValues = {
```

(i.e. `loadStoredLang` and `LANG_STORAGE_KEY` go right before the existing `const EMPTY_FORM: FormValues = {` line — don't duplicate `EMPTY_FORM` itself.)

Find:

```ts
  const [selectedAccent, setSelectedAccent] = useState<AccentName | undefined>(undefined)
```

Add directly after it:

```ts
  const [selectedAccent, setSelectedAccent] = useState<AccentName | undefined>(undefined)
  const [lang, setLang] = useState<PosterLang>(loadStoredLang)
```

Find the closing of the first `useEffect` (the one that loads the DB on mount), which ends with:

```ts
      setHistory(listHistory(db))
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])
```

Add a new `useEffect` directly after that closing `}, [])`:

```ts
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang)
    } catch {
      // localStorage niedostępny (np. tryb prywatny) — język zostaje tylko w pamięci sesji.
    }
  }, [lang])
```

- [ ] **Step 3: Render the toggle and thread `lang` to the poster-rendering components**

In `src/App.tsx`, find:

```tsx
        <h1 className="mb-2 text-[1.6rem] font-bold">Generator plakatów SKNM</h1>
```

Replace with:

```tsx
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[1.6rem] font-bold">Generator plakatów SKNM</h1>
          <LangToggle value={lang} onChange={setLang} />
        </div>
```

Find:

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

Replace with:

```tsx
            <PosterPreview posterRef={posterRef} Component={selectedPoster?.Component} data={form} scheme={selectedScheme} accent={selectedAccent} lang={lang} />
            <SchemeSelector
              poster={selectedPoster}
              posterKey={selectedTemplate?.poster_key}
              selectedScheme={selectedScheme}
              onSelectScheme={handleSelectScheme}
              selectedAccent={selectedAccent}
              onSelectAccent={handleSelectAccent}
              lang={lang}
            />
```

Find:

```tsx
            <HistoryList entries={history} onRestore={handleRestoreHistoryEntry} onDelete={handleDeleteHistoryEntry} />
```

Replace with:

```tsx
            <HistoryList entries={history} onRestore={handleRestoreHistoryEntry} onDelete={handleDeleteHistoryEntry} lang={lang} />
```

- [ ] **Step 4: Thread `lang` through `PosterPreview`**

Replace the full contents of `src/components/PosterPreview.tsx` with:

```tsx
import type { ComponentType, RefObject } from 'react'
import type { AccentName, PosterLang, PosterProps, RawPosterData } from '../types'
import { PosterScaled } from './PosterScaled'

const PREVIEW_SIZE = 420

interface PosterPreviewProps {
  posterRef: RefObject<HTMLDivElement | null>
  Component?: ComponentType<PosterProps>
  data: RawPosterData
  scheme?: string
  accent?: AccentName
  lang?: PosterLang
}

// Podgląd na żywo - aktualizuje się automatycznie przy każdej zmianie
// formularza, szablonu lub schematu kolorów (bez przycisku "Generuj").
export function PosterPreview({ posterRef, Component, data, scheme, accent, lang }: PosterPreviewProps) {
  if (!Component) return null
  return (
    <div className="w-fit overflow-hidden rounded-[10px] border border-border shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
      <PosterScaled ref={posterRef} size={PREVIEW_SIZE}>
        <Component data={data} scheme={scheme} accent={accent} lang={lang} />
      </PosterScaled>
    </div>
  )
}
```

- [ ] **Step 5: Thread `lang` through `SchemeSelector`'s swatches**

In `src/components/SchemeSelector.tsx`, find:

```ts
import { ACCENT_DOT, ACCENT_LABELS, ACCENT_NAMES, SCHEME_LABELS, accentsFor, defaultAccentFor, layoutHasAccentAxis, schemesFor } from '../posters/schemes'
import { PosterScaled } from './PosterScaled'
import type { AccentName, RawPosterData, RegistryEntry } from '../types'
```

Replace with:

```ts
import { ACCENT_DOT, ACCENT_LABELS, ACCENT_NAMES, SCHEME_LABELS, accentsFor, defaultAccentFor, layoutHasAccentAxis, schemesFor } from '../posters/schemes'
import { PosterScaled } from './PosterScaled'
import type { AccentName, PosterLang, RawPosterData, RegistryEntry } from '../types'
```

Find:

```ts
interface SchemeSelectorProps {
  poster: RegistryEntry | null
  posterKey: string | undefined
  selectedScheme: string | undefined
  onSelectScheme: (name: string) => void
  selectedAccent: AccentName | undefined
  onSelectAccent: (accent: AccentName | undefined) => void
}
```

Replace with:

```ts
interface SchemeSelectorProps {
  poster: RegistryEntry | null
  posterKey: string | undefined
  selectedScheme: string | undefined
  onSelectScheme: (name: string) => void
  selectedAccent: AccentName | undefined
  onSelectAccent: (accent: AccentName | undefined) => void
  lang?: PosterLang
}
```

Find:

```ts
export function SchemeSelector({
  poster, posterKey, selectedScheme, onSelectScheme, selectedAccent, onSelectAccent,
}: SchemeSelectorProps) {
```

Replace with:

```ts
export function SchemeSelector({
  poster, posterKey, selectedScheme, onSelectScheme, selectedAccent, onSelectAccent, lang,
}: SchemeSelectorProps) {
```

Find:

```tsx
                  <PosterScaled size={SWATCH_SIZE}>
                    <SwatchComponent data={THUMB_DATA} scheme={name} />
                  </PosterScaled>
```

Replace with:

```tsx
                  <PosterScaled size={SWATCH_SIZE}>
                    <SwatchComponent data={THUMB_DATA} scheme={name} lang={lang} />
                  </PosterScaled>
```

- [ ] **Step 6: Thread `lang` through `HistoryList`**

In `src/components/HistoryList.tsx`, find:

```ts
import { posterRegistry } from '../posters/registry'
import { ACCENT_LABELS, SCHEME_LABELS } from '../posters/schemes'
import { decodeScheme } from '../utils/colorScheme'
import { PosterScaled } from './PosterScaled'
import type { HistoryRow } from '../types'
```

Replace with:

```ts
import { posterRegistry } from '../posters/registry'
import { ACCENT_LABELS, SCHEME_LABELS } from '../posters/schemes'
import { decodeScheme } from '../utils/colorScheme'
import { PosterScaled } from './PosterScaled'
import type { HistoryRow, PosterLang } from '../types'
```

Find:

```ts
interface HistoryListProps {
  entries: HistoryRow[]
  onRestore: (entry: HistoryRow) => void
  onDelete: (id: number) => void
}

export function HistoryList({ entries, onRestore, onDelete }: HistoryListProps) {
```

Replace with:

```ts
interface HistoryListProps {
  entries: HistoryRow[]
  onRestore: (entry: HistoryRow) => void
  onDelete: (id: number) => void
  lang?: PosterLang
}

export function HistoryList({ entries, onRestore, onDelete, lang }: HistoryListProps) {
```

Find:

```tsx
                <PosterScaled size={THUMB_SIZE}>
                  <Component data={entry} scheme={entryScheme} accent={entryAccent} />
                </PosterScaled>
```

Replace with:

```tsx
                <PosterScaled size={THUMB_SIZE}>
                  <Component data={entry} scheme={entryScheme} accent={entryAccent} lang={lang} />
                </PosterScaled>
```

- [ ] **Step 7: Typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 8: Manual verification**

Run: `npm run dev`, open the app in a browser.
Expected:
- A PL/EN toggle appears next to the "Generator plakatów SKNM" heading, defaulting to PL selected.
- Clicking EN doesn't change any poster text yet (Task 3 hasn't wired the posters) and doesn't throw console errors.
- Reload the page — the toggle keeps whichever language you last picked (check `localStorage.getItem('sknm-poster-lang')` in devtools if unsure).

- [ ] **Step 9: Commit**

```bash
git add src/components/LangToggle.tsx src/App.tsx src/components/PosterPreview.tsx src/components/SchemeSelector.tsx src/components/HistoryList.tsx
git commit -m "Dodanie globalnego przełącznika języka plakatu (PL/EN) w App"
```

---

### Task 3: Wire `lang` into every poster component

**Files:**
- Modify: `src/posters/blocks/BigDateNumber.tsx`
- Modify: `src/posters/PosterWyklad.tsx`
- Modify: `src/posters/PosterOgloszenie.tsx`
- Modify: `src/posters/PosterGosc.tsx`
- Modify: `src/posters/PosterWarsztat.tsx`
- Modify: `src/posters/PosterKonferencja.tsx`
- Modify: `src/posters/PosterRekrutacja.tsx`
- Modify: `src/posters/PosterGala.tsx`
- Modify: `src/posters/PosterData.tsx`

**Interfaces:**
- Consumes: `PosterLang` (Task 1), `lang?: PosterLang` on `PosterProps` (Task 1), the `lang`-aware `getMonthShort`/`formatFullDate` (Task 1).
- Consumes: `<BigDateNumber lang={...} />` prop added in this task, used by `PosterWyklad` and `PosterGala`.

No component test harness exists for poster components (confirmed: none of the 8 `Poster*.tsx` files have a test file today) — this task is verified with `npm run typecheck` plus a manual browser walkthrough of all 8 templates in both languages, matching the spec's testing section.

- [ ] **Step 1: Thread `lang` into the shared `BigDateNumber` block**

Replace the full contents of `src/posters/blocks/BigDateNumber.tsx` with:

```tsx
import type { CSSProperties } from 'react'
import { typography } from '../theme'
import { getDay, getMonthShort } from '../../utils/formatDate'
import type { PosterLang } from '../../types'

interface BigDateNumberProps {
  event_date: string
  color?: string
  style?: CSSProperties
  lang?: PosterLang
}

// Duży "dzień + skrócony miesiąc" w jednej linii (np. "12 LIS" / "12 NOV").
export function BigDateNumber({ event_date, color, style, lang }: BigDateNumberProps) {
  return (
    <div style={{ ...typography.bigDay, whiteSpace: 'nowrap', flex: '0 0 auto', color, ...style }}>
      {getDay(event_date)}
      <span style={typography.bigMonth}> {getMonthShort(event_date, { upperCase: true, lang })}</span>
    </div>
  )
}
```

- [ ] **Step 2: Wykład — badge default, short org name, date lang**

In `src/posters/PosterWyklad.tsx`, find:

```tsx
export function PosterWyklad({ data, scheme, accent }: PosterProps) {
```

Replace with:

```tsx
export function PosterWyklad({ data, scheme, accent, lang }: PosterProps) {
```

Find:

```tsx
        <BrandingText lines={['SKNM', 'POLITECHNIKA', 'KRAKOWSKA']} opacity={0.85} />
```

Replace with:

```tsx
        <BrandingText lines={lang === 'en' ? ['SKNM', 'KRAKOW UNIVERSITY', 'OF TECHNOLOGY'] : ['SKNM', 'POLITECHNIKA', 'KRAKOWSKA']} opacity={0.85} />
```

Find:

```tsx
        <Badge background="var(--badge-fill)" color="var(--badge-text)" style={{ fontSize: 24, ...fx('badge') }}>{badge || 'WYKŁAD OTWARTY'}</Badge>
```

Replace with:

```tsx
        <Badge background="var(--badge-fill)" color="var(--badge-text)" style={{ fontSize: 24, ...fx('badge') }}>{badge || (lang === 'en' ? 'OPEN LECTURE' : 'WYKŁAD OTWARTY')}</Badge>
```

Find:

```tsx
          <BigDateNumber event_date={event_date} style={fx('event_date')} />
```

Replace with:

```tsx
          <BigDateNumber event_date={event_date} style={fx('event_date')} lang={lang} />
```

- [ ] **Step 3: Ogłoszenie — short org name only**

In `src/posters/PosterOgloszenie.tsx`, find:

```tsx
export function PosterOgloszenie({ data, scheme, accent }: PosterProps) {
```

Replace with:

```tsx
export function PosterOgloszenie({ data, scheme, accent, lang }: PosterProps) {
```

Find:

```tsx
        <BrandingText lines={['SKNM', 'POLITECHNIKA', 'KRAKOWSKA']} opacity={0.85} />
```

Replace with:

```tsx
        <BrandingText lines={lang === 'en' ? ['SKNM', 'KRAKOW UNIVERSITY', 'OF TECHNOLOGY'] : ['SKNM', 'POLITECHNIKA', 'KRAKOWSKA']} opacity={0.85} />
```

- [ ] **Step 4: Gość — badge default, free-entry line, date lang**

In `src/posters/PosterGosc.tsx`, find:

```tsx
export function PosterGosc({ data, scheme, accent }: PosterProps) {
```

Replace with:

```tsx
export function PosterGosc({ data, scheme, accent, lang }: PosterProps) {
```

Find:

```tsx
              <span style={fx('event_date')}>{getMonthShort(event_date, { upperCase: true })}</span>
```

Replace with:

```tsx
              <span style={fx('event_date')}>{getMonthShort(event_date, { upperCase: true, lang })}</span>
```

Find:

```tsx
          <Badge color={textColor} style={fx('badge')}>{badge || 'SEMINARIUM SKNM'}</Badge>
```

Replace with:

```tsx
          <Badge color={textColor} style={fx('badge')}>{badge || (lang === 'en' ? 'SKNM SEMINAR' : 'SEMINARIUM SKNM')}</Badge>
```

Find:

```tsx
          <div style={{ fontSize: 22, fontWeight: 600, color: textColor }}>Wstęp wolny · sknm.pk.edu.pl</div>
```

Replace with:

```tsx
          <div style={{ fontSize: 22, fontWeight: 600, color: textColor }}>{lang === 'en' ? 'Free entry · sknm.pk.edu.pl' : 'Wstęp wolny · sknm.pk.edu.pl'}</div>
```

- [ ] **Step 5: Warsztat — badge default, date lang**

In `src/posters/PosterWarsztat.tsx`, find:

```tsx
export function PosterWarsztat({ data, scheme, accent }: PosterProps) {
  const { title, subtitle, event_date, event_time, location, badge, graphics, showPkLogo, qrUrl, photos, fx } = withPlaceholders(data)
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  const pills = [
    { text: event_time, style: fx('event_time') },
    { text: `${getDay(event_date)} ${getMonthShort(event_date)}`, style: fx('event_date') },
    { text: location, style: fx('location') },
  ]
```

Replace with:

```tsx
export function PosterWarsztat({ data, scheme, accent, lang }: PosterProps) {
  const { title, subtitle, event_date, event_time, location, badge, graphics, showPkLogo, qrUrl, photos, fx } = withPlaceholders(data)
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  const pills = [
    { text: event_time, style: fx('event_time') },
    { text: `${getDay(event_date)} ${getMonthShort(event_date, { lang })}`, style: fx('event_date') },
    { text: location, style: fx('location') },
  ]
```

Find:

```tsx
          <Badge background="var(--badge-fill)" color="var(--badge-text)" style={{ padding: '10px 16px', ...fx('badge') }}>{badge || 'WARSZTATY'}</Badge>
```

Replace with:

```tsx
          <Badge background="var(--badge-fill)" color="var(--badge-text)" style={{ padding: '10px 16px', ...fx('badge') }}>{badge || (lang === 'en' ? 'WORKSHOP' : 'WARSZTATY')}</Badge>
```

- [ ] **Step 6: Konferencja — both badge defaults, full-date lang**

In `src/posters/PosterKonferencja.tsx`, find:

```tsx
export function PosterKonferencja({ data, scheme, accent }: PosterProps) {
```

Replace with:

```tsx
export function PosterKonferencja({ data, scheme, accent, lang }: PosterProps) {
```

Find:

```tsx
          <Badge color="var(--header-badge)" style={fx('badge')}>{badge || 'SEMINARIUM SKNM'}</Badge>
```

Replace with:

```tsx
          <Badge color="var(--header-badge)" style={fx('badge')}>{badge || (lang === 'en' ? 'SKNM SEMINAR' : 'SEMINARIUM SKNM')}</Badge>
```

Find:

```tsx
            <span style={fx('event_date')}>{formatFullDate(event_date)}</span>
```

Replace with:

```tsx
            <span style={fx('event_date')}>{formatFullDate(event_date, lang)}</span>
```

Find:

```tsx
            <Badge color="var(--footer-badge)" style={{ font: `700 20px ${fontMono}`, letterSpacing: '.12em', ...fx('badge2') }}>{badge2 || 'WIĘCEJ INFORMACJI'}</Badge>
```

Replace with:

```tsx
            <Badge color="var(--footer-badge)" style={{ font: `700 20px ${fontMono}`, letterSpacing: '.12em', ...fx('badge2') }}>{badge2 || (lang === 'en' ? 'MORE INFORMATION' : 'WIĘCEJ INFORMACJI')}</Badge>
```

Note: `formatFullDate` takes `lang?: PosterLang` positionally (Task 1) — passing `lang` (which may be `undefined`) here is fine, since the function defaults to `'pl'` when its second argument is `undefined`.

- [ ] **Step 7: Rekrutacja — badge default, long org name, date lang**

In `src/posters/PosterRekrutacja.tsx`, find:

```tsx
export function PosterRekrutacja({ data, scheme, accent }: PosterProps) {
```

Replace with:

```tsx
export function PosterRekrutacja({ data, scheme, accent, lang }: PosterProps) {
```

Find:

```tsx
        <BrandingText lines={['STUDENCKIE KOŁO', 'NAUKOWE MATEMATYKÓW', 'POLITECHNIKI KRAKOWSKIEJ']} />
```

Replace with:

```tsx
        <BrandingText lines={lang === 'en' ? ['STUDENT SCIENCE CLUB', 'OF MATHEMATICS', 'KRAKOW UNIVERSITY OF TECHNOLOGY'] : ['STUDENCKIE KOŁO', 'NAUKOWE MATEMATYKÓW', 'POLITECHNIKI KRAKOWSKIEJ']} />
```

Find:

```tsx
          <Badge color="var(--badge-color)" style={{ font: `700 26px ${fontMono}`, letterSpacing: '.1em', ...fx('badge') }}>{badge || 'SPOTKANIE ORGANIZACYJNE'}</Badge>
          <InfoLine
            parts={[
              { text: `${getDay(event_date)} ${getMonthShort(event_date)}`, hidden: hidden('event_date') },
```

Replace with:

```tsx
          <Badge color="var(--badge-color)" style={{ font: `700 26px ${fontMono}`, letterSpacing: '.1em', ...fx('badge') }}>{badge || (lang === 'en' ? 'KICK-OFF MEETING' : 'SPOTKANIE ORGANIZACYJNE')}</Badge>
          <InfoLine
            parts={[
              { text: `${getDay(event_date)} ${getMonthShort(event_date, { lang })}`, hidden: hidden('event_date') },
```

- [ ] **Step 8: Gala — badge default, long org name, date lang**

In `src/posters/PosterGala.tsx`, find:

```tsx
export function PosterGala({ data, scheme, accent }: PosterProps) {
```

Replace with:

```tsx
export function PosterGala({ data, scheme, accent, lang }: PosterProps) {
```

Find:

```tsx
        <BrandingText lines={['STUDENCKIE KOŁO', 'NAUKOWE MATEMATYKÓW', 'POLITECHNIKI KRAKOWSKIEJ']} color="var(--gold)" />
```

Replace with:

```tsx
        <BrandingText lines={lang === 'en' ? ['STUDENT SCIENCE CLUB', 'OF MATHEMATICS', 'KRAKOW UNIVERSITY OF TECHNOLOGY'] : ['STUDENCKIE KOŁO', 'NAUKOWE MATEMATYKÓW', 'POLITECHNIKI KRAKOWSKIEJ']} color="var(--gold)" />
```

Find:

```tsx
        <Badge color="var(--gold)" style={{ font: `700 24px ${fontMono}`, letterSpacing: '.2em', ...fx('badge') }}>{badge || 'GALA SKNM'}</Badge>
```

Replace with:

```tsx
        <Badge color="var(--gold)" style={{ font: `700 24px ${fontMono}`, letterSpacing: '.2em', ...fx('badge') }}>{badge || (lang === 'en' ? 'SKNM GALA' : 'GALA SKNM')}</Badge>
```

Find:

```tsx
          <BigDateNumber event_date={event_date} color="var(--gold)" style={fx('event_date')} />
```

Replace with:

```tsx
          <BigDateNumber event_date={event_date} color="var(--gold)" style={fx('event_date')} lang={lang} />
```

- [ ] **Step 9: Data — branding line, date lang**

In `src/posters/PosterData.tsx`, find:

```tsx
export function PosterData({ data, scheme, accent }: PosterProps) {
```

Replace with:

```tsx
export function PosterData({ data, scheme, accent, lang }: PosterProps) {
```

Find:

```tsx
        <BrandingText lines={['WYDARZENIE', 'SKNM · PK']} style={{ textAlign: 'left' }} />
```

Replace with:

```tsx
        <BrandingText lines={lang === 'en' ? ['EVENT', 'SKNM · PK'] : ['WYDARZENIE', 'SKNM · PK']} style={{ textAlign: 'left' }} />
```

Find:

```tsx
            {getMonthShort(event_date, { upperCase: true })}
```

Replace with:

```tsx
            {getMonthShort(event_date, { upperCase: true, lang })}
```

- [ ] **Step 10: Typecheck and run the full test suite**

Run: `npm run typecheck && npm test`
Expected: both pass.

- [ ] **Step 11: Manual verification — all 8 templates, both languages**

Run: `npm run dev`, open the app.
For each of the 8 templates (Wykład, Gość, Warsztat, Data, Konferencja, Rekrutacja, Gala, Ogłoszenie):
1. Select it.
2. Toggle to EN — confirm only the built-in label(s) from the table below change, dates switch to English month names, and nothing overflows or wraps awkwardly (the long-form org name's third EN line, `KRAKOW UNIVERSITY OF TECHNOLOGY`, is the longest addition — check it on both Gala and Rekrutacja).
3. Type something into the title/speaker/location/custom badge fields — confirm that text stays exactly as typed in both PL and EN.
4. Toggle back to PL — confirm everything reverts.

Expected text per template (EN column, PL is what's currently on `main`):

| Poster | Built-in text now in English |
|---|---|
| Wykład | Badge → `OPEN LECTURE`; org line → `SKNM / KRAKOW UNIVERSITY / OF TECHNOLOGY`; month → e.g. `SEP` |
| Ogłoszenie | Org line → `SKNM / KRAKOW UNIVERSITY / OF TECHNOLOGY` |
| Gość | Badge → `SKNM SEMINAR`; footer line → `Free entry · sknm.pk.edu.pl`; month → e.g. `SEP` |
| Warsztat | Badge → `WORKSHOP`; month pill → e.g. `Sep` |
| Konferencja | Header badge → `SKNM SEMINAR`; footer badge → `MORE INFORMATION`; full date → e.g. `20 September 2026` |
| Rekrutacja | Badge → `KICK-OFF MEETING`; org line → `STUDENT SCIENCE CLUB / OF MATHEMATICS / KRAKOW UNIVERSITY OF TECHNOLOGY`; month → e.g. `Sep` |
| Gala | Badge → `SKNM GALA`; org line → `STUDENT SCIENCE CLUB / OF MATHEMATICS / KRAKOW UNIVERSITY OF TECHNOLOGY`; month → e.g. `SEP` |
| Data | Branding line 1 → `EVENT`; month → e.g. `SEP` |

- [ ] **Step 12: Commit**

```bash
git add src/posters/blocks/BigDateNumber.tsx src/posters/PosterWyklad.tsx src/posters/PosterOgloszenie.tsx src/posters/PosterGosc.tsx src/posters/PosterWarsztat.tsx src/posters/PosterKonferencja.tsx src/posters/PosterRekrutacja.tsx src/posters/PosterGala.tsx src/posters/PosterData.tsx
git commit -m "Podłączenie przełącznika języka do wszystkich szablonów plakatów"
```
