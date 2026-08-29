# TypeScript Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the whole project (~44 `.js`/`.jsx` files) to strict TypeScript with explicit types everywhere, a real `tsc --noEmit` gate in `npm run build` and CI, and `check-schemes.mjs` ported to a vitest test.

**Architecture:** Leaf-first conversion (`git mv` per file). A `tsconfig` bridge (`allowJs: true, checkJs: false`) keeps `vite build` green the whole way and limits `tsc` errors to already-converted files; the final task flips `allowJs: false` and turns on the full gate. Shared domain types live in `src/types.ts`; the single `as` at the sql.js boundary is `rowsFromExec<T>`.

**Tech Stack:** Vite 8, React 19, TypeScript 5, vitest, sql.js (`@types/sql.js`), oxlint (TS plugin on by default — no config change). Deploy: `vite build` → GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-29-typescript-migration-design.md`

## Global Constraints

- **`strict: true`** plus `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`, `isolatedModules`, `verbatimModuleSyntax`, `moduleDetection: "force"`, `moduleResolution: "bundler"`, `jsx: "react-jsx"`, `noEmit: true`. NOT set: `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, a restrictive `types` array.
- **Zero implicit `any`.** No `any` in the codebase. The only assertion at the sql.js boundary is one `as unknown as T` inside `rowsFromExec<T>`. Two small casts (`as SygnetName | undefined`, `as LogoVariant | undefined`) are allowed inside `resolveScheme` only.
- **`verbatimModuleSyntax`** → every type-only import is `import type { … }`.
- **Naming:** the form-state interface is **`FormValues`**, NOT `FormData` (the spec's `FormData` collides with the DOM global and with the `FormData` *component* in `src/forms/FormData.tsx`). Use `FormValues` everywhere.
- **`null` guards, not `!`.** `strictNullChecks` will surface latent `null`/`undefined`; each gets a real guard. The one `!`/throw allowed: `document.getElementById('root')` in `main.tsx`.
- Comments in Polish with full diacritics. Match existing style: single quotes, no semicolons, 2-space indent. **Never run a code formatter.**
- `npm run lint` (oxlint) stays clean throughout.
- Commits end with:
  `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`
- Work on branch `typescript-migration` (already created; the spec is already committed there).

## Migration Recipe (shared context for Tasks 2–10)

Each conversion task renames a layer of files and adds types.

1. **Rename:** `git mv src/x/File.jsx src/x/File.tsx` (or `.js` → `.ts` for non-JSX). Preserves history.
2. **Imports:** drop `.jsx`/`.js` extensions from relative import specifiers (`./App.jsx` → `./App`). Bundler resolution handles extensionless. Keep `?url` / `.svg` / `.css` / `.wasm?url` specifiers verbatim.
3. **Types:** add an explicit props type next to each component (`interface FooProps { … }`, signature `function Foo({ … }: FooProps)`). No `React.FC`. Type every function's params and non-obvious returns. Import shared types from `src/types.ts` with `import type`.
4. **Guards:** apply the tricky-spot fix from this plan's task text (null checks, the sygnet fallback, etc.).
5. **Verify** (every task 2–10):
   ```
   npx tsc --noEmit && npx tsc --noEmit -p tsconfig.node.json   # only converted files can error
   npm run build
   npm run lint
   npm test
   ```
   All green. `tsc` errors from unconverted `.js` files should NOT appear (the `allowJs`/`checkJs:false` bridge); if one does, it means a converted file imported a `.js` module in a way that surfaced an inference gap — add a local `import type` or a minimal `.d.ts` note, don't convert extra files.
6. **Commit.**

**Transitional state is expected:** between Tasks 2 and 10 the tree is a `.ts`/`.js` mix. `vite build` stays green; `tsc` is only fully meaningful after Task 11.

**`src/types.ts` is delivered in Task 2** and is the reference for every later task. Its full content is in Task 2, Step 1.

---

### Task 1: TypeScript + vitest tooling

**Files:**
- Create: `tsconfig.json`, `tsconfig.node.json`, `src/vite-env.d.ts`
- Rename: `vite.config.js` → `vite.config.ts`
- Modify: `package.json`, `index.html`, `.gitignore`, `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: a compiling TS toolchain with the `allowJs` bridge; `npm test` (vitest, `passWithNoTests`); `npm run typecheck`. No `.ts` source files yet, so `tsc` is trivially green.

- [ ] **Step 1: Install devDependencies**

```bash
npm install -D typescript @types/sql.js "@types/node@^22" vitest
```

`@types/node@^22` — close to CI's Node 20, ahead enough for `node:zlib` `crc32`
(used by `generate-assets`). Expected: `package.json` devDependencies gains those
four; `package-lock.json` updates. (`@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `oxlint`, `vite` already present.)

- [ ] **Step 2: Create `tsconfig.json`**

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",

    "noEmit": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,

    // MOST na czas migracji — task 11 przestawia na false i usuwa checkJs.
    "allowJs": true,
    "checkJs": false
  },
  "include": ["src"]
}
```

`skipLibCheck: true` — `@types/sql.js` is community-maintained; don't fail the build on its internals. `esModuleInterop: true` — `@types/sql.js` uses `export =`, so `import initSqlJs from 'sql.js'` needs it (compatible with `verbatimModuleSyntax`). `typecheck` runs both tsconfigs explicitly, so no project `references` needed; editors pick up `tsconfig.node.json` via its own `include`.

- [ ] **Step 3: Create `tsconfig.node.json`**

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["node"],

    "noEmit": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "strict": true,
    "skipLibCheck": true,

    "allowJs": true,
    "checkJs": false
  },
  "include": ["vite.config.ts", "scripts/**/*.ts"]
}
```

- [ ] **Step 4: Create `src/vite-env.d.ts`**

```ts
/// <reference types="vite/client" />
```

This supplies types for `import x from '*.svg'` → `string`, `import x from '*?url'` → `string` (incl. `sql-wasm.wasm?url`), `import.meta.env`, and `import './x.css'`.

- [ ] **Step 5: Rename and type `vite.config.ts`**

```bash
git mv vite.config.js vite.config.ts
```

Add at the top: `/// <reference types="vitest/config" />`. `defineConfig` is already typed. Add a `test` block:

```ts
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
  },
```

(Task 3 removes `passWithNoTests` once `schemes.test.ts` lands.) Everything else in the file is unchanged.

- [ ] **Step 6: Update `package.json` scripts**

```json
"dev": "vite",
"build": "vite build",
"typecheck": "tsc --noEmit && tsc --noEmit -p tsconfig.node.json",
"test": "vitest run",
"lint": "oxlint",
"preview": "vite preview"
```

`build` stays `vite build` until Task 11 (so intermediate tasks deploy-check the same way). `typecheck` is available now for the per-task verify cycle.

- [ ] **Step 7: `.gitignore`**

Add a line: `*.tsbuildinfo`. **`index.html` is not touched in this task** — the
`/src/main.jsx` → `/src/main.tsx` swap happens in Task 9 alongside the rename, so
this task's `npm run build` stays green.

- [ ] **Step 8: `deploy.yml` — add typecheck + test steps**

In `.github/workflows/deploy.yml`, in the `build` job, **after** "Install dependencies" and **before** "Build":

```yaml
      - name: Typecheck
        run: npm run typecheck
      - name: Test
        run: npm test
```

- [ ] **Step 9: Verify**

