import hankenLatin from '../../assets/fonts/hanken-grotesk-latin.woff2?url'
import hankenLatinExt from '../../assets/fonts/hanken-grotesk-latin-ext.woff2?url'
import mono400Latin from '../../assets/fonts/space-mono-400-latin.woff2?url'
import mono400LatinExt from '../../assets/fonts/space-mono-400-latin-ext.woff2?url'
import mono700Latin from '../../assets/fonts/space-mono-700-latin.woff2?url'
import mono700LatinExt from '../../assets/fonts/space-mono-700-latin-ext.woff2?url'
import { saveBlob } from '../../posters/export'
import { stepsForDeck } from '../present'
import { SLIDE_SIZE } from '../shape'
import { paletteFor } from '../themes'
import { clampDuration, effectiveTransition, transitionFrames } from '../transitions'
import type { TransitionFrames } from '../transitions'
import { TRANSITION_KEYS } from '../types'
import type { Deck, SlideAspect, TransitionKey } from '../types'
import { renderOffscreen } from './offscreen'
import { PLAYER_CSS, PLAYER_SCRIPT } from './player'
import { deckFileName } from './raster'
import type { ExportProgress } from './raster'

export type { ExportProgress }

// Dane slajdu potrzebne odtwarzaczowi (treść idzie osobno, jako gotowy HTML).
export interface PlayerSlide {
  // Liczba kroków „pokazuj po kolei" (0 = wszystko od razu).
  steps: number
  // Przejście NA ten slajd (już rozstrzygnięte względem domyślnego talii).
  transition: TransitionKey
  // Tło slajdu (`--s-bg`) - kolor pasów wokół sceny.
  bg: string
}

// Zakresy znaków jak w fonts.css - przeglądarka pobiera tylko potrzebny plik.
const LATIN_EXT =
  'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'
const LATIN =
  'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'

const FONT_FACES: { family: string; weight: string; url: string; range: string }[] = [
  { family: 'Hanken Grotesk', weight: '400 800', url: hankenLatinExt, range: LATIN_EXT },
  { family: 'Hanken Grotesk', weight: '400 800', url: hankenLatin, range: LATIN },
  { family: 'Space Mono', weight: '400', url: mono400LatinExt, range: LATIN_EXT },
  { family: 'Space Mono', weight: '400', url: mono400Latin, range: LATIN },
  { family: 'Space Mono', weight: '700', url: mono700LatinExt, range: LATIN_EXT },
  { family: 'Space Mono', weight: '700', url: mono700Latin, range: LATIN },
]

// Atrybuty edycji na slajdzie - w pliku do pokazu nic nie jest edytowalne.
const EDITOR_ATTRS = ['data-slide-edit', 'contenteditable', 'role', 'aria-label', 'aria-multiline', 'spellcheck', 'data-placeholder', 'data-empty', 'tabindex']

const MIME_BY_EXT: Record<string, string> = {
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  woff2: 'font/woff2',
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// JSON w <script> nie może zawierać „</script>" ani separatorów linii JS.
function scriptJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

// Klatki wszystkich przejść w obu kierunkach + zamiana przy ograniczonym ruchu.
// Liczone przy eksporcie, żeby odtwarzacz nie musiał znać transitions.ts.
export function transitionTable(): {
  transitions: Record<string, Record<'1' | '-1', TransitionFrames>>
  reduced: Record<string, { key: TransitionKey; durationScale: number }>
} {
  const transitions: Record<string, Record<'1' | '-1', TransitionFrames>> = {}
  const reduced: Record<string, { key: TransitionKey; durationScale: number }> = {}
  for (const key of TRANSITION_KEYS) {
    transitions[key] = { '1': transitionFrames(key, 1), '-1': transitionFrames(key, -1) }
    reduced[key] = effectiveTransition(key, true)
  }
  return { transitions, reduced }
}

function stage(id: string, aspect: SlideAspect, markup: string[]): string {
  const { width, height } = SLIDE_SIZE[aspect]
  const slides = markup.map((html, index) => `<div class="slide" data-i="${index}">${html}</div>`).join('\n')
  return `<div class="stage" id="${id}" data-w="${width}" data-h="${height}" style="width:${width}px;height:${height}px">\n${slides}\n</div>`
}

export function buildHtmlDocument(input: {
  title: string
  fontCss: string
  wide: string[]
  square: string[]
  slides: PlayerSlide[]
  duration: number
}): string {
  const data = { duration: clampDuration(input.duration), slides: input.slides, ...transitionTable() }
  const firstBg = input.slides[0]?.bg ?? '#ffffff'
  return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="SKNM - Prezentacje">
<title>${escapeHtml(input.title)}</title>
<style>
${input.fontCss}
${PLAYER_CSS}
</style>
</head>
<body style="background:${escapeHtml(firstBg)}">
<div class="progress" id="progress"></div>
${stage('stage-wide', '16:9', input.wide)}
${stage('stage-square', '1:1', input.square)}
<script type="application/json" id="deck-data">${scriptJson(data)}</script>
<script>${PLAYER_SCRIPT}</script>
</body>
</html>
`
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('FileReader'))
    reader.readAsDataURL(blob)
  })
}

// Pobiera plik jako data URL. Brakujący typ (np. serwer bez MIME dla .svg)
// uzupełniamy z rozszerzenia, inaczej <img> z SVG się nie wyświetli.
async function fetchDataUrl(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Nie udało się pobrać ${url} (${response.status})`)
  let blob = await response.blob()
  const ext = new URL(url, location.href).pathname.split('.').pop()?.toLowerCase() ?? ''
  const expected = MIME_BY_EXT[ext]
  if (expected && (!blob.type || blob.type === 'application/octet-stream' || (ext === 'svg' && blob.type !== expected))) {
    blob = new Blob([blob], { type: expected })
  }
  return blobToDataUrl(blob)
}

