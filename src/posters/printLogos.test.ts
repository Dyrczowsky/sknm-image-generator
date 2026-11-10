import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { posterRegistry } from './registry'
import { PosterShapeContext } from './shape'
import type { PosterShape } from '../types'
import { LOGO_CLEAR, LOGO_HEIGHT, LOGO_MAX_HEIGHT, PRINT_LOGO_SCALE, logoSizing } from './theme'

// Wysokości grafik logo (img alt="Logo") w statycznym renderze plakatu.
function logoHeights(key: string, shape: PosterShape): number[] {
  const html = renderToStaticMarkup(
    createElement(PosterShapeContext.Provider, { value: shape }, createElement(posterRegistry[key].Component, { data: {} })),
  )
  return [...html.matchAll(/<img[^>]*alt="Logo"[^>]*>/g)].map((m) => Number(/height:([\d.]+)px/.exec(m[0])?.[1]))
}

describe('logotypy w druku', () => {
  it('logoSizing: druk ×1,5, pole ochronne rośnie razem z logo', () => {
    expect(logoSizing(false)).toMatchObject({ height: LOGO_HEIGHT, clear: LOGO_CLEAR })
    expect(logoSizing(true)).toMatchObject({ height: LOGO_HEIGHT * PRINT_LOGO_SCALE, clear: Math.round(LOGO_CLEAR * PRINT_LOGO_SCALE) })
  })

  // Jednolita stopka: logo ma wysokość pasa stopki w każdym szablonie,
  // niezależnie od treści lewego rogu (wielka data, etykieta, sam adres...).
  for (const key of Object.keys(posterRegistry)) {
    it(`${key}: logo PK na wysokość pasa stopki - jak w każdym innym szablonie`, () => {
      for (const shape of ['square', 'story'] as const) {
        if (shape === 'story' && !posterRegistry[key].storyShape) continue
        expect(logoHeights(key, shape)).toEqual([LOGO_MAX_HEIGHT])
      }
      for (const shape of ['portrait', 'landscape'] as const) {
        expect(logoHeights(key, shape)).toEqual([LOGO_MAX_HEIGHT * PRINT_LOGO_SCALE])
      }
    })
  }
})
