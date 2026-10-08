import { describe, expect, it } from 'vitest'
import { ImageImportError, MAX_ASSET_BYTES, firstWithin, fitWithin, importErrorMessage, mimeOfFile, outputType, prepareImage, shrinkSteps } from './prepare'

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

  it('wyjątek jest typowany i niesie komunikat dla użytkownika', () => {
    let caught: unknown
    try {
      outputType('image/gif')
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(ImageImportError)
    expect((caught as ImageImportError).reason).toBe('unsupported')
    expect((caught as ImageImportError).message).toMatch(/JPG, PNG albo SVG/)
  })
})

describe('MAX_ASSET_BYTES', () => {
  it('to 5 MB, tak jak file_size_limit kubełka', () => {
    expect(MAX_ASSET_BYTES).toBe(5242880)
  })
})

describe('shrinkSteps', () => {
  const area = (step: { width: number; height: number }) => step.width * step.height

  it('JPEG: zaczyna od pełnych wymiarów i domyślnej jakości, potem tylko w dół', () => {
    const steps = shrinkSteps('image/jpeg', 3000, 2000)
    expect(steps[0]).toEqual({ width: 3000, height: 2000, quality: 0.85 })
    expect(steps.length).toBeGreaterThan(3)
    for (let i = 1; i < steps.length; i++) {
      const smaller = area(steps[i]) < area(steps[i - 1])
      const sameSizeLowerQuality = area(steps[i]) === area(steps[i - 1]) && steps[i].quality! < steps[i - 1].quality!
      expect(smaller || sameSizeLowerQuality).toBe(true)
    }
  })

  it('JPEG: najpierw jakość, dopiero potem wymiary', () => {
    const [first, second] = shrinkSteps('image/jpeg', 3000, 2000)
    expect(second).toMatchObject({ width: first.width, height: first.height })
    expect(second.quality).toBeLessThan(0.85)
  })

  it('PNG: tylko wymiary, bez jakości, z zachowaniem proporcji', () => {
    const steps = shrinkSteps('image/png', 2000, 1000)
    expect(steps[0]).toEqual({ width: 2000, height: 1000 })
    expect(steps.length).toBeGreaterThan(2)
    for (const step of steps) {
      expect(step.quality).toBeUndefined()
      expect(step.width).toBe(step.height * 2)
    }
    for (let i = 1; i < steps.length; i++) expect(area(steps[i])).toBeLessThan(area(steps[i - 1]))
  })

  it('PNG: ostatni krok mieści się w limicie nawet bez kompresji (4 bajty na piksel)', () => {
    const steps = shrinkSteps('image/png', 2000, 2000)
    expect(area(steps[steps.length - 1]) * 4).toBeLessThan(MAX_ASSET_BYTES)
  })

  it('malutka grafika nie dostaje zerowego boku ani powtórzonych kroków', () => {
    const steps = shrinkSteps('image/png', 3, 1)
    for (const step of steps) expect(Math.min(step.width, step.height)).toBeGreaterThanOrEqual(1)
    expect(new Set(steps.map((step) => `${step.width}x${step.height}`)).size).toBe(steps.length)
  })
})

describe('firstWithin', () => {
  const steps = [{ width: 30, height: 30 }, { width: 20, height: 20 }, { width: 10, height: 10 }]
  const sized = (bytes: number) => new Blob([new Uint8Array(bytes)])

  it('zwraca pierwszy wynik mieszczący się w limicie i dalej nie koduje', async () => {
    const tried: number[] = []
    const blob = await firstWithin(steps, async (step) => {
      tried.push(step.width)
      return sized(step.width * 10)
    }, 200)
    expect(blob?.size).toBe(200)
    expect(tried).toEqual([30, 20])
  })

  it('nic się nie mieści → null po wszystkich krokach', async () => {
    const tried: number[] = []
    const blob = await firstWithin(steps, async (step) => {
      tried.push(step.width)
      return sized(500)
    }, 499)
    expect(blob).toBeNull()
    expect(tried).toEqual([30, 20, 10])
  })
})

describe('importErrorMessage', () => {
  it('typowany błąd: jego własny komunikat', () => {
    expect(importErrorMessage(new ImageImportError('tooLarge', 'Za duży'), 'a.png')).toBe('Za duży')
  })

  it('każdy inny błąd: ogólny komunikat z nazwą pliku', () => {
    expect(importErrorMessage(new Error('InvalidStateError'), 'zdjęcie.jpg')).toBe('Nie udało się wczytać pliku „zdjęcie.jpg". Spróbuj ponownie albo wybierz inny plik.')
    expect(importErrorMessage(undefined, 'x.png')).toContain('x.png')
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

  it('SVG ponad limit kubełka → odrzucony z komunikatem o limicie', async () => {
    const file = new File([new Uint8Array(MAX_ASSET_BYTES + 1)], 'wielkie.svg', { type: 'image/svg+xml' })
    const error = await prepareImage(file).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(ImageImportError)
    expect((error as ImageImportError).reason).toBe('tooLarge')
    expect((error as ImageImportError).message).toBe('Plik „wielkie.svg" jest za duży. Limit to 5 MB.')
  })

  it('SVG dokładnie w limicie przechodzi', async () => {
    const file = new File([new Uint8Array(MAX_ASSET_BYTES)], 'duze.svg', { type: 'image/svg+xml' })
    expect(await prepareImage(file)).toBe(file)
  })
})
