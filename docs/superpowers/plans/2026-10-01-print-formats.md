# Print Formats & Collapsible Panels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Export posters for A4/A3/A2 paper in portrait or landscape as PNG or CMYK PDF with a layout that really fills the page, and let the creator's long panels be rolled up.

**Architecture:** A poster renders in one of three shapes (`square` 1080×1080, `portrait` 1080×1528, `landscape` 1528×1080) carried by React context from `PosterScaled` to `PosterFrame`; paper size only changes output resolution. Export rasterises the layout node at paper pixel size with a 300→200→150 dpi fallback; PDF wraps a naive-CMYK, Flate-compressed image in a hand-written single-page PDF. Pure logic lives in small DOM-free modules so it is unit-testable in vitest's node environment.

**Tech Stack:** React 19, TypeScript ~5.9, Vite 8, Tailwind 4, vitest 4 (node env, `src/**/*.test.ts` only), `html-to-image`, browser `CompressionStream`. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-01-print-formats-design.md`

## Global Constraints

- No new npm dependencies.
- Layout sizes: `square` 1080×1080, `portrait` 1080×1528, `landscape` 1528×1080.
- Paper sizes (mm, portrait): A4 210×297, A3 297×420, A2 420×594.
- Resolution ladder: 300, 200, 150 dpi, in that order.
- PDF is always `/DeviceCMYK`; PNG is always RGB. No bleed, no crop marks.
- Square and Story exports must be pixel-identical to today.
- Thumbnails, scheme swatches, history and `/poster/:id` without `?shape` stay square.
- `orientation`, `fileType`, `exportFormat` are session-only (not in the draft DB, not in `localStorage`). Collapsed-panel state **is** in `localStorage` under `sknm-collapsed-panels`.
- Template tweaks derive from `usePosterShape()` (`width`/`height`/`kx`/`ky`), never from the paper size. Font sizes do not change per shape.
- Tests are `.ts` files (vitest `include` is `src/**/*.test.ts`); render components with `createElement` + `renderToStaticMarkup`, not JSX.
- UI copy is Polish. Code comments are Polish, matching the surrounding files. Commit messages are Polish and end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- After every task: `npm run typecheck && npm run lint && npm test` all pass.

## Review Focus

1. **Unknown or stale format key** (e.g. a key removed later) → treated as the square PNG export, never a crash. Test in Task 2.
2. **Pure black pixel in CMYK conversion** (`max(R,G,B) = 0`, division by zero) → `0,0,0,255`, no `NaN`. Test in Task 3.
3. **Browser cannot allocate A2 at 300 dpi** → falls back to 200, then 150, reports the dpi used; if all fail the error surfaces instead of downloading a blank file. Test in Task 5.
4. **Corrupt `sknm-collapsed-panels` value** (invalid JSON, wrong types, missing keys) → all panels open. Test in Task 8.
5. **Collapsed panel must not lose what is inside** → children stay mounted (`hidden`), not unmounted. Test in Task 8.

## File Structure

| File | Responsibility |
|---|---|
| `src/types.ts` (modify) | `PosterShape`, `Orientation`, `FileType` |
| `src/posters/shape.ts` (create) | `SHAPE_SIZE`, `PosterShapeContext`, `usePosterShape()` |
| `src/posters/theme.ts` (modify) | `posterBaseStyle` loses fixed width/height |
| `src/posters/blocks/PosterFrame.tsx` (modify) | sizes itself from the shape |
| `src/components/PosterScaled.tsx` (modify) | `shape` prop, provides the context |
| `src/components/PosterPreview.tsx` (modify) | passes `shape` |
| `src/pages/PosterPreviewPage.tsx`, `src/main.tsx` (modify) | `?shape=` for visual checks |
| `src/posters/formats.ts` (create) | `EXPORT_FORMATS`, `isPrintFormat`, `shapeFor`, `pixelSize`, `pageSizePt` — DOM-free |
| `src/posters/cmyk.ts` (create) | `rgbaToCmyk` |
| `src/posters/pdf.ts` (create) | `buildPdf` |
| `src/posters/dpiLadder.ts` (create) | `DPI_LADDER`, `withDpiLadder` |
| `src/posters/export.ts` (modify) | `downloadPoster` (DOM side: rasterise, deflate, download) |
| `src/components/SegmentedToggle.tsx` (create) | generic segmented control |
| `src/components/LangToggle.tsx` (modify) | thin wrapper over `SegmentedToggle` |
| `src/utils/collapsedPanels.ts` (create) | parse/serialise collapsed state |
| `src/components/CollapsiblePanel.tsx` (create) | panel with a toggle heading |
| `src/App.tsx` (modify) | state + wiring |
| `src/posters/Poster{Wyklad,Komunikat,Gala,Warsztat,Gosc}.tsx` (modify) | shape-aware fixed-size parts |
| `docs/architektura.md`, `docs/dodawanie-szablonu.md` (modify) | docs |

---

### Task 1: Poster shapes

**Files:**
- Modify: `src/types.ts`, `src/posters/theme.ts:68-75`, `src/posters/blocks/PosterFrame.tsx`, `src/components/PosterScaled.tsx`, `src/components/PosterPreview.tsx`, `src/pages/PosterPreviewPage.tsx`, `src/main.tsx`
- Create: `src/posters/shape.ts`
- Test: `src/posters/shape.test.ts`

**Interfaces:**
- Produces:
  - `type PosterShape = 'square' | 'portrait' | 'landscape'`, `type Orientation = 'portrait' | 'landscape'`, `type FileType = 'png' | 'pdf'` (from `src/types.ts`)
  - `SHAPE_SIZE: Record<PosterShape, { width: number; height: number }>`
  - `PosterShapeContext: React.Context<PosterShape>` (default `'square'`)
  - `usePosterShape(): { shape: PosterShape; width: number; height: number; kx: number; ky: number }` where `kx = width / 1080`, `ky = height / 1080`
  - `<PosterScaled size={number} shape?: PosterShape>` — `size` is on-screen **width**
  - `<PosterPreview … shape?: PosterShape>`
  - URL `/poster/<key>[/<scheme>]?shape=portrait|landscape`

- [ ] **Step 1: Write the failing test** — `src/posters/shape.test.ts`

```ts
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SHAPE_SIZE } from './shape'
import { PosterFrame } from './blocks/PosterFrame'
import { PosterScaled } from '../components/PosterScaled'

const frame = () => createElement(PosterFrame, { children: 'x' })

describe('kształty plakatu', () => {
  it('SHAPE_SIZE: kwadrat, pion, poziom na skali 1080', () => {
    expect(SHAPE_SIZE.square).toEqual({ width: 1080, height: 1080 })
    expect(SHAPE_SIZE.portrait).toEqual({ width: 1080, height: 1528 })
    expect(SHAPE_SIZE.landscape).toEqual({ width: 1528, height: 1080 })
  })

  it('PosterFrame bez kontekstu = kwadrat 1080×1080 (miniatury bez zmian)', () => {
    expect(renderToStaticMarkup(frame())).toContain('width:1080px;height:1080px')
  })

  it('PosterScaled bez `shape` = kwadrat, `size` to szerokość i wysokość', () => {
    const html = renderToStaticMarkup(createElement(PosterScaled, { size: 540, children: frame() }))
    expect(html).toContain('width:540px;height:540px')
    expect(html).toContain('width:1080px;height:1080px')
  })

  it('PosterScaled shape=portrait: ramka 1080×1528, pudełko 540×764', () => {
    const html = renderToStaticMarkup(createElement(PosterScaled, { size: 540, shape: 'portrait', children: frame() }))
    expect(html).toContain('width:540px;height:764px')
    // dwa wrappery PosterScaled + sama ramka (kształt dotarł przez kontekst)
    expect(html.split('width:1080px;height:1528px').length - 1).toBe(3)
  })

  it('PosterScaled shape=landscape: ramka 1528×1080, pudełko 764×540', () => {
    const html = renderToStaticMarkup(createElement(PosterScaled, { size: 764, shape: 'landscape', children: frame() }))
    expect(html).toContain('width:764px;height:540px')
    expect(html.split('width:1528px;height:1080px').length - 1).toBe(3)
  })
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx vitest run src/posters/shape.test.ts`
Expected: FAIL — cannot resolve `./shape`.

- [ ] **Step 3: Add the types** — append to `src/types.ts`, next to `PosterLang`:

```ts
// Kształt renderowanego plakatu. `square` to format social i wszystkie
// miniatury; `portrait`/`landscape` to proporcja papieru A (1:√2).
export type PosterShape = 'square' | 'portrait' | 'landscape'
export type Orientation = 'portrait' | 'landscape'
export type FileType = 'png' | 'pdf'
```

- [ ] **Step 4: Create `src/posters/shape.ts`**

```ts
import { createContext, useContext } from 'react'
import type { PosterShape } from '../types'

// Rozmiar układu (CSS px) każdego kształtu, na dotychczasowej skali 1080.
// A2/A3/A4 mają tę samą proporcję, więc format papieru zmienia tylko
// rozdzielczość eksportu (patrz formats.ts), nigdy układ.
export const SHAPE_SIZE: Record<PosterShape, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1528 },
  landscape: { width: 1528, height: 1080 },
}

