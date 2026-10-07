import { describe, expect, it } from 'vitest'
import { fitWithin, mimeOfFile, outputType, prepareImage } from './prepare'

describe('fitWithin', () => {
  it('zmniejsza do limitu dłuższego boku z zachowaniem proporcji', () => {
    expect(fitWithin(4032, 3024, 3000)).toEqual({ width: 3000, height: 2250 })
    expect(fitWithin(3024, 4032, 3000)).toEqual({ width: 2250, height: 3000 })
  })

  it('zaokrągla krótszy bok', () => {
    expect(fitWithin(4000, 3001, 2000)).toEqual({ width: 2000, height: 1501 })
  })

  it('nie powiększa', () => {
    expect(fitWithin(800, 600, 3000)).toEqual({ width: 800, height: 600 })
    expect(fitWithin(3000, 2000, 3000)).toEqual({ width: 3000, height: 2000 })
  })

  it('bardzo wąska grafika nie dostaje zerowego boku', () => {
    expect(fitWithin(10000, 1, 2000)).toEqual({ width: 2000, height: 1 })
  })
})

describe('outputType', () => {
  it('format zostaje ten sam', () => {
    expect(outputType('image/jpeg')).toBe('image/jpeg')
    expect(outputType('image/png')).toBe('image/png')
    expect(outputType('image/svg+xml')).toBe('image/svg+xml')
  })

  it('inny format → wyjątek', () => {
    expect(() => outputType('image/gif')).toThrow('image/gif')
    expect(() => outputType('')).toThrow()
  })
})

describe('mimeOfFile', () => {
  it('bierze typ pliku, a gdy go brak - rozszerzenie', () => {
    expect(mimeOfFile({ type: 'image/png', name: 'logo.bin' })).toBe('image/png')
    expect(mimeOfFile({ type: '', name: 'Logo.SVG' })).toBe('image/svg+xml')
    expect(mimeOfFile({ type: '', name: 'foto.jpeg' })).toBe('image/jpeg')
    expect(() => mimeOfFile({ type: '', name: 'notatki.txt' })).toThrow()
  })
})

describe('prepareImage', () => {
  // Jedyna ścieżka bez canvasa - reszta działa tylko w przeglądarce.
  it('SVG przechodzi bez zmian', async () => {
    const file = new File(['<svg xmlns="http://www.w3.org/2000/svg"/>'], 'logo.svg', { type: 'image/svg+xml' })
    expect(await prepareImage(file)).toBe(file)
  })

  it('SVG bez typu dostaje typ z rozszerzenia', async () => {
    const file = new File(['<svg/>'], 'logo.svg')
    const blob = await prepareImage(file)
    expect(blob.type).toBe('image/svg+xml')
    expect(await blob.text()).toBe('<svg/>')
  })
})
