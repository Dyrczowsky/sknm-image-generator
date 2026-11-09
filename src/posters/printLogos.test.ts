import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { posterRegistry } from './registry'
import { PosterShapeContext } from './shape'
import type { PosterShape } from '../types'
import { LOGO_CLEAR, LOGO_HEIGHT, PRINT_LOGO_SCALE, logoSizing } from './theme'

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

  for (const key of Object.keys(posterRegistry)) {
    it(`${key}: logo PK większe w pionie i poziomie (druk), bez zmian w kwadracie i Story`, () => {
      for (const shape of ['square', 'story'] as const) {
        if (shape === 'story' && !posterRegistry[key].storyShape) continue
        for (const h of logoHeights(key, shape)) expect(h).toBeGreaterThanOrEqual(LOGO_HEIGHT)
        for (const h of logoHeights(key, shape)) expect(h).toBeLessThan(LOGO_HEIGHT * PRINT_LOGO_SCALE)
      }
      for (const shape of ['portrait', 'landscape'] as const) {
        const heights = logoHeights(key, shape)
        expect(heights.length).toBeGreaterThan(0)
        for (const h of heights) expect(h).toBeGreaterThanOrEqual(LOGO_HEIGHT * PRINT_LOGO_SCALE)
      }
    })
  }
})