async function buildFontCss(): Promise<string> {
  const faces = await Promise.all(
    FONT_FACES.map(async (face) => {
      const src = await fetchDataUrl(face.url)
      return `@font-face { font-family: '${face.family}'; font-style: normal; font-weight: ${face.weight}; font-display: block; src: url('${src}') format('woff2'); unicode-range: ${face.range}; }`
    }),
  )
  return faces.join('\n')
}

// Kopia węzła gotowa do zapisu: obrazy osadzone, bez atrybutów edytora.
async function serializeSlide(node: HTMLElement, images: Map<string, Promise<string>>): Promise<string> {
  const clone = node.cloneNode(true) as HTMLElement
  await Promise.all(
    Array.from(clone.querySelectorAll('img')).map(async (img) => {
      const src = img.getAttribute('src')
      if (!src || src.startsWith('data:')) return
      const absolute = new URL(src, location.href).href
      let pending = images.get(absolute)
      if (!pending) {
        pending = fetchDataUrl(absolute)
        images.set(absolute, pending)
      }
      img.setAttribute('src', await pending)
      img.removeAttribute('srcset')
    }),
  )
  clone.querySelectorAll('[data-slide-edit]').forEach((el) => {
    for (const attr of EDITOR_ATTRS) el.removeAttribute(attr)
  })
  return clone.outerHTML
}

// Jeden plik .html działający offline: oba formaty (16:9 i 1:1), wybór
// automatyczny wg proporcji okna (okno bliżej kwadratu niż 16:9 → 1:1)
// z przełącznikiem klawiszem `A`.
export async function exportDeckHtml(deck: Deck, onProgress?: ExportProgress): Promise<void> {
  const aspects: SlideAspect[] = ['16:9', '1:1']
  const total = deck.slides.length * aspects.length
  let done = 0
  onProgress?.(done, total)

  const fontCssPromise = buildFontCss()
  // Ten sam plik (sygnet, logo) w obu formatach pobieramy raz.
  const images = new Map<string, Promise<string>>()
  const markup: Record<SlideAspect, string[]> = { '16:9': [], '1:1': [] }

  for (const aspect of aspects) {
    const offscreen = await renderOffscreen(deck, aspect)
    try {
      for (const node of offscreen.nodes) {
        markup[aspect].push(await serializeSlide(node, images))
        done += 1
        onProgress?.(done, total)
      }
    } finally {
      offscreen.dispose()
    }
  }

  const steps = stepsForDeck(deck)
  const slides: PlayerSlide[] = deck.slides.map((slide, index) => ({
    steps: steps[index],
    transition: slide.transition ?? deck.transition,
    bg: paletteFor(deck.theme, slide.background).bg,
  }))

  const html = buildHtmlDocument({
    title: deck.name || 'Prezentacja',
    fontCss: await fontCssPromise,
    wide: markup['16:9'],
    square: markup['1:1'],
    slides,
    duration: deck.duration,
  })
  saveBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), `${deckFileName(deck.name)}.html`)
}