// Domyślnie kwadrat: wszystko, co nie podaje kształtu (miniatury szablonów,
// swatche, historia), renderuje się jak dotychczas.
export const PosterShapeContext = createContext<PosterShape>('square')

// `kx`/`ky` = ile razy ramka jest szersza/wyższa od kwadratu — do skalowania
// elementów o stałych wymiarach (kliny, zdjęcia).
export function usePosterShape() {
  const shape = useContext(PosterShapeContext)
  const { width, height } = SHAPE_SIZE[shape]
  return { shape, width, height, kx: width / 1080, ky: height / 1080 }
}
```

- [ ] **Step 5: Remove the fixed size from `posterBaseStyle`** — in `src/posters/theme.ts` replace the constant with:

```ts
// Wymiary ramki nadaje PosterFrame z kształtu (patrz shape.ts).
export const posterBaseStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  boxSizing: 'border-box',
  fontFamily: fontHeading,
}
```

- [ ] **Step 6: Size `PosterFrame` from the shape** — in `src/posters/blocks/PosterFrame.tsx` add `import { usePosterShape } from '../shape'`, update the comment's first line to `// Wspólny kontener plakatu; wymiary z kształtu (1080×1080 / 1080×1528 / 1528×1080).`, and change the component body to:

```tsx
export function PosterFrame({ vars, padding = 0, style, children }: PosterFrameProps) {
  const { width, height } = usePosterShape()
  return (
    <div
      style={{
        width,
        height,
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

- [ ] **Step 7: Rewrite `src/components/PosterScaled.tsx`**

```tsx
import { forwardRef } from 'react'
import type { ReactNode } from 'react'
import type { PosterShape } from '../types'
import { PosterShapeContext, SHAPE_SIZE } from '../posters/shape'

interface PosterScaledProps {
  // Szerokość na ekranie w px; wysokość wynika z proporcji kształtu.
  size: number
  shape?: PosterShape
  children: ReactNode
}

// Renderuje plakat w pełnym rozmiarze układu i pomniejsza go przez CSS
// transform do `size` px szerokości. `innerRef` wskazuje na węzeł w pełnej
// rozdzielczości - to on jest przekazywany do html-to-image przy eksporcie.
export const PosterScaled = forwardRef<HTMLDivElement, PosterScaledProps>(function PosterScaled({ size, shape = 'square', children }, innerRef) {
  const { width, height } = SHAPE_SIZE[shape]
  const scale = size / width
  return (
    <div style={{ width: size, height: height * scale, overflow: 'hidden', flex: '0 0 auto' }}>
      <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <div ref={innerRef} style={{ width, height }}>
          <PosterShapeContext.Provider value={shape}>{children}</PosterShapeContext.Provider>
        </div>
      </div>
    </div>
  )
})
```

- [ ] **Step 8: Pass `shape` through `PosterPreview`** — in `src/components/PosterPreview.tsx`: import `PosterShape` in the type import, add `shape?: PosterShape` to `PosterPreviewProps`, add `shape` to the destructured props, and change the render to `<PosterScaled ref={posterRef} size={PREVIEW_SIZE} shape={shape}>`.

- [ ] **Step 9: `?shape=` on the preview page** — in `src/main.tsx`, after `posterMatch`:

```ts
const shapeParam = new URLSearchParams(window.location.search).get('shape')
const previewShape = shapeParam === 'portrait' || shapeParam === 'landscape' ? shapeParam : 'square'
```

and render `<PosterPreviewPage posterKey={posterMatch[1]} scheme={posterMatch[2]} shape={previewShape} />`.

In `src/pages/PosterPreviewPage.tsx`: `import type { PosterShape } from '../types'`, add `shape?: PosterShape` to the props interface, destructure it, and render `<PosterScaled size={600} shape={shape}>`.

- [ ] **Step 10: Run tests, typecheck, lint**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all pass, including the 5 new tests.

- [ ] **Step 11: Commit**

```bash
git add src/types.ts src/posters/shape.ts src/posters/shape.test.ts src/posters/theme.ts src/posters/blocks/PosterFrame.tsx src/components/PosterScaled.tsx src/components/PosterPreview.tsx src/pages/PosterPreviewPage.tsx src/main.tsx
git commit -m "Kształty plakatu (kwadrat/pion/poziom) w kontekście React"
```

---

### Task 2: Format table and size helpers

**Files:**
- Create: `src/posters/formats.ts`
- Test: `src/posters/formats.test.ts`
- Modify: `src/posters/export.ts:3-15` (remove the interface + table, import from `formats.ts`), `src/App.tsx:11` (import `EXPORT_FORMATS` from `./posters/formats`)

**Interfaces:**
- Consumes: `PosterShape`, `Orientation` from `src/types.ts`
- Produces:
  - `interface PaperSize { widthMm: number; heightMm: number }`
  - `interface ExportFormat { label: string; width?: number; height?: number; paper?: PaperSize }`
  - `EXPORT_FORMATS: Record<string, ExportFormat>` with keys `square`, `story`, `a4`, `a3`, `a2`
  - `isPrintFormat(formatKey: string): boolean`
  - `shapeFor(formatKey: string, orientation: Orientation): PosterShape`
  - `pixelSize(paper: PaperSize, orientation: Orientation, dpi: number): { width: number; height: number }`
  - `pageSizePt(paper: PaperSize, orientation: Orientation): { width: number; height: number }`

- [ ] **Step 1: Write the failing test** — `src/posters/formats.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { EXPORT_FORMATS, isPrintFormat, pageSizePt, pixelSize, shapeFor } from './formats'

const paper = (key: string) => {
  const p = EXPORT_FORMATS[key].paper
  if (!p) throw new Error(`${key}: brak papieru`)
  return p
}