```bash
npx tsc --noEmit && npx tsc --noEmit -p tsconfig.node.json   # 0 files, exits 0
npm run build      # vite build, unchanged, green
npm run lint       # green
npm test           # vitest: "No test files found" but passWithNoTests → exit 0
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "$(printf 'Add TypeScript + vitest tooling with an allowJs migration bridge\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

### Task 2: `src/types.ts` + leaf modules

**Files:**
- Create: `src/types.ts`
- Rename: `src/utils/formatDate.js` → `.ts`; `src/posters/theme.js` → `.ts`; `src/posters/logos.js` → `.ts`; `src/posters/fallback.js` → `.ts`

**Interfaces:**
- Produces: all shared domain types (`FormValues`, `FormTextField`, `LogoSlotValue`, `PhotoValue`, `ListItem`, `TemplateRow`, `DraftRow`, `HistoryRow`, `SygnetName`, `LogoVariant`, `ResolvedScheme`, `RawPosterData`, `PosterProps`, `FormProps`, `RegistryEntry`); typed `getDay`/`getMonthShort`/`formatFullDate`; typed `colors`/`typography`/`fontMono`/`fontHeading`/`placeholderBoxStyle`/`posterBaseStyle`; `sygnetByName: Record<SygnetName, string>`, `pkLogoLight`/`pkLogoDark`; `PLACEHOLDERS`, `withPlaceholders`.

- [ ] **Step 1: Create `src/types.ts`**

```ts
import type { ComponentType } from 'react'

// --- Dane formularza (stan edytora) ---
export interface LogoSlotValue { enabled: boolean; src: string | null }
export interface PhotoValue { src: string; x: number; y: number }
export type ListItem = Record<string, string>

export interface FormValues {
  title: string
  subtitle: string
  speaker: string
  event_date: string
  event_time: string
  location: string
  badge: string
  badge2: string
  logos: Record<string, LogoSlotValue>
  photos: Record<string, PhotoValue[]>
  lists: Record<string, ListItem[]>
}

// Pola tekstowe formularza — te, które faktycznie ustawia onFieldChange.
export type FormTextField =
  | 'title' | 'subtitle' | 'speaker'
  | 'event_date' | 'event_time' | 'location'
  | 'badge' | 'badge2'

// --- Wiersze SQLite (sql.js) ---
export interface TemplateRow { id: number; name: string; poster_key: string }

export interface DraftRow {
  id: number
  title: string | null
  subtitle: string | null
  speaker: string | null
  event_date: string | null
  event_time: string | null
  location: string | null
  badge: string | null
  badge2: string | null
  color_scheme: string | null
  template_id: number | null
  updated_at: string | null
}

export interface HistoryRow {
  id: number
  title: string | null
  subtitle: string | null
  speaker: string | null
  event_date: string | null
  event_time: string | null
  location: string | null
  color_scheme: string | null
  created_at: string
  template_id: number | null
  template_name: string | null
  template_poster_key: string | null
}

// --- Schematy kolorów ---
export type SygnetName = 'negatywny' | 'granat' | 'zloty' | 'szary' | 'czarny'
export type LogoVariant = 'light' | 'dark'

export interface ResolvedScheme {
  cssVars: Record<`--${string}`, string>
  sygnet: SygnetName | undefined
  logoVariant: LogoVariant | undefined
}

// --- Propsy plakatów / formularzy / rejestru ---
// `data` plakatu: fragment formularza (edytor / miniatury = {}), pola
// opcjonalne i null-tolerancyjne. HistoryRow wpasowuje się tu strukturalnie
// (pola tekstowe pokrywają się, nadmiarowe kolumny nie przeszkadzają).
export type RawPosterData = { [K in keyof FormValues]?: FormValues[K] | null }
export interface PosterProps { data: RawPosterData; scheme?: string }

export interface FormProps {
  value: FormValues
  onFieldChange: (name: FormTextField, value: string) => void
  onLogoChange: (slotKey: string, src: string | null) => void
  onLogoEnabledChange: (slotKey: string, checked: boolean) => void
  onPhotoAdd: (fieldKey: string, src: string | null) => void
  onPhotoChangeAt: (fieldKey: string, index: number, src: string | null) => void
  onPhotoPositionChangeAt: (fieldKey: string, index: number, partial: { x?: number; y?: number }) => void
  onListItemAdd: (fieldKey: string) => void
  onListItemChange: (fieldKey: string, index: number, subKey: string, val: string) => void
  onListItemRemove: (fieldKey: string, index: number) => void
}

export interface RegistryEntry {
  name: string
  Component: ComponentType<PosterProps>
  Form: ComponentType<FormProps>
  schemes?: string[]
}
```

- [ ] **Step 2: `src/utils/formatDate.ts`**

`git mv`. Types:

```ts
interface ParsedDate { year: number; month: number; day: number }

function parseDate(isoDate: string): ParsedDate | null {
  if (!isoDate) return null
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return null
  return { year, month, day }
}

export function getDay(isoDate: string): string { … }
export function getMonthShort(isoDate: string, { upperCase = false }: { upperCase?: boolean } = {}): string { … }
export function formatFullDate(isoDate: string): string { … }
```

`MONTHS_GENITIVE` / `MONTHS_SHORT` are `const` `string[]` — leave as-is (inferred `string[]`). Bodies unchanged.

- [ ] **Step 3: `src/posters/theme.ts`**

`git mv`. `colors`, `fontHeading`, `fontMono` — inference is fine (`Record<string,string>` / `string`); no annotation needed. `typography` — inferred object literal, fine. `placeholderBoxStyle` and `posterBaseStyle` are spread into `style={{…}}`: annotate both `: React.CSSProperties`:

```ts
import type { CSSProperties } from 'react'
export const placeholderBoxStyle: CSSProperties = { … }
export const posterBaseStyle: CSSProperties = { … }
```

(`position: 'relative'` etc. widen to `string` without the annotation, which then fails to spread into a `CSSProperties`.)

- [ ] **Step 4: `src/posters/logos.ts`**

`git mv`. The five `import x from '*.svg'` give `string` (vite/client). Type the map:

```ts
import type { SygnetName } from '../types'

export const sygnetByName: Record<SygnetName, string> = {
  negatywny: sygnetNegatywny,
  granat: sygnetGranat,
  zloty: sygnetZloty,
  szary: sygnetSzary,
  czarny: sygnetCzarny,
}
```

`export { default as pkLogoLight } from '…'` / `pkLogoDark` — unchanged.

- [ ] **Step 5: `src/posters/fallback.ts`**

`git mv`. `todayIso`/`nowTime` → `(): string`. `PLACEHOLDERS` — inferred (getters typed automatically). `withPlaceholders`:

```ts
import type { RawPosterData } from '../types'

export function withPlaceholders(data: RawPosterData) {
  return {
    title: data.title || PLACEHOLDERS.title,
    subtitle: data.subtitle,
    speaker: data.speaker || PLACEHOLDERS.speaker,
    event_date: data.event_date || PLACEHOLDERS.event_date,
    event_time: data.event_time || PLACEHOLDERS.event_time,
    location: data.location || PLACEHOLDERS.location,
    badge: data.badge,
    badge2: data.badge2,
    logos: data.logos ?? {},
    photos: data.photos ?? {},
    lists: data.lists ?? {},
  }
}
```

Return type is inferred (`title/speaker/event_*/location: string`; `subtitle/badge/badge2: string | null | undefined`; `logos/photos/lists`: the Record types). `|| {}` → `?? {}` (nullish is correct here and `verbatimModuleSyntax`-neutral).

- [ ] **Step 6: Verify** (recipe step 5) + **Commit**

```bash
git add -A
git commit -m "$(printf 'Add src/types.ts and convert leaf modules to TypeScript\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

### Task 3: `schemes.ts` + port `check-schemes` to vitest

