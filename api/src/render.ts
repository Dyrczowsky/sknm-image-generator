import puppeteer from '@cloudflare/puppeteer'
import type { RenderInput, RenderResult } from '../../src/api/types'
import type { Env } from './env'

const READY_TIMEOUT_MS = 15_000
const TOTAL_BUDGET_MS = 30_000

const unavailable: RenderResult = {
  ok: false,
  error: { code: 'render_unavailable', message: 'Usługa renderowania jest chwilowo niedostępna. Spróbuj ponownie za chwilę.' },
}

type Browser = Awaited<ReturnType<typeof puppeteer.launch>>

// Cienka warstwa: otwiera stronę /render w Browser Rendering i woła `window.sknmRender`.
// Jeden termin (30 s) obejmuje start przeglądarki, wczytanie strony i render.
// Błędy startu, wczytania, gotowości i przekroczenie terminu = `render_unavailable` (można ponowić);
// odrzucenie po stronie `sknmRender` = `render_failed`. Przeglądarka jest zawsze zamykana.
export async function renderInBrowser(env: Env, input: RenderInput): Promise<RenderResult> {
  const deadline = Date.now() + TOTAL_BUDGET_MS
  const left = () => deadline - Date.now()
  let browser: Browser | undefined
  let timedOut = false
  let timer: ReturnType<typeof setTimeout> | undefined

  const run = async (): Promise<RenderResult> => {
    let page: Awaited<ReturnType<Browser['newPage']>>
    try {
      const launched = await puppeteer.launch(env.BROWSER)
      if (timedOut) {
        await launched.close().catch(() => undefined)
        return unavailable
      }
      browser = launched
      page = await browser.newPage()
      if (left() <= 0) return unavailable
      await page.goto(env.RENDER_URL, { waitUntil: 'networkidle0', timeout: Math.min(READY_TIMEOUT_MS, left()) })
      if (left() <= 0) return unavailable
      await page.waitForFunction('window.sknmReady === true && typeof window.sknmRender === "function"', {
        timeout: Math.min(READY_TIMEOUT_MS, left()),
      })
    } catch (e) {
      console.error('render:', e instanceof Error ? e.message : 'nieznany błąd')
      return unavailable
    }
    try {
      // Funkcja wykonuje się w przeglądarce (bez typów DOM w Workerze, stąd `any`).
      return await page.evaluate(async (i) => {
        const w = globalThis as unknown as { sknmRender: (input: RenderInput) => Promise<RenderResult>; document: any; Image: any }
        const r = await w.sknmRender(i)
        if (!r.ok) return r
        try {
          const img = new w.Image()
          img.src = `data:image/png;base64,${r.png}`
          await img.decode()
          const c = w.document.createElement('canvas')
          c.width = Math.round(img.width / 2)
          c.height = Math.round(img.height / 2)
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
          return { ...r, preview: (c.toDataURL('image/jpeg', 0.8) as string).split(',')[1] }
        } catch {
          return r // bez podglądu; MCP wyśle wtedy pełny PNG
        }
      }, input)
    } catch (e) {
      console.error('render: sknmRender odrzucone:', e instanceof Error ? e.message : 'nieznany błąd')
      return { ok: false, error: { code: 'render_failed', message: 'Renderowanie obrazu nie powiodło się.' } }
    }
  }

  const timeout = new Promise<RenderResult>((resolve) => {
    timer = setTimeout(() => {
      timedOut = true
      resolve(unavailable)
    }, TOTAL_BUDGET_MS)
  })
  try {
    return await Promise.race([run(), timeout])
  } finally {
    clearTimeout(timer)
    await browser?.close().catch(() => undefined)
  }
}
