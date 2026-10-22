import { describe, expect, it } from 'vitest'
import { canvasSizeFor } from './export'

describe('canvasSizeFor', () => {
  it('plakat mniejszy niż format: rozmiar formatu (story dostaje dostawkę)', () => {
    expect(canvasSizeFor({ width: 1080, height: 1920 }, { width: 1080, height: 1080 })).toEqual({ width: 1080, height: 1920 })
  })

  it('wydłużony kwadrat: płótno rośnie do plakatu zamiast go przycinać', () => {
    expect(canvasSizeFor({ width: 1080, height: 1080 }, { width: 1080, height: 1400 })).toEqual({ width: 1080, height: 1400 })
    expect(canvasSizeFor({ width: 1080, height: 1920 }, { width: 1080, height: 2100 })).toEqual({ width: 1080, height: 2100 })
  })
})