**Files:**
- Rename: `src/posters/schemes.js` → `.ts`
- Create: `src/posters/schemes.test.ts`
- Delete: `scripts/check-schemes.mjs`
- Modify: `vite.config.ts` (drop `passWithNoTests`)

**Interfaces:**
- Consumes: `colors` (T2), `ResolvedScheme`/`SygnetName`/`LogoVariant` (T2).
- Produces: `schemes: Record<string, LayoutSchemes>`, `resolveScheme(layoutKey: string, name: string | undefined): ResolvedScheme`, `SCHEME_LABELS: Record<string, string>`.

- [ ] **Step 1: `src/posters/schemes.ts`**

`git mv`. **The eight scheme-block object literals, `SCHEME_LABELS`, and the
`rekrutacja.default = { ...rekrutacja.limonka }` line are byte-identical to the
current `schemes.js`.** The only edits: the extensionless `./theme` import (the
`.js` extension existed only for the deleted Node script; vitest resolves
extensionless), the `import type`, the `SchemeBlock`/`LayoutSchemes` types, the
`: LayoutSchemes` annotation on each of the 8 layout consts + the `schemes`
export, and the typed `resolveScheme` signature with its two index guards.

Add types:

```ts
import type { LogoVariant, ResolvedScheme, SygnetName } from '../types'

// Blok jednego schematu: dowolne role kolorów + opcjonalny sygnet/logoVariant.
interface SchemeBlock {
  sygnet?: SygnetName
  logoVariant?: LogoVariant
  [role: string]: string | undefined
}
type LayoutSchemes = Record<string, SchemeBlock>

const ogloszenie: LayoutSchemes = { /* … unchanged … */ }
const gala: LayoutSchemes = { /* … */ }
const gosc: LayoutSchemes = { /* … */ }
const data: LayoutSchemes = { /* … */ }
const wyklad: LayoutSchemes = { /* … */ }
const konferencja: LayoutSchemes = { /* … */ }
const rekrutacja: LayoutSchemes = { /* … */ }
const warsztat: LayoutSchemes = { /* … */ }
rekrutacja.default = { ...rekrutacja.limonka }   // działa: rekrutacja jest Record

export const schemes: Record<string, LayoutSchemes> = {
  ogloszenie, gala, gosc, data, wyklad, konferencja, rekrutacja, warsztat,
}

const roleToVar = (k: string): `--${string}` =>
  `--${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`
const NON_CSS = new Set(['sygnet', 'logoVariant'])

export function resolveScheme(layoutKey: string, name: string | undefined): ResolvedScheme {
  const layout = schemes[layoutKey] ?? {}
  const merged: SchemeBlock = { ...(layout.default ?? {}), ...(name ? layout[name] ?? {} : {}) }
  const cssVars: Record<`--${string}`, string> = {}
  for (const [k, v] of Object.entries(merged)) {
    if (v !== undefined && !NON_CSS.has(k)) cssVars[roleToVar(k)] = v
  }
  return {
    cssVars,
    sygnet: merged.sygnet as SygnetName | undefined,
    logoVariant: merged.logoVariant as LogoVariant | undefined,
  }
}

export const SCHEME_LABELS: Record<string, string> = { /* … unchanged … */ }
```

Note the `name ? layout[name] ?? {} : {}` — the old `layout[name]` with `name: undefined` was fine in JS; under TS, indexing with `string | undefined` needs the guard. Behaviour is identical (`layout[undefined]` was already `undefined`).

- [ ] **Step 2: `src/posters/schemes.test.ts`**

Port every assertion group from `scripts/check-schemes.mjs` into vitest. Shape:

```ts
import { describe, expect, it } from 'vitest'
import { SCHEME_LABELS, resolveScheme, schemes } from './schemes'
import { colors } from './theme'

describe('resolveScheme', () => {
  it('nieznany layout/schemat → pusty wynik', () => {
    const s = resolveScheme('nieistnieje', 'tez-nie')
    expect(s.cssVars).toEqual({})
    expect(s.sygnet).toBeUndefined()
    expect(s.logoVariant).toBeUndefined()
  })

  it('roleToVar: camelCase → --kebab, NON_CSS pomijane', () => {
    ;(schemes as Record<string, unknown>).__probe = {
      default: { pageBg: '#000', badgeFill: '#111', wedgeBr: '#222', tri1: '#333', logoVariant: 'dark' },
    }
    const s = resolveScheme('__probe', undefined)
    expect(s.cssVars['--page-bg']).toBe('#000')
    expect(s.cssVars['--badge-fill']).toBe('#111')
    expect(s.cssVars['--wedge-br']).toBe('#222')
    expect(s.cssVars['--tri1']).toBe('#333')
    expect(s.cssVars['--logo-variant']).toBeUndefined()
    expect(s.logoVariant).toBe('dark')
    delete (schemes as Record<string, unknown>).__probe
  })

  it('Ogłoszenie: nadpisania + dziedziczenie z default', () => { /* … te same asercje … */ })
  it('Gala (jeden schemat)', () => { /* … */ })
  it('Gość', () => { /* … */ })
  it('Data', () => { /* … */ })
  it('Wykład', () => { /* … */ })
  it('Konferencja', () => { /* … */ })
  it('Rekrutacja (default = limonka)', () => { /* … */ })
  it('Warsztat', () => { /* … */ })

  it('invariant: każdy layout ma default; każda para zwraca sygnet + logoVariant + niepusty cssVars', () => {
    for (const layout of Object.keys(schemes)) {
      const names = Object.keys(schemes[layout])
      expect(names, `${layout}: brak bloku default`).toContain('default')
      for (const name of names) {
        const s = resolveScheme(layout, name)
        expect(s.sygnet, `${layout}/${name}`).toBeTruthy()
        expect(['light', 'dark'], `${layout}/${name}`).toContain(s.logoVariant)
        expect(Object.keys(s.cssVars).length, `${layout}/${name}`).toBeGreaterThan(0)
      }
    }
  })
})

it('SCHEME_LABELS', () => {
  expect(SCHEME_LABELS.czern).toBe('Czerń')
})
```

Translate `assert.equal(a, b)` → `expect(a).toBe(b)`, `assert.deepEqual` → `toEqual`, `assert.ok(x, msg)` → `expect(x, msg).toBeTruthy()`. Copy the exact `colors.*` comparisons from the `.mjs` file — do not paraphrase them.

- [ ] **Step 3: Delete the old script + flag**

```bash
git rm scripts/check-schemes.mjs
```

In `vite.config.ts` remove `passWithNoTests: true` from the `test` block.

- [ ] **Step 4: Verify** — `npm test` runs `schemes.test.ts` and passes; recipe step 5. **Commit.**

```bash
git add -A
git commit -m "$(printf 'Convert schemes.js to TS and port check-schemes to a vitest test\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

### Task 4: DB layer

**Files:**
- Rename: `src/db/{utils,templates,client,drafts,history,schema}.js` → `.ts`
- Optional create: `src/db/schema.test.ts`

**Interfaces:**
- Consumes: `TemplateRow`/`DraftRow`/`HistoryRow` (T2).
- Produces: `rowsFromExec<T>(res: QueryExecResult[] | undefined): T[]`; typed `getDb(): Promise<Database>`, `persist(db: Database): Promise<void>`, `listTemplates(db): TemplateRow[]`, `getDraft(db): DraftRow | null`, `saveDraft(db, draft: Partial<DraftRow>): Promise<void>`, `listHistory(db): HistoryRow[]`, `addHistoryEntry(db, entry): Promise<void>`, `deleteHistoryEntry(db, id: number): Promise<void>`, `resetIfStale(db): boolean`, `createSchema(db): void`, `syncTemplates(db): boolean`, `DEFAULT_TEMPLATES`, `SCHEMA_VERSION`.

- [ ] **Step 1: `src/db/utils.ts`**

```ts
import type { QueryExecResult } from 'sql.js'

export function rowsFromExec<T>(execResult: QueryExecResult[] | undefined): T[] {
  if (!execResult || execResult.length === 0) return []
  const { columns, values } = execResult[0]
  return values.map((row) =>
    Object.fromEntries(row.map((value, i) => [columns[i], value])),
  ) as unknown as T[]
}
```

The `as unknown as T[]` is the **only** boundary assertion.

- [ ] **Step 2: `src/db/schema.ts`**

`git mv`. Types:

```ts
import type { Database } from 'sql.js'
import { rowsFromExec } from './utils'

export const DEFAULT_TEMPLATES: ReadonlyArray<{ name: string; poster_key: string }> = [ /* … */ ]
export const SCHEMA_VERSION = 2

export function resetIfStale(db: Database): boolean {
  const [row] = rowsFromExec<Record<string, number>>(db.exec('PRAGMA user_version'))
  const current = row ? Number(Object.values(row)[0] ?? 0) : 0
  if (current >= SCHEMA_VERSION) return false
  db.run('DROP TABLE IF EXISTS generated_images; DROP TABLE IF EXISTS draft; DROP TABLE IF EXISTS templates;')
  db.run(`PRAGMA user_version = ${SCHEMA_VERSION}`)
  return true
}

export function createSchema(db: Database): void { /* body unchanged */ }

export function syncTemplates(db: Database): boolean {
  const existingKeys = new Set(
    rowsFromExec<{ poster_key: string }>(db.exec('SELECT poster_key FROM templates')).map((r) => r.poster_key),
  )
  const missing = DEFAULT_TEMPLATES.filter((t) => !existingKeys.has(t.poster_key))
  if (missing.length === 0) return false
  const stmt = db.prepare('INSERT INTO templates (name, poster_key) VALUES (:name, :poster_key)')
  for (const t of missing) stmt.run({ ':name': t.name, ':poster_key': t.poster_key })
  stmt.free()
  return true
}
```

(`Object.values(row)[0]` can type as `number | undefined`; the `?? 0` keeps it a `number`.)

- [ ] **Step 3: `src/db/client.ts`**

```ts
import initSqlJs, { type Database } from 'sql.js'
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import { get, set } from 'idb-keyval'
import { createSchema, resetIfStale, syncTemplates } from './schema'

const DB_STORAGE_KEY = 'sknm-image-generator-db'
let dbPromise: Promise<Database> | null = null

async function initDb(): Promise<Database> {
  const SQL = await initSqlJs({ locateFile: () => sqlWasmUrl })
  const saved = await get<Uint8Array | ArrayBuffer>(DB_STORAGE_KEY)
  const db = saved ? new SQL.Database(new Uint8Array(saved as ArrayBufferLike)) : new SQL.Database()
  const wiped = resetIfStale(db)
  createSchema(db)
  const templatesChanged = syncTemplates(db)
  if (!saved || wiped || templatesChanged) void persist(db)
  return db
}

export function getDb(): Promise<Database> {
  if (!dbPromise) dbPromise = initDb()
  return dbPromise
}

export async function persist(db: Database): Promise<void> {
  await set(DB_STORAGE_KEY, db.export())
}
```

`get<T>` from `idb-keyval` is generic. `new Uint8Array(saved)` — `saved` is `Uint8Array | ArrayBuffer | undefined`; `new Uint8Array(x)` needs `ArrayBufferLike | ...`; the `as ArrayBufferLike` keeps it honest enough (IndexedDB round-trips a `Uint8Array` as an `ArrayBuffer`). `void persist(db)` documents the intentional fire-and-forget (pre-existing behaviour).

- [ ] **Step 4: `src/db/templates.ts`, `src/db/drafts.ts`, `src/db/history.ts`**

- `templates.ts`: `export function listTemplates(db: Database): TemplateRow[] { return rowsFromExec<TemplateRow>(db.exec('…')) }`
- `drafts.ts`: `getDraft(db: Database): DraftRow | null` → `rowsFromExec<DraftRow>(…)[0] ?? null`. `saveDraft(db: Database, draft: Partial<DraftRow>): Promise<void>` — the param object stays; `?? ''` / `?? null` already handle `undefined`. `db.run(sql, params)` — `params` type is `BindParams`; the `{ ':title': … }` object is `Record<string, string | number | null>` which is a valid `BindParams`.
- `history.ts`: `listHistory(db: Database): HistoryRow[]`. `addHistoryEntry(db: Database, entry: Partial<HistoryRow> & { template_id?: number | null }): Promise<void>` — actually the call site passes `{ ...form, template_id, color_scheme }` (form fields + those two); type the param `Partial<Pick<HistoryRow, 'title'|'subtitle'|'speaker'|'event_date'|'event_time'|'location'|'color_scheme'|'template_id'>>`. `deleteHistoryEntry(db: Database, id: number): Promise<void>`.

- [ ] **Step 5 (optional): `src/db/schema.test.ts`**

If `sql.js` loads in the vitest `node` env within ~20 min of effort, add a test for `resetIfStale` (fresh DB → `true`, drops nothing harmful; second call at v2 → `false`) and `rowsFromExec` shape. Likely `locateFile`:

```ts
import initSqlJs from 'sql.js'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm')
const SQL = await initSqlJs({ locateFile: () => wasmPath })
```

If it fights the environment, **skip it** — note why in the task report. The DB *types* are the deliverable; new tests are a bonus.

- [ ] **Step 6: Verify + Commit**

```bash
git add -A
git commit -m "$(printf 'Convert the DB layer to TypeScript with typed row shapes\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

### Task 5: Poster infrastructure (blocks + slot helpers + export)

**Files:**
- Rename: `src/posters/blocks/{PosterFrame,Badge,BigDateNumber,BrandingText,InfoLine,LogoRow}.jsx` → `.tsx`; `src/posters/{LogoSlot,PhotoGallery,PlaceholderBox}.jsx` → `.tsx`; `src/posters/export.js` → `.ts`

**Interfaces:**
- Consumes: `theme` (T2), `formatDate` (T2), `LogoSlotValue`/`PhotoValue`/`LogoVariant` (T2).
- Produces: typed block components; `downloadPosterAsPng(node: HTMLElement, filename: string, formatKey?: string): Promise<void>`, `EXPORT_FORMATS`.

- [ ] **Step 1: Blocks** — each gets a local props type. Exact shapes:

```ts
import type { CSSProperties, ReactNode } from 'react'

// PosterFrame
interface PosterFrameProps { vars?: Record<`--${string}`, string>; padding?: number; style?: CSSProperties; children: ReactNode }
// spread `...vars` into the style object — see "Tricky spots / CSS custom properties".

// Badge
interface BadgeProps { children: ReactNode; color?: string; background?: string; style?: CSSProperties }

// BigDateNumber
interface BigDateNumberProps { event_date: string; color?: string; style?: CSSProperties }

// BrandingText
interface BrandingTextProps { lines: string[]; color?: string; opacity?: number; style?: CSSProperties }

// InfoLine
interface InfoLineProps {
  parts: ReadonlyArray<string | null | undefined | false>
  secondLine?: ReactNode
  separator?: string
  style?: CSSProperties
}

// LogoRow
interface LogoRowProps { gap?: number; alignItems?: CSSProperties['alignItems']; children: ReactNode; style?: CSSProperties }
```

Bodies unchanged. `parts.filter(Boolean)` narrows to `string[]` — `.join()` fine.

- [ ] **Step 2: `LogoSlot.tsx`, `PhotoGallery.tsx`, `PlaceholderBox.tsx`**

```ts
import type { CSSProperties, ReactNode } from 'react'
import type { LogoSlotValue, LogoVariant, PhotoValue } from '../types'

interface LogoSlotProps { logo?: LogoSlotValue; variant?: LogoVariant; width?: number; height?: number; style?: CSSProperties }
// `variant = 'light'` default already handles `variant={s.logoVariant}` when logoVariant is undefined.

interface PhotoGalleryProps {
  photos?: PhotoValue[]
  label?: ReactNode
  style?: CSSProperties
  placeholderStyle?: CSSProperties
  labelStyle?: CSSProperties
  children?: ReactNode
}
// `(photos ?? []).filter((p) => p?.src)` — `p: PhotoValue`, `p?.src` fine.

interface PlaceholderBoxProps { label?: ReactNode; width?: number; height?: number; style?: CSSProperties }
```

- [ ] **Step 3: `export.ts`** — the null-guard-heavy file:

```ts
import { toPng } from 'html-to-image'

export interface ExportFormat { label: string; width: number; height: number }
export const EXPORT_FORMATS: Record<string, ExportFormat> = { square: {…}, story: {…} }

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e instanceof Error ? e : new Error('image load failed'))
    img.src = src
  })
}

async function compositeOnCanvas(posterDataUrl: string, width: number, height: number): Promise<string> {
  const img = await loadImage(posterDataUrl)
  if (width === img.width && height === img.height) return posterDataUrl

  const srcCanvas = document.createElement('canvas')
  srcCanvas.width = img.width
  srcCanvas.height = img.height
  const srcCtx = srcCanvas.getContext('2d')
  if (!srcCtx) throw new Error('brak kontekstu 2d')
  srcCtx.drawImage(img, 0, 0)
  const [r, g, b, a] = srcCtx.getImageData(4, 4, 1, 1).data   // Uint8ClampedArray → number

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('brak kontekstu 2d')
  ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, (width - img.width) / 2, (height - img.height) / 2)
  return canvas.toDataURL('image/png')
}

export async function downloadPosterAsPng(node: HTMLElement, filename: string, formatKey = 'square'): Promise<void> {
  const format = EXPORT_FORMATS[formatKey] ?? EXPORT_FORMATS.square
  const posterDataUrl = await toPng(node, { width: 1080, height: 1080, pixelRatio: 1 })
  const dataUrl = await compositeOnCanvas(posterDataUrl, format.width, format.height)
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}
```

`getImageData(...).data` is `Uint8ClampedArray`; `const [r,g,b,a]` → each `number`.

- [ ] **Step 4: Verify + Commit**

```bash
git add -A
git commit -m "$(printf 'Convert poster blocks, slot helpers and PNG export to TypeScript\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

### Task 6: The 8 poster components

**Files:**
- Rename: `src/posters/Poster{Wyklad,Gosc,Warsztat,Data,Konferencja,Rekrutacja,Gala,Ogloszenie}.jsx` → `.tsx`

**Interfaces:**
- Consumes: `PosterProps` (T2), `resolveScheme` (T3), `withPlaceholders` (T2), `sygnetByName` (T2), blocks (T5).
- Produces: 8 `(props: PosterProps) => JSX.Element` components, each assignable to `ComponentType<PosterProps>`.

- [ ] **Step 1: Convert each poster** — they share one shape. For each:

- `git mv` to `.tsx`, drop `.jsx`/`.js` from relative imports.
- Signature: `export function PosterWyklad({ data, scheme }: PosterProps)`.
- The sygnet index: `<img src={sygnetByName[s.sygnet ?? 'negatywny']} … />`. (`s.sygnet` is `SygnetName | undefined`; every real layout `default` sets it, so the `?? 'negatywny'` is unreachable at runtime but satisfies the index type. Do this in all 8.)
- `<LogoSlot … variant={s.logoVariant} …>` — `LogoSlotProps.variant?: LogoVariant`, accepts `undefined` (defaults to `'light'`). No change needed.
- Per-file `colors` import:
  - **PosterKonferencja.tsx**: keeps `import { colors, fontMono } from './theme'` — `colors.coral` (agenda time), `fontMono` (styles). The `agenda` fallback: `const agenda = lists.agenda?.length ? lists.agenda : DEFAULT_AGENDA` — type `DEFAULT_AGENDA: ListItem[]`. `agenda.map((item, i) => …)` — `item: ListItem`, `item.time`/`item.title`/`item.subtitle` are `string`.
  - **PosterGosc.tsx**: keeps `import { colors } from './theme'` (`colors.coral`/`colors.cream` for the fixed date box).
  - **PosterData.tsx**: keeps `import { colors, fontMono } from './theme'` (`colors.coral` month label; check `fontMono` usage).
  - **PosterWyklad / PosterWarsztat / PosterRekrutacja / PosterGala / PosterOgloszenie**: `colors` likely unused (they're fully var-driven). Remove the import if `oxlint` / `noUnusedLocals` flags it; keep `fontMono` where used (Konferencja, Data, Gala, Ogloszenie, Rekrutacja use `fontMono` in `Badge`/text styles — verify per file).
- `PosterWarsztat.tsx` local `function Pill({ children }: { children: ReactNode })`.
- `PosterKonferencja.tsx` `DEFAULT_AGENDA` — `const DEFAULT_AGENDA: ListItem[] = [ { time: '09:30', title: '…', subtitle: '…' }, … ]`.
- `withPlaceholders(data)` returns an inferred object; destructured pieces flow into blocks with matching types. `event_date`/`event_time`/`location` are `string`; `badge`/`badge2`/`subtitle` are `string | null | undefined` — blocks accept that (`InfoLine.secondLine?: ReactNode`, `{badge || 'X'}`).
- `photos.photo` (Gosc/Data/Warsztat): `photos: Record<string, PhotoValue[]>` → `photos.photo: PhotoValue[]` → `<PhotoGallery photos={photos.photo} />` matches `photos?: PhotoValue[]`.

- [ ] **Step 2: Verify** — `npx tsc --noEmit` clean for all 8; `npm run build`; `npm run lint`; `npm test`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "$(printf 'Convert the 8 poster components to TypeScript\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

### Task 7: Forms

**Files:**
- Rename: `src/forms/{FormField,LogoField,PhotoGalleryField}.jsx` → `.tsx`; `src/forms/Form{Wyklad,Gosc,Warsztat,Data,Konferencja,Rekrutacja,Gala,Ogloszenie}.jsx` → `.tsx`

**Interfaces:**
- Consumes: `FormProps`/`FormValues`/`FormTextField`/`PhotoValue` (T2), `PLACEHOLDERS` (T2), `ImageUpload` (T8 — but `LogoField`/`PhotoGalleryField` import it; **`ImageUpload` is converted in Task 8**, so during this task those two import a still-`.jsx` module — the `allowJs` bridge covers it, its props inferred loosely. That's fine; Task 8 tightens it.).
- Produces: 8 `(props: FormProps) => JSX.Element` form components; `FormField`, `LogoField`, `PhotoGalleryField` typed.

- [ ] **Step 1: Shared field components**

```ts
import type { ReactNode } from 'react'

// FormField
interface FormFieldProps {
  type: string
  label: ReactNode
  placeholder?: string
  value: string
  onChange: (value: string) => void
}
// `value={value ?? ''}` — value is `string`; keep `?? ''` harmless or drop it.

// LogoField
interface LogoFieldProps {
  fieldKey: string
  label: string
  value: FormValues
  onChange: (fieldKey: string, src: string | null) => void
  onEnabledChange: (fieldKey: string, checked: boolean) => void
}
// `const logo = value.logos[fieldKey]` → `LogoSlotValue` (or undefined at runtime; the `?.` chains handle it — type it `LogoSlotValue | undefined` by reading `value.logos[fieldKey] as LogoSlotValue | undefined`? No — Record index gives `LogoSlotValue`. Leave it; `logo?.src` still type-checks.)

// PhotoGalleryField
interface PhotoGalleryFieldProps {
  fieldKey: string
  label: string
  max?: number
  value: FormValues
  onAdd: (fieldKey: string, src: string | null) => void
  onChangeAt: (fieldKey: string, index: number, src: string | null) => void
  onPositionChangeAt: (fieldKey: string, index: number, partial: { x?: number; y?: number }) => void
}
```

- [ ] **Step 2: The 8 form components** — each: `git mv` to `.tsx`, `export function FormWyklad({ value, onFieldChange, … }: FormProps)` (destructure only what the form uses; the param type is the full `FormProps`). `onFieldChange('badge', v)` — `'badge'` is a `FormTextField` literal ✓. `FormKonferencja` / `FormData` / `FormGosc` / `FormWarsztat` also use list/photo handlers — all in `FormProps`. `value.lists.agenda ?? []` → `ListItem[]`; `item.time ?? ''` etc. fine.

- [ ] **Step 3: Verify + Commit**

```bash
git add -A
git commit -m "$(printf 'Convert form components to TypeScript\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

### Task 8: Registry + components

**Files:**
- Rename: `src/posters/registry.js` → `.ts`; `src/components/{ImageUpload,PosterScaled,PosterPreview,TemplateSelector,HistoryList}.jsx` → `.tsx`

**Interfaces:**
- Consumes: `RegistryEntry`/`PosterProps`/`FormProps`/`PhotoValue`/`HistoryRow`/`TemplateRow` (T2), all 8 posters (T6), all 8 forms (T7), `resolveScheme`/`SCHEME_LABELS` (T3).
- Produces: `posterRegistry: Record<string, RegistryEntry>`; typed `ImageUpload`, `PosterScaled` (`forwardRef<HTMLDivElement>`), `PosterPreview`, `TemplateSelector`, `HistoryList`.

- [ ] **Step 1: `registry.ts`**

`git mv`, drop extensions from imports. `export const posterRegistry: Record<string, RegistryEntry> = { … }` — the object literal is unchanged. This annotation forces all 8 `Component` values to be `ComponentType<PosterProps>` and all 8 `Form` values `ComponentType<FormProps>` — the first real cross-check that the poster/form signatures are consistent. Fix any mismatch in the owning file (likely none if Tasks 6–7 used `PosterProps`/`FormProps`).

- [ ] **Step 2: `ImageUpload.tsx`** (the biggest component conversion)

```ts
import { useRef } from 'react'
import type { ChangeEvent, PointerEvent, ReactNode } from 'react'

interface ImageUploadProps {
  label: string
  hint?: string
  value: string | null
  onChange: (src: string | null) => void
  enabled?: boolean
  onEnabledChange?: (checked: boolean) => void
  position?: { x: number; y: number }
  onPositionChange?: (partial: { x?: number; y?: number }) => void
}

interface DragState { startX: number; startY: number; startPosX: number; startPosY: number; rect: DOMRect }

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)   // readAsDataURL zawsze daje string
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.readAsDataURL(file)
  })
}
```

- `const dragState = useRef<DragState | null>(null)`
- `handleFile = async (e: ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; e.target.value = ''; if (!file) return; onChange(await readAsDataUrl(file)) }`
- `handlePointerDown = (e: PointerEvent<HTMLDivElement>) => …` — `e.currentTarget.getBoundingClientRect()` → `DOMRect`.
- `handlePointerMove = (e: PointerEvent<HTMLDivElement>) => …`
- Range inputs `onChange={(e) => onPositionChange({ x: Number(e.target.value) })}` — `e: ChangeEvent<HTMLInputElement>` inferred.

- [ ] **Step 3: `PosterScaled.tsx`**

```ts
import { forwardRef } from 'react'
import type { ReactNode } from 'react'

interface PosterScaledProps { size: number; children: ReactNode }

export const PosterScaled = forwardRef<HTMLDivElement, PosterScaledProps>(
  function PosterScaled({ size, children }, innerRef) { /* body unchanged */ },
)
```

- [ ] **Step 4: `PosterPreview.tsx`**

```ts
import type { ComponentType, RefObject } from 'react'
import type { PosterProps, RawPosterData } from '../types'

interface PosterPreviewProps {
  posterRef: RefObject<HTMLDivElement | null>
  Component?: ComponentType<PosterProps>
  data: RawPosterData
  scheme?: string
}
```

`<PosterScaled ref={posterRef} …>` — `posterRef` is `RefObject<HTMLDivElement | null>` matching `forwardRef<HTMLDivElement>`.

- [ ] **Step 5: `TemplateSelector.tsx`**

```ts
import type { TemplateRow } from '../types'
import type { RawPosterData } from '../types'

interface TemplateSelectorProps {
  templates: TemplateRow[]
  selectedId: number | null
  selectedScheme: string | undefined
  onSelect: (id: number) => void
  onSelectScheme: (name: string) => void
}

const THUMB_DATA: RawPosterData = {}
```

`const SwatchComponent = selectedEntry?.Component` → `ComponentType<PosterProps> | undefined`; it's only rendered inside `schemeList.length > 1 &&` where `selectedEntry` is defined, but TS needs help: render `{schemeList.length > 1 && SwatchComponent && ( … <SwatchComponent … /> … )}` (add the `&& SwatchComponent`).

- [ ] **Step 6: `HistoryList.tsx`**

```ts
import type { HistoryRow } from '../types'

interface HistoryListProps {
  entries: HistoryRow[]
  onRestore: (entry: HistoryRow) => void
  onDelete: (id: number) => void
}
```

`<Component data={entry} scheme={entry.color_scheme ?? undefined} />` — `entry: HistoryRow` is structurally assignable to `RawPosterData` (overlapping text fields are `string | null`; extra columns are allowed on a variable). The **only** change from JS: `scheme={entry.color_scheme}` → `scheme={entry.color_scheme ?? undefined}` (`string | null` → `string | undefined`).

- [ ] **Step 7: Verify + Commit**

```bash
git add -A
git commit -m "$(printf 'Convert registry and UI components to TypeScript\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

### Task 9: App shell

**Files:**
- Rename: `src/App.jsx` → `.tsx`; `src/pages/PosterPreviewPage.jsx` → `.tsx`; `src/main.jsx` → `.tsx`
- Modify: `index.html`

**Interfaces:**
- Consumes: everything.
- Produces: fully typed `App`, `PosterPreviewPage`, `main` entrypoint.

- [ ] **Step 1: `App.tsx`**

`git mv`, drop import extensions (`./App.jsx` n/a here; `./db/client` etc. already extensionless). Types:

```ts
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Database } from 'sql.js'
import type { FormValues, FormTextField, HistoryRow, PhotoValue, TemplateRow } from './types'

