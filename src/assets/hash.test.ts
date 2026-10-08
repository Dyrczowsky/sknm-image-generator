import { describe, expect, it } from 'vitest'
import { isAssetRef, mimeOfRef, refFor } from './hash'

// SHA-256 z bajtów "abc" (wektor testowy z FIPS 180-2).
const ABC = new Uint8Array([0x61, 0x62, 0x63])
const ABC_SHA = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'

describe('refFor', () => {
  it('skrót treści + rozszerzenie z typu MIME', async () => {
    expect(await refFor(ABC, 'image/png')).toBe(`${ABC_SHA}.png`)
    expect(await refFor(ABC, 'image/jpeg')).toBe(`${ABC_SHA}.jpg`)
    expect(await refFor(ABC, 'image/svg+xml')).toBe(`${ABC_SHA}.svg`)
  })

  it('przyjmuje też ArrayBuffer i wycinek większego bufora', async () => {
    expect(await refFor(ABC.buffer, 'image/png')).toBe(`${ABC_SHA}.png`)
    const padded = new Uint8Array([0, 0x61, 0x62, 0x63, 0])
    expect(await refFor(padded.subarray(1, 4), 'image/png')).toBe(`${ABC_SHA}.png`)
  })

  it('nieobsługiwany typ → wyjątek', async () => {
    await expect(refFor(ABC, 'image/gif')).rejects.toThrow('image/gif')
  })
})

describe('isAssetRef', () => {
  it('przyjmuje tylko 64 małe znaki szesnastkowe i znane rozszerzenie', () => {
    expect(isAssetRef(`${ABC_SHA}.png`)).toBe(true)
    expect(isAssetRef(`${ABC_SHA}.jpg`)).toBe(true)
    expect(isAssetRef(`${ABC_SHA}.svg`)).toBe(true)
    expect(isAssetRef(`${ABC_SHA}.gif`)).toBe(false)
    expect(isAssetRef(`${ABC_SHA.toUpperCase()}.png`)).toBe(false)
    expect(isAssetRef(`${ABC_SHA.slice(1)}.png`)).toBe(false)
    expect(isAssetRef(`folder/${ABC_SHA}.png`)).toBe(false)
    expect(isAssetRef('data:image/png;base64,AAAA')).toBe(false)
    expect(isAssetRef('')).toBe(false)
  })
})

describe('mimeOfRef', () => {
  it('typ MIME z rozszerzenia', () => {
    expect(mimeOfRef(`${ABC_SHA}.jpg`)).toBe('image/jpeg')
    expect(mimeOfRef(`${ABC_SHA}.png`)).toBe('image/png')
    expect(mimeOfRef(`${ABC_SHA}.svg`)).toBe('image/svg+xml')
  })

  it('zła nazwa → wyjątek', () => {
    expect(() => mimeOfRef('zdjecie.png')).toThrow('zdjecie.png')
  })
})