describe('formaty eksportu', () => {
  it('klucze i kolejność: social, potem papier', () => {
    expect(Object.keys(EXPORT_FORMATS)).toEqual(['square', 'story', 'a4', 'a3', 'a2'])
  })

  it('isPrintFormat', () => {
    expect(isPrintFormat('square')).toBe(false)
    expect(isPrintFormat('story')).toBe(false)
    for (const k of ['a4', 'a3', 'a2']) expect(isPrintFormat(k)).toBe(true)
  })

  it('nieznany klucz formatu → jak kwadrat, bez wyjątku', () => {
    expect(isPrintFormat('nieistnieje')).toBe(false)
    expect(shapeFor('nieistnieje', 'landscape')).toBe('square')
  })

  it('shapeFor: social zawsze kwadrat, papier = orientacja', () => {
    expect(shapeFor('square', 'landscape')).toBe('square')
    expect(shapeFor('story', 'portrait')).toBe('square')
    expect(shapeFor('a4', 'portrait')).toBe('portrait')
    expect(shapeFor('a2', 'landscape')).toBe('landscape')
  })

  it('pixelSize przy 300 dpi', () => {
    expect(pixelSize(paper('a4'), 'portrait', 300)).toEqual({ width: 2480, height: 3508 })
    expect(pixelSize(paper('a3'), 'portrait', 300)).toEqual({ width: 3508, height: 4961 })
    expect(pixelSize(paper('a2'), 'portrait', 300)).toEqual({ width: 4961, height: 7016 })
  })

  it('pixelSize: poziom zamienia boki, niższe dpi skaluje', () => {
    expect(pixelSize(paper('a4'), 'landscape', 300)).toEqual({ width: 3508, height: 2480 })
    expect(pixelSize(paper('a4'), 'portrait', 150)).toEqual({ width: 1240, height: 1754 })
  })

  it('pageSizePt: A4 = 595.28 × 841.89 pt', () => {
    const p = pageSizePt(paper('a4'), 'portrait')
    expect(p.width).toBeCloseTo(595.28, 2)
    expect(p.height).toBeCloseTo(841.89, 2)
    const l = pageSizePt(paper('a4'), 'landscape')
    expect(l.width).toBeCloseTo(841.89, 2)
    expect(l.height).toBeCloseTo(595.28, 2)
  })
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx vitest run src/posters/formats.test.ts`
Expected: FAIL — cannot resolve `./formats`.

- [ ] **Step 3: Create `src/posters/formats.ts`**

```ts
import type { Orientation, PosterShape } from '../types'

export interface PaperSize {
  widthMm: number
  heightMm: number
}

// Format social ma stały rozmiar w px (`width`/`height`) i zawsze układ
// kwadratowy. Format papierowy ma `paper` (mm, w pionie) - układ idzie za
// orientacją, a rozmiar w px za dpi.
export interface ExportFormat {
  label: string
  width?: number
  height?: number
  paper?: PaperSize
}

export const EXPORT_FORMATS: Record<string, ExportFormat> = {
  square: { label: 'Kwadrat · 1080×1080', width: 1080, height: 1080 },
  story: { label: 'Story · 1080×1920', width: 1080, height: 1920 },
  a4: { label: 'A4 · 210×297 mm', paper: { widthMm: 210, heightMm: 297 } },
  a3: { label: 'A3 · 297×420 mm', paper: { widthMm: 297, heightMm: 420 } },
  a2: { label: 'A2 · 420×594 mm', paper: { widthMm: 420, heightMm: 594 } },
}

export function isPrintFormat(formatKey: string): boolean {
  return Boolean(EXPORT_FORMATS[formatKey]?.paper)
}

export function shapeFor(formatKey: string, orientation: Orientation): PosterShape {
  return isPrintFormat(formatKey) ? orientation : 'square'
}

function oriented(paper: PaperSize, orientation: Orientation): { w: number; h: number } {
  return orientation === 'landscape'
    ? { w: paper.heightMm, h: paper.widthMm }
    : { w: paper.widthMm, h: paper.heightMm }
}

// Rozmiar w pikselach przy danym dpi (25,4 mm = 1 cal).
export function pixelSize(paper: PaperSize, orientation: Orientation, dpi: number): { width: number; height: number } {
  const { w, h } = oriented(paper, orientation)
  return { width: Math.round((w / 25.4) * dpi), height: Math.round((h / 25.4) * dpi) }
}

// Rozmiar strony PDF w punktach (1 pt = 1/72 cala).
export function pageSizePt(paper: PaperSize, orientation: Orientation): { width: number; height: number } {
  const { w, h } = oriented(paper, orientation)
  return { width: (w * 72) / 25.4, height: (h * 72) / 25.4 }
}
```

- [ ] **Step 4: Point existing code at the new module** — in `src/posters/export.ts` delete the `ExportFormat` interface and the `EXPORT_FORMATS` constant (lines 3–15) and add `import { EXPORT_FORMATS } from './formats'`. In `downloadPosterAsPng`, the square fallback must keep working with the now-optional fields:

```ts
  const format = EXPORT_FORMATS[formatKey] ?? EXPORT_FORMATS.square
  const posterDataUrl = await toPng(node, { width: 1080, height: 1080, pixelRatio: 1 })
  const dataUrl = await compositeOnCanvas(posterDataUrl, format.width ?? 1080, format.height ?? 1080)
```

In `src/App.tsx` line 11 change to:

```ts
import { downloadPosterAsPng } from './posters/export'
import { EXPORT_FORMATS } from './posters/formats'
```

- [ ] **Step 5: Run tests, typecheck, lint**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/posters/formats.ts src/posters/formats.test.ts src/posters/export.ts src/App.tsx
git commit -m "Tabela formatów eksportu z papierem A4/A3/A2 i helperami rozmiaru"
```

---

### Task 3: RGB → CMYK conversion

**Files:**
- Create: `src/posters/cmyk.ts`
- Test: `src/posters/cmyk.test.ts`

**Interfaces:**
- Produces: `rgbaToCmyk(rgba: Uint8ClampedArray | Uint8Array): Uint8Array<ArrayBuffer>` — input is 4 bytes per pixel (R,G,B,A), output is 4 bytes per pixel (C,M,Y,K), same pixel count.

- [ ] **Step 1: Write the failing test** — `src/posters/cmyk.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { rgbaToCmyk } from './cmyk'

const px = (...rgb: number[]) => Array.from(rgbaToCmyk(new Uint8ClampedArray([...rgb, 255])))

describe('rgbaToCmyk', () => {
  it('biel → brak farby', () => {
    expect(px(255, 255, 255)).toEqual([0, 0, 0, 0])
  })
  it('czerń → sam K, bez dzielenia przez zero', () => {
    expect(px(0, 0, 0)).toEqual([0, 0, 0, 255])
  })
  it('czyste R / G / B', () => {
    expect(px(255, 0, 0)).toEqual([0, 255, 255, 0])
    expect(px(0, 255, 0)).toEqual([255, 0, 255, 0])
    expect(px(0, 0, 255)).toEqual([255, 255, 0, 0])
  })
  it('szarość → tylko K', () => {
    expect(px(128, 128, 128)).toEqual([0, 0, 0, 127])
  })
  it('kolor mieszany (granat marki #3C459B)', () => {
    // max = 155 → K = 100; C = (155-60)*255/155 = 156, M = (155-69)*255/155 = 141, Y = 0
    expect(px(0x3c, 0x45, 0x9b)).toEqual([156, 141, 0, 100])
  })
  it('alfa jest ignorowana, długość = 4 bajty na piksel', () => {
    const out = rgbaToCmyk(new Uint8ClampedArray([255, 0, 0, 0, 0, 0, 0, 10]))
    expect(Array.from(out)).toEqual([0, 255, 255, 0, 0, 0, 0, 255])
  })
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx vitest run src/posters/cmyk.test.ts`
Expected: FAIL — cannot resolve `./cmyk`.

- [ ] **Step 3: Create `src/posters/cmyk.ts`**

```ts
// Konwersja „urządzeniowa" RGB → CMYK, bez profilu ICC: K = 1 − max(R,G,B),
// a C/M/Y to reszta po odjęciu czerni. Nasycone kolory marki (limonka,
// koral) wyjdą w druku nieco bardziej matowo niż na ekranie - to cena braku
// zarządzania kolorem (patrz docs/architektura.md). Alfa jest pomijana:
// plakaty są nieprzezroczyste.
export function rgbaToCmyk(rgba: Uint8ClampedArray | Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(rgba.length)
  for (let i = 0; i < rgba.length; i += 4) {
    const r = rgba[i]
    const g = rgba[i + 1]
    const b = rgba[i + 2]
    const max = Math.max(r, g, b)
    if (max === 0) {
      out[i + 3] = 255
      continue
    }
    out[i] = Math.round(((max - r) * 255) / max)
    out[i + 1] = Math.round(((max - g) * 255) / max)
    out[i + 2] = Math.round(((max - b) * 255) / max)
    out[i + 3] = 255 - max
  }
  return out
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/posters/cmyk.test.ts && npm run typecheck`
Expected: 6 passed, typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add src/posters/cmyk.ts src/posters/cmyk.test.ts
git commit -m "Konwersja RGBA → CMYK dla eksportu PDF"
```

---

### Task 4: Minimal PDF writer

**Files:**
- Create: `src/posters/pdf.ts`
- Test: `src/posters/pdf.test.ts`

**Interfaces:**
- Produces:
  - `interface PdfImage { widthPx: number; heightPx: number; widthPt: number; heightPt: number; imageData: Uint8Array }` — `imageData` is the **zlib-deflated** CMYK byte stream
  - `buildPdf(img: PdfImage): Uint8Array<ArrayBuffer>`

- [ ] **Step 1: Write the failing test** — `src/posters/pdf.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { buildPdf } from './pdf'

// latin1: jeden bajt = jeden znak, więc indeksy w stringu = offsety w pliku.
const build = () => {
  const bytes = buildPdf({ widthPx: 2480, heightPx: 3508, widthPt: 595.2756, heightPt: 841.8898, imageData: new Uint8Array([1, 2, 3, 250, 251]) })
  return { bytes, text: new TextDecoder('latin1').decode(bytes) }
}

describe('buildPdf', () => {
  it('nagłówek i zakończenie pliku', () => {
    const { text } = build()
    expect(text.startsWith('%PDF-1.4\n')).toBe(true)
    expect(text.endsWith('%%EOF\n')).toBe(true)
  })

  it('MediaBox = rozmiar papieru w punktach', () => {
    expect(build().text).toContain('/MediaBox [0 0 595.28 841.89]')
  })

  it('obraz: DeviceCMYK, 8 bitów, Flate, wymiary w px, długość strumienia', () => {
    const { text } = build()
    expect(text).toContain('/Subtype /Image /Width 2480 /Height 3508 /ColorSpace /DeviceCMYK /BitsPerComponent 8 /Filter /FlateDecode /Length 5')
  })

  it('bajty obrazu trafiają do pliku bez zmian', () => {
    const { bytes, text } = build()
    const at = text.indexOf('stream\n') + 'stream\n'.length
    expect(Array.from(bytes.slice(at, at + 5))).toEqual([1, 2, 3, 250, 251])
  })

  it('obraz jest rozciągnięty na całą stronę', () => {
    expect(build().text).toContain('q 595.28 0 0 841.89 0 0 cm /Im0 Do Q')
  })

  it('xref: każdy offset wskazuje na swój obiekt, startxref na tabelę', () => {
    const { text } = build()
    const startxref = Number(/startxref\n(\d+)\n/.exec(text)?.[1])
    expect(text.slice(startxref, startxref + 4)).toBe('xref')
    const lines = text.slice(startxref).split('\n')
    expect(lines[1]).toBe('0 6')
    expect(lines[2]).toBe('0000000000 65535 f ')
    for (let n = 1; n <= 5; n++) {
      const entry = lines[2 + n]
      expect(entry).toMatch(/^\d{10} 00000 n $/)
      const offset = Number(entry.slice(0, 10))
      expect(text.slice(offset, offset + `${n} 0 obj`.length)).toBe(`${n} 0 obj`)
    }
    expect(text).toContain('trailer\n<< /Size 6 /Root 1 0 R >>')
  })
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx vitest run src/posters/pdf.test.ts`
Expected: FAIL — cannot resolve `./pdf`.

- [ ] **Step 3: Create `src/posters/pdf.ts`**

```ts
export interface PdfImage {
  widthPx: number
  heightPx: number
  widthPt: number
  heightPt: number
  // Bajty CMYK (4 na piksel) już spakowane zlib/deflate - patrz export.ts.
  imageData: Uint8Array
}

// Jednostronicowy PDF 1.4 z jednym obrazem CMYK rozciągniętym na całą stronę.
// Pisany ręcznie, żeby nie dokładać biblioteki: 5 obiektów (katalog, drzewo
// stron, strona, obraz, strumień treści), tabela xref i trailer. Cały tekst
// struktury to ASCII, więc długość stringa = liczba bajtów.
export function buildPdf({ widthPx, heightPx, widthPt, heightPt, imageData }: PdfImage): Uint8Array<ArrayBuffer> {
  const enc = new TextEncoder()
  const chunks: Uint8Array[] = []
  const offsets: number[] = []
  let length = 0

  const push = (part: string | Uint8Array) => {
    const bytes = typeof part === 'string' ? enc.encode(part) : part
    chunks.push(bytes)
    length += bytes.length
  }
  const startObj = (n: number) => {
    offsets[n] = length
    push(`${n} 0 obj\n`)
  }
  const w = widthPt.toFixed(2)
  const h = heightPt.toFixed(2)

  push('%PDF-1.4\n')

  startObj(1)
  push('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')

  startObj(2)
  push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n')

  startObj(3)
  push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`)

  startObj(4)
  push(`<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} /ColorSpace /DeviceCMYK /BitsPerComponent 8 /Filter /FlateDecode /Length ${imageData.length} >>\nstream\n`)
  push(imageData)
  push('\nendstream\nendobj\n')

  const content = `q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`
  startObj(5)
  push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`)

  const xrefAt = length
  // Każdy wpis xref ma dokładnie 20 bajtów (stąd spacja przed \n).
  push('xref\n0 6\n0000000000 65535 f \n')
  for (let n = 1; n <= 5; n++) push(`${String(offsets[n]).padStart(10, '0')} 00000 n \n`)
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`)

  const out = new Uint8Array(length)
  let at = 0
  for (const chunk of chunks) {
    out.set(chunk, at)
    at += chunk.length
  }
  return out
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/posters/pdf.test.ts && npm run typecheck`
Expected: 6 passed, typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add src/posters/pdf.ts src/posters/pdf.test.ts
git commit -m "Minimalny writer PDF z obrazem CMYK"
```

---

### Task 5: Resolution ladder and `downloadPoster`

**Files:**
- Create: `src/posters/dpiLadder.ts`
- Test: `src/posters/dpiLadder.test.ts`
- Modify: `src/posters/export.ts` (replace `downloadPosterAsPng` with `downloadPoster`), `src/App.tsx:11,375-381` (call site — minimal change here; full UI in Task 7)

**Interfaces:**
- Consumes: `EXPORT_FORMATS`, `pixelSize`, `pageSizePt` (Task 2); `SHAPE_SIZE` (Task 1); `rgbaToCmyk` (Task 3); `buildPdf` (Task 4); `Orientation`, `FileType` (Task 1)
- Produces:
  - `DPI_LADDER: readonly number[]` = `[300, 200, 150]`
  - `withDpiLadder<T>(dpis: readonly number[], attempt: (dpi: number) => Promise<T>): Promise<{ dpi: number; result: T }>` — rejects with the last error if every step fails
  - `interface DownloadOptions { formatKey: string; orientation: Orientation; fileType: FileType }`
  - `downloadPoster(node: HTMLElement, basename: string, opts: DownloadOptions): Promise<{ dpi?: number }>` — appends `.png`/`.pdf`; `dpi` is set only for paper formats

- [ ] **Step 1: Write the failing test** — `src/posters/dpiLadder.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { DPI_LADDER, withDpiLadder } from './dpiLadder'

describe('withDpiLadder', () => {
  it('drabinka: 300 → 200 → 150', () => {
    expect(DPI_LADDER).toEqual([300, 200, 150])
  })

  it('pierwszy udany szczebel wygrywa, kolejne nie są próbowane', async () => {
    const tried: number[] = []
    const out = await withDpiLadder(DPI_LADDER, async (dpi) => {
      tried.push(dpi)
      return `ok@${dpi}`
    })
    expect(out).toEqual({ dpi: 300, result: 'ok@300' })
    expect(tried).toEqual([300])
  })

  it('błąd na 300 (np. za duży canvas dla A2) → schodzi na 200', async () => {
    const tried: number[] = []
    const out = await withDpiLadder(DPI_LADDER, async (dpi) => {
      tried.push(dpi)
      if (dpi === 300) throw new Error('canvas za duży')
      return dpi
    })
    expect(out).toEqual({ dpi: 200, result: 200 })
    expect(tried).toEqual([300, 200])
  })

  it('wszystkie szczeble zawodzą → odrzuca ostatnim błędem (nie pobiera pustego pliku)', async () => {
    await expect(
      withDpiLadder(DPI_LADDER, async (dpi) => {
        throw new Error(`fail@${dpi}`)
      }),
    ).rejects.toThrow('fail@150')
  })

  it('pusta drabinka → błąd', async () => {
    await expect(withDpiLadder([], async () => 1)).rejects.toThrow()
  })
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx vitest run src/posters/dpiLadder.test.ts`
Expected: FAIL — cannot resolve `./dpiLadder`.

- [ ] **Step 3: Create `src/posters/dpiLadder.ts`**

```ts
// Rozdzielczości druku próbowane po kolei. Przeglądarki ograniczają rozmiar
// canvasu (A2 przy 300 dpi to ~35 MP), więc gdy rasteryzacja zawiedzie,
// schodzimy niżej zamiast oddać pusty plik.
export const DPI_LADDER: readonly number[] = [300, 200, 150]

export async function withDpiLadder<T>(
  dpis: readonly number[],
  attempt: (dpi: number) => Promise<T>,
): Promise<{ dpi: number; result: T }> {
  let lastError: unknown = new Error('brak rozdzielczości do wypróbowania')
  for (const dpi of dpis) {
    try {
      return { dpi, result: await attempt(dpi) }
    } catch (e) {
      lastError = e
    }
  }
  throw lastError
}
```

- [ ] **Step 4: Run the ladder tests**

Run: `npx vitest run src/posters/dpiLadder.test.ts`
Expected: 5 passed.

- [ ] **Step 5: Rewrite the export entry point** — in `src/posters/export.ts` keep `loadImage` and `compositeOnCanvas` exactly as they are. Replace the imports and `downloadPosterAsPng` with:

```ts
import { toCanvas, toPng } from 'html-to-image'
import type { FileType, Orientation } from '../types'
import { rgbaToCmyk } from './cmyk'
import { DPI_LADDER, withDpiLadder } from './dpiLadder'
import { EXPORT_FORMATS, pageSizePt, pixelSize } from './formats'
import type { PaperSize } from './formats'
import { buildPdf } from './pdf'
import { SHAPE_SIZE } from './shape'
```

and, below `compositeOnCanvas`:

```ts
export interface DownloadOptions {
  formatKey: string
  orientation: Orientation
  fileType: FileType
}

function saveAs(href: string, filename: string) {
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  link.click()
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  saveAs(url, filename)
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

// Rasteryzuje węzeł plakatu (w rozmiarze układu `orientation`) do canvasu
// o dokładnych wymiarach papieru w px. Za duży canvas przeglądarka oddaje
// pusty (przezroczysty) - plakat jest nieprzezroczysty, więc alfa 0 w rogu
// oznacza porażkę i rzucamy, żeby drabinka zeszła na niższe dpi.
async function rasterise(node: HTMLElement, orientation: Orientation, px: { width: number; height: number }): Promise<HTMLCanvasElement> {
  const layout = SHAPE_SIZE[orientation]
  const canvas = await toCanvas(node, {
    width: layout.width,
    height: layout.height,
    canvasWidth: px.width,
    canvasHeight: px.height,
    pixelRatio: 1,
    skipAutoScale: true,
  })
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('brak kontekstu 2d')
  if (canvas.width !== px.width || canvas.height !== px.height) throw new Error('canvas ma inny rozmiar niż żądany')
  if (ctx.getImageData(4, 4, 1, 1).data[3] === 0) throw new Error('pusty canvas')
  return canvas
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob zwrócił null'))), 'image/png')
  })
}

// zlib/deflate przez natywny CompressionStream - format, którego oczekuje
// filtr /FlateDecode w PDF.
async function deflate(bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function canvasToPdfBlob(canvas: HTMLCanvasElement, paper: PaperSize, orientation: Orientation): Promise<Blob> {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('brak kontekstu 2d')
  const rgba = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  const imageData = await deflate(rgbaToCmyk(rgba))
  const page = pageSizePt(paper, orientation)
  const pdf = buildPdf({ widthPx: canvas.width, heightPx: canvas.height, widthPt: page.width, heightPt: page.height, imageData })
  return new Blob([pdf], { type: 'application/pdf' })
}

// Pobiera plakat w wybranym formacie. Formaty social (kwadrat/story) to
// zawsze PNG z układu 1080×1080 - `orientation`/`fileType` są ignorowane.
// Formaty papierowe idą przez drabinkę dpi; zwracane `dpi` to rozdzielczość,
// która faktycznie się udała.
export async function downloadPoster(node: HTMLElement, basename: string, opts: DownloadOptions): Promise<{ dpi?: number }> {
  const format = EXPORT_FORMATS[opts.formatKey] ?? EXPORT_FORMATS.square
  const paper = format.paper

  if (!paper) {
    const posterDataUrl = await toPng(node, { width: 1080, height: 1080, pixelRatio: 1 })
    const dataUrl = await compositeOnCanvas(posterDataUrl, format.width ?? 1080, format.height ?? 1080)
    saveAs(dataUrl, `${basename}.png`)
    return {}
  }

  const { dpi, result: blob } = await withDpiLadder(DPI_LADDER, async (d) => {
    const canvas = await rasterise(node, opts.orientation, pixelSize(paper, opts.orientation, d))
    return opts.fileType === 'pdf' ? canvasToPdfBlob(canvas, paper, opts.orientation) : canvasToPngBlob(canvas)
  })
  saveBlob(blob, `${basename}.${opts.fileType}`)
  return { dpi }
}
```

- [ ] **Step 6: Keep the app compiling** — in `src/App.tsx` change the import to `import { downloadPoster } from './posters/export'` and, inside `handleDownload`, replace the two lines that build `filename` and call `downloadPosterAsPng` with:

```ts
    const basename = (form.title || 'plakat').trim().replace(/\s+/g, '_')
    await downloadPoster(posterRef.current, basename, { formatKey: exportFormat, orientation: 'portrait', fileType: 'png' })
```

- [ ] **Step 7: Run tests, typecheck, lint**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all pass.

- [ ] **Step 8: Manual check that Square and Story are unchanged** — with `npm run dev` running, open the app, download Kwadrat and Story for the default template. Expected: `…​.png` at 1080×1080 and 1080×1920, visually the same as before this task (`sips -g pixelWidth -g pixelHeight ~/Downloads/<file>.png`).

- [ ] **Step 9: Commit**

```bash
git add src/posters/dpiLadder.ts src/posters/dpiLadder.test.ts src/posters/export.ts src/App.tsx
git commit -m "Eksport do rozmiaru papieru: drabinka dpi, PNG i PDF CMYK"
```

---

### Task 6: `SegmentedToggle`

**Files:**
- Create: `src/components/SegmentedToggle.tsx`
- Modify: `src/components/LangToggle.tsx`
- Test: `src/components/SegmentedToggle.test.ts`

**Interfaces:**
- Produces: `SegmentedToggle<T extends string>(props: { value: T; onChange: (value: T) => void; options: readonly { value: T; label: string }[]; ariaLabel: string })`. `LangToggle`'s props are unchanged.

- [ ] **Step 1: Write the failing test** — `src/components/SegmentedToggle.test.ts`

```ts
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SegmentedToggle } from './SegmentedToggle'
import { LangToggle } from './LangToggle'

describe('SegmentedToggle', () => {
  it('grupa z etykietą, jeden przycisk na opcję, aktywny ma aria-pressed', () => {
    const html = renderToStaticMarkup(
      createElement(SegmentedToggle<'png' | 'pdf'>, {
        value: 'pdf',
        onChange: () => {},
        ariaLabel: 'Typ pliku',
        options: [{ value: 'png', label: 'PNG' }, { value: 'pdf', label: 'PDF' }],
      }),
    )
    expect(html).toContain('role="group"')
    expect(html).toContain('aria-label="Typ pliku"')
    expect(html).toMatch(/aria-pressed="false"[^>]*>PNG</)
    expect(html).toMatch(/aria-pressed="true"[^>]*>PDF</)
  })

  it('LangToggle wygląda jak dotychczas (PL/EN, etykieta „Język plakatu")', () => {
    const html = renderToStaticMarkup(createElement(LangToggle, { value: 'pl', onChange: () => {} }))
    expect(html).toContain('aria-label="Język plakatu"')
    expect(html).toMatch(/aria-pressed="true"[^>]*>PL</)
    expect(html).toMatch(/aria-pressed="false"[^>]*>EN</)
    expect(html).toContain('bg-accent text-white')
  })
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx vitest run src/components/SegmentedToggle.test.ts`
Expected: FAIL — cannot resolve `./SegmentedToggle`.

- [ ] **Step 3: Create `src/components/SegmentedToggle.tsx`**

```tsx
interface SegmentedToggleProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: readonly { value: T; label: string }[]
  ariaLabel: string
}

// Przełącznik segmentowy (jedna aktywna opcja z kilku) - wspólny wygląd dla
// języka plakatu, orientacji strony i typu pliku.
export function SegmentedToggle<T extends string>({ value, onChange, options, ariaLabel }: SegmentedToggleProps<T>) {
  const base = 'cursor-pointer rounded-md px-3 py-1.5 text-[0.8rem] font-semibold uppercase tracking-[0.04em] transition-colors'
  const active = 'bg-accent text-white'
  const inactive = 'text-muted hover:text-fg'

  return (
    <div className="inline-flex gap-1 rounded-lg border border-field-border bg-field p-1" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`${base} ${value === option.value ? active : inactive}`}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Make `LangToggle` a wrapper** — replace the body of `src/components/LangToggle.tsx` (keep the existing explanatory comment above the function):

```tsx
import type { PosterLang } from '../types'
import { SegmentedToggle } from './SegmentedToggle'

interface LangToggleProps {
  value: PosterLang
  onChange: (lang: PosterLang) => void
}

const LANG_OPTIONS = [
  { value: 'pl', label: 'PL' },
  { value: 'en', label: 'EN' },
] as const

// Przełącznik języka WBUDOWANEGO TEKSTU PLAKATU (domyślne etykiety, nazwa
// organizacji, format daty — patrz src/posters/*.tsx i utils/formatDate.ts).
// Nie tłumaczy interfejsu aplikacji ani treści wpisanych przez użytkownika.
export function LangToggle({ value, onChange }: LangToggleProps) {
  return <SegmentedToggle value={value} onChange={onChange} options={LANG_OPTIONS} ariaLabel="Język plakatu" />
}
```

- [ ] **Step 5: Run tests, typecheck, lint**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/SegmentedToggle.tsx src/components/SegmentedToggle.test.ts src/components/LangToggle.tsx
git commit -m "SegmentedToggle: wspólny przełącznik, LangToggle jako wrapper"
```

---

### Task 7: Export controls in the app

**Files:**
- Modify: `src/App.tsx` (imports, state near line 76, `handleDownload` ~375, actions section ~440-459, preview ~463)

**Interfaces:**
- Consumes: `downloadPoster` (Task 5), `EXPORT_FORMATS`, `isPrintFormat`, `shapeFor` (Task 2), `SegmentedToggle` (Task 6), `PosterPreview`'s `shape` prop (Task 1), `Orientation`, `FileType` (Task 1)
- Produces: no new exports.

- [ ] **Step 1: Imports and state** — in `src/App.tsx`:

```ts
import { EXPORT_FORMATS, isPrintFormat, shapeFor } from './posters/formats'
import { SegmentedToggle } from './components/SegmentedToggle'
```

add `FileType, Orientation` to the existing `import type { … } from './types'`. Above the component (next to `LANG_STORAGE_KEY`):

```ts
const ORIENTATION_OPTIONS = [
  { value: 'portrait', label: 'Pion' },
  { value: 'landscape', label: 'Poziom' },
] as const

const FILE_TYPE_OPTIONS = [
  { value: 'png', label: 'PNG' },
  { value: 'pdf', label: 'PDF' },
] as const
```

Right after `const [exportFormat, setExportFormat] = useState('square')`:

```ts
  // Orientacja strony i typ pliku dotyczą tylko formatów papierowych
  // (A4/A3/A2). Sesyjne, jak `exportFormat` - bez zapisu do draftu.
  const [orientation, setOrientation] = useState<Orientation>('portrait')
  const [fileType, setFileType] = useState<FileType>('png')
  const [exporting, setExporting] = useState(false)
  const [exportNote, setExportNote] = useState<string | null>(null)
  const printFormat = isPrintFormat(exportFormat)
  const effectiveFileType: FileType = printFormat ? fileType : 'png'
```

- [ ] **Step 2: Replace `handleDownload`**

```ts
  const handleDownload = async () => {
    if (!selectedTemplate || !posterRef.current || !dbRef.current || exporting) return
    const basename = (form.title || 'plakat').trim().replace(/\s+/g, '_')
    setExporting(true)
    setExportNote(null)
    try {
      const { dpi } = await downloadPoster(posterRef.current, basename, { formatKey: exportFormat, orientation, fileType: effectiveFileType })
      if (dpi !== undefined && dpi < 300) setExportNote(`Zapisano w ${dpi} dpi — przeglądarka nie obsłużyła 300 dpi.`)
      await addHistoryEntry(dbRef.current, { ...form, template_id: selectedTemplateId, color_scheme: encodeScheme(selectedScheme, selectedAccent) })
      setHistory(listHistory(dbRef.current))
    } catch {
      setExportNote('Nie udało się wygenerować pliku. Spróbuj mniejszego formatu.')
    } finally {
      setExporting(false)
    }
  }
```

- [ ] **Step 3: Replace the actions section** (the `<section>` with `[grid-area:actions]`):

```tsx
          <section className={`${panel} flex flex-wrap items-center gap-3 min-[900px]:[grid-area:actions]`}>
            <select
              className="rounded-lg border border-field-border bg-field px-3.5 py-[11px] text-[0.9rem] text-fg"
              value={exportFormat}
              onChange={(e) => {
                setExportFormat(e.target.value)
                setExportNote(null)
              }}
              aria-label="Format eksportu"
            >
              {Object.entries(EXPORT_FORMATS).map(([key, format]) => (
                <option key={key} value={key}>
                  {format.label}
                </option>
              ))}
            </select>
            {printFormat && (
              <>
                <SegmentedToggle value={orientation} onChange={setOrientation} options={ORIENTATION_OPTIONS} ariaLabel="Orientacja" />
                <SegmentedToggle value={fileType} onChange={setFileType} options={FILE_TYPE_OPTIONS} ariaLabel="Typ pliku" />
              </>
            )}
            <button
              type="button"
              className="cursor-pointer rounded-lg bg-accent px-[18px] py-[11px] text-[0.95rem] font-medium text-white transition-[background-color,transform] hover:bg-accent-hover active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
              onClick={handleDownload}
              disabled={exporting}
            >
              {exporting ? 'Generowanie…' : `Pobierz ${effectiveFileType.toUpperCase()}`}
            </button>
            {exportNote && (
              <p className="basis-full text-[0.85rem] text-muted" role="status">
                {exportNote}
              </p>
            )}
          </section>
```

- [ ] **Step 4: Preview follows the shape** — on the `<PosterPreview … />` line add `shape={shapeFor(exportFormat, orientation)}`.

- [ ] **Step 5: Typecheck, lint, tests**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all pass.

- [ ] **Step 6: Manual check in the browser** (`npm run dev`):
  - Kwadrat/Story: no toggles, button reads `Pobierz PNG`, preview square.
  - A4: both toggles appear and look like the PL/EN switch; preview becomes tall; `Poziom` makes it wide; `PDF` changes the button to `Pobierz PDF`.
  - Switch back to Kwadrat with PDF selected: button reads `Pobierz PNG` and downloads a `.png`.
  - Download A4 pion PNG → `sips -g pixelWidth -g pixelHeight` reports 2480 × 3508.
  - Download A4 pion PDF → opens in Preview; `mdls -name kMDItemPageWidth -name kMDItemPageHeight <file>` reports ≈ 595 × 842; Preview's Inspector (⌘I) shows the image colour model as CMYK.
  - Download A2 pion PNG → file is 4961 × 7016, or a note reports the lower dpi used.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx
git commit -m "Kreator: wybór A4/A3/A2, orientacji i typu pliku (PNG/PDF)"
```

---

### Task 8: Collapsible creator panels

**Files:**
- Create: `src/utils/collapsedPanels.ts`, `src/components/CollapsiblePanel.tsx`
- Test: `src/utils/collapsedPanels.test.ts`, `src/components/CollapsiblePanel.test.ts`
- Modify: `src/App.tsx` (state + the `template`, `form`, `history` sections)

**Interfaces:**
- Produces:
  - `type PanelKey = 'template' | 'form' | 'history'`
  - `type CollapsedPanels = Record<PanelKey, boolean>` (`true` = collapsed)
  - `COLLAPSED_STORAGE_KEY = 'sknm-collapsed-panels'`
  - `ALL_OPEN: CollapsedPanels`
  - `parseCollapsed(raw: string | null): CollapsedPanels`
  - `<CollapsiblePanel id title summary? open onToggle className? children>`

- [ ] **Step 1: Write the failing tests**

`src/utils/collapsedPanels.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { ALL_OPEN, parseCollapsed } from './collapsedPanels'

describe('parseCollapsed', () => {
  it('brak wpisu → wszystko rozwinięte', () => {
    expect(parseCollapsed(null)).toEqual({ template: false, form: false, history: false })
    expect(parseCollapsed(null)).toEqual(ALL_OPEN)
  })
  it('poprawny wpis', () => {
    expect(parseCollapsed('{"template":true,"form":false,"history":true}')).toEqual({ template: true, form: false, history: true })
  })
  it('zepsuty JSON → wszystko rozwinięte', () => {
    expect(parseCollapsed('{nie json')).toEqual(ALL_OPEN)
  })
  it('nie-obiekt (liczba, null, tablica) → wszystko rozwinięte', () => {
    for (const raw of ['5', 'null', '[true]', '"x"']) expect(parseCollapsed(raw), raw).toEqual(ALL_OPEN)
  })
  it('brakujące klucze i złe typy → false dla tych kluczy, obce klucze pomijane', () => {
    expect(parseCollapsed('{"template":true,"form":"tak","obcy":true}')).toEqual({ template: true, form: false, history: false })
  })
})
```

`src/components/CollapsiblePanel.test.ts`:

```ts
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CollapsiblePanel } from './CollapsiblePanel'

const render = (open: boolean, summary?: string) =>
  renderToStaticMarkup(
    createElement(CollapsiblePanel, { id: 'form', title: '2. Uzupełnij dane', summary, open, onToggle: () => {}, className: 'karta', children: createElement('input', { name: 'tytul' }) }),
  )

describe('CollapsiblePanel', () => {
  it('rozwinięty: aria-expanded=true, treść widoczna', () => {
    const html = render(true)
    expect(html).toContain('aria-expanded="true"')
    expect(html).toContain('aria-controls="panel-form"')
    expect(html).toContain('id="panel-form"')
    expect(html).not.toMatch(/id="panel-form"[^>]*hidden/)
    expect(html).toContain('class="karta"')
  })
  it('zwinięty: aria-expanded=false, treść ukryta, ale NADAL w drzewie', () => {
    const html = render(false)
    expect(html).toContain('aria-expanded="false"')
    expect(html).toMatch(/id="panel-form"[^>]*hidden/)
    expect(html).toContain('name="tytul"')
  })
  it('podsumowanie widać tylko po zwinięciu', () => {
    expect(render(false, 'Wykład')).toContain('Wykład')
    expect(render(true, 'Wykład')).not.toContain('Wykład')
  })
})
```

- [ ] **Step 2: Run them, verify they fail**

Run: `npx vitest run src/utils/collapsedPanels.test.ts src/components/CollapsiblePanel.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Create `src/utils/collapsedPanels.ts`**

```ts
export type PanelKey = 'template' | 'form' | 'history'
export type CollapsedPanels = Record<PanelKey, boolean>

export const COLLAPSED_STORAGE_KEY = 'sknm-collapsed-panels'
export const ALL_OPEN: CollapsedPanels = { template: false, form: false, history: false }

// Odczyt stanu zwinięcia paneli z localStorage. Cokolwiek nieoczekiwanego
// (brak wpisu, zepsuty JSON, zły typ) → panel rozwinięty.
export function parseCollapsed(raw: string | null): CollapsedPanels {
  if (!raw) return { ...ALL_OPEN }
  try {
    const value: unknown = JSON.parse(raw)
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return { ...ALL_OPEN }
    const record = value as Record<string, unknown>
    return {
      template: record.template === true,
      form: record.form === true,
      history: record.history === true,
    }
  } catch {
    return { ...ALL_OPEN }
  }
}
```

- [ ] **Step 4: Create `src/components/CollapsiblePanel.tsx`**

```tsx
import type { ReactNode } from 'react'

interface CollapsiblePanelProps {
  id: string
  title: string
  // Krótki opis zawartości pokazywany przy nagłówku, gdy panel jest zwinięty
  // (np. nazwa wybranego szablonu).
  summary?: string
  open: boolean
  onToggle: () => void
  className?: string
  children: ReactNode
}

// Karta sekcji kreatora ze zwijaną treścią. Zwinięta treść dostaje `hidden`
// zamiast być odmontowana - pola formularza i miniatury zachowują stan.
export function CollapsiblePanel({ id, title, summary, open, onToggle, className, children }: CollapsiblePanelProps) {
  const bodyId = `panel-${id}`
  return (
    <section className={className}>
      <h2 className={open ? 'mb-3.5' : undefined}>
        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-between gap-3 text-left text-base font-semibold uppercase tracking-[0.04em] text-muted hover:text-fg"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={onToggle}
        >
          <span>
            {title}
            {!open && summary && <span className="ml-2 font-medium normal-case tracking-normal text-fg">· {summary}</span>}
          </span>
          <span aria-hidden="true" className={`flex-none transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
        </button>
      </h2>
      <div id={bodyId} hidden={!open}>
        {children}
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Run the two test files**

Run: `npx vitest run src/utils/collapsedPanels.test.ts src/components/CollapsiblePanel.test.ts`
Expected: 8 passed.

- [ ] **Step 6: Wire into `App.tsx`** — imports:

```ts
import { CollapsiblePanel } from './components/CollapsiblePanel'
import { COLLAPSED_STORAGE_KEY, parseCollapsed } from './utils/collapsedPanels'
import type { CollapsedPanels, PanelKey } from './utils/collapsedPanels'
```

Next to `loadStoredLang`:

```ts
function loadStoredCollapsed(): CollapsedPanels {
  try {
    return parseCollapsed(localStorage.getItem(COLLAPSED_STORAGE_KEY))
  } catch {
    return parseCollapsed(null)
  }
}
```

State and persistence, next to the `lang` state and its effect:

```ts
  const [collapsed, setCollapsed] = useState<CollapsedPanels>(loadStoredCollapsed)
  const togglePanel = (key: PanelKey) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify(collapsed))
    } catch {
      // localStorage niedostępny — stan paneli zostaje tylko w pamięci sesji.
    }
  }, [collapsed])
```

Replace the three sections. Template:

```tsx
          <CollapsiblePanel
            id="template"
            title="1. Wybierz szablon"
            summary={selectedTemplate?.name}
            open={!collapsed.template}
            onToggle={() => togglePanel('template')}
            className={`${panel} min-[900px]:[grid-area:template]`}
          >
            <TemplateSelector templates={templates} selectedId={selectedTemplateId} onSelect={handleSelectTemplate} lang={lang} />
          </CollapsiblePanel>
```

Form — same wrapper with `id="form"`, `title="2. Uzupełnij dane"`, `open={!collapsed.form}`, `onToggle={() => togglePanel('form')}`, `className={`${panel} min-[900px]:[grid-area:form]`}`, and the existing `{SelectedForm && (<SelectedForm … />)}` block unchanged as children.

History:

```tsx
          <CollapsiblePanel
            id="history"
            title="Historia"
            open={!collapsed.history}
            onToggle={() => togglePanel('history')}
            className={`${panel} min-[900px]:[grid-area:history]`}
          >
            <HistoryList entries={history} onRestore={handleRestoreHistoryEntry} onDelete={handleDeleteHistoryEntry} lang={lang} />
          </CollapsiblePanel>
```

The `Podgląd` section keeps its plain `<h2 className={panelHeading}>`.

- [ ] **Step 7: Typecheck, lint, tests**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all pass.

- [ ] **Step 8: Manual check** (`npm run dev`): collapse each of the three panels; the template panel shows the selected template's name when collapsed; type a title, collapse and expand `2. Uzupełnij dane` — the title is still there; reload — collapsed panels stay collapsed; headings look the same as the `Podgląd` heading apart from the chevron.

- [ ] **Step 9: Commit**

```bash
git add src/utils/collapsedPanels.ts src/utils/collapsedPanels.test.ts src/components/CollapsiblePanel.tsx src/components/CollapsiblePanel.test.ts src/App.tsx
git commit -m "Zwijane panele kreatora (szablon, dane, historia)"
```

---

### Task 9: Shape-aware templates

**Files:**
- Modify: `src/posters/PosterWyklad.tsx`, `src/posters/PosterKomunikat.tsx`, `src/posters/PosterGala.tsx`, `src/posters/PosterWarsztat.tsx`, `src/posters/PosterGosc.tsx`
- Verify only: `PosterData.tsx`, `PosterKonferencja.tsx`, `PosterOgloszenie.tsx`, `PosterRekrutacja.tsx`

**Interfaces:**
- Consumes: `usePosterShape()` from `src/posters/shape.ts` (Task 1); the `?shape=` preview URL (Task 1).
- Produces: nothing new.

**How to look at a template.** With `npm run dev` running (read the port from its output; `5173` below), screenshot the preview page with headless Chrome into the scratchpad and open the PNG:

```bash
OUT=<scratchpad dir>
shot() { "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --window-size=1300,1300 --virtual-time-budget=6000 --screenshot="$OUT/$1-$2.png" "http://localhost:5173/sknm-image-generator/poster/$1?shape=$2" >/dev/null 2>&1; }
for t in wyklad komunikat gala warsztat gosc data konferencja ogloszenie rekrutacja; do for s in square portrait landscape; do shot $t $s; done; done
```

**Acceptance for every template × shape:** nothing clipped by the frame; no text overlapping other text, the QR slot or logos; background decorations reach the same corners as in the square; no band of dead space taller than about a quarter of the frame; the square render is unchanged from `main`.

- [ ] **Step 1: Baseline** — run the loop above before changing anything and look at all 27 screenshots. Note which ones fail the acceptance criteria. Expected failures: wedges that look small on Wykład/Komunikat/Gala in portrait and landscape; Warsztat's photo ending at 1080px in portrait; Gość's photo strip in landscape leaving the text cramped.

- [ ] **Step 2: Wykład — scale the wedges** — in `src/posters/PosterWyklad.tsx` add `import { usePosterShape } from './shape'`, add `const { kx, ky } = usePosterShape()` after `resolveScheme`, and change the three wedge `<div>`s to:

```tsx
      <div style={{ position: 'absolute', top: 0, right: 0, width: 700 * kx, height: 600 * ky, background: 'var(--wash-top)', clipPath: 'polygon(0 0,100% 0,100% 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 920 * kx, height: 780 * ky, background: 'var(--wedge-br)', opacity: 0.42, clipPath: 'polygon(100% 0,100% 100%,0 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 520 * kx, height: 300 * ky, background: 'var(--wedge-bl)', clipPath: 'polygon(0 100%,0 0,100% 100%)' }} />
```

The chip stack (`left: 18, bottom: 72`) stays as is.

- [ ] **Step 3: Komunikat — same wedges** — in `src/posters/PosterKomunikat.tsx` make the identical change: the import, `const { kx, ky } = usePosterShape()`, and the same three `<div>`s as in Step 2 (the chip stack there uses `var(--accent)` and stays as is).

- [ ] **Step 4: Gala — scale the panel** — in `src/posters/PosterGala.tsx` add the import and `const { kx, ky } = usePosterShape()`, and change the first decoration to:

```tsx
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 880 * kx, height: 700 * ky, background: 'var(--panel-br)', clipPath: 'polygon(100% 0,100% 100%,0 100%)' }} />
```

- [ ] **Step 5: Warsztat — full-height photo** — in `src/posters/PosterWarsztat.tsx` add the import and `const { kx } = usePosterShape()`, and change the `PhotoGallery` props to:

```tsx
        style={{ position: 'absolute', top: 0, right: 0, width: 660 * kx, height: '100%', clipPath: 'polygon(38% 0,100% 0,100% 100%,0 100%)' }}
        placeholderStyle={{ paddingLeft: 180 * kx }}
```

- [ ] **Step 6: Gość — taller photo in portrait, photo beside the text in landscape** — in `src/posters/PosterGosc.tsx` add the import, and after `const textColor = …`:

```tsx
  const { shape, height } = usePosterShape()
  // Poziom: zdjęcie obok tekstu zamiast nad nim - pas 1528×600 zostawiałby
  // na tekst za mało wysokości.
  const side = shape === 'landscape'
  const photoH = Math.round((height * 600) / 1080)
  const showDate = !hidden('event_date') || !hidden('event_time')
  const dateBox = showDate && (
    <div
      style={{
        background: boxBg, color: boxText, padding: '18px 26px', display: 'flex', flexDirection: 'column', alignItems: 'center',
        ...(side ? { alignSelf: 'flex-end' } : { position: 'absolute', top: -56, right: 72 }),
      }}
    >
      <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 0.9, ...fx('event_date') }}>{getDay(event_date)}</div>
      <div style={{ font: `700 22px ${fontMono}`, letterSpacing: '.12em' }}>
        <span style={fx('event_date')}>{getMonthShort(event_date, { upperCase: true, lang })}</span>
        {event_time && !hidden('event_time') && <> <span>{event_time}</span></>}
      </div>
    </div>
  )
```

Then change the JSX:

```tsx
    <PosterFrame vars={s.cssVars} style={side ? { flexDirection: 'row' } : undefined}>
      <PhotoGallery
        photos={photos.photo}
        label={<>zdjęcie prelegenta<br />{side ? '640 × 1080' : `1080 × ${photoH}`}</>}
        style={side ? { width: 640, height: '100%', flex: '0 0 auto' } : { height: photoH }}
      >
```

(the triangle child with the sygnet is unchanged), and in the text column replace the inline date-box block with `{dateBox}` and the column's padding with `padding: side ? 72 : '56px 72px 72px'`. Everything else in the column is unchanged.

- [ ] **Step 7: Re-shoot and compare** — run the screenshot loop again and check all 27 against the acceptance criteria. For each remaining failure, fix it in that template using `usePosterShape()` values only, re-shoot, and repeat until all 27 pass. Diff the nine `*-square.png` files against the Step 1 baseline by eye — they must be unchanged.

- [ ] **Step 8: Typecheck, lint, tests**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all pass.

- [ ] **Step 9: Commit**

```bash
git add src/posters/PosterWyklad.tsx src/posters/PosterKomunikat.tsx src/posters/PosterGala.tsx src/posters/PosterWarsztat.tsx src/posters/PosterGosc.tsx
# plus any other Poster*.tsx changed in Step 7
git commit -m "Szablony w pionie i poziomie: skalowane kliny, zdjęcia Warsztatu i Gościa"
```

---

### Task 10: Documentation

**Files:**
- Modify: `docs/architektura.md` (append a section), `docs/dodawanie-szablonu.md` (extend section `## 6. Sprawdzenie`)

- [ ] **Step 1: Append to `docs/architektura.md`**

```markdown
## Kształty i formaty eksportu

Plakat renderuje się w jednym z trzech kształtów (`src/posters/shape.ts`):

| Kształt | Układ (px) | Kiedy |
|---|---|---|
| `square` | 1080 × 1080 | Kwadrat, Story, wszystkie miniatury |
| `portrait` | 1080 × 1528 | A4/A3/A2 w pionie |
| `landscape` | 1528 × 1080 | A4/A3/A2 w poziomie |

Kształt niesie kontekst Reacta (`PosterShapeContext`), ustawiany przez
`PosterScaled`; `PosterFrame` i szablony czytają go przez `usePosterShape()`.
Bez providera obowiązuje kwadrat. Format papieru (A4/A3/A2) nie zmienia
układu — tylko rozdzielczość eksportu (`src/posters/formats.ts`).

Eksport (`src/posters/export.ts`):

- **Kwadrat / Story** — PNG z układu 1080×1080, jak dotychczas.
- **A4 / A3 / A2** — rasteryzacja do rozmiaru papieru w px przy 300 dpi;
  gdy przeglądarka nie udźwignie canvasu, drabinka schodzi na 200 i 150 dpi
  (`dpiLadder.ts`), a kreator pokazuje, która rozdzielczość się udała.
- **PNG** — RGB. **PDF** — zawsze CMYK: piksele przeliczone w `cmyk.ts`,
  spakowane natywnym `CompressionStream('deflate')` i osadzone jako jeden
  obraz na stronie o wymiarach papieru (`pdf.ts`, bez biblioteki).

**Ograniczenie CMYK:** konwersja jest „urządzeniowa", bez profilu ICC, więc
nasycone kolory marki (limonka, koral) wychodzą w druku bardziej matowo niż
na ekranie. Tekst w PDF nie jest zaznaczalny (to obraz). Bez spadów i
znaczników cięcia.
```

- [ ] **Step 2: Add to the end of `## 6. Sprawdzenie` in `docs/dodawanie-szablonu.md`**

```markdown
- Szablon musi wyglądać dobrze w **trzech kształtach**. Otwórz
  `/poster/<klucz>?shape=portrait` i `/poster/<klucz>?shape=landscape`
  (bez parametru — kwadrat). Elementy o stałych wymiarach w px (kliny,
  zdjęcia, pasy) skaluj przez `usePosterShape()` z `src/posters/shape.ts`
  (`kx`/`ky` = ile razy ramka jest szersza/wyższa od kwadratu) — nie
  wpisuj `1080` na sztywno i nie rozgałęziaj po formacie papieru.
```

- [ ] **Step 3: Commit**

```bash
git add docs/architektura.md docs/dodawanie-szablonu.md
git commit -m "Dokumentacja: kształty plakatu i eksport do druku"
```