const EMPTY_FORM: FormValues = { title: '', subtitle: '', /* … */ logos: {}, photos: {}, lists: {} }

function defaultSchemeFor(templateId: number | null, templates: TemplateRow[]): string | undefined {
  const tpl = templates.find((t) => t.id === templateId)
  return tpl ? posterRegistry[tpl.poster_key]?.schemes?.[0] : undefined
}

function App() {
  const dbRef = useRef<Database | null>(null)
  const posterRef = useRef<HTMLDivElement | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [ready, setReady] = useState(false)
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [selectedScheme, setSelectedScheme] = useState<string | undefined>(undefined)
  const [form, setForm] = useState<FormValues>(EMPTY_FORM)
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [exportFormat, setExportFormat] = useState('square')
  …
```

Handler types (match `FormProps`):
- `handleFieldChange = (name: FormTextField, value: string) => { setForm((prev) => { const next = { ...prev, [name]: value }; … }) }` — `[name]: value` with `name: FormTextField` (all `string`-valued keys) + `value: string` → OK.
- `handleLogoChange = (slotKey: string, src: string | null) => …`; `current` typed `prev.logos[slotKey] ?? { enabled: true, src: null }` → `LogoSlotValue`.
- `handleLogoEnabledChange = (slotKey: string, checked: boolean) => …`
- `handlePhotoAdd = (fieldKey: string, src: string | null) => { if (!src) return; … [...list, { src, x: 50, y: 50 }] … }` — `{ src, x, y }` is `PhotoValue`.
- `handlePhotoChangeAt = (fieldKey: string, index: number, src: string | null) => …` — `src ? list.map(...) : list.filter(...)`.
- `handlePhotoPositionChangeAt = (fieldKey: string, index: number, partial: { x?: number; y?: number }) => …` — `{ ...p, ...partial }` → `PhotoValue` (partial only narrows x/y).
- `handleListItemAdd/Change/Remove` typed per `FormProps`. `[...list, {}]` — `{}` as `ListItem`? `Record<string, string>` — `{}` is assignable. OK.
- `handleSelectTemplate = (id: number) => …`, `handleSelectScheme = (name: string) => …`
- `handleRestoreHistoryEntry = (entry: HistoryRow) => …` — builds a `FormValues` from `entry.title ?? ''` etc.
- `handleDeleteHistoryEntry = async (id: number) => …`
- `handleDownload = async () => …` — guarded by `if (!selectedTemplate || !posterRef.current || !dbRef.current) return`; after the guard `posterRef.current` is `HTMLDivElement`, `dbRef.current` is `Database`.
- `<select onChange={(e) => setExportFormat(e.target.value)}>` — `e: ChangeEvent<HTMLSelectElement>` inferred.
- `EXPORT_FORMATS` is now `Record<string, ExportFormat>` (T5) → `Object.entries(EXPORT_FORMATS)` → `[string, ExportFormat][]` ✓.
- `<PosterPreview posterRef={posterRef} Component={selectedPoster?.Component} data={form} scheme={selectedScheme} />` — `form: FormValues` assignable to `RawPosterData` ✓.
- `SelectedForm` is `ComponentType<FormProps> | undefined`; `{SelectedForm && <SelectedForm value={form} onFieldChange={handleFieldChange} … />}` — all 9 handlers passed, types match `FormProps`.

- [ ] **Step 2: `PosterPreviewPage.tsx`**

```ts
interface PosterPreviewPageProps { posterKey: string; scheme?: string }
```

`const poster = posterRegistry[posterKey]` → `RegistryEntry` (Record index). `if (!poster) return …` narrows. `const { Component, name } = poster`. `withPlaceholders({})` → the empty object is `RawPosterData` ✓.

- [ ] **Step 3: `main.tsx` + `index.html`**

```ts
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './assets/fonts/fonts.css'
import './App.css'
import App from './App'
import { PosterPreviewPage } from './pages/PosterPreviewPage'

const base = import.meta.env.BASE_URL
const path = window.location.pathname.startsWith(base)
  ? window.location.pathname.slice(base.length - 1)
  : window.location.pathname
const posterMatch = path.match(/^\/poster\/([^/]+)(?:\/([^/]+))?\/?$/)

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('brak #root')

createRoot(rootEl).render(
  <StrictMode>
    {posterMatch ? <PosterPreviewPage posterKey={posterMatch[1]} scheme={posterMatch[2]} /> : <App />}
  </StrictMode>,
)
```

`posterMatch[1]` is `string` (after the `posterMatch ?` check, the array is defined; element `[1]` is `string` because group 1 is non-optional in the regex — but TS types `RegExpMatchArray` elements as `string` for `[number]` access, actually `string | undefined` is NOT the default... `RegExpMatchArray[number]` is `string`. Good. `[2]` is also `string` to TS but `undefined` at runtime when the optional group doesn't match — `PosterPreviewPage.scheme?: string` tolerates it; no cast needed, but if you want honesty: `scheme={posterMatch[2] || undefined}`).

`index.html`: `<script … src="/src/main.jsx">` → `/src/main.tsx`.

- [ ] **Step 4: Verify** — `npm run build` (Vite now resolves `/src/main.tsx`), `npm run dev` smoke if a browser is available (else reason it through), `npx tsc --noEmit`, `npm run lint`, `npm test`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(printf 'Convert App shell (App, main, preview page) to TypeScript\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

### Task 10: `scripts/generate-assets.ts`

**Files:**
- Rename: `scripts/generate-assets.mjs` → `.ts`

- [ ] **Step 1: Convert**

`git mv`. Add types:

```ts
function chunk(type: string, data: Buffer): Buffer { … }
function encodePng(width: number, height: number, pixelFn: (x: number, y: number) => [number, number, number]): Buffer { … }
const brand: [number, number, number] = [37, 99, 235]
```

`raw[offset++] = 0` etc. — `Buffer` index assignment is `number`, fine. `Buffer.from`, `Buffer.alloc`, `Buffer.concat`, `deflateSync`, `crc32`, `writeFileSync` — typed via `@types/node`. `import { deflateSync, crc32 } from 'node:zlib'` — `@types/node` has `crc32` in recent versions; if not, `import zlib from 'node:zlib'` and `zlib.crc32` with a fallback note.

- [ ] **Step 2: Verify** — it is in `tsconfig.node.json`'s include, so `npx tsc --noEmit -p tsconfig.node.json` must be clean. Run it for real to confirm output is unchanged:

```bash
node scripts/generate-assets.ts
git status public/icons/    # expect: no diff — bytes identical
```

(Node v25 runs `.ts` natively; the file has only `node:*` imports.)

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "$(printf 'Convert the PWA icon generator script to TypeScript\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

### Task 11: Flip the bridge + wire the gate

**Files:**
- Modify: `tsconfig.json`, `tsconfig.node.json`, `package.json`

- [ ] **Step 1: Turn off `allowJs`**

In `tsconfig.json` and `tsconfig.node.json`: remove `"allowJs": true` and `"checkJs": false`. Now `tsc` type-checks the entire tree with full strict.

- [ ] **Step 2: Full typecheck — fix the stragglers**

```bash
npm run typecheck
```

Expected: **clean.** If it surfaces errors, they are (a) a `.js`/`.mjs` file nobody converted — convert it now (there should be none: `git ls-files 'src/**/*.js' 'src/**/*.jsx'` must be empty), or (b) a real type hole a converted file papered over via a loose `.js` import — fix it properly. Do NOT re-add `allowJs`.

```bash
git ls-files 'src/*.js' 'src/*.jsx' 'src/**/*.js' 'src/**/*.jsx'   # expect: nothing
git grep -nE "from '[^']*\.jsx?'" -- src   # expect: nothing (all extensionless)
```

- [ ] **Step 3: Wire the gate into `build`**

`package.json`:

```json
"build": "npm run typecheck && vite build",
```

(`typecheck` runs both tsconfigs.)

- [ ] **Step 4: Full verification**

```bash
npm run typecheck   # clean
npm test            # green
npm run build       # typecheck + vite build, green
npm run lint        # clean
```

`npm run dev` — manual smoke (load `/`, pick a layout, pick a scheme, `/poster/gosc/czern`). If the Claude-in-Chrome extension is unavailable and no user is present, note that the live smoke was not run and recommend the reviewer/user do a 2-minute pass.

- [ ] **Step 5: Commit**

```bash
git add tsconfig.json tsconfig.node.json package.json
git commit -m "$(printf 'Turn off the allowJs bridge and gate the build on tsc\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

## Tricky Spots (cross-task reference)

- **`sygnetByName[s.sygnet]`** (8 posters): `s.sygnet` is `SygnetName | undefined`; index with `s.sygnet ?? 'negatywny'`. Runtime-unreachable fallback (every layout `default` sets `sygnet`), type-required.
- **`resolveScheme` casts**: `merged.sygnet as SygnetName | undefined`, `merged.logoVariant as LogoVariant | undefined` — the two allowed casts, because `SchemeBlock`'s index signature is `string | undefined` for arbitrary roles.
- **CSS custom properties**: `PosterFrame` spreads `...vars` (`Record<\`--${string}\`, string>`) into a `style={{…}}` object. `@types/react@19` `CSSProperties` **does** allow `--${string}` keys, so this type-checks. If a specific `tsc` version rejects it, the fallback is `style={{ … } as CSSProperties}` on that one div — do NOT loosen the `vars` type.
- **sql.js `PRAGMA user_version`**: `rowsFromExec<Record<string, number>>` then `Number(Object.values(row)[0] ?? 0)`.
- **`get<T>` from idb-keyval**: `get<Uint8Array | ArrayBuffer>(KEY)`; `new Uint8Array(saved as ArrayBufferLike)`.
- **`FileReader.result`**: `readAsDataURL` → always a string; `resolve(reader.result as string)`.
- **`getContext('2d')`**: `| null` — throw-guard at all 3 sites in `export.ts`.
- **`document.getElementById('root')`**: the one `throw` guard (`main.tsx`).
- **`HistoryRow` → poster `data`**: assignable to `RawPosterData` structurally; only `scheme={entry.color_scheme ?? undefined}` needs the nullish coalesce.
- **`FormData` name**: the interface is `FormValues`. `src/forms/FormData.tsx` still exports a component named `FormData` — that's fine, different module, and `registry.ts` imports it as a value.
- **`verbatimModuleSyntax`**: `import type` for every type-only import; `import initSqlJs, { type Database } from 'sql.js'` for the mixed case.
- **sql.js type imports** (Task 4 finalises): `@types/sql.js` is `export =`. With `esModuleInterop: true` (set in `tsconfig.json`), `import initSqlJs from 'sql.js'` works. For `Database` / `QueryExecResult` / `SqlValue` / `Statement` / `BindParams`: first try `import initSqlJs, { type Database, type QueryExecResult } from 'sql.js'`; if the named type imports don't resolve against the `export =` shape, fall back to `import type * as SqlJs from 'sql.js'` and use `SqlJs.Database` etc. Task 4's `tsc`-clean gate proves whichever form is used.
- **`forwardRef` ref types** (`PosterScaled` ↔ `PosterPreview` ↔ `App`): under `@types/react@19`, `useRef<HTMLDivElement | null>(null)` → `RefObject<HTMLDivElement | null>`, which `forwardRef<HTMLDivElement, …>` accepts. If they don't line up, `useRef<HTMLDivElement>(null)` (React 19's 1-arg form still yields the nullable `RefObject`). Do not `as` the ref.
- **`App` `{ ...prev, [name]: value }`** (`handleFieldChange`, `name: FormTextField`): every `FormTextField` key is `string`-valued in `FormValues`, so the spread is `FormValues`. If a `tsc` version widens the computed-key spread, the fallback is `setForm((prev): FormValues => ({ ...prev, [name]: value }))`.

