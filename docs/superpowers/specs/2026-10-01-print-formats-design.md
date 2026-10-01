# Print formats (A4 / A3 / A2, portrait & landscape, PNG / PDF) — design

## Goal

Let a user export a poster sized for paper — A4, A3 or A2, in portrait or
landscape — as a PNG or a PDF, with a layout that actually fills the page
instead of a square floating on a coloured background.

Today every poster is a fixed 1080×1080 square (`posterBaseStyle` in
`src/posters/theme.ts`); the only non-square export, Story, pads the square
with background colour (`compositeOnCanvas` in `src/posters/export.ts`).

## Decisions (from brainstorming)

- **True reflow**, not padding: each template renders a real portrait and a
  real landscape layout.
- **File type is selectable**: PNG or PDF.
- **PDF is CMYK** (always — there is no RGB PDF variant).
- **Landscape** is supported alongside portrait.
- The **PNG/PDF** and **portrait/landscape** controls look like the existing
  PL/EN switch (`LangToggle`).
- **No bleed, no crop marks.**

## Page shapes

A2, A3 and A4 share one aspect ratio (1 : √2), so the layout only needs
three shapes, all on the existing 1080-unit scale:

| Shape | Layout size (CSS px) | Used by |
|---|---|---|
| `square` | 1080 × 1080 | Kwadrat, Story, all thumbnails |
| `portrait` | 1080 × 1528 | A4/A3/A2 pion |
| `landscape` | 1528 × 1080 | A4/A3/A2 poziom |

The paper size only changes the **output resolution**, never the layout.

- New type `PosterShape = 'square' | 'portrait' | 'landscape'` in
  `src/types.ts`.
- New module `src/posters/shape.tsx`:
  - `SHAPE_SIZE: Record<PosterShape, { width: number; height: number }>`
  - `PosterShapeContext` (default `'square'`)
  - `usePosterShape(): { shape, width, height }`
- The shape travels by **React context**, not as a prop: `PosterFrame` and
  any template that needs a shape-specific tweak read it with
  `usePosterShape()`. Everything that does not provide the context
  (template thumbnails, scheme swatches, history, `PosterPreviewPage`) keeps
  rendering the square, with no call-site changes.

## Rendering

- `posterBaseStyle` drops its hard-coded `width`/`height`; `PosterFrame`
  sets them from `usePosterShape()`.
- `PosterScaled` gains an optional `shape` prop (default `'square'`). It
  wraps its children in `PosterShapeContext.Provider` and sizes its boxes
  from `SHAPE_SIZE[shape]`. `size` keeps meaning "on-screen **width** in
  px"; the on-screen height follows the aspect ratio.
- `PosterPreview` takes `shape` and passes it down. The preview panel is
  460px wide, so preview width stays 420: square 420×420, portrait 420×594,
  landscape 420×297.

## Template adjustments

Rows inside `PosterFrame` are already spread with
`justify-content: space-between`, and corner decorations are absolutely
positioned from their own corner, so most of each layout stretches without
changes. Every template must still be checked in all three shapes, and
these known fixed-size parts need shape-aware values:

| Template | Part | Portrait | Landscape |
|---|---|---|---|
| Warsztat | right panel `height: 1080` | full frame height | full frame height (already) |
| Gość | photo `height: 600` | taller photo | photo beside the text rather than above |
| Rekrutacja | zigzag band | band keeps its height, anchored to bottom | band stretched to full width |
| Data | giant day number | scale up with free height | unchanged |
| Wykład, Komunikat | wedges with fixed px sizes | scale wedge heights with frame height | scale wedge widths with frame width |
| Konferencja | header band + agenda | agenda gets the extra height | agenda in the wider column |
| Gala, Ogłoszenie | centred content | verify only | verify only |

Rule for tweaks: derive from `usePosterShape()` (`width`/`height`), never
branch on the paper size. Font sizes are **not** changed per shape — the
existing title/text scale sliders stay the user's tool for fitting text,
and the live preview shows the chosen shape.

## Export formats

`EXPORT_FORMATS` in `src/posters/export.ts` grows a print variant:

```ts
interface ExportFormat {
  label: string
  // social formats: fixed pixel size, always PNG, square layout
  width?: number
  height?: number
  // print formats: paper size in mm (portrait), layout follows orientation
  paper?: { widthMm: number; heightMm: number }
}
```

| Key | Label | Paper |
|---|---|---|
| `square` | Kwadrat · 1080×1080 | — |
| `story` | Story · 1080×1920 | — |
| `a4` | A4 · 210×297 mm | 210 × 297 |
| `a3` | A3 · 297×420 mm | 297 × 420 |
| `a2` | A2 · 420×594 mm | 420 × 594 |

Pure helpers (unit-tested):

- `shapeFor(formatKey, orientation): PosterShape` — `square` for social
  formats, otherwise the orientation.
- `pixelSize(format, orientation, dpi): { width, height }` —
  `round(mm / 25.4 * dpi)`, swapped for landscape. At 300 dpi: A4
  2480×3508, A3 3508×4961, A2 4961×7016.
- `pageSizePt(format, orientation): { width, height }` — `mm * 72 / 25.4`.

### Rasterising

`html-to-image` renders the layout node at its CSS size with
`canvasWidth`/`canvasHeight` set to the target pixel size, so the output is
exactly the paper's pixel dimensions.

**Resolution ladder:** try 300 dpi, then 200, then 150. A step fails if
rasterising throws or yields an empty canvas (browsers cap canvas area;
A2 at 300 dpi is ~35 MP). The dpi actually used is returned to the caller
and shown to the user when it is below 300.

