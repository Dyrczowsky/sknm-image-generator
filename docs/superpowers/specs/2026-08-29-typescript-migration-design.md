# Migracja projektu na TypeScript

Data: 2026-08-29
Status: zatwierdzony do planowania

## Problem

Projekt jest w całości `.js` / `.jsx` (~44 pliki źródłowe) bez żadnej warstwy
typów. Kształty danych są domyślne i rozjeżdżają się w cichości: forma
(`EMPTY_FORM`), wpisy `logos` / `photos` / `lists`, wiersze z SQLite
(`rowsFromExec` zwraca nietypowane obiekty), `posterRegistry`, role schematów,
propsy plakatów i formularzy, `withPlaceholders`.

Cel: **pełny TypeScript z jawnymi typami wszędzie** + realna bramka
type-checkingu w buildzie i CI (nie kosmetyczna — `vite build` sam nie sprawdza
typów).

## Decyzje (zatwierdzone)

1. **Pełny `strict: true`** + bramka `tsc --noEmit` wpięta w `npm run build` i w
   workflow GitHub Actions. Nowy skrypt `typecheck`.
2. **`scripts/check-schemes.mjs` → vitest.** Dochodzi devDep `vitest`;
   `check-schemes.mjs` staje się `src/posters/schemes.test.ts`. `npm test`
   zaczyna coś robić; to podstawa pod typowane testy na przyszłość.
3. **Zero implicit `any`.** Wiersze SQLite (`TemplateRow` / `DraftRow` /
   `HistoryRow`) mają jawne typy; `rowsFromExec<T>` przyjmuje `unknown` i robi
   jedną asercję `as unknown as T` — to jedyna asercja na granicy sql.js.

## Tooling i konfiguracja

### Nowe devDependencies

`typescript`, `@types/sql.js`, `@types/node` (dla `vite.config.ts` i
`scripts/`), `vitest`.
(`@types/react` / `@types/react-dom` już są. `oxlint` ma plugin TypeScript
domyślnie włączony — lint działa na `.ts` / `.tsx` bez zmian w `.oxlintrc.json`;
do potwierdzenia w tasku 1. `idb-keyval` / `html-to-image` / `vite-plugin-pwa` /
`@vitejs/plugin-react` mają typy własne.)

### `tsconfig.json` (aplikacja) + `tsconfig.node.json` (config + scripts)

Split z szablonu `create-vite react-ts`. Kluczowe flagi aplikacji:

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",

    "noEmit": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,        // wymusza `import type { … }`
    "moduleDetection": "force",

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,

    // MOST na czas migracji — task 11 przestawia allowJs na false:
    "allowJs": true,
    "checkJs": false
  },
  "include": ["src", "vite-env.d.ts"]
}
```

`exactOptionalPropertyTypes` i `types` (restrykcyjna lista) celowo **pominięte** —
`types` ogranicza auto-include `@types/*`, a `vite/client` i tak wchodzi przez
`vite-env.d.ts`.

`tsconfig.node.json`: `include: ["vite.config.ts", "scripts/**/*.ts"]`,
`compilerOptions.types: ["node"]`, `moduleResolution: "bundler"`, `noEmit: true`,
`strict: true`. Referencja z `tsconfig.json` (`"references": [{ "path": "./tsconfig.node.json" }]`).

### `vite.config.js` → `vite.config.ts`

Bez zmian logiki. Dochodzi blok `test` dla vitest:

```ts
/// <reference types="vitest/config" />
// …
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,   // task 1; usuwalne po tasku 3
  },
```

### `vite-env.d.ts` (nowy)

```ts
/// <reference types="vite/client" />
```

Daje typy dla `import x from '*.svg'` (→ `string`), `import x from '*?url'`
(→ `string`, m.in. `sql-wasm.wasm?url`), `import.meta.env`.

### `index.html`

`<script src="/src/main.jsx">` → `/src/main.tsx`.

### `package.json` scripts

```json
"dev": "vite",
"build": "tsc --noEmit && tsc --noEmit -p tsconfig.node.json && vite build",
"typecheck": "tsc --noEmit && tsc --noEmit -p tsconfig.node.json",
"test": "vitest run",
"lint": "oxlint",
"preview": "vite preview"
```

