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