### PNG

The rasterised canvas is downloaded as-is (RGB).

### PDF (CMYK)

No PDF library is added. Two small pure modules, both unit-tested:

- `src/posters/cmyk.ts` — `rgbaToCmyk(rgba: Uint8ClampedArray): Uint8Array`.
  Device conversion: `K = 1 − max(R,G,B)`, `C = (1−R−K)/(1−K)` (same for M,
  Y), pure black → `0,0,0,255`. Alpha is ignored (posters are opaque).
- `src/posters/pdf.ts` — `buildPdf({ widthPx, heightPx, widthPt, heightPt,
  imageData }): Uint8Array`. Writes a single-page PDF 1.4: catalog, page
  tree, one page whose `MediaBox` is the paper size in points, one image
  XObject (`/ColorSpace /DeviceCMYK`, `/BitsPerComponent 8`,
  `/Filter /FlateDecode`) and a content stream that scales the image to the
  full page. Includes a correct `xref` table and trailer.

The CMYK bytes are compressed with the browser's
`CompressionStream('deflate')` (zlib format, which is what `FlateDecode`
expects) before being handed to `buildPdf`.

**Known limitation:** the conversion is not colour-managed (no ICC
profile). Saturated brand colours — the lime and the coral — will print
somewhat duller than on screen. This is inherent to putting sRGB artwork
into CMYK without a profile and is documented in `docs/architektura.md`.

**Memory:** A2 at 300 dpi holds ~140 MB of RGBA plus ~140 MB of CMYK at
once. The resolution ladder also catches allocation failures here.

### Entry point

`downloadPosterAsPng` is replaced by:

```ts
export async function downloadPoster(
  node: HTMLElement,
  basename: string,
  opts: { formatKey: string; orientation: Orientation; fileType: FileType },
): Promise<{ dpi?: number }>
```

It appends the extension (`.png` / `.pdf`). Social formats ignore
`orientation` and `fileType` and behave exactly as today.

## UI (`App.tsx`, actions section)

- New types `Orientation = 'portrait' | 'landscape'` and
  `FileType = 'png' | 'pdf'` in `src/types.ts`.
- New state: `orientation` (default `'portrait'`), `fileType` (default
  `'png'`). Session-only, like the existing `exportFormat` — not written to
  the draft DB or `localStorage`.
- `LangToggle`'s markup is extracted into a generic
  `SegmentedToggle<T extends string>` (`options: { value: T; label: string }[]`,
  `value`, `onChange`, `ariaLabel`). `LangToggle` becomes a thin wrapper, so
  its look and behaviour do not change.
- Next to the format `<select>`, **only when a paper format is selected**:
  - `SegmentedToggle` **Pion / Poziom** (`aria-label="Orientacja"`)
  - `SegmentedToggle` **PNG / PDF** (`aria-label="Typ pliku"`)
- The download button reads `Pobierz PNG` or `Pobierz PDF`.
- While exporting, the button is disabled and reads `Generowanie…` (print
  exports take seconds, unlike the square).
- If the export fell back below 300 dpi, a short note appears under the
  button: `Zapisano w 200 dpi — przeglądarka nie obsłużyła 300 dpi.`
- The live preview uses `shapeFor(exportFormat, orientation)`.

## Collapsible creator panels

Independent of the print work, but shipped with it: the long panels of the
creator can be rolled up so the format controls and preview stay reachable
on small screens.

- **Collapsible:** `1. Wybierz szablon`, `2. Uzupełnij dane`, `Historia`.
  **Not collapsible:** the actions row and `Podgląd`.
- New component `src/components/CollapsiblePanel.tsx`
  (`title`, `open`, `onToggle`, `className`, `children`). It renders the
  existing `<section>` + heading styles; the heading becomes a full-width
  `<button aria-expanded aria-controls>` with a chevron on the right that
  rotates when open. Collapsed content is unmounted from layout with
  `hidden` (form state lives in `App`, so nothing is lost).
- State: `collapsed: Record<'template' | 'form' | 'history', boolean>` in
  `App.tsx`, all open by default, persisted to `localStorage` under
  `sknm-collapsed-panels` (read once on mount with a try/catch fallback,
  like `sknm-poster-lang`).
- A collapsed `1. Wybierz szablon` shows the selected template's name next
  to the heading, so the current choice stays visible.

## Out of scope

- Bleed and crop marks.
- ICC colour management; an RGB PDF option.
- Remembering format/orientation/file type per draft or across sessions.
- Portrait/landscape thumbnails in the template picker, swatches, history.
- Selectable (vector) text in the PDF.

## Testing

- **Unit (vitest):**
  - `export.test.ts` — `shapeFor`, `pixelSize`, `pageSizePt` for every
    format × orientation.
  - `cmyk.test.ts` — white, black, pure R/G/B, a mid grey; output length.
  - `pdf.test.ts` — header/trailer present, `MediaBox` matches the paper,
    image dictionary declares `DeviceCMYK` with the right dimensions, every
    `xref` offset points at its `N 0 obj`.
- **Visual:** all nine templates in `square`, `portrait` and `landscape`
  with placeholder data, checked in headless Chrome — nothing clipped,
  overlapping or left with dead space; square output unchanged from today.
- **Manual:** one real A4 PDF opened in Preview and checked to report CMYK
  and 210×297 mm; one A2 PNG export to confirm the ladder.

## Docs to update

- `docs/architektura.md` — shapes, export pipeline, the CMYK limitation.
- `docs/dodawanie-szablonu.md` — a new template must render in all three
  shapes and use `usePosterShape()` for fixed-size parts.