Bramka `tsc` w `build` dochodzi dopiero w tasku 11 (do tego czasu `build`
zostaje `vite build`, żeby etapy pośrednie były zielone).

### `.github/workflows/deploy.yml`

Przed krokiem `Build`: `- run: npm run typecheck` oraz `- run: npm test`.

### `.gitignore`

`*.tsbuildinfo`.

## Model typów

### `src/types.ts` (nowy) — wspólne typy domenowe

```ts
export interface LogoSlotValue { enabled: boolean; src: string | null }
export interface PhotoValue { src: string; x: number; y: number }
export type ListItem = Record<string, string>

export interface FormData {
  title: string; subtitle: string; speaker: string
  event_date: string; event_time: string; location: string
  badge: string; badge2: string
  logos: Record<string, LogoSlotValue>
  photos: Record<string, PhotoValue[]>
  lists: Record<string, ListItem[]>
}

// Wiersze SQLite (sql.js) — jawne kształty, zawężane na granicy rowsFromExec.
export interface TemplateRow { id: number; name: string; poster_key: string }
export interface DraftRow {
  id: number
  title: string | null; subtitle: string | null; speaker: string | null
  event_date: string | null; event_time: string | null; location: string | null
  badge: string | null; badge2: string | null
  color_scheme: string | null
  template_id: number | null
  updated_at: string | null
}
export interface HistoryRow {
  id: number
  title: string | null; subtitle: string | null; speaker: string | null
  event_date: string | null; event_time: string | null; location: string | null
  color_scheme: string | null
  created_at: string
  template_id: number | null
  template_name: string | null
  template_poster_key: string | null
}

export type SygnetName = 'negatywny' | 'granat' | 'zloty' | 'szary' | 'czarny'
export type LogoVariant = 'light' | 'dark'

export interface ResolvedScheme {
  cssVars: Record<string, string>
  sygnet: SygnetName | undefined
  logoVariant: LogoVariant | undefined
}

// data: pełna forma (edytor), jej fragment (miniatury = {}), albo wiersz
// historii (HistoryList renderuje miniaturę wprost z `entry`). Dokładny typ
// wejścia domykany w tasku 6 — patrz „Trudne miejsca / withPlaceholders".
// Kandydat: pola FormData opcjonalne i null-tolerancyjne.
export type RawPosterData = { [K in keyof FormData]?: FormData[K] | null }
export interface PosterProps { data: RawPosterData; scheme?: string }

export interface FormProps {
  value: FormData
  onFieldChange: (name: keyof FormData, value: string) => void
  onLogoChange: (slotKey: string, src: string | null) => void
  onLogoEnabledChange: (slotKey: string, checked: boolean) => void
  onPhotoAdd: (fieldKey: string, src: string) => void
  onPhotoChangeAt: (fieldKey: string, index: number, src: string | null) => void
  onPhotoPositionChangeAt: (fieldKey: string, index: number, partial: Partial<Pick<PhotoValue, 'x' | 'y'>>) => void
  onListItemAdd: (fieldKey: string) => void
  onListItemChange: (fieldKey: string, index: number, subKey: string, val: string) => void
  onListItemRemove: (fieldKey: string, index: number) => void
}

export interface RegistryEntry {
  name: string
  Component: React.ComponentType<PosterProps>
  Form: React.ComponentType<FormProps>
  schemes?: string[]
}
```

Dokładne sygnatury handlerów w `FormProps` do domknięcia w tasku 7 przez
odczytanie realnych wywołań w `App.jsx` — powyższe to punkt wyjścia.

### Zasady

- **`src/db/utils.ts`:** `rowsFromExec<T>(res: QueryExecResult[] | undefined): T[]`
  — generyczny; guard na pusty wynik; jedna asercja `as unknown as T`. Callery
  podają `T` (`rowsFromExec<TemplateRow>(...)`).
- **Bloki / formularze / komponenty:** każdy dostaje własny jawny typ propsów
  obok siebie (`interface BadgeProps { … }`), sygnatura
  `function Badge({ … }: BadgeProps)`. Bez `React.FC`.
