import puppeteer from '@cloudflare/puppeteer'
import type { RenderInput, RenderResult } from '../../src/api/types'
import type { Env } from './env'

const READY_TIMEOUT_MS = 15_000
const TOTAL_BUDGET_MS = 30_000

const unavailable: RenderResult = {
  ok: false,
  error: { code: 'render_unavailable', message: 'Usługa renderowania jest chwilowo niedostępna. Spróbuj ponownie za chwilę.' },
}

// Cienka warstwa: otwiera stronę /render w Browser Rendering i woła `window.sknmRender`.
export async function renderInBrowser(env: Env, input: RenderInput): Promise<RenderResult> {
  const started = Date.now()
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined
  try {
    browser = await puppeteer.launch(env.BROWSER)
    const page = await browser.newPage()
    await page.goto(env.RENDER_URL, { waitUntil: 'networkidle0', timeout: READY_TIMEOUT_MS })
    try {
      await page.waitForFunction('window.sknmReady === true && typeof window.sknmRender === "function"', { timeout: READY_TIMEOUT_MS })
    } catch {
      return unavailable
    }
    const left = Math.max(1000, TOTAL_BUDGET_MS - (Date.now() - started))
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<RenderResult>((resolve) => {
      timer = setTimeout(() => resolve({ ok: false, error: { code: 'render_failed', message: 'Renderowanie przekroczyło limit 30 s.' } }), left)
    })
    try {
      return await Promise.race([page.evaluate((i) => (globalThis as unknown as { sknmRender: (input: RenderInput) => Promise<RenderResult> }).sknmRender(i), input), timeout])
    } finally {
      clearTimeout(timer)
    }
  } catch (e) {
    console.error('render:', e instanceof Error ? e.message : 'nieznany błąd')
    return unavailable
  } finally {
    await browser?.close().catch(() => undefined)
  }
}
