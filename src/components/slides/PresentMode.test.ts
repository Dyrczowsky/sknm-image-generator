import { describe, expect, it } from 'vitest'
import { announce, clickAction, fitWidth, keyAction, swipeAction } from './PresentMode'

describe('keyAction', () => {
  it('dalej: strzałki w prawo/dół, PageDown, spacja, Enter, N', () => {
    for (const key of ['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter', 'n', 'N']) {
      expect(keyAction(key)).toBe('next')
    }
  })

  it('wstecz: strzałki w lewo/górę, PageUp, Backspace, P', () => {
    for (const key of ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace', 'p', 'P']) {
      expect(keyAction(key)).toBe('prev')
    }
  })

  it('Home/End, Esc, wygaszanie i cyfry', () => {
    expect(keyAction('Home')).toBe('first')
    expect(keyAction('End')).toBe('last')
    expect(keyAction('Escape')).toBe('exit')
    for (const key of ['b', 'B', '.']) expect(keyAction(key)).toBe('black')
    for (const key of ['w', 'W', ',']) expect(keyAction(key)).toBe('white')
    for (const key of ['0', '5', '9']) expect(keyAction(key)).toBe('digit')
  })

  it('inne klawisze nic nie robią', () => {
    for (const key of ['a', 'Tab', 'Shift', 'F5', '10', '']) expect(keyAction(key)).toBeNull()
  })
})

describe('fitWidth', () => {
  it('16:9 w szerszym oknie - ogranicza wysokość', () => {
    expect(fitWidth({ width: 2000, height: 900 }, '16:9')).toBe(1600)
  })

  it('16:9 w węższym oknie - ogranicza szerokość', () => {
    expect(fitWidth({ width: 1000, height: 1000 }, '16:9')).toBe(1000)
  })

  it('1:1 w oknie poziomym bierze wysokość', () => {
    expect(fitWidth({ width: 1920, height: 1080 }, '1:1')).toBe(1080)
  })

  it('zaokrągla w dół i nie zwraca wartości ujemnych', () => {
    expect(fitWidth({ width: 1000, height: 333 }, '16:9')).toBe(592)
    expect(fitWidth({ width: 0, height: 0 }, '16:9')).toBe(0)
    expect(fitWidth({ width: -5, height: 100 }, '1:1')).toBe(0)
  })
})

describe('swipeAction', () => {
  it('w lewo = dalej, w prawo = wstecz', () => {
    expect(swipeAction(-80)).toBe('next')
    expect(swipeAction(80)).toBe('prev')
  })

  it('krótki ruch to nie gest', () => {
    expect(swipeAction(40)).toBeNull()
    expect(swipeAction(-40)).toBeNull()
    expect(swipeAction(0)).toBeNull()
  })

  it('ruch głównie pionowy jest ignorowany', () => {
    expect(swipeAction(-60, 120)).toBeNull()
    expect(swipeAction(-120, 60)).toBe('next')
  })
})

describe('clickAction', () => {
  it('lewe 30% cofa, reszta idzie dalej', () => {
    expect(clickAction(0, 1000)).toBe('prev')
    expect(clickAction(299, 1000)).toBe('prev')
    expect(clickAction(300, 1000)).toBe('next')
    expect(clickAction(999, 1000)).toBe('next')
  })
})

describe('announce', () => {
  it('numeruje od 1', () => {
    expect(announce(2, 11)).toBe('Slajd 3 z 11')
  })
})
