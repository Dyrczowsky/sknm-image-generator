# Poster Colour Schemes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse ~28 duplicated colour-variant poster components into one file per layout, with all colours in a single per-layout-nested `src/posters/schemes.js`, threaded to elements through CSS custom properties; rename numeric poster keys/files to names.

**Architecture:** `resolveScheme(layoutKey, name)` merges a named scheme over that layout's `default` block and returns `{ cssVars, sygnet, logoVariant }`. `PosterFrame` spreads `cssVars` onto the 1080×1080 root, so every descendant style can use `var(--role)`. Each `Poster*` component reads its own layout's scheme at the top and passes `var(--role)` strings (not hex) into the unchanged block components. The SQLite `templates` table drops to 8 rows; colour lives in a new `color_scheme` column on `draft` / `generated_images`; a `PRAGMA user_version` bump wipes stale local databases.

**Tech Stack:** React 19, Vite 8, sql.js (SQLite in WASM) persisted to IndexedDB via idb-keyval, html-to-image for PNG export. No test runner — verification is `node scripts/check-schemes.mjs` for the resolver, `npm run lint`, `npm run build`, and manual visual checks at `/poster/<layout>/<scheme>`.

**Spec:** `docs/superpowers/specs/2026-08-28-poster-color-schemes-design.md`

## Global Constraints

- **Language:** All code comments in Polish with full diacritics. UI copy already Polish — keep it.
- **File/key naming:** poster keys and new filenames are ASCII lowercase, no diacritics: `wyklad`, `gosc`, `warsztat`, `data`, `konferencja`, `rekrutacja`, `gala`, `ogloszenie`.
- **No new dependencies.** No test framework, no CSS-in-JS lib. `color-mix` is NOT used — decoration colours are explicit hex/rgba per scheme.
- **Blocks stay dumb.** `src/posters/blocks/*` and `LogoSlot`/`PlaceholderBox`/`PhotoGallery` must not import `schemes.js`. They receive `var(--role)` strings through their existing `color`/`background`/`style` props.
- **Every task ends green:** `npm run build` and `npm run lint` pass, and the app still renders (`npm run dev`).
- **Commits:** one per task, present tense, end with:
  `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`
- Work happens on branch `poster-color-schemes` (already created, spec already committed there).

## Conversion Recipe (shared context for Tasks 4–11)

Each poster-conversion task performs the same mechanical steps for one layout. This recipe is background for all of them; the per-task sections carry the layout-specific scheme block, role table, and exact replacements.

1. **Add the layout's scheme block** to `src/posters/schemes.js`: a `const <layout> = { default: {…}, <scheme>: {…}, … }` object, then add `<layout>` to the `export const schemes = { … }` map.
2. **Append assertions** for the layout to `scripts/check-schemes.mjs`.
3. **Rename the component file** with `git mv src/posters/Poster1X.jsx src/posters/Poster<Name>.jsx` and rename the exported function `Poster1X` → `Poster<Name>`.
4. **Rewrite the component:**
   - Add `scheme` to props: `function Poster<Name>({ data, scheme })`.
   - Add `import { resolveScheme } from './schemes'` and `import { sygnetByName } from './logos'`; drop the old single-sygnet import (`sygnetNegatywny` etc.).
   - First line of the body after `withPlaceholders`: `const s = resolveScheme('<layout>', scheme)`.
   - `<PosterFrame background={colors.X} color={colors.Y} …>` → `<PosterFrame vars={s.cssVars} …>` (drop `background`/`color` props; keep `padding`/`style`).
   - Replace every scheme-driven `colors.X` / hardcoded hex / rgba per the task's replacement table with `'var(--role)'`.
   - `<img src={sygnetNegatywny} …>` → `<img src={sygnetByName[s.sygnet]} …>`.
   - `variant="light"` / `variant="dark"` on `LogoSlot` → `variant={s.logoVariant}`.
   - Remove now-unused imports (`colors` if nothing references it, `fontMono` only if unused). `oxlint` will flag leftovers.
   - Update the top comment: drop the `1X · ` prefix, keep the description.
5. **Delete the variant files** with `git rm` (`Poster1XCzern.jsx` etc.; for Wykład also `Poster1h/1i/1j/1k.jsx`).
6. **Rename the form file** with `git mv src/forms/Form1X.jsx src/forms/Form<Name>.jsx`, rename the export `Form1X` → `Form<Name>`, update its top comment. For Wykład also `git rm src/forms/Form1h.jsx src/forms/Form1i.jsx src/forms/Form1j.jsx src/forms/Form1k.jsx` (byte-identical to `Form1a`).
7. **Update `src/posters/registry.js`:** remove the layout's old imports (`Poster1X`, `Poster1XCzern`, …, `Form1X`) and old entries (`'1X'`, `'1X-czern'`, …); add `import { Poster<Name> } from './Poster<Name>'`, `import { Form<Name> } from '../forms/Form<Name>'`, and one entry keyed `<layout>` with `{ name, Component, Form, schemes: [...] }` (Gala: no `schemes`).
8. **Update `src/db/schema.js` `DEFAULT_TEMPLATES`:** replace the layout's rows (the base `{ name, poster_key: '1X' }` plus its `-czern`/`-zloto`/`-jasny`/`-szary` rows; for Wykład the `1h`–`1k` rows) with one `{ name: '<Name>', poster_key: '<layout>' }`.
9. **Verify** (see per-task Verify block) and **commit**.

**CSS var naming:** `roleToVar` converts camelCase to `--kebab` by inserting `-` before each uppercase letter and lowercasing: `pageBg`→`--page-bg`, `badgeFill`→`--badge-fill`, `wedgeBr`→`--wedge-br`, `tri1`→`--tri1`, `lineFirst`→`--line-first`. Use the exact `var(--…)` the table gives.

**Transitional state is expected.** Between Tasks 4 and 11 `registry.js` and `DEFAULT_TEMPLATES` hold a mix of converted (named) and unconverted (`1x` + `family`) layouts. The old `TemplateSelector` groups the unconverted ones by `family` and treats each converted one as a single-tile group with no swatch row. Both render. Clear IndexedDB in DevTools between dev sessions so the draft's `template_id` never dangles.

**Visual reference for Tasks 4–11:** before starting Task 4, create a read-only checkout of the pre-refactor code:

```bash
git worktree add ../sknm-ref 989e047
(cd ../sknm-ref && npm ci && npm run dev -- --port 5174)
```

Compare `http://localhost:5173/poster/<new>/<scheme>` against `http://localhost:5174/poster/<old-key>` (e.g. new `/poster/ogloszenie/czern` vs old `/poster/1l-czern`). Remove with `git worktree remove ../sknm-ref` in Task 15.

---

### Task 1: Scheme resolver + sygnet map

**Files:**
- Create: `src/posters/schemes.js`
- Modify: `src/posters/logos.js`
- Create: `scripts/check-schemes.mjs`

**Interfaces:**
- Produces:
  - `resolveScheme(layoutKey: string, name: string | undefined) => { cssVars: Record<string,string>, sygnet: string | undefined, logoVariant: 'light' | 'dark' | undefined }`
  - `schemes: Record<string, Record<string, object>>` (empty per-layout blocks filled in Tasks 4–11)
  - `SCHEME_LABELS: Record<string,string>`
  - `sygnetByName: Record<'negatywny'|'granat'|'zloty'|'szary'|'czarny', string>` (from `logos.js`)

- [ ] **Step 1: Write the resolver module**

Create `src/posters/schemes.js` (the `./theme.js` import keeps the **`.js`
extension** — unlike the rest of `src/`, which relies on Vite's extensionless
resolution — so that `node scripts/check-schemes.mjs` can import this module
directly; Vite resolves `./theme.js` fine too):

```js
import { colors } from './theme.js'

// Schematy kolorów są ZAGNIEŻDŻONE per layout, bo „granat" Wykładu (biały na
// granacie) to nie to samo co „granat" Warsztatu (granat na kremie). Każdy
// layout ma pełny blok `default` + nazwane schematy nadpisujące tylko różnice.
// Bloki layoutów dokłada się w kolejnych taskach (Task 4–11).
export const schemes = {}

// camelCase → --kebab; layout może dodać dowolną rolę bez zmiany resolvera.
const roleToVar = (k) => '--' + k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
const NON_CSS = new Set(['sygnet', 'logoVariant'])

// Scala nazwany schemat nad `default` danego layoutu. Nieznany layout / schemat
// → pusty wynik / sam `default`.
export function resolveScheme(layoutKey, name) {
  const layout = schemes[layoutKey] ?? {}
  const merged = { ...(layout.default ?? {}), ...(layout[name] ?? {}) }
  const cssVars = {}
  for (const [k, v] of Object.entries(merged)) {
    if (!NON_CSS.has(k)) cssVars[roleToVar(k)] = v
  }
  return { cssVars, sygnet: merged.sygnet, logoVariant: merged.logoVariant }
}

// Podpisy swatchy kolorystyki w UI. `default` bywa „Granat" albo (Rekrutacja)
// pierwszym elementem jest `limonka`.
export const SCHEME_LABELS = {
  default: 'Granat',
  limonka: 'Limonka',
  czern: 'Czerń',
  zloto: 'Złoto',
  jasny: 'Jasny',
  szary: 'Szary',
}
```

- [ ] **Step 2: Rewrite logos.js with a sygnet lookup map**

Replace `src/posters/logos.js` entirely (switch the sygnet exports from
`export … from` re-exports to `import` + named `export`, so the same bindings can
also populate `sygnetByName`; the PK-logo re-exports stay as they were):

```js
// Sygnet SKNM (herb koła) - warianty kolorystyczne pod różne tła.
import sygnetNegatywny from '../assets/brand/sknm/sygnet_negatywny.svg'
import sygnetGranat from '../assets/brand/sknm/sygnet_granat.svg'
import sygnetZloty from '../assets/brand/sknm/sygnet_zloty.svg'
import sygnetSzary from '../assets/brand/sknm/sygnet_szary.svg'
import sygnetCzarny from '../assets/brand/sknm/sygnet_czarny.svg'

export { sygnetNegatywny, sygnetGranat, sygnetZloty, sygnetSzary, sygnetCzarny }

// Wybór sygnetu po nazwie roli ze schematu (patrz schemes.js).
export const sygnetByName = {
  negatywny: sygnetNegatywny,
  granat: sygnetGranat,
  zloty: sygnetZloty,
  szary: sygnetSzary,
  czarny: sygnetCzarny,
}

// Logo Politechniki Krakowskiej - domyślne logo w miejscach na logo PK/wydziału,
// dopóki użytkownik nie wgra własnego pliku w formularzu.
export { default as pkLogoLight } from '../assets/brand/pk/PK_POZIOM.svg'
export { default as pkLogoDark } from '../assets/brand/pk/PK_POZIOM_inwersyjne.svg'
```

The named `sygnet*` re-exports stay available for the still-unconverted posters; Tasks 4–11 drop each poster's use of them, and Task 15 removes any that end up unreferenced.

- [ ] **Step 3: Write the resolver smoke check**

Create `scripts/check-schemes.mjs`:

```js
// Ręczny smoke-test resolvera schematów (brak test runnera w projekcie).
// Uruchom: node scripts/check-schemes.mjs
import assert from 'node:assert/strict'
import { resolveScheme, schemes, SCHEME_LABELS } from '../src/posters/schemes.js'

// Task 1: pusty rejestr — resolver nie wybucha.
{
  const s = resolveScheme('nieistnieje', 'tez-nie')
  assert.deepEqual(s.cssVars, {})
  assert.equal(s.sygnet, undefined)
  assert.equal(s.logoVariant, undefined)
}

// roleToVar przez publiczne API: dołóż tymczasowy layout i sprawdź nazwy varów.
{
  schemes.__probe = { default: { pageBg: '#000', badgeFill: '#111', wedgeBr: '#222', tri1: '#333', logoVariant: 'dark' } }
  const s = resolveScheme('__probe', undefined)
  assert.equal(s.cssVars['--page-bg'], '#000')
  assert.equal(s.cssVars['--badge-fill'], '#111')
  assert.equal(s.cssVars['--wedge-br'], '#222')
  assert.equal(s.cssVars['--tri1'], '#333')
  assert.equal(s.cssVars['--logo-variant'], undefined) // NON_CSS
  assert.equal(s.logoVariant, 'dark')
  delete schemes.__probe
}

assert.equal(SCHEME_LABELS.czern, 'Czerń')

console.log('check-schemes: OK')
```

- [ ] **Step 4: Run the smoke check**

Run: `node scripts/check-schemes.mjs`
Expected: prints `check-schemes: OK`, exit 0. (Node imports `src/posters/schemes.js` → `src/posters/theme.js`; `theme.js` is pure ESM with no Vite-only imports, so this works.)

- [ ] **Step 5: Lint and build**

Run: `npm run lint && npm run build`
Expected: both pass. `schemes.js` and `sygnetByName` have no consumers yet, so the bundle is unchanged behaviourally.

- [ ] **Step 6: Commit**

```bash
git add src/posters/schemes.js src/posters/logos.js scripts/check-schemes.mjs
git commit -m "$(printf 'Add per-layout scheme resolver and sygnet lookup map\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

### Task 2: PosterFrame emits CSS custom properties

**Files:**
- Modify: `src/posters/blocks/PosterFrame.jsx`

**Interfaces:**
- Consumes: `resolveScheme(...).cssVars` (Task 1)
- Produces: `<PosterFrame vars={cssVars} padding? style? >` — spreads `vars` onto the root and sets `background: 'var(--page-bg)'`, `color: 'var(--page-text)'`. Legacy `background`/`color` props still honoured (fallback) so unconverted posters render unchanged until their task.

- [ ] **Step 1: Rewrite PosterFrame**

Replace `src/posters/blocks/PosterFrame.jsx` with:

```jsx
import { posterBaseStyle } from '../theme'