## Self-Review

**Spec coverage:**

| Spec item | Task |
|---|---|
| devDeps `typescript` / `@types/sql.js` / `@types/node` / `vitest` | 1 |
| `tsconfig.json` + `tsconfig.node.json`, full strict + extra flags | 1 |
| `vite-env.d.ts` | 1 (`src/vite-env.d.ts`) |
| `vite.config.js` → `.ts` + vitest `test` block | 1 |
| `index.html` `main.jsx` → `main.tsx` | 9 (with the rename) |
| `package.json` scripts (`typecheck`, `test`, `build` gate) | 1 (scripts), 11 (`build` gate) |
| `deploy.yml` typecheck + test steps | 1 |
| `.gitignore` `*.tsbuildinfo` | 1 |
| `src/types.ts` domain types | 2 |
| `rowsFromExec<T>` single boundary `as` | 4 |
| Typed SQLite row shapes | 2 (types), 4 (usage) |
| leaf modules → TS | 2 |
| `schemes.ts` + `schemes.test.ts` + rm `check-schemes.mjs` | 3 |
| DB layer → TS | 4 |
| blocks + slot helpers + `export.ts` | 5 |
| 8 posters | 6 |
| forms | 7 |
| registry + components | 8 |
| App / main / page | 9 |
| `generate-assets.ts` | 10 |
| `allowJs` flip + `build` gate + CI | 11 |
| `strictNullChecks` guards (getContext, getElementById, posterRef, route regex) | 5, 9 |
| `withPlaceholders` ↔ `HistoryRow` seam | resolved: `RawPosterData` accepts `HistoryRow` structurally (T2 type, T8 `?? undefined`) |

