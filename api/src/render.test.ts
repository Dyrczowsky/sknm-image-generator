import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Env } from './env'

const launch = vi.fn()
vi.mock('@cloudflare/puppeteer', () => ({ default: { launch: (...a: unknown[]) => launch(...a) } }))
const { renderInBrowser } = await import('./render')

const env = { BROWSER: {}, RENDER_URL: 'https://r.test/render' } as unknown as Env
const input = { template: 'wyklad' }
const OK = { ok: true, png: '', width: 1, height: 1, photoRefs: [], historyRow: {} }

function fakeBrowser(page: Record<string, unknown>) {
  const close = vi.fn(async () => undefined)
  launch.mockResolvedValue({ newPage: async () => ({ goto: async () => undefined, waitForFunction: async () => undefined, evaluate: async () => OK, ...page }), close })
  return close
}

afterEach(() => {
  vi.useRealTimers()
  launch.mockReset()
  vi.restoreAllMocks()
})

describe('renderInBrowser', () => {
  it('zwraca wynik i zamyka przeglądarkę', async () => {
    const close = fakeBrowser({})
    expect(await renderInBrowser(env, input)).toEqual(OK)
    expect(close).toHaveBeenCalledOnce()
  })

  it('timeout gotowości: render_unavailable i close', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const close = fakeBrowser({ waitForFunction: async () => { throw new Error('Timeout') } })
    expect(await renderInBrowser(env, input)).toMatchObject({ ok: false, error: { code: 'render_unavailable' } })
    expect(close).toHaveBeenCalledOnce()
  })

  it('odrzucenie sknmRender: render_failed i close', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const close = fakeBrowser({ evaluate: async () => { throw new Error('boom') } })
    expect(await renderInBrowser(env, input)).toMatchObject({ ok: false, error: { code: 'render_failed' } })
    expect(close).toHaveBeenCalledOnce()
  })

  it('termin 30 s: render zawieszony kończy się błędem i zamknięciem', async () => {
    vi.useFakeTimers()
    const close = fakeBrowser({ evaluate: () => new Promise(() => undefined) })
    const p = renderInBrowser(env, input)
    await vi.advanceTimersByTimeAsync(29_999)
    let done = false
    void p.then(() => { done = true })
    await vi.advanceTimersByTimeAsync(0)
    expect(done).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(await p).toMatchObject({ ok: false, error: { code: 'render_unavailable' } })
    expect(close).toHaveBeenCalledOnce()
  })

  it('start przeglądarki po terminie: przeglądarka zostaje zamknięta', async () => {
    vi.useFakeTimers()
    const close = vi.fn(async () => undefined)
    let resolveLaunch: (b: unknown) => void = () => undefined
    launch.mockReturnValue(new Promise((r) => { resolveLaunch = r }))
    const p = renderInBrowser(env, input)
    await vi.advanceTimersByTimeAsync(30_000)
    expect(await p).toMatchObject({ ok: false, error: { code: 'render_unavailable' } })
    resolveLaunch({ close, newPage: async () => { throw new Error('nie powinno być wywołane') } })
    await vi.advanceTimersByTimeAsync(0)
    expect(close).toHaveBeenCalledOnce()
  })
})