- **Role schematów:** bloki `schemes.<layout>` typowane jako
  `Record<string, string>` (design świadomie dopuszcza dowolne role per layout;
  sztywna unia to przekombinowanie). `sygnet` / `logoVariant` zawężone do
  `SygnetName` / `LogoVariant`. `schemes` całościowo:
  `Record<string, Record<string, Record<string, string>>>` — tak, żeby test mógł
  wstawić `schemes.__probe`.
- **`registry.ts`:** `Record<string, RegistryEntry>` — wymusza, że wszystkie 8
  plakatów pasuje do `ComponentType<PosterProps>` i 8 formularzy do
  `ComponentType<FormProps>`. Celowe wymuszenie spójności.
- **`PosterScaled`:** zostaje `forwardRef<HTMLDivElement, PosterScaledProps>`
  (mniejszy diff niż migracja na ref-jako-prop z React 19).

## Kolejność migracji (most `allowJs`)

Przez migrację `tsconfig` ma `allowJs: true, checkJs: false` → `tsc --noEmit`
zgłasza błędy tylko z przekonwertowanych `.ts` / `.tsx`; `vite build` łyka
mieszankę. Task 11 zdejmuje most.

Konwersja od liści w górę, `git mv` zachowuje historię. 11 tasków:

| # | Zakres | Zależy od |
|---|---|---|
| 1 | Infra: devDeps, `tsconfig.json` + `tsconfig.node.json`, `vite-env.d.ts`, `vite.config.ts`, wiring vitest (`passWithNoTests`), skrypty npm (bez bramki `tsc`), `.gitignore` | — |
| 2 | `src/types.ts` + liście: `utils/formatDate`, `posters/theme`, `posters/logos`, `posters/fallback` | 1 |
| 3 | `posters/schemes.ts` + `posters/schemes.test.ts` (port `check-schemes.mjs` do vitest, wszystkie asercje + pętla invariantów) + `git rm scripts/check-schemes.mjs` + usuń `passWithNoTests` | 2 |
| 4 | Warstwa DB: `db/utils`, `db/schema`, `db/client`, `db/templates`, `db/drafts`, `db/history` + `TemplateRow`/`DraftRow`/`HistoryRow`. Mały test vitest na `resetIfStale` / `rowsFromExec` (sql.js w node). | 2 |
| 5 | Infra plakatów: `blocks/*` (6), `LogoSlot`, `PhotoGallery`, `PlaceholderBox`, `posters/export` | 2 |
| 6 | 8× `Poster*.tsx` | 3, 5 |
| 7 | Formularze: `FormField`, `LogoField`, `PhotoGalleryField`, 8× `Form*.tsx` + domknięcie `FormProps` | 2 |
| 8 | `posters/registry.ts` + `components/*` (`PosterScaled`, `PosterPreview`, `TemplateSelector`, `HistoryList`, `ImageUpload` — **konwertuj, jest używany przez `LogoField`/`PhotoGalleryField`**) | 6, 7 |
| 9 | Powłoka: `App.tsx`, `pages/PosterPreviewPage.tsx`, `main.tsx` + `index.html` | 8 |
| 10 | `scripts/generate-assets.ts` (uruchamiany `node scripts/generate-assets.ts`) | — |
| 11 | Zdjęcie mostu: `allowJs: false`, usuń `checkJs`, `tsc --noEmit` do `npm run build`, kroki `typecheck` + `test` w `deploy.yml`, sweep | wszystkie |

Każdy task 2–10: `npx tsc --noEmit` (przekonwertowane czyste), `npm run build`,
`npm run lint`, `npm test` — wszystko zielone.

## Trudne miejsca

Spodziewane ~15 małych guardów — każdy to realny utajony bug, nie szum
(`strictNullChecks`):

- **sql.js:** `import initSqlJs, { Database, QueryExecResult, SqlValue, BindParams, Statement } from 'sql.js'`.
  `res[0]` bywa `undefined` (pusty wynik) — guard. `values: SqlValue[][]`,
  `columns: string[]`. Jedna asercja `as unknown as T` w `rowsFromExec`.
- **`getContext('2d')` → `| null`** (`export.ts`), **`getElementById('root')` →
  `| null`** (`main.tsx`), **`posterRef.current` → `| null`** przed `toPng`
  (`App.tsx`, `export.ts`) — jawne guardy z `throw`.
