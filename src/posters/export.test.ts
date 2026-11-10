import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toCanvas, toPng } from 'html-to-image'
import { canvasSizeFor, downloadPoster, isWebKit, renderSocialPng } from './export'

vi.mock('html-to-image', () => ({ toCanvas: vi.fn(), toPng: vi.fn() }))

interface FakeCanvas {
  width: number
  height: number
  getContext: () => unknown
  toBlob: (cb: (b: Blob | null) => void) => void
  toDataURL: () => string
}

const fakeCanvases: FakeCanvas[] = []
const pngBlob = new Blob(['png'], { type: 'image/png' })

function fakeCanvas(): FakeCanvas {
  const canvas: FakeCanvas = {
    width: 0,
    height: 0,
    getContext: () => ({
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      getImageData: () => ({ data: [10, 20, 30, 255] }),
    }),
    toBlob: (cb) => cb(pngBlob),
    toDataURL: () => 'data:image/png;base64,composited',
  }
  fakeCanvases.push(canvas)
  return canvas
}

class FakeImage {
  width = 1080
  height = 1080
  onload: (() => void) | null = null
  set src(_: string) {
    queueMicrotask(() => this.onload?.())
  }
}

const node = { offsetHeight: 1080 } as HTMLElement
const saved: string[] = []

beforeEach(() => {
  fakeCanvases.length = 0
  saved.length = 0
  vi.mocked(toCanvas).mockReset()
  vi.mocked(toPng).mockReset().mockResolvedValue('data:image/png;base64,poster')
  vi.mocked(toCanvas).mockImplementation(async (_n, o) => {
    const c = fakeCanvas()
    c.width = o?.canvasWidth ?? 0
    c.height = o?.canvasHeight ?? 0
    return c as unknown as HTMLCanvasElement
  })
  vi.stubGlobal('document', {
    createElement: (tag: string) => {
      if (tag === 'canvas') return fakeCanvas()
      return { click: function (this: { download: string }) { saved.push(this.download) } }
    },
  })
  vi.stubGlobal('Image', FakeImage)
  vi.stubGlobal('fetch', vi.fn(async () => ({ blob: async () => pngBlob })))
  vi.stubGlobal('URL', { createObjectURL: () => 'blob:x', revokeObjectURL: () => {} })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('renderSocialPng', () => {
  it('story w układzie story: rasteryzuje wprost do 1080×1920', async () => {
    const blob = await renderSocialPng(node, 'story', 'story')
    expect(blob).toBe(pngBlob)
    expect(toCanvas).toHaveBeenCalledWith(node, expect.objectContaining({ canvasWidth: 1080, canvasHeight: 1920 }))
    expect(toPng).not.toHaveBeenCalled()
  })

  it('story z układu square: plakat trafia na płótno 1080×1920', async () => {
    const blob = await renderSocialPng(node, 'story', 'square')
    expect(blob).toBe(pngBlob)
    expect(toPng).toHaveBeenCalledOnce()
    expect(toCanvas).not.toHaveBeenCalled()
    expect(fakeCanvases.some((c) => c.width === 1080 && c.height === 1920)).toBe(true)
  })

  it('square z układu square: plakat bez dostawki (1080×1080)', async () => {
    expect(await renderSocialPng(node, 'square', 'square')).toBe(pngBlob)
    expect(toPng).toHaveBeenCalledOnce()
  })
})

describe('downloadPoster (social)', () => {
  it('square i story dalej idą tą samą ścieżką rastra i zapisują plik', async () => {
    await downloadPoster(node, 'plakat', { formatKey: 'square', orientation: 'portrait', fileType: 'png', shape: 'square' })
    expect(toPng).toHaveBeenCalledOnce()
    await downloadPoster(node, 'plakat', { formatKey: 'story', orientation: 'portrait', fileType: 'png', shape: 'story' })
    expect(toCanvas).toHaveBeenCalledWith(node, expect.objectContaining({ canvasWidth: 1080, canvasHeight: 1920 }))
    expect(saved).toEqual(['plakat.png', 'plakat.png'])
  })
})

describe('canvasSizeFor', () => {
  it('plakat mniejszy niż format: rozmiar formatu (story dostaje dostawkę)', () => {
    expect(canvasSizeFor({ width: 1080, height: 1920 }, { width: 1080, height: 1080 })).toEqual({ width: 1080, height: 1920 })
  })

  it('wydłużony kwadrat: płótno rośnie do plakatu zamiast go przycinać', () => {
    expect(canvasSizeFor({ width: 1080, height: 1080 }, { width: 1080, height: 1400 })).toEqual({ width: 1080, height: 1400 })
    expect(canvasSizeFor({ width: 1080, height: 1920 }, { width: 1080, height: 2100 })).toEqual({ width: 1080, height: 2100 })
  })
})

describe('isWebKit', () => {
  it('Safari na Macu i przeglądarki na iOS: tak', () => {
    expect(isWebKit('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15')).toBe(true)
    expect(isWebKit('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.0.0 Mobile/15E148 Safari/604.1')).toBe(true)
  })

  it('Chrome, Edge, Firefox: nie', () => {
    expect(isWebKit('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36')).toBe(false)
    expect(isWebKit('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0')).toBe(false)
    expect(isWebKit('Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:131.0) Gecko/20100101 Firefox/131.0')).toBe(false)
  })
})
