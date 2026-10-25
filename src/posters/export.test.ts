import { describe, expect, it } from 'vitest'
import { canvasSizeFor, isWebKit } from './export'

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