- **regex trasy** (`main.tsx`): `path.match(...)` → `RegExpMatchArray | null`;
  po null-checku `[1]` to `string`, `[2]` to `string | undefined`.
- **SVG / `?url` / `wasm?url`** → `string` przez `vite/client`.
  `sygnetByName: Record<SygnetName, string>`.
- **`App.tsx`** (największy): `useState<FormData>(EMPTY_FORM)`,
  `useState<string | undefined>(undefined)`, `useRef<Database | null>(null)`,
  `useRef<HTMLDivElement | null>(null)`,
  `useRef<ReturnType<typeof setTimeout> | null>(null)`,
  `templates: TemplateRow[]`, `history: HistoryRow[]`, wszystkie handlery jawnie
  typowane. `selectedTemplate` może być `undefined` — guard już jest w kodzie,
  potwierdzić że TS jest zadowolony.
- **`export.ts`:** `new Image()` load → `Promise<HTMLImageElement>`;
  `getImageData(...).data` to `Uint8ClampedArray`, destrukturyzacja `[r,g,b,a]`
  jako `number`.
- **`check-schemes` → vitest:** `schemes.__probe = {…}` i `delete schemes.__probe`
  wymagają, żeby `schemes` było indeksowalne (`Record<string, …>`).
- **`withPlaceholders` / `HistoryList` (seam):** `HistoryList` przekazuje surowy
  `HistoryRow` jako `data` do komponentu plakatu, który woła
  `withPlaceholders(data)`. `HistoryRow` nie ma pól `logos`/`photos`/`lists` i ma
  `title: string | null`. `withPlaceholders` przyjmuje `RawPosterData` (pola
  opcjonalne + `null`-tolerancyjne, `data.logos ?? {}` itd.), a `HistoryList`
  albo rzutuje `entry` do `RawPosterData`, albo mapuje go małą funkcją. Domknięte
  w tasku 6 (typ `withPlaceholders`) + tasku 8 (`HistoryList`).

## Weryfikacja

- **Każdy task 2–10:** `npx tsc --noEmit` (przekonwertowane pliki bez błędów;
  most `allowJs` trzyma `.js` w ryzach), `npm run build`, `npm run lint`,
  `npm test` — wszystko zielone.
- **Task 11 / końcowa:** `npm run typecheck` (oba tsconfig, `allowJs: false`) w
  pełni czysty · `npm test` zielony · `npm run build` (z bramką `tsc`) zielony ·
  `npm run lint` czysty · `git grep -nE "\.jsx|from '[^']*\.js'" -- src/` bez
  trafień (poza uzasadnionymi) · `node scripts/generate-assets.ts` regeneruje
  `public/icons/*.png` bajt w bajt · `npm run dev` — smoke ręczny (rozszerzenie
  Chrome może być niedostępne; wtedy robi to człowiek).
- **CI:** lokalnie `npm run typecheck && npm test && npm run build` odzwierciedla
  workflow; samego GitHub Actions nie da się odpalić lokalnie.

## Ryzyka

- **`strictNullChecks` odsłoni utajone `null`/`undefined`** — to feature. Każdy
  przypadek dostaje mały guard, nie `!` na ślepo (wyjątek: `getElementById('root')`
  — `throw` jest OK, brak roota to i tak martwa apka).
- **`verbatimModuleSyntax`** wymusza `import type { … }` przy każdym imporcie
  wyłącznie typów — dużo drobnych poprawek, wychwytywanych od razu przez `tsc`.
- **`@types/sql.js`** jest społecznościowe i bywa nie w 100% zgodne z runtime —
  jeśli któryś typ jest za wąski/za szeroki, dopuszczalna lokalna korekta przez
  augmentację modułu w `vite-env.d.ts` (udokumentować w tasku 4).
- **Node v25 + `.ts` w `scripts/`** — `generate-assets.ts` używa tylko importów
  `node:*` (bez relatywnych), więc natywne uruchomienie działa. Gdyby CI Node
  było starsze (workflow ustawia `node-version: 20`) — `generate-assets` i tak
  nie jest wołany w CI (to jednorazowy generator ikon), więc bez wpływu na
  deploy. Odnotować.