No gaps.

**Placeholder scan:** No "TBD"/"TODO". The scheme/label/agenda object *bodies* said "unchanged" — that is literal (the JS values are correct; only annotations are added), and Task 3 Step 2 explicitly says "copy the exact `colors.*` comparisons, do not paraphrase". Task 4 Step 5 and Task 9 dev-smoke are the only explicitly-optional/conditional items, each with a stated fallback.

**Type consistency:**
- `FormValues` (not `FormData`) everywhere — types.ts, `FormProps.value`, `App` state, `LogoFieldProps.value`, `PhotoGalleryFieldProps.value`.
- `RawPosterData` — produced T2, consumed by `withPlaceholders` (T2), `PosterProps.data` (T2), `PosterPreviewProps.data` (T8), `TemplateSelector` `THUMB_DATA` (T8), `HistoryList` (T8), `App` `<PosterPreview data={form}>` (T9, `FormValues` → `RawPosterData` widening).
- `ResolvedScheme` — produced by `resolveScheme` (T3), its `cssVars: Record<\`--${string}\`, string>` matches `PosterFrameProps.vars` (T5).
- `SygnetName` / `LogoVariant` — `sygnetByName: Record<SygnetName, string>` (T2), `resolveScheme` return (T3), `LogoSlotProps.variant?: LogoVariant` (T5), poster `s.sygnet ?? 'negatywny'` (T6).
- `RegistryEntry.Component: ComponentType<PosterProps>` / `.Form: ComponentType<FormProps>` (T2) — enforced by `posterRegistry: Record<string, RegistryEntry>` (T8), satisfied by T6/T7 signatures.
- `Database` (sql.js) — `dbRef` (T9), `getDb(): Promise<Database>` (T4), every `db: Database` param (T4).
- `TemplateRow` / `HistoryRow` — `listTemplates`/`listHistory` returns (T4), `App` state (T9), `TemplateSelectorProps.templates` / `HistoryListProps.entries` (T8).