// Wspólny kontener 1080×1080. `vars` to zmienne CSS ze schematu kolorów
// (resolveScheme(...).cssVars) — po ich rozlaniu każdy potomek może użyć
// `var(--rola)` w inline-style. `background`/`color` domyślnie biorą się z
// `--page-bg` / `--page-text`; jawne propsy (starszy wariant, przed migracją
// danego layoutu) mają pierwszeństwo. `style` nadpisuje domyślny układ flex.
export function PosterFrame({ vars, background, color, padding = 0, style, children }) {
  return (
    <div
      style={{
        ...posterBaseStyle,
        ...vars,
        background: background ?? 'var(--page-bg)',
        color: color ?? 'var(--page-text)',
        padding,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Build**

Run: `npm run lint && npm run build`
Expected: pass.

- [ ] **Step 3: Visual regression check**

Run: `npm run dev`, open `/poster/1a` and `/poster/1b`.
Expected: identical to before — every existing poster still passes explicit `background={colors.…}`/`color={colors.…}`, which win over the `var()` fallback, and `vars` is `undefined` (spread of `undefined` is a no-op).

- [ ] **Step 4: Commit**

```bash
git add src/posters/blocks/PosterFrame.jsx
git commit -m "$(printf 'Let PosterFrame spread scheme CSS vars, keep explicit bg/color fallback\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

### Task 3: Preview route accepts `/poster/<layout>/<scheme>`

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/pages/PosterPreviewPage.jsx`

**Interfaces:**
- Produces: `<PosterPreviewPage posterKey={string} scheme={string | undefined} />`; route regex `^/poster/([^/]+)(?:/([^/]+))?/?$`.

- [ ] **Step 1: Widen the route regex**

In `src/main.jsx` replace:

```js
const posterMatch = path.match(/^\/poster\/([^/]+)\/?$/)
```

with:

```js
const posterMatch = path.match(/^\/poster\/([^/]+)(?:\/([^/]+))?\/?$/)
```

and the render line:

```js
{posterMatch ? <PosterPreviewPage posterKey={posterMatch[1]} /> : <App />}
```

with:

```js
{posterMatch ? <PosterPreviewPage posterKey={posterMatch[1]} scheme={posterMatch[2]} /> : <App />}
```

- [ ] **Step 2: Thread `scheme` through the preview page**

In `src/pages/PosterPreviewPage.jsx`:
- Change the signature to `export function PosterPreviewPage({ posterKey, scheme }) {`.
- Change `<Component data={data} />` to `<Component data={data} scheme={scheme} />`.
- Change the heading to include the scheme when set:
  `<h1>Podgląd szablonu: {name}{scheme ? ` · ${scheme}` : ''}</h1>`

- [ ] **Step 3: Build + check existing route still resolves**

Run: `npm run lint && npm run build`, then `npm run dev` and open `/poster/1a` and `/poster/1h`.
Expected: pass; both still render (unconverted components ignore the extra `scheme` prop).

- [ ] **Step 4: Commit**

```bash
git add src/main.jsx src/pages/PosterPreviewPage.jsx
git commit -m "$(printf 'Support /poster/<layout>/<scheme> preview URLs\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

### Task 4: Convert Ogłoszenie (reference conversion)

Simplest layout (5 roles). This task's rewrite is shown in full as the pattern; later tasks give replacement tables.

**Files:**
- Modify: `src/posters/schemes.js`, `scripts/check-schemes.mjs`, `src/posters/registry.js`, `src/db/schema.js`
- Rename: `src/posters/Poster1l.jsx` → `src/posters/PosterOgloszenie.jsx`; `src/forms/Form1l.jsx` → `src/forms/FormOgloszenie.jsx`
- Delete: `src/posters/Poster1lCzern.jsx`, `src/posters/Poster1lZloto.jsx`, `src/posters/Poster1lJasny.jsx`, `src/posters/Poster1lSzary.jsx`

**Interfaces:**
- Consumes: `resolveScheme` (T1), `sygnetByName` (T1), `PosterFrame vars` (T2).
- Produces: `PosterOgloszenie({ data, scheme })`, `FormOgloszenie(props)`, registry key `ogloszenie` with `schemes: ['default','czern','zloto','jasny','szary']`, `schemes.ogloszenie`.

**Role table** (from `1l` / `1lCzern` / `1lZloto` / `1lJasny` / `1lSzary`):

| role | default | czern | zloto | jasny | szary |
|---|---|---|---|---|---|
| `pageBg` | navy | black | navy | cream | paper |
| `pageText` | cream | cream | cream | limeText | slate |
| `accent` (2 triangles + subtitle) | lime | gold | gold | navy | grayDark |
| `sygnet` | negatywny | negatywny | zloty | granat | szary |
| `logoVariant` | dark | dark | dark | light | light |

- [ ] **Step 1: Add `schemes.ogloszenie`**

In `src/posters/schemes.js`, before `export const schemes = {}`, add:

```js
const ogloszenie = {
  default: { pageBg: colors.navy, pageText: colors.cream, accent: colors.lime,
             sygnet: 'negatywny', logoVariant: 'dark' },
  czern: { pageBg: colors.black, accent: colors.gold, sygnet: 'negatywny' },
  zloto: { accent: colors.gold, sygnet: 'zloty' },
  jasny: { pageBg: colors.cream, pageText: colors.limeText, accent: colors.navy,
           sygnet: 'granat', logoVariant: 'light' },
  szary: { pageBg: colors.paper, pageText: colors.slate, accent: colors.grayDark,
           sygnet: 'szary', logoVariant: 'light' },
}
```

and change `export const schemes = {}` to `export const schemes = { ogloszenie }`.

- [ ] **Step 2: Add assertions**

Append to `scripts/check-schemes.mjs` before the final `console.log`:

```js
// Ogłoszenie
{
  const d = resolveScheme('ogloszenie', undefined)
  assert.equal(d.cssVars['--page-bg'], colors.navy)
  assert.equal(d.cssVars['--accent'], colors.lime)
  assert.equal(d.sygnet, 'negatywny')
  const cz = resolveScheme('ogloszenie', 'czern')
  assert.equal(cz.cssVars['--page-bg'], colors.black)
  assert.equal(cz.cssVars['--accent'], colors.gold)
  assert.equal(cz.cssVars['--page-text'], colors.cream) // z default
  assert.equal(cz.logoVariant, 'dark')                  // z default
  const zl = resolveScheme('ogloszenie', 'zloto')
  assert.equal(zl.cssVars['--page-bg'], colors.navy)    // z default
  assert.equal(zl.sygnet, 'zloty')
}
```

Add `import { colors } from '../src/posters/theme.js'` to the top of the script.

- [ ] **Step 3: Rename + rewrite the component**

```bash
git mv src/posters/Poster1l.jsx src/posters/PosterOgloszenie.jsx
```

Replace the file contents with:

```jsx
import { fontMono } from './theme'
import { sygnetByName } from './logos'
import { LogoSlot } from './LogoSlot'
import { withPlaceholders } from './fallback'
import { resolveScheme } from './schemes'
import { PosterFrame } from './blocks/PosterFrame'
import { BrandingText } from './blocks/BrandingText'
import { LogoRow } from './blocks/LogoRow'

// OGŁOSZENIE — wyśrodkowany cytat/komunikat, bez zdjęcia i bez daty.
// Jedyny szablon bez narożnikowego stosu informacji — do krótkich ogłoszeń,
// cytatów i podziękowań.
export function PosterOgloszenie({ data, scheme }) {
  const { title, subtitle, logos } = withPlaceholders(data)
  const s = resolveScheme('ogloszenie', scheme)

  return (
    <PosterFrame vars={s.cssVars} padding={96}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <img src={sygnetByName[s.sygnet]} alt="SKNM" style={{ width: 132, display: 'block' }} />
        <BrandingText lines={['SKNM', 'POLITECHNIKA', 'KRAKOWSKA']} opacity={0.85} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 32 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ width: 46, height: 40, background: 'var(--accent)', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
          <div style={{ width: 46, height: 40, background: 'var(--accent)', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.08, letterSpacing: '-.02em', maxWidth: '18ch', textWrap: 'balance', fontKerning: 'none' }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ font: `700 24px ${fontMono}`, letterSpacing: '.1em', color: 'var(--accent)' }}>— {subtitle.toUpperCase()}</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <div style={{ font: `700 20px ${fontMono}`, letterSpacing: '.12em', opacity: 0.85 }}>sknm.pk.edu.pl</div>
        <LogoRow>
          <LogoSlot logo={logos.pk} variant={s.logoVariant} width={190} height={72} />
        </LogoRow>
      </div>
    </PosterFrame>
  )
}
```

- [ ] **Step 4: Delete variant components**

```bash
git rm src/posters/Poster1lCzern.jsx src/posters/Poster1lZloto.jsx src/posters/Poster1lJasny.jsx src/posters/Poster1lSzary.jsx
```

- [ ] **Step 5: Rename the form**

```bash
git mv src/forms/Form1l.jsx src/forms/FormOgloszenie.jsx
```

In `src/forms/FormOgloszenie.jsx` rename the export `Form1l` → `FormOgloszenie` and update its top comment (`// Formularz dla 1l · Ogłoszenie …` → `// Formularz Ogłoszenia …`).

- [ ] **Step 6: Update the registry**

In `src/posters/registry.js`:
- Remove imports `Poster1l`, `Poster1lCzern`, `Poster1lZloto`, `Poster1lJasny`, `Poster1lSzary`, `Form1l`.
- Add `import { PosterOgloszenie } from './PosterOgloszenie'` and `import { FormOgloszenie } from '../forms/FormOgloszenie'`.
- Remove the `'1l'`, `'1l-czern'`, `'1l-zloto'`, `'1l-jasny'`, `'1l-szary'` entries.
- Add:

```js
  ogloszenie: {
    name: 'Ogłoszenie',
    Component: PosterOgloszenie,
    Form: FormOgloszenie,
    schemes: ['default', 'czern', 'zloto', 'jasny', 'szary'],
  },
```

- [ ] **Step 7: Update DEFAULT_TEMPLATES**

In `src/db/schema.js` remove the `Ogłoszenie` and `Ogłoszenie — czerń/złoto/jasny/szary` rows (`poster_key` `1l`, `1l-czern`, `1l-zloto`, `1l-jasny`, `1l-szary`) and add a single:

```js
  { name: 'Ogłoszenie', poster_key: 'ogloszenie' },
```

(Position it wherever reads naturally; order only affects template list order.)

- [ ] **Step 8: Verify**

```bash
node scripts/check-schemes.mjs   # → check-schemes: OK
npm run lint
npm run build
```

Then `npm run dev` and compare against the reference checkout:
- `/poster/ogloszenie` vs ref `/poster/1l`
- `/poster/ogloszenie/czern` vs ref `/poster/1l-czern`
- `/poster/ogloszenie/zloto` vs ref `/poster/1l-zloto`
- `/poster/ogloszenie/jasny` vs ref `/poster/1l-jasny`
- `/poster/ogloszenie/szary` vs ref `/poster/1l-szary`

Expected: pixel-equivalent (fonts, spacing, colours). Also open the app (`/`), pick the Ogłoszenie tile, confirm it renders (default scheme, no swatch row yet).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "$(printf 'Convert Ogloszenie to one file + colour scheme\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

### Task 5: Convert Gala

Only one scheme (no variants). No `git rm` of variant files.

**Files:**
- Modify: `src/posters/schemes.js`, `scripts/check-schemes.mjs`, `src/posters/registry.js`, `src/db/schema.js`
- Rename: `src/posters/Poster1g.jsx` → `src/posters/PosterGala.jsx`; `src/forms/Form1g.jsx` → `src/forms/FormGala.jsx`

**Interfaces:**
- Produces: `PosterGala({ data, scheme })`, `FormGala`, registry key `gala` (no `schemes`), `schemes.gala` (only `default`).

**Role table** (from `1g`):

| role | default |
|---|---|
| `pageBg` | ink |
| `pageText` | goldPanelText |
| `mutedText` (subtitle) | creamMuted |
| `gold` (BrandingText, Badge, gradient line, BigDateNumber) | gold |
| `panelBr` (bottom-right wedge) | inkPanel |
| `patronBorder` (patronat PlaceholderBox border) | `rgba(184,148,58,.5)` |
| `patronText` (patronat PlaceholderBox label) | `rgba(240,237,228,.7)` |
| `sygnet` | zloty |
| `logoVariant` | dark |

- [ ] **Step 1: Add `schemes.gala`**

```js
const gala = {
  default: {
    pageBg: colors.ink, pageText: colors.goldPanelText, mutedText: colors.creamMuted,
    gold: colors.gold, panelBr: colors.inkPanel,
    patronBorder: 'rgba(184,148,58,.5)', patronText: 'rgba(240,237,228,.7)',
    sygnet: 'zloty', logoVariant: 'dark',
  },
}
```

Add `gala` to `export const schemes = { ogloszenie, gala }`.

- [ ] **Step 2: Add assertions**

```js
// Gala (jeden schemat)
{
  const d = resolveScheme('gala', undefined)
  assert.equal(d.cssVars['--page-bg'], colors.ink)
  assert.equal(d.cssVars['--gold'], colors.gold)
  assert.equal(d.cssVars['--panel-br'], colors.inkPanel)
  assert.equal(d.sygnet, 'zloty')
}
```

- [ ] **Step 3: Rename + rewrite the component**

```bash
git mv src/posters/Poster1g.jsx src/posters/PosterGala.jsx
```

Apply the recipe. Replacement table for `PosterGala.jsx`:

| current | replacement |
|---|---|
| `import { sygnetZloty } from './logos'` | `import { sygnetByName } from './logos'` + `import { resolveScheme } from './schemes'` |
| `export function Poster1g({ data }) {` | `export function PosterGala({ data, scheme }) {` |
| (after `withPlaceholders`) | add `const s = resolveScheme('gala', scheme)` |
| `<PosterFrame background={colors.ink} color={colors.goldPanelText} padding={72}>` | `<PosterFrame vars={s.cssVars} padding={72}>` |
| bottom-right wedge `background: colors.inkPanel` | `background: 'var(--panel-br)'` |
| gradient line `linear-gradient(to right, rgba(132,117,78,0) 0, ${colors.gold} 18%, ${colors.gold} 82%, rgba(132,117,78,0) 100%)` | `` `linear-gradient(to right, rgba(132,117,78,0) 0, var(--gold) 18%, var(--gold) 82%, rgba(132,117,78,0) 100%)` `` |
| `<img src={sygnetZloty} …>` | `<img src={sygnetByName[s.sygnet]} …>` |
| `<BrandingText … color={colors.gold} />` | `<BrandingText … color="var(--gold)" />` |
| `<Badge color={colors.gold} style={…}>` | `<Badge color="var(--gold)" style={…}>` |
| subtitle `color: colors.creamMuted` | `color: 'var(--muted-text)'` |
| `<BigDateNumber event_date={event_date} color={colors.gold} />` | `<BigDateNumber event_date={event_date} color="var(--gold)" />` |
| `<LogoSlot logo={logos.pk} variant="dark" …/>` | `<LogoSlot logo={logos.pk} variant={s.logoVariant} …/>` |
| `<PlaceholderBox label="patronat" … style={{ borderColor: 'rgba(184,148,58,.5)', color: 'rgba(240,237,228,.7)' }} />` | `… style={{ borderColor: 'var(--patron-border)', color: 'var(--patron-text)' }} />` |

`colors` and `fontMono` are both still used (`colors` no longer — check; `fontMono` yes in Badge style). Remove `colors` import if `oxlint` flags it unused.

- [ ] **Step 4: Rename the form**

```bash
git mv src/forms/Form1g.jsx src/forms/FormGala.jsx
```

Rename export `Form1g` → `FormGala`, update top comment.

- [ ] **Step 5: Registry**

In `registry.js`: drop `Poster1g`/`Form1g` imports and the `'1g'` entry; add `PosterGala`/`FormGala` imports and:

```js
  gala: { name: 'Gala', Component: PosterGala, Form: FormGala },
```

- [ ] **Step 6: DEFAULT_TEMPLATES**

Replace `{ name: 'Gala', poster_key: '1g' }` with `{ name: 'Gala', poster_key: 'gala' }`.

- [ ] **Step 7: Verify**

```bash
node scripts/check-schemes.mjs
npm run lint && npm run build
```

`npm run dev`: compare `/poster/gala` vs ref `/poster/1g`. App: pick Gala tile, no swatch row.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "$(printf 'Convert Gala to one file + colour scheme\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

### Task 6: Convert Gość

**Files:**
- Modify: `src/posters/schemes.js`, `scripts/check-schemes.mjs`, `src/posters/registry.js`, `src/db/schema.js`
- Rename: `Poster1b.jsx` → `PosterGosc.jsx`; `Form1b.jsx` → `FormGosc.jsx`
- Delete: `Poster1bCzern.jsx`, `Poster1bZloto.jsx`, `Poster1bJasny.jsx`, `Poster1bSzary.jsx`

**Role table** (from `1b` / `1bCzern` / `1bZloto` / `1bJasny` / `1bSzary`):

| role | default | czern | zloto | jasny | szary |
|---|---|---|---|---|---|
| `pageBg` | cream | black | navy | paper | paper |
| `pageText` | ink | cream | cream | ink | slate |
| `mutedText` (InfoLine) | textMuted | creamMuted | creamMuted | textMuted | textMuted |
| `accent` (corner triangle bg + badge text + „Wstęp wolny" link) | navy | gold | gold | navy | grayDark |
| `sygnet` (sits in the triangle) | negatywny | negatywny | zloty | negatywny | negatywny |
| `logoVariant` | light | dark | dark | light | light |

Fixed (keep literal `colors.coral` / `colors.cream`): the date badge box (`background: colors.coral`, `color: colors.cream`) — identical in all five variants.

- [ ] **Step 1: Add `schemes.gosc`**

```js
const gosc = {
  default: { pageBg: colors.cream, pageText: colors.ink, mutedText: colors.textMuted,
             accent: colors.navy, sygnet: 'negatywny', logoVariant: 'light' },
  czern: { pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
           accent: colors.gold, sygnet: 'negatywny', logoVariant: 'dark' },
  zloto: { pageBg: colors.navy, pageText: colors.cream, mutedText: colors.creamMuted,
           accent: colors.gold, sygnet: 'zloty', logoVariant: 'dark' },
  jasny: { pageBg: colors.paper },
  szary: { pageBg: colors.paper, pageText: colors.slate, accent: colors.grayDark },
}
```

Add `gosc` to the `schemes` map.

- [ ] **Step 2: Assertions**

```js
// Gość
{
  const d = resolveScheme('gosc', undefined)
  assert.equal(d.cssVars['--accent'], colors.navy)
  assert.equal(d.sygnet, 'negatywny')
  const cz = resolveScheme('gosc', 'czern')
  assert.equal(cz.cssVars['--accent'], colors.gold)
  assert.equal(cz.sygnet, 'negatywny')   // Gość: czerń zostaje przy negatywnym
  assert.equal(cz.cssVars['--muted-text'], colors.creamMuted)
  const ja = resolveScheme('gosc', 'jasny')
  assert.equal(ja.cssVars['--page-bg'], colors.paper)
  assert.equal(ja.cssVars['--accent'], colors.navy)         // z default
  assert.equal(ja.cssVars['--muted-text'], colors.textMuted) // z default
  const sz = resolveScheme('gosc', 'szary')
  assert.equal(sz.cssVars['--page-text'], colors.slate)
  assert.equal(sz.cssVars['--muted-text'], colors.textMuted) // szary NIE nadpisuje
}
```

- [ ] **Step 3: Rename + rewrite**

```bash
git mv src/posters/Poster1b.jsx src/posters/PosterGosc.jsx
```

Replacement table for `PosterGosc.jsx`:

| current | replacement |
|---|---|
| `import { colors, fontMono } from './theme'` | `import { colors, fontMono } from './theme'` (keep — `colors.coral`/`colors.cream` still used) |
| `import { sygnetNegatywny } from './logos'` | `import { sygnetByName } from './logos'` + `import { resolveScheme } from './schemes'` |
| `export function Poster1b({ data }) {` | `export function PosterGosc({ data, scheme }) {` |
| after `withPlaceholders` | add `const s = resolveScheme('gosc', scheme)` |
| `<PosterFrame background={colors.cream} color={colors.ink}>` | `<PosterFrame vars={s.cssVars}>` |
| triangle `background: colors.navy` | `background: 'var(--accent)'` |
| `<img src={sygnetNegatywny} …>` (inside triangle) | `<img src={sygnetByName[s.sygnet]} …>` |
| date box `background: colors.coral, color: colors.cream` | unchanged (literal) |
| `<Badge color={colors.navy}>` | `<Badge color="var(--accent)">` |
| `<InfoLine … style={{ fontSize: 32, color: colors.textMuted, lineHeight: 1.35 }} />` | `… color: 'var(--muted-text)' …` |
| „Wstęp wolny · sknm.pk.edu.pl" `color: colors.navy` | `color: 'var(--accent)'` |
| `<LogoSlot logo={logos.pk} variant="light" …/>` ×2 | `variant={s.logoVariant}` |

- [ ] **Step 4: Delete variants + rename form**

```bash
git rm src/posters/Poster1bCzern.jsx src/posters/Poster1bZloto.jsx src/posters/Poster1bJasny.jsx src/posters/Poster1bSzary.jsx
git mv src/forms/Form1b.jsx src/forms/FormGosc.jsx
```

Rename export `Form1b` → `FormGosc`, update comment.

- [ ] **Step 5: Registry**

Drop `Poster1b`, `Poster1bCzern`, `Poster1bZloto`, `Poster1bJasny`, `Poster1bSzary`, `Form1b` imports and the `'1b'`, `'1b-czern'`, `'1b-zloto'`, `'1b-jasny'`, `'1b-szary'` entries. Add `PosterGosc`/`FormGosc` imports and:

```js
  gosc: {
    name: 'Gość',
    Component: PosterGosc,
    Form: FormGosc,
    schemes: ['default', 'czern', 'zloto', 'jasny', 'szary'],
  },
```

- [ ] **Step 6: DEFAULT_TEMPLATES**

Replace the `1b` + `1b-czern/zloto/jasny/szary` rows with `{ name: 'Gość', poster_key: 'gosc' }`.

- [ ] **Step 7: Verify**

```bash
node scripts/check-schemes.mjs
npm run lint && npm run build
```

Compare `/poster/gosc[/czern|/zloto|/jasny|/szary]` against ref `/poster/1b`, `/poster/1b-czern`, etc.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "$(printf 'Convert Gosc to one file + colour scheme\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

### Task 7: Convert Data

**Files:**
- Modify: `schemes.js`, `check-schemes.mjs`, `registry.js`, `schema.js`
- Rename: `Poster1d.jsx` → `PosterData.jsx`; `Form1d.jsx` → `FormData.jsx`
- Delete: `Poster1dCzern.jsx`, `Poster1dZloto.jsx`, `Poster1dJasny.jsx`, `Poster1dSzary.jsx`

**Role table** (from `1d` / `1dCzern` / `1dZloto` / `1dJasny` / `1dSzary`):

| role | default | czern | zloto | jasny | szary |
|---|---|---|---|---|---|
| `pageBg` | cream | black | navy | paper | paper |
| `pageText` | navy | cream | cream | navy | slate |
| `mutedText` (InfoLine) | textMuted | creamMuted | creamMuted | textMuted | textMuted |
| `title` | ink | cream | cream | ink | slate |
| `tri1` (left triangle) | navy | gold | gold | navy | grayDark |
| `tri2` (middle triangle) | lime | coral | coral | lime | gray |
| `tri3` (right triangle) | coral | cream | cream | coral | coral |
| `sygnet` | granat | negatywny | zloty | granat | szary |
| `logoVariant` | light | dark | dark | light | light |

Fixed (keep literal `colors.coral`): the month label (`colors.coral` in all five).

- [ ] **Step 1: Add `schemes.data`**

```js
const data = {
  default: { pageBg: colors.cream, pageText: colors.navy, mutedText: colors.textMuted,
             title: colors.ink, tri1: colors.navy, tri2: colors.lime, tri3: colors.coral,
             sygnet: 'granat', logoVariant: 'light' },
  czern: { pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
           title: colors.cream, tri1: colors.gold, tri2: colors.coral, tri3: colors.cream,
           sygnet: 'negatywny', logoVariant: 'dark' },
  zloto: { pageBg: colors.navy, pageText: colors.cream, mutedText: colors.creamMuted,
           title: colors.cream, tri1: colors.gold, tri2: colors.coral, tri3: colors.cream,
           sygnet: 'zloty', logoVariant: 'dark' },
  jasny: { pageBg: colors.paper },
  szary: { pageBg: colors.paper, pageText: colors.slate, title: colors.slate,
           tri1: colors.grayDark, tri2: colors.gray, sygnet: 'szary' },
}
```

Add `data` to the `schemes` map. (`schemes.data` — the key collides with no JS keyword; it is a plain object property.)

- [ ] **Step 2: Assertions**

```js
// Data
{
  const d = resolveScheme('data', undefined)
  assert.equal(d.cssVars['--page-text'], colors.navy)   // Data default: tekst granatowy
  assert.equal(d.cssVars['--tri2'], colors.lime)
  const sz = resolveScheme('data', 'szary')
  assert.equal(sz.cssVars['--tri3'], colors.coral)      // szary nie nadpisuje tri3
  assert.equal(sz.cssVars['--tri1'], colors.grayDark)
  const ja = resolveScheme('data', 'jasny')
  assert.equal(ja.cssVars['--title'], colors.ink)       // z default
}
```

- [ ] **Step 3: Rename + rewrite**

```bash
git mv src/posters/Poster1d.jsx src/posters/PosterData.jsx
```

Replacement table for `PosterData.jsx`:

| current | replacement |
|---|---|
| `import { colors, fontMono } from './theme'` | keep (`colors.coral` for month still used; `fontMono` used) |
| `import { sygnetGranat } from './logos'` | `import { sygnetByName } from './logos'` + `import { resolveScheme } from './schemes'` |
| `export function Poster1d({ data }) {` | `export function PosterData({ data, scheme }) {` |
| after `withPlaceholders` | `const s = resolveScheme('data', scheme)` |
| `<PosterFrame background={colors.cream} color={colors.navy} padding={72}>` | `<PosterFrame vars={s.cssVars} padding={72}>` |
| `<img src={sygnetGranat} …>` | `<img src={sygnetByName[s.sygnet]} …>` |
| month `color: colors.coral` | unchanged (literal) |
| title `color: colors.ink` | `color: 'var(--title)'` |
| `<InfoLine … style={{ color: colors.textMuted, maxWidth: '24ch' }} />` | `color: 'var(--muted-text)'` |
| triangle 1 `background: colors.navy` | `background: 'var(--tri1)'` |
| triangle 2 `background: colors.lime` | `background: 'var(--tri2)'` |
| triangle 3 `background: colors.coral` | `background: 'var(--tri3)'` |
| `<LogoSlot … variant="light" …/>` ×2 | `variant={s.logoVariant}` |

`BrandingText` and the huge day/time inherit `color` from PosterFrame (`var(--page-text)`) — no change needed.

- [ ] **Step 4: Delete variants + rename form**

```bash
git rm src/posters/Poster1dCzern.jsx src/posters/Poster1dZloto.jsx src/posters/Poster1dJasny.jsx src/posters/Poster1dSzary.jsx
git mv src/forms/Form1d.jsx src/forms/FormData.jsx
```

Rename export `Form1d` → `FormData`, update comment.

- [ ] **Step 5: Registry + DEFAULT_TEMPLATES**

Registry: drop `1d*` imports/entries, add `PosterData`/`FormData` and:

```js
  data: {
    name: 'Data',
    Component: PosterData,
    Form: FormData,
    schemes: ['default', 'czern', 'zloto', 'jasny', 'szary'],
  },
```

`DEFAULT_TEMPLATES`: replace the `1d` + `1d-*` rows with `{ name: 'Data', poster_key: 'data' }`.

- [ ] **Step 6: Verify**

```bash
node scripts/check-schemes.mjs
npm run lint && npm run build
```

Compare `/poster/data[/czern|/zloto|/jasny|/szary]` vs ref `/poster/1d[-czern…]`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "$(printf 'Convert Data to one file + colour scheme\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

### Task 8: Convert Wykład

Wykład's variants are `1h` (złoto), `1i` (czerń), `1j` (jasny), `1k` (szary) — separate top-level keys, each with its own byte-identical `Form1h`–`Form1k`. Registry `schemes` order matches history: `default`, `zloto`, `czern`, `jasny`, `szary`.

**Files:**
- Modify: `schemes.js`, `check-schemes.mjs`, `registry.js`, `schema.js`
- Rename: `Poster1a.jsx` → `PosterWyklad.jsx`; `Form1a.jsx` → `FormWyklad.jsx`
- Delete: `Poster1h.jsx`, `Poster1i.jsx`, `Poster1j.jsx`, `Poster1k.jsx`, `Form1h.jsx`, `Form1i.jsx`, `Form1j.jsx`, `Form1k.jsx`

**Role table** (from `1a` / `1h` / `1i` / `1j` / `1k`):

| role | default | zloto | czern | jasny | szary |
|---|---|---|---|---|---|
| `pageBg` | navy | navy | black | cream | paper |
| `pageText` | cream | cream | cream | limeText | slate |
| `badgeFill` (filled Badge) | lime | gold | gold | navy | grayDark |
| `badgeText` | limeText | cream | cream | cream | cream |
| `speaker` (speaker name) | lime | cream | gold | navy | grayDark |
| `chips` (3 stacked triangles, bottom-left) | lime | gold | gold | navy | gray |
| `washTop` (top-right wash triangle) | `rgba(255,255,255,.055)` | (default) | `rgba(255,255,255,.04)` | `rgba(60,69,155,.05)` | `rgba(138,141,143,.08)` |
| `wedgeBr` (bottom-right wedge, `opacity:.42` stays in JSX) | navyLight | (default) | `#1E1E1E` | `#E2DED3` | `#D8D4CA` |
| `wedgeBl` (bottom-left wedge) | navyDark | (default) | `#0A0A0A` | `#DAD5C8` | `#CFCAC0` |
| `sygnet` | negatywny | zloty | negatywny | granat | szary |
| `logoVariant` | dark | dark | dark | light | light |

- [ ] **Step 1: Add `schemes.wyklad`**

```js
const wyklad = {
  default: {
    pageBg: colors.navy, pageText: colors.cream,
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

Add `wyklad` to the `schemes` map.

- [ ] **Step 2: Assertions**

```js
// Wykład
{
  const d = resolveScheme('wyklad', undefined)
  assert.equal(d.cssVars['--badge-fill'], colors.lime)
  assert.equal(d.cssVars['--badge-text'], colors.limeText)
  assert.equal(d.cssVars['--wedge-bl'], colors.navyDark)
  const zl = resolveScheme('wyklad', 'zloto')
  assert.equal(zl.cssVars['--page-bg'], colors.navy)          // z default (zloto = navy)
  assert.equal(zl.cssVars['--wedge-br'], colors.navyLight)    // z default
  assert.equal(zl.cssVars['--speaker'], colors.cream)
  const cz = resolveScheme('wyklad', 'czern')
  assert.equal(cz.cssVars['--wedge-bl'], '#0A0A0A')
  assert.equal(cz.sygnet, 'negatywny')                        // Wykład czerń: negatyw, nie złoto
}
```

- [ ] **Step 3: Rename + rewrite**

```bash
git mv src/posters/Poster1a.jsx src/posters/PosterWyklad.jsx
```

Replacement table for `PosterWyklad.jsx`:

| current | replacement |
|---|---|
| `import { colors } from './theme'` | remove if unused after edits (`oxlint` will tell) |
| `import { sygnetNegatywny } from './logos'` | `import { sygnetByName } from './logos'` + `import { resolveScheme } from './schemes'` |
| `export function Poster1a({ data }) {` | `export function PosterWyklad({ data, scheme }) {` |
| after `withPlaceholders` | `const s = resolveScheme('wyklad', scheme)` |
| `<PosterFrame background={colors.navy} color={colors.cream} padding={72}>` | `<PosterFrame vars={s.cssVars} padding={72}>` |
| `<img src={sygnetNegatywny} …>` | `<img src={sygnetByName[s.sygnet]} …>` |
| `<Badge background={colors.lime} color={colors.limeText} style={{ fontSize: 24 }}>` | `<Badge background="var(--badge-fill)" color="var(--badge-text)" style={{ fontSize: 24 }}>` |
| speaker `<div style={{ fontSize: 36, fontWeight: 600, color: colors.lime }}>` | `color: 'var(--speaker)'` |
| `<LogoSlot … variant="dark" …/>` ×2 | `variant={s.logoVariant}` |
| wash triangle `background: 'rgba(255,255,255,.055)'` | `background: 'var(--wash-top)'` |
| wedge BR `background: colors.navyLight, opacity: 0.42` | `background: 'var(--wedge-br)', opacity: 0.42` |
| wedge BL `background: colors.navyDark` | `background: 'var(--wedge-bl)'` |
| 3 chips `background: colors.lime` (×3, opacity 1/.66/.33 stay) | `background: 'var(--chips)'` |

`BrandingText` (`opacity={0.85}`, no colour) and the title/InfoLine inherit `var(--page-text)` — no change.

- [ ] **Step 4: Delete variants + forms**

```bash
git rm src/posters/Poster1h.jsx src/posters/Poster1i.jsx src/posters/Poster1j.jsx src/posters/Poster1k.jsx
git rm src/forms/Form1h.jsx src/forms/Form1i.jsx src/forms/Form1j.jsx src/forms/Form1k.jsx
git mv src/forms/Form1a.jsx src/forms/FormWyklad.jsx
```

Rename export `Form1a` → `FormWyklad`, update comment.

- [ ] **Step 5: Registry**

Drop imports `Poster1a`, `Poster1h`, `Poster1i`, `Poster1j`, `Poster1k`, `Form1a`, `Form1h`, `Form1i`, `Form1j`, `Form1k` and entries `'1a'`, `'1h'`, `'1i'`, `'1j'`, `'1k'`. Add `PosterWyklad`/`FormWyklad` imports and:

```js
  wyklad: {
    name: 'Wykład',
    Component: PosterWyklad,
    Form: FormWyklad,
    schemes: ['default', 'zloto', 'czern', 'jasny', 'szary'],
  },
```

- [ ] **Step 6: DEFAULT_TEMPLATES**

Replace the `Wykład` (`1a`), `Wykład — złoto` (`1h`), `Wykład — czerń` (`1i`), `Wykład — jasny` (`1j`), `Wykład — szary` (`1k`) rows with `{ name: 'Wykład', poster_key: 'wyklad' }`.

- [ ] **Step 7: Verify**

```bash
node scripts/check-schemes.mjs
npm run lint && npm run build
```

Compare `/poster/wyklad` vs ref `/poster/1a`; `/poster/wyklad/zloto` vs `/poster/1h`; `/poster/wyklad/czern` vs `/poster/1i`; `/poster/wyklad/jasny` vs `/poster/1j`; `/poster/wyklad/szary` vs `/poster/1k`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "$(printf 'Convert Wyklad to one file + colour scheme\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

### Task 9: Convert Konferencja

**Files:**
- Modify: `schemes.js`, `check-schemes.mjs`, `registry.js`, `schema.js`
- Rename: `Poster1e.jsx` → `PosterKonferencja.jsx`; `Form1e.jsx` → `FormKonferencja.jsx`
- Delete: `Poster1eCzern.jsx`, `Poster1eZloto.jsx`, `Poster1eJasny.jsx`, `Poster1eSzary.jsx`

**Role table** (from `1e` / `1eCzern` / `1eZloto` / `1eJasny` / `1eSzary`):

| role | default | czern | zloto | jasny | szary |
|---|---|---|---|---|---|
| `pageBg` | cream | black | navy | paper | paper |
| `pageText` | ink | cream | cream | ink | slate |
| `mutedText` (agenda subtitle, „sknm.pk.edu.pl") | textMuted | creamMuted | creamMuted | textMuted | textMuted |
| `panel` (header band bg) | navy | inkPanel | inkPanel | navy | grayDark |
| `panelText` (header band text) | cream | cream | cream | cream | cream |
| `headerBadge` (Badge in header) | lime | gold | gold | lime | cream |
| `lineFirst` (first agenda border) | navy | gold | gold | navy | grayDark |
| `lineRest` (other agenda borders + trailing) | creamMuted | `rgba(244,242,237,.2)` | `rgba(244,242,237,.2)` | creamMuted | creamMuted |
| `footerBadge` (Badge2 in footer) | navy | gold | gold | navy | grayDark |
| `sygnet` | negatywny | negatywny | zloty | negatywny | szary |
| `logoVariant` | light | dark | dark | light | light |

Fixed (keep literal `colors.coral`): agenda time labels.

- [ ] **Step 1: Add `schemes.konferencja`**

```js
const konferencja = {
  default: {
    pageBg: colors.cream, pageText: colors.ink, mutedText: colors.textMuted,
    panel: colors.navy, panelText: colors.cream, headerBadge: colors.lime,
    lineFirst: colors.navy, lineRest: colors.creamMuted, footerBadge: colors.navy,
    sygnet: 'negatywny', logoVariant: 'light',
  },
  czern: {
    pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
    panel: colors.inkPanel, headerBadge: colors.gold,
    lineFirst: colors.gold, lineRest: 'rgba(244,242,237,.2)', footerBadge: colors.gold,
    sygnet: 'negatywny', logoVariant: 'dark',
  },
  zloto: {
    pageBg: colors.navy, pageText: colors.cream, mutedText: colors.creamMuted,
    panel: colors.inkPanel, headerBadge: colors.gold,
    lineFirst: colors.gold, lineRest: 'rgba(244,242,237,.2)', footerBadge: colors.gold,
    sygnet: 'zloty', logoVariant: 'dark',
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

Add `konferencja` to the `schemes` map.

- [ ] **Step 2: Assertions**

```js
// Konferencja
{
  const d = resolveScheme('konferencja', undefined)
  assert.equal(d.cssVars['--panel'], colors.navy)
  assert.equal(d.cssVars['--line-rest'], colors.creamMuted)
  const cz = resolveScheme('konferencja', 'czern')
  assert.equal(cz.cssVars['--panel'], colors.inkPanel)
  assert.equal(cz.cssVars['--line-rest'], 'rgba(244,242,237,.2)')
  assert.equal(cz.cssVars['--panel-text'], colors.cream)   // z default
  const ja = resolveScheme('konferencja', 'jasny')
  assert.equal(ja.cssVars['--panel'], colors.navy)         // z default
  const sz = resolveScheme('konferencja', 'szary')
  assert.equal(sz.cssVars['--line-rest'], colors.creamMuted) // szary nie nadpisuje
}
```

- [ ] **Step 3: Rename + rewrite**

```bash
git mv src/posters/Poster1e.jsx src/posters/PosterKonferencja.jsx
```

Replacement table for `PosterKonferencja.jsx`:

| current | replacement |
|---|---|
| `import { colors, fontMono } from './theme'` | keep (`colors.coral` + `fontMono` used) |
| `import { sygnetNegatywny } from './logos'` | `import { sygnetByName } from './logos'` + `import { resolveScheme } from './schemes'` |
| `export function Poster1e({ data }) {` | `export function PosterKonferencja({ data, scheme }) {` |
| after `agenda` const | `const s = resolveScheme('konferencja', scheme)` |
| `<PosterFrame background={colors.cream} color={colors.ink}>` | `<PosterFrame vars={s.cssVars}>` |
| header `background: colors.navy, color: colors.cream` | `background: 'var(--panel)', color: 'var(--panel-text)'` |
| `<Badge color={colors.lime}>` (header) | `<Badge color="var(--header-badge)">` |
| `<img src={sygnetNegatywny} …>` | `<img src={sygnetByName[s.sygnet]} …>` |
| agenda `borderTop: \`2px solid ${i === 0 ? colors.navy : colors.creamMuted}\`` | `` borderTop: `2px solid ${i === 0 ? 'var(--line-first)' : 'var(--line-rest)'}` `` |
| agenda time `color: colors.coral` | unchanged (literal) |
| agenda subtitle `color: colors.textMuted` | `color: 'var(--muted-text)'` |
| trailing `borderTop: \`2px solid ${colors.creamMuted}\`` | `` borderTop: `2px solid var(--line-rest)` `` |
| footer `<Badge color={colors.navy} style={…}>` | `<Badge color="var(--footer-badge)" style={…}>` |
| footer „sknm.pk.edu.pl" `color: colors.textMuted` | `color: 'var(--muted-text)'` |
| `<LogoSlot … variant="light" …/>` | `variant={s.logoVariant}` |
| `<PlaceholderBox label="patronat" width={180} height={68} />` | unchanged (uses its own defaults in every current variant) |

- [ ] **Step 4: Delete variants + rename form**

```bash
git rm src/posters/Poster1eCzern.jsx src/posters/Poster1eZloto.jsx src/posters/Poster1eJasny.jsx src/posters/Poster1eSzary.jsx
git mv src/forms/Form1e.jsx src/forms/FormKonferencja.jsx
```

Rename export `Form1e` → `FormKonferencja`, update comment.

- [ ] **Step 5: Registry + DEFAULT_TEMPLATES**

Registry: drop `1e*` imports/entries, add `PosterKonferencja`/`FormKonferencja` and:

```js
  konferencja: {
    name: 'Konferencja',
    Component: PosterKonferencja,
    Form: FormKonferencja,
    schemes: ['default', 'czern', 'zloto', 'jasny', 'szary'],
  },
```

`DEFAULT_TEMPLATES`: replace the `1e` + `1e-*` rows with `{ name: 'Konferencja', poster_key: 'konferencja' }`.

- [ ] **Step 6: Verify**

```bash
node scripts/check-schemes.mjs
npm run lint && npm run build
```

Compare `/poster/konferencja[/czern|/zloto|/jasny|/szary]` vs ref.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "$(printf 'Convert Konferencja to one file + colour scheme\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

### Task 10: Convert Rekrutacja

Default scheme is `limonka` (lime page), not `default`.

**Files:**
- Modify: `schemes.js`, `check-schemes.mjs`, `registry.js`, `schema.js`
- Rename: `Poster1f.jsx` → `PosterRekrutacja.jsx`; `Form1f.jsx` → `FormRekrutacja.jsx`
- Delete: `Poster1fCzern.jsx`, `Poster1fZloto.jsx`, `Poster1fJasny.jsx`, `Poster1fSzary.jsx`

**Role table** (from `1f` / `1fCzern` / `1fZloto` / `1fJasny` / `1fSzary`):

| role | limonka | czern | zloto | jasny | szary |
|---|---|---|---|---|---|
| `pageBg` | lime | black | gold | paper | paper |
| `pageText` | limeText | cream | ink | navy | slate |
| `band` (bottom zigzag band) | navy | gold | navy | navy | grayDark |
| `subColor` (subtitle) | navyDark | creamMuted | navyDark | textMuted | textMuted |
| `footerText` (bottom info block colour) | cream | ink | cream | cream | cream |
| `badgeColor` (Badge text) | lime | black | gold | lime | cream |
| `qrBorder` (QR PlaceholderBox border) | `rgba(244,242,237,.55)` | `rgba(18,18,18,.4)` | `rgba(244,242,237,.55)` | `rgba(244,242,237,.55)` | `rgba(244,242,237,.55)` |
| `qrText` (QR PlaceholderBox label) | `rgba(244,242,237,.75)` | `rgba(18,18,18,.6)` | `rgba(244,242,237,.75)` | `rgba(244,242,237,.75)` | `rgba(244,242,237,.75)` |
| `sygnet` | granat | negatywny | zloty | granat | szary |
| `logoVariant` | dark | light | dark | dark | dark |

- [ ] **Step 1: Add `schemes.rekrutacja`**

```js
const rekrutacja = {
  limonka: {
    pageBg: colors.lime, pageText: colors.limeText,
    band: colors.navy, subColor: colors.navyDark, footerText: colors.cream,
    badgeColor: colors.lime,
    qrBorder: 'rgba(244,242,237,.55)', qrText: 'rgba(244,242,237,.75)',
    sygnet: 'granat', logoVariant: 'dark',
  },
  czern: {
    pageBg: colors.black, pageText: colors.cream,
    band: colors.gold, subColor: colors.creamMuted, footerText: colors.ink,
    badgeColor: colors.black,
    qrBorder: 'rgba(18,18,18,.4)', qrText: 'rgba(18,18,18,.6)',
    sygnet: 'negatywny', logoVariant: 'light',
  },
  zloto: {
    pageBg: colors.gold, pageText: colors.ink,
    band: colors.navy, subColor: colors.navyDark, badgeColor: colors.gold,
    sygnet: 'zloty',
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

Add `rekrutacja` to the `schemes` map. (`limonka` is this layout's `default`-equivalent — `resolveScheme` merges named over `default`, and there is no `default` key here, so **every** `rekrutacja` scheme block must be self-complete for the roles it needs.) To keep the merge working, give `rekrutacja` a `default` alias:

```js
rekrutacja.default = rekrutacja.limonka
```

immediately after the object literal, so `resolveScheme('rekrutacja', 'zloto')` still inherits the shared roles (`footerText`, `qrBorder`, `qrText`, `logoVariant`) from `limonka`. Registry lists `schemes: ['limonka', …]` so the UI never shows a "default" swatch for Rekrutacja.

- [ ] **Step 2: Assertions**

```js
// Rekrutacja (default = limonka)
{
  const li = resolveScheme('rekrutacja', 'limonka')
  assert.equal(li.cssVars['--page-bg'], colors.lime)
  assert.equal(li.cssVars['--band'], colors.navy)
  const zl = resolveScheme('rekrutacja', 'zloto')
  assert.equal(zl.cssVars['--page-bg'], colors.gold)
  assert.equal(zl.cssVars['--footer-text'], colors.cream)   // z limonka
  assert.equal(zl.cssVars['--qr-border'], 'rgba(244,242,237,.55)') // z limonka
  assert.equal(zl.logoVariant, 'dark')                      // z limonka
  const cz = resolveScheme('rekrutacja', 'czern')
  assert.equal(cz.cssVars['--qr-border'], 'rgba(18,18,18,.4)')
  assert.equal(cz.logoVariant, 'light')
}
```

- [ ] **Step 3: Rename + rewrite**

```bash
git mv src/posters/Poster1f.jsx src/posters/PosterRekrutacja.jsx
```

Replacement table for `PosterRekrutacja.jsx`:

| current | replacement |
|---|---|
| `import { colors, fontMono } from './theme'` | keep if `fontMono` used (Badge style) — drop `colors` if unused |
| `import { sygnetGranat } from './logos'` | `import { sygnetByName } from './logos'` + `import { resolveScheme } from './schemes'` |
| `export function Poster1f({ data }) {` | `export function PosterRekrutacja({ data, scheme }) {` |
| after `withPlaceholders` | `const s = resolveScheme('rekrutacja', scheme)` |
| `<PosterFrame background={colors.lime} color={colors.limeText} padding={72}>` | `<PosterFrame vars={s.cssVars} padding={72}>` |
| bottom band `background: colors.navy` | `background: 'var(--band)'` |
| `<img src={sygnetGranat} …>` | `<img src={sygnetByName[s.sygnet]} …>` |
| subtitle `color: colors.navyDark` | `color: 'var(--sub-color)'` |
| bottom block wrapper `color: colors.cream` | `color: 'var(--footer-text)'` |
| `<Badge color={colors.lime} style={…}>` | `<Badge color="var(--badge-color)" style={…}>` |
| QR `<PlaceholderBox … style={{ borderColor: 'rgba(244,242,237,.55)', color: 'rgba(244,242,237,.75)' }} />` | `borderColor: 'var(--qr-border)', color: 'var(--qr-text)'` |
| `<LogoSlot … variant="dark" …/>` | `variant={s.logoVariant}` |

`BrandingText` (no colour), title, and `InfoLine` inherit `var(--page-text)` — no change.

- [ ] **Step 4: Delete variants + rename form**

```bash
git rm src/posters/Poster1fCzern.jsx src/posters/Poster1fZloto.jsx src/posters/Poster1fJasny.jsx src/posters/Poster1fSzary.jsx
git mv src/forms/Form1f.jsx src/forms/FormRekrutacja.jsx
```

Rename export `Form1f` → `FormRekrutacja`, update comment.

- [ ] **Step 5: Registry + DEFAULT_TEMPLATES**

Registry: drop `1f*` imports/entries, add `PosterRekrutacja`/`FormRekrutacja` and:

```js
  rekrutacja: {
    name: 'Rekrutacja',
    Component: PosterRekrutacja,
    Form: FormRekrutacja,
    schemes: ['limonka', 'czern', 'zloto', 'jasny', 'szary'],
  },
```

`DEFAULT_TEMPLATES`: replace the `1f` + `1f-*` rows with `{ name: 'Rekrutacja', poster_key: 'rekrutacja' }`.

- [ ] **Step 6: Verify**

```bash
node scripts/check-schemes.mjs
npm run lint && npm run build
```

Compare `/poster/rekrutacja` vs ref `/poster/1f`; `/poster/rekrutacja/limonka` also vs `/poster/1f`; `/poster/rekrutacja/czern` vs `/poster/1f-czern`; etc.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "$(printf 'Convert Rekrutacja to one file + colour scheme\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

### Task 11: Convert Warsztat

Richest role set (local `Pill` component, QR placeholder, logo backplates).

**Files:**
- Modify: `schemes.js`, `check-schemes.mjs`, `registry.js`, `schema.js`
- Rename: `Poster1c.jsx` → `PosterWarsztat.jsx`; `Form1c.jsx` → `FormWarsztat.jsx`
- Delete: `Poster1cCzern.jsx`, `Poster1cZloto.jsx`, `Poster1cJasny.jsx`, `Poster1cSzary.jsx`

**Role table** (from `1c` / `1cCzern` / `1cZloto` / `1cJasny` / `1cSzary`):

| role | default | czern | zloto | jasny | szary |
|---|---|---|---|---|---|
| `pageBg` | cream | black | navy | paper | paper |
| `pageText` | ink | cream | cream | ink | slate |
| `mutedText` (subtitle) | textMuted | creamMuted | creamMuted | textMuted | textMuted |
| `title` | navy | cream | cream | navy | slate |
| `badgeFill` | navy | gold | gold | navy | grayDark |
| `badgeText` | lime | black | ink | lime | cream |
| `pillFill` | lime | gold | gold | lime | gray |
| `pillText` | limeText | black | ink | limeText | slate |
| `slotBg` (QR box + logo backplates) | cream | black | navy | paper | paper |
| `qrBorder` | placeholderBorder | `rgba(244,242,237,.3)` | `rgba(244,242,237,.3)` | placeholderBorder | placeholderBorder |
| `qrText` | placeholderText | `rgba(244,242,237,.7)` | `rgba(244,242,237,.7)` | placeholderText | placeholderText |
| `sygnet` | granat | negatywny | zloty | granat | szary |
| `logoVariant` | light | dark | dark | light | light |

`colors.placeholderBorder` / `colors.placeholderText` are exported from `theme.js`.

- [ ] **Step 1: Add `schemes.warsztat`**

```js
const warsztat = {
  default: {
    pageBg: colors.cream, pageText: colors.ink, mutedText: colors.textMuted,
    title: colors.navy, badgeFill: colors.navy, badgeText: colors.lime,
    pillFill: colors.lime, pillText: colors.limeText, slotBg: colors.cream,
    qrBorder: colors.placeholderBorder, qrText: colors.placeholderText,
    sygnet: 'granat', logoVariant: 'light',
  },
  czern: {
    pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
    title: colors.cream, badgeFill: colors.gold, badgeText: colors.black,
    pillFill: colors.gold, pillText: colors.black, slotBg: colors.black,
    qrBorder: 'rgba(244,242,237,.3)', qrText: 'rgba(244,242,237,.7)',
    sygnet: 'negatywny', logoVariant: 'dark',
  },
  zloto: {
    pageBg: colors.navy, pageText: colors.cream, mutedText: colors.creamMuted,
    title: colors.cream, badgeFill: colors.gold, badgeText: colors.ink,
    pillFill: colors.gold, pillText: colors.ink, slotBg: colors.navy,
    qrBorder: 'rgba(244,242,237,.3)', qrText: 'rgba(244,242,237,.7)',
    sygnet: 'zloty', logoVariant: 'dark',
  },
  jasny: {
    pageBg: colors.paper, slotBg: colors.paper,
  },
  szary: {
    pageBg: colors.paper, pageText: colors.slate,
    title: colors.slate, badgeFill: colors.grayDark, badgeText: colors.cream,
    pillFill: colors.gray, pillText: colors.slate, slotBg: colors.paper,
    sygnet: 'szary',
  },
}
```

Add `warsztat` to the `schemes` map.

- [ ] **Step 2: Assertions**

```js
// Warsztat
{
  const d = resolveScheme('warsztat', undefined)
  assert.equal(d.cssVars['--pill-fill'], colors.lime)
  assert.equal(d.cssVars['--qr-border'], colors.placeholderBorder)
  const ja = resolveScheme('warsztat', 'jasny')
  assert.equal(ja.cssVars['--page-bg'], colors.paper)
  assert.equal(ja.cssVars['--slot-bg'], colors.paper)
  assert.equal(ja.cssVars['--badge-fill'], colors.navy)     // z default
  assert.equal(ja.cssVars['--pill-text'], colors.limeText)  // z default
  assert.equal(ja.sygnet, 'granat')                         // z default
  const cz = resolveScheme('warsztat', 'czern')
  assert.equal(cz.cssVars['--slot-bg'], colors.black)
  assert.equal(cz.cssVars['--qr-border'], 'rgba(244,242,237,.3)')
}
```

- [ ] **Step 3: Rename + rewrite**

```bash
git mv src/posters/Poster1c.jsx src/posters/PosterWarsztat.jsx
```

Replacement table for `PosterWarsztat.jsx`:

| current | replacement |
|---|---|
| `import { colors } from './theme'` | drop if unused after edits |
| `import { sygnetGranat } from './logos'` | `import { sygnetByName } from './logos'` + `import { resolveScheme } from './schemes'` |
| local `function Pill` — `background: colors.lime, color: colors.limeText` | `background: 'var(--pill-fill)', color: 'var(--pill-text)'` |
| `export function Poster1c({ data }) {` | `export function PosterWarsztat({ data, scheme }) {` |
| after `pills` const | `const s = resolveScheme('warsztat', scheme)` |
| `<PosterFrame background={colors.cream} color={colors.ink}>` | `<PosterFrame vars={s.cssVars}>` |
| `<img src={sygnetGranat} …>` | `<img src={sygnetByName[s.sygnet]} …>` |
| `<Badge background={colors.navy} color={colors.lime} style={…}>` | `<Badge background="var(--badge-fill)" color="var(--badge-text)" style={…}>` |
| title `color: colors.navy` | `color: 'var(--title)'` |
| subtitle `color: colors.textMuted` | `color: 'var(--muted-text)'` |
| `<PlaceholderBox label={…} width={150} height={150} style={{ background: colors.cream }} />` | `style={{ background: 'var(--slot-bg)', borderColor: 'var(--qr-border)', color: 'var(--qr-text)' }}` |
| `<LogoSlot … variant="light" … style={{ background: colors.cream }} />` ×2 | `variant={s.logoVariant} … style={{ background: 'var(--slot-bg)' }}` |

Note the default `PlaceholderBox` currently has no `borderColor`/`color` override; adding `var(--qr-border)`/`var(--qr-text)` with default values equal to `colors.placeholderBorder`/`colors.placeholderText` reproduces the current look exactly (those are the component's own defaults).

- [ ] **Step 4: Delete variants + rename form**

```bash
git rm src/posters/Poster1cCzern.jsx src/posters/Poster1cZloto.jsx src/posters/Poster1cJasny.jsx src/posters/Poster1cSzary.jsx
git mv src/forms/Form1c.jsx src/forms/FormWarsztat.jsx
```

Rename export `Form1c` → `FormWarsztat`, update comment.

- [ ] **Step 5: Registry + DEFAULT_TEMPLATES**

Registry: drop `1c*` imports/entries, add `PosterWarsztat`/`FormWarsztat` and:

```js
  warsztat: {
    name: 'Warsztat',
    Component: PosterWarsztat,
    Form: FormWarsztat,
    schemes: ['default', 'czern', 'zloto', 'jasny', 'szary'],
  },
```

`DEFAULT_TEMPLATES`: replace the `1c` + `1c-*` rows with `{ name: 'Warsztat', poster_key: 'warsztat' }`. After this task `DEFAULT_TEMPLATES` should be exactly 8 rows (`wyklad`, `gosc`, `warsztat`, `data`, `konferencja`, `rekrutacja`, `gala`, `ogloszenie`) and `registry.js` should import zero `Poster1*` / `Form1*`.

- [ ] **Step 6: Verify**

```bash
node scripts/check-schemes.mjs
npm run lint && npm run build
grep -rnE "Poster1[a-l]|Form1[a-l]|poster_key: '1" src/posters/registry.js src/db/schema.js   # expect: no matches
```

Compare `/poster/warsztat[/czern|/zloto|/jasny|/szary]` vs ref. Open the app, click through all 8 tiles — every one renders its default scheme.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "$(printf 'Convert Warsztat to one file + colour scheme\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

### Task 12: Database — colour_scheme column + version reset

**Files:**
- Modify: `src/db/schema.js`, `src/db/client.js`, `src/db/drafts.js`, `src/db/history.js`

**Interfaces:**
- Consumes: `DEFAULT_TEMPLATES` (now 8 named rows, from Tasks 4–11).
- Produces:
  - `draft` and `generated_images` tables gain `color_scheme TEXT`.
  - `resetIfStale(db) => boolean` in `schema.js`, called from `initDb` before `createSchema`.
  - `saveDraft(db, { …, color_scheme })` persists `color_scheme`.
  - `addHistoryEntry(db, { …, color_scheme })` persists it; `listHistory` returns `color_scheme`.

- [ ] **Step 1: Add columns + version reset to schema.js**

In `src/db/schema.js`:

- Add `color_scheme TEXT` to the `CREATE TABLE ... draft` and `CREATE TABLE ... generated_images` statements in `createSchema`.
- Add near the top:

```js
// Bump przy każdej zmianie kształtu tabel wymagającej świeżego startu.
export const SCHEMA_VERSION = 2

// Zgoda właściciela: dane lokalne (IndexedDB) można wyczyścić. Zamiast
// ostrożnej migracji kluczy `1b-czern` → layout+scheme po prostu zrzucamy
// tabele, gdy zapisana wersja jest starsza.
export function resetIfStale(db) {
  const [row] = rowsFromExec(db.exec('PRAGMA user_version'))
  const current = row ? Number(Object.values(row)[0]) : 0
  if (current >= SCHEMA_VERSION) return false
  db.run('DROP TABLE IF EXISTS templates; DROP TABLE IF EXISTS draft; DROP TABLE IF EXISTS generated_images;')
  db.run(`PRAGMA user_version = ${SCHEMA_VERSION}`)
  return true
}
```

- Delete `migrateDraftColumns` and its `DRAFT_EXTRA_COLUMNS` const (the version reset + full `createSchema` supersede it).

- [ ] **Step 2: Wire it into initDb**

In `src/db/client.js`:

```js
import { createSchema, syncTemplates, resetIfStale } from './schema'
```

```js
  const db = saved ? new SQL.Database(new Uint8Array(saved)) : new SQL.Database()
  const wiped = resetIfStale(db)
  createSchema(db)
  const templatesChanged = syncTemplates(db)
  if (!saved || wiped || templatesChanged) persist(db)
  return db
```

- [ ] **Step 3: Persist colour_scheme in the draft**

In `src/db/drafts.js` `saveDraft`, add `color_scheme` to the column list, the `VALUES` list, the `ON CONFLICT ... DO UPDATE SET` list, and the params object:

```js
     `INSERT INTO draft (id, title, subtitle, speaker, event_date, event_time, location, badge, badge2, color_scheme, template_id, updated_at)
      VALUES (1, :title, :subtitle, :speaker, :event_date, :event_time, :location, :badge, :badge2, :color_scheme, :template_id, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        …
        color_scheme = excluded.color_scheme,
        template_id = excluded.template_id,
        updated_at = excluded.updated_at`,
```

```js
      ':color_scheme': draft.color_scheme ?? null,
```

- [ ] **Step 4: Persist colour_scheme in history**

In `src/db/history.js`:
- `listHistory` SELECT: add `g.color_scheme`.
- `addHistoryEntry`: add `color_scheme` to the column list, `VALUES`, and params (`':color_scheme': entry.color_scheme ?? null`).

- [ ] **Step 5: Verify**

```bash
npm run lint && npm run build
```

Then `npm run dev`, open DevTools → Application → IndexedDB → delete `sknm-image-generator-db`, reload. Expected: 8 template tiles, no console errors. In DevTools run against the DB (or just trust the flow): the draft round-trips and `PRAGMA user_version` returns `2`. Reload again — templates not duplicated (`syncTemplates` no-ops).

- [ ] **Step 6: Commit**

```bash
git add src/db/
git commit -m "$(printf 'Add color_scheme column and version-gated local DB reset\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

### Task 13: Scheme selection UI

**Files:**
- Modify: `src/App.jsx`, `src/components/TemplateSelector.jsx`, `src/components/PosterPreview.jsx`, `src/components/HistoryList.jsx`

**Interfaces:**
- Consumes: `posterRegistry[key].schemes` (Tasks 4–11), `SCHEME_LABELS` (T1), `resolveScheme` via components, `draft.color_scheme` (T12).
- Produces:
  - `App` holds `selectedScheme`; passes `scheme`/`selectedScheme`/`onSelectScheme` down.
  - `<TemplateSelector templates selectedId selectedScheme onSelect onSelectScheme />`.
  - `<PosterPreview posterRef Component data scheme />`.
  - `<HistoryList entries onRestore onDelete />` shows the scheme label.

- [ ] **Step 1: PosterPreview passes scheme**

`src/components/PosterPreview.jsx`:

```jsx
export function PosterPreview({ posterRef, Component, data, scheme }) {
  if (!Component) return null
  return (
    <div className="poster-preview">
      <PosterScaled ref={posterRef} size={PREVIEW_SIZE}>
        <Component data={data} scheme={scheme} />
      </PosterScaled>
    </div>
  )
}
```

- [ ] **Step 2: App scheme state**

In `src/App.jsx`:

- Add `color_scheme: ''` to `EMPTY_FORM`? No — keep scheme out of the form object; use a dedicated state:

```js
const [selectedScheme, setSelectedScheme] = useState(undefined)
```

- Add a helper (module scope):

```js
function defaultSchemeFor(templateId, templates) {
  const tpl = templates.find((t) => t.id === templateId)
  return tpl ? posterRegistry[tpl.poster_key]?.schemes?.[0] : undefined
}
```

- In the initial `getDb().then(...)` effect, the existing code computes a
  template id from the draft (`draft.template_id ?? tpls[0]?.id ?? null`) and
  passes it to `setSelectedTemplateId`. Capture that id in a local
  `const initialTemplateId = draft?.template_id ?? tpls[0]?.id ?? null` and, right
  after `setSelectedTemplateId(initialTemplateId)`, add:

```js
setSelectedScheme(draft?.color_scheme ?? defaultSchemeFor(initialTemplateId, tpls))
```

  (both branches of the existing `if (draft) { … } else { … }` set the template
  id — set the scheme in the same two places, or hoist the id computation above
  the `if` so there is a single `setSelectedScheme` call).

- `persistDraft` gains the scheme:

```js
const persistDraft = useCallback((nextForm, templateId, schemeName) => {
  if (!dbRef.current) return
  if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
  saveTimeoutRef.current = setTimeout(() => {
    saveDraft(dbRef.current, { ...nextForm, template_id: templateId, color_scheme: schemeName ?? null })
  }, 400)
}, [])
```

  Update every existing `persistDraft(next, selectedTemplateId)` call to `persistDraft(next, selectedTemplateId, selectedScheme)`.

- `handleSelectTemplate` resets the scheme:

```js
const handleSelectTemplate = (id) => {
  setSelectedTemplateId(id)
  const nextScheme = defaultSchemeFor(id, templates)
  setSelectedScheme(nextScheme)
  persistDraft(form, id, nextScheme)
}
```

- New handler:

```js
const handleSelectScheme = (name) => {
  setSelectedScheme(name)
  persistDraft(form, selectedTemplateId, name)
}
```

- `handleRestoreHistoryEntry`: after `setSelectedTemplateId(templateId)`, add
  `const nextScheme = entry.color_scheme ?? defaultSchemeFor(templateId, templates); setSelectedScheme(nextScheme);`
  and pass `nextScheme` to `persistDraft`.

- `handleDownload`: `addHistoryEntry(dbRef.current, { ...form, template_id: selectedTemplateId, color_scheme: selectedScheme })`.

- Pass props down:

```jsx
<TemplateSelector
  templates={templates}
  selectedId={selectedTemplateId}
  selectedScheme={selectedScheme}
  onSelect={handleSelectTemplate}
  onSelectScheme={handleSelectScheme}
/>
```

```jsx
<PosterPreview posterRef={posterRef} Component={selectedPoster?.Component} data={form} scheme={selectedScheme} />
```

- [ ] **Step 3: Rewrite TemplateSelector**

Replace `src/components/TemplateSelector.jsx` with:

```jsx
import { posterRegistry } from '../posters/registry'
import { SCHEME_LABELS } from '../posters/schemes'
import { PosterScaled } from './PosterScaled'

const THUMB_SIZE = 180
const SWATCH_SIZE = 64
const THUMB_DATA = {}

export function TemplateSelector({ templates, selectedId, selectedScheme, onSelect, onSelectScheme }) {
  const selected = templates.find((t) => t.id === selectedId)
  const selectedEntry = selected ? posterRegistry[selected.poster_key] : null
  const schemeList = selectedEntry?.schemes ?? []

  return (
    <div>
      <div className="template-selector">
        {templates.map((tpl) => {
          const entry = posterRegistry[tpl.poster_key]
          if (!entry) return null
          const { Component } = entry
          const isActive = tpl.id === selectedId
          return (
            <button
              key={tpl.poster_key}
              type="button"
              className={`template-thumb${isActive ? ' is-selected' : ''}`}
              onClick={() => onSelect(tpl.id)}
            >
              <PosterScaled size={THUMB_SIZE}>
                <Component data={THUMB_DATA} scheme={entry.schemes?.[0]} />
              </PosterScaled>
              <span>{entry.name}</span>
            </button>
          )
        })}
      </div>

      {schemeList.length > 1 && (
        <div className="color-variant-selector">
          <span className="color-variant-label">Kolorystyka</span>
          <div className="color-variant-row">
            {schemeList.map((name) => (
              <button
                key={name}
                type="button"
                className={`color-variant-thumb${name === selectedScheme ? ' is-selected' : ''}`}
                onClick={() => onSelectScheme(name)}
              >
                <PosterScaled size={SWATCH_SIZE}>
                  <selectedEntry.Component data={THUMB_DATA} scheme={name} />
                </PosterScaled>
                <span>{SCHEME_LABELS[name] ?? name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

(The `.template-selector`, `.color-variant-*` CSS classes already exist in `App.css` — reused unchanged.)

- [ ] **Step 4: HistoryList shows the scheme**

In `src/components/HistoryList.jsx`:
- `import { SCHEME_LABELS } from '../posters/schemes'`
- `<Component data={entry} />` → `<Component data={entry} scheme={entry.color_scheme} />`
- The meta line:

```jsx
<span className="history-meta">
  {entry.template_name ?? 'usunięty szablon'}
  {entry.color_scheme && ` · ${SCHEME_LABELS[entry.color_scheme] ?? entry.color_scheme}`}
  {' — '}{entry.created_at}
</span>
```

- [ ] **Step 5: Verify**

```bash
npm run lint && npm run build
```

`npm run dev`, clear IndexedDB, reload:
- Pick each layout → swatch row appears for the 7 multi-scheme layouts, absent for Gala.
- Click swatches → live preview updates colours; selected swatch highlighted.
- Reload page → last layout + scheme restored from the draft.
- Fill a title, `Pobierz PNG`, check the History panel: entry shows e.g. "Gość · Czerń — <timestamp>" and its thumbnail is in the chosen colours.
- Click "Przywróć" on that entry → form + layout + scheme restored.

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx src/components/
git commit -m "$(printf 'Add colour-scheme picker, preview and history wiring\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

### Task 14: Update the blocks README

**Files:**
- Modify: `src/posters/blocks/README.md`

- [ ] **Step 1: Rewrite the "how to add a template" section**

Update `src/posters/blocks/README.md`:
- Step 1 example: `Poster1a.jsx` → `PosterWyklad.jsx`.
- Step 4: "Dodaj plik do `src/posters/registry.js` (klucz `poster_key` = nazwa layoutu, komponent, formularz, `schemes: [...]`), do `DEFAULT_TEMPLATES` w `src/db/schema.js`, oraz blok `<layout>` do `src/posters/schemes.js` (kolory)."
- Step 5: `/poster/:id` → `/poster/<layout>` i `/poster/<layout>/<scheme>` (np. `/poster/gosc/czern`).
- Add a new subsection **"Kolory i schematy"**:

```markdown
## Kolory i schematy

Plakat nie trzyma kolorów na sztywno. Na górze woła
`const s = resolveScheme('<layout>', scheme)` i przekazuje w dół stringi
`var(--rola)` (nie hexy). `PosterFrame vars={s.cssVars}` rozlewa zmienne CSS na
korzeń 1080×1080, więc każdy potomek (również bloki) widzi `var(--page-bg)`,
`var(--accent)`, `var(--badge-fill)` itd.

Wszystkie wartości kolorów są w `src/posters/schemes.js`, zagnieżdżone po
layoucie: `schemes.<layout>.default` to pełny zestaw ról, nazwane schematy
(`czern`, `zloto`, `jasny`, `szary`, dla Rekrutacji `limonka`) nadpisują tylko
różnice. Dekoracje (trójkąty, kliny) mają własne role z konkretną wartością per
schemat — bez `color-mix`.

`s.sygnet` (nazwa assetu, przez `sygnetByName`) i `s.logoVariant`
(`'light'|'dark'`) też pochodzą ze schematu.
```

- [ ] **Step 2: Verify**

Run: `npm run build` (docs aren't linted; just confirm nothing else broke).

- [ ] **Step 3: Commit**

```bash
git add src/posters/blocks/README.md
git commit -m "$(printf 'Document the colour-scheme system in the blocks README\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

### Task 15: Full verification sweep

**Files:** `src/posters/blocks/PosterFrame.jsx` (slim-down); otherwise verification only.

- [ ] **Step 1: Slim PosterFrame back to the spec signature**

Every poster now passes `vars` and never `background`/`color`, so remove the
transitional fallback props. `PosterFrame` becomes exactly:

```jsx
export function PosterFrame({ vars, padding = 0, style, children }) {
  return (
    <div
      style={{
        ...posterBaseStyle,
        ...vars,
        background: 'var(--page-bg)',
        color: 'var(--page-text)',
        padding,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
```

Then `git grep -n "background={colors\|color={colors" -- src/posters` must return nothing. Commit:

```bash
git add src/posters/blocks/PosterFrame.jsx
git commit -m "$(printf 'Drop PosterFrame bg/color fallback now that every poster passes vars\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

- [ ] **Step 2: Static checks**

```bash
npm run lint
npm run build
node scripts/check-schemes.mjs
git grep -nE "Poster1[a-l]|Form1[a-l]|familyLabel|colorLabel|groupByFamily|1[a-l]-(czern|zloto|jasny|szary)" -- src/
```

Expected: lint + build clean; `check-schemes: OK`; the `git grep` returns **nothing** (all numeric keys, variant keys, and the old `family` grouping API are gone). `git grep -nE "sygnetNegatywny|sygnetGranat|sygnetZloty|sygnetSzary|sygnetCzarny" -- src/posters` should now only hit `logos.js` — if a name is unreferenced elsewhere, drop it from the `export { … }` line in `logos.js` and commit.

- [ ] **Step 3: Visual matrix vs the reference checkout**

With `npm run dev` (5173) and the ref checkout (5174, from the Conversion Recipe preamble), walk every layout × scheme:

| new URL | ref URL |
|---|---|
| `/poster/wyklad` `/wyklad/zloto` `/wyklad/czern` `/wyklad/jasny` `/wyklad/szary` | `/poster/1a` `/1h` `/1i` `/1j` `/1k` |
| `/poster/gosc` `+/czern /zloto /jasny /szary` | `/poster/1b` `+-czern …` |
| `/poster/warsztat` `+…` | `/poster/1c` `+…` |
| `/poster/data` `+…` | `/poster/1d` `+…` |
| `/poster/konferencja` `+…` | `/poster/1e` `+…` |
| `/poster/rekrutacja` `/rekrutacja/limonka` `+/czern /zloto /jasny /szary` | `/poster/1f` `+-czern …` |
| `/poster/gala` | `/poster/1g` |
| `/poster/ogloszenie` `+…` | `/poster/1l` `+…` |

Expected: each pair visually equivalent. Note any deliberate drift in the spec's "Ryzyka" section; anything unexpected is a bug — fix in the owning file (poster or `schemes.js`) and amend that task's commit or add a follow-up commit.

- [ ] **Step 4: PNG export resolves CSS vars**

In the app: pick Konferencja / Czerń (has `rgba()` line roles + panel), fill a title, `Pobierz PNG` (both `square` and `story` formats). Open each PNG.
Expected: colours identical to the on-screen preview — **no** black fills, no transparent regions, no unstyled text. (`html-to-image` inlines computed styles, so `var(--x)` is serialised as resolved `rgb(...)`.)
If a var fails to resolve in the export only: move the `...vars` spread from `PosterFrame` up onto the capture node — set them in `PosterScaled` via a new `vars` prop passed by `PosterPreview` (which already has `scheme` → call `resolveScheme` there too). Add that as a new commit.

- [ ] **Step 5: Fresh-database flow**

DevTools → delete IndexedDB `sknm-image-generator-db` → reload.
Expected: 8 tiles; default schemes render; draft persists layout+scheme across reload; history entries carry the scheme label; "Przywróć" restores layout+scheme+text.

- [ ] **Step 6: Clean up the reference worktree**

```bash
git worktree remove ../sknm-ref
```

- [ ] **Step 7: Final commit if anything changed in Steps 3–4**

Otherwise nothing beyond Step 1 to commit — the branch is ready for review/merge via `superpowers:finishing-a-development-branch`.

---

## Self-Review

**Spec coverage:**

| Spec section | Task(s) |
|---|---|
| `schemes.js` nested per layout + `resolveScheme(layoutKey, name)` | 1, then a block per layout in 4–11 |
| `SCHEME_LABELS` | 1 |
| `sygnetByName` in `logos.js` | 1 |
| `PosterFrame` emits `vars`, bg/color from `var()` | 2 |
| Blocks unchanged, receive `var(--role)` | 4–11 (verified: no block file modified) |
| Decoration roles explicit per scheme (no `color-mix`) | 7 (`tri*`), 8 (`wedge*`, `washTop`), 5 (`panelBr`) |
| One component file per layout, renamed to names | 4–11 |
| Forms renamed; `Form1h–1k` deleted | 8 (Wykład), 4–11 (rest) |
| `registry.js` new shape, `schemes: [...]`, no `family` | 4–11 |
| Gala has no `schemes`, renders `schemes.gala.default` | 5 |
| `DEFAULT_TEMPLATES` → 8 named rows | 4–11 (each slice), verified in 11 & 15 |
| `color_scheme TEXT` on `draft` + `generated_images` | 12 |
| `PRAGMA user_version` reset, drop `migrateDraftColumns` | 12 |
| `drafts.js` / `history.js` persist `color_scheme` | 12 |
| `App.jsx` `selectedScheme` state, reset on layout change, persist, restore | 13 |
| `TemplateSelector` swatch row from `registry.schemes` + `SCHEME_LABELS` | 13 |
| `PosterPreview` passes `scheme` | 13 |
| `HistoryList` shows scheme label | 13 |
| `main.jsx` + `PosterPreviewPage` `/poster/<layout>/<scheme>` | 3 |
| `blocks/README.md` update | 14 |
| Verification: `/poster/:layout/:scheme` matrix, PNG export, fresh DB, lint, build | 15 (and per-task) |

No gaps.

**Placeholder scan:** No "TBD"/"TODO". Every poster task carries its full scheme block, role table, and exact replacement table. `check-schemes.mjs` assertions are concrete. The one deferred detail — "exact role values" — is resolved: every value is in a task's scheme block, derived from the variant files listed in that task's role table.

**Type consistency:**
- `resolveScheme(layoutKey, name)` — 2 args everywhere (T1 definition; T4–11 call sites `resolveScheme('<layout>', scheme)`; T13 `PosterPreview` uses the component, not the resolver directly).
- Return shape `{ cssVars, sygnet, logoVariant }` — consumed as `s.cssVars` (→ `PosterFrame vars`), `sygnetByName[s.sygnet]`, `s.logoVariant` consistently.
- `posterRegistry[key]` fields: `name`, `Component`, `Form`, `schemes?` — `TemplateSelector` (T13) reads `entry.name`, `entry.Component`, `entry.schemes?.[0]`; `App` reads `.schemes?.[0]` via `defaultSchemeFor`; matches T4–11 definitions.
- `color_scheme` — column name identical in `schema.js`, `drafts.js`, `history.js` (T12) and `entry.color_scheme` / `draft.color_scheme` reads (T13).
- CSS var names — produced by `roleToVar` (T1), consumed as literal `var(--…)` strings in T4–11; each poster task's replacement table spells the exact string, and the role table's role name feeds `roleToVar` deterministically (`badgeFill`→`--badge-fill`, `lineFirst`→`--line-first`, `tri1`→`--tri1`, `wedgeBr`→`--wedge-br`, `panelBr`→`--panel-br`, `subColor`→`--sub-color`, `qrBorder`→`--qr-border`, `slotBg`→`--slot-bg`, `headerBadge`→`--header-badge`, `footerBadge`→`--footer-badge`, `footerText`→`--footer-text`, `badgeColor`→`--badge-color`, `mutedText`→`--muted-text`, `pageBg`→`--page-bg`, `pageText`→`--page-text`, `accentText`→`--accent-text`).
