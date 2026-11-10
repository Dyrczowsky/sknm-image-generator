import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { buildRenderState } from '../api/renderInput'
import { snapshotFor } from '../api/renderSnapshot'
import type { RenderResult } from '../api/types'
import { PosterPreview } from '../components/PosterPreview'
import { OFFSCREEN } from '../components/styles'
import { renderSocialPng } from '../posters/export'
import { posterRegistry } from '../posters/registry'
import { SHAPE_SIZE } from '../posters/shape'
import type { EditorState } from '../snapshot/snapshot'
import type { PosterShape } from '../types'
import { decodeScheme } from '../utils/colorScheme'
import { loadAllFonts } from '../utils/loadFonts'

declare global {
  interface Window {
    // Wywoływane przez Workera (puppeteer) po `sknmReady === true`.
    sknmRender?: (input: unknown) => Promise<RenderResult>
    sknmReady?: boolean
  }
}

interface RenderJob {
  state: EditorState
  shape: PosterShape
}

// Ile kolejnych klatek węzeł plakatu musi się nie zmieniać (auto-dopasowanie
// tekstu skończyło pracę) i jak długo najwyżej na to czekamy.
const STABLE_FRAMES = 3
const SETTLE_TIMEOUT_MS = 5000
// Kawałki przy kodowaniu base64 - `String.fromCharCode(...)` ma limit argumentów.
const BASE64_CHUNK = 0x8000

const nextFrame = () => new Promise<number>((resolve) => requestAnimationFrame(resolve))

// Czeka, aż wysokość i treść węzła będą takie same przez STABLE_FRAMES klatek
// z rzędu; po SETTLE_TIMEOUT_MS eksportujemy to, co jest.
async function settled(node: HTMLElement): Promise<void> {
  const deadline = performance.now() + SETTLE_TIMEOUT_MS
  let last = ''
  let stable = 0
  while (stable < STABLE_FRAMES && performance.now() < deadline) {
    await nextFrame()
    const current = `${node.offsetHeight}|${node.innerHTML}`
    stable = current === last ? stable + 1 : 0
    last = current
  }
}

async function toBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i += BASE64_CHUNK) binary += String.fromCharCode(...bytes.subarray(i, i + BASE64_CHUNK))
  return btoa(binary)
}

// Faktyczny rozmiar PNG (kwadrat, który urósł w dół, daje wyższy plik).
async function pngSize(blob: Blob): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(blob)
  const size = { width: bitmap.width, height: bitmap.height }
  bitmap.close()
  return size
}

// Strona techniczna pod /render dla API: Worker otwiera ją w headless Chrome
// i woła `window.sknmRender(input)`. Plakat powstaje z tych samych komponentów
// i tego samego kodu eksportu co przycisk „Pobierz" w edytorze. Węzeł jest
// poza ekranem (OFFSCREEN), nigdy `display:none` - patrz docs/architektura.md.
// `initialJob` służy tylko testom.
export function RenderPage({ initialJob }: { initialJob?: RenderJob }) {
  // `id` wymusza świeży montaż plakatu dla każdego zadania (pomiar wysokości,
  // stan auto-dopasowania).
  const [job, setJob] = useState<(RenderJob & { id: number }) | null>(initialJob ? { ...initialJob, id: 0 } : null)
  const [layoutHeight, setLayoutHeight] = useState(0)
  const posterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let jobId = 0
    // Zadania idą po kolei - na stronie jest jeden węzeł plakatu.
    let queue: Promise<unknown> = Promise.resolve()

    const run = async (input: unknown): Promise<RenderResult> => {
      try {
        const built = buildRenderState(input)
        if (!built.ok) return built
        const { state, formatKey, shape } = built
        flushSync(() => {
          setLayoutHeight(0)
          setJob({ state, shape, id: ++jobId })
        })
        const node = posterRef.current
        if (!node) throw new Error('Brak węzła plakatu.')
        await document.fonts.ready
        await Promise.all(Array.from(node.querySelectorAll('img'), (img) => img.decode()))
        await settled(node)
        // Tekst plakatu mógł dopiero teraz poprosić o krój - wtedy dopasowanie
        // policzono na foncie zastępczym; czekamy na krój i dopasowujemy znowu.
        if (document.fonts.status !== 'loaded') {
          await document.fonts.ready
          await settled(node)
        }
        const blob = await renderSocialPng(node, formatKey, shape)
        const [png, size] = await Promise.all([toBase64(blob), pngSize(blob)])
        const snap = await snapshotFor(state)
        if (!snap.ok) return snap
        return { ok: true, png, ...size, photoRefs: snap.photoRefs, historyRow: snap.historyRow }
      } catch (e) {
        return { ok: false, error: { code: 'render_failed', message: e instanceof Error ? e.message : 'Nie udało się wygenerować obrazu.' } }
      }
    }

    window.sknmRender = (input) => {
      const result = queue.then(() => run(input))
      queue = result.catch(() => undefined)
      return result
    }
    let active = true
    void loadAllFonts(document.fonts).then(() => {
      if (active) window.sknmReady = true
    })
    return () => {
      active = false
      delete window.sknmRender
      delete window.sknmReady
    }
  }, [])

  const poster = job ? posterRegistry[job.state.posterKey] : undefined
  const { scheme, accent } = decodeScheme(job?.state.colorScheme)

  return (
    <main>
      <p>Strona techniczna generatora (API).</p>
      {job && (
        <div className={OFFSCREEN} aria-hidden="true">
          <PosterPreview
            key={job.id}
            posterRef={posterRef}
            Component={poster?.Component}
            data={job.state.form}
            scheme={scheme}
            accent={accent}
            lang={job.state.lang}
            shape={job.shape}
            size={SHAPE_SIZE[job.shape].width}
            layoutHeight={layoutHeight}
            onLayoutHeight={setLayoutHeight}
          />
        </div>
      )}
    </main>
  )
}
