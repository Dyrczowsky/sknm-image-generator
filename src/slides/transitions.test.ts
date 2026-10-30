import { describe, expect, it } from 'vitest'
import { clampDuration, effectiveTransition, TRANSITIONS, transitionFrames } from './transitions'
import { MAX_DURATION, MIN_DURATION, TRANSITION_KEYS } from './types'

const ALLOWED = new Set(['opacity', 'transform', 'clipPath', 'filter', 'offset', 'easing'])
const DIRECTIONAL = ['wypchniecie', 'wsuniecie', 'odsloniecie', 'wymazanie', 'obrot'] as const

describe('TRANSITIONS', () => {
  it('każdy klucz ma etykietę i opis', () => {
    for (const key of TRANSITION_KEYS) {
      expect(TRANSITIONS[key].label.length).toBeGreaterThan(0)
      expect(TRANSITIONS[key].description.length).toBeGreaterThan(0)
    }
  })
})

describe('transitionFrames', () => {
  for (const key of TRANSITION_KEYS) {
    for (const dir of [1, -1] as const) {
      describe(`${key} (${dir})`, () => {
        const frames = transitionFrames(key, dir)

        it('używa tylko dozwolonych właściwości', () => {
          for (const frame of [...frames.enter, ...frames.exit]) {
            for (const prop of Object.keys(frame)) expect(ALLOWED.has(prop)).toBe(true)
          }
        })

        it('wielokąty mają stałą liczbę punktów', () => {
          for (const list of [frames.enter, frames.exit]) {
            const counts = list
              .filter((f) => typeof f.clipPath === 'string' && f.clipPath.startsWith('polygon('))
              .map((f) => (f.clipPath as string).split(',').length)
            expect(new Set(counts).size).toBeLessThanOrEqual(1)
          }
        })

        it('daje się zserializować do JSON', () => {
          expect(JSON.parse(JSON.stringify(frames))).toEqual(frames)
        })
      })
    }
  }

  it('przejścia kierunkowe różnią się między kierunkami', () => {
    for (const key of DIRECTIONAL) {
      expect(transitionFrames(key, 1)).not.toEqual(transitionFrames(key, -1))
    }
  })

  it('brak nie animuje, przenikanie nakłada nowy slajd', () => {
    expect(transitionFrames('brak', 1).enter).toEqual([])
    expect(transitionFrames('przenikanie', 1).enterOnTop).toBe(true)
    expect(transitionFrames('odsloniecie', 1).enterOnTop).toBe(false)
    expect(transitionFrames('obrot', 1).easing).toBe('ease-in-out')
  })
})

describe('clampDuration', () => {
  it('ogranicza do zakresu', () => {
    expect(clampDuration(0)).toBe(MIN_DURATION)
    expect(clampDuration(99999)).toBe(MAX_DURATION)
    expect(clampDuration(650)).toBe(650)
    expect(clampDuration(Number.NaN)).toBe(MIN_DURATION)
  })
})

describe('effectiveTransition', () => {
  it('bez ograniczenia ruchu zostawia przejście', () => {
    expect(effectiveTransition('obrot', false)).toEqual({ key: 'obrot', durationScale: 1 })
  })

  it('przy ograniczeniu ruchu zamienia na krótkie przenikanie', () => {
    expect(effectiveTransition('obrot', true)).toEqual({ key: 'przenikanie', durationScale: 0.25 })
    expect(effectiveTransition('brak', true)).toEqual({ key: 'brak', durationScale: 1 })
  })
})
