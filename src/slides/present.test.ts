import { describe, expect, it } from 'vitest'
import type { Deck, Slide } from './types'
import { direction, first, goto, isAtEnd, isAtStart, last, next, prev, stepsForDeck } from './present'

// Slajd z podanym układem i flagą pokazu po kolei; reszta pól bez znaczenia dla nawigacji.
function slide(layout: string, reveal: boolean): Slide {
  return { id: layout, layout, data: {}, background: 'jasne', mirrored: false, reveal }
}

describe('next', () => {
  it('przechodzi przez wszystkie pozycje w przód i zatrzymuje się na końcu', () => {
    const steps = [0, 2, 0]
    const visited = [first()]
    let pos = first()
    for (let i = 0; i < 10; i++) {
      pos = next(pos, steps)
      visited.push(pos)
    }
    expect(visited).toEqual([
      { slide: 0, step: 0 },
      { slide: 1, step: 0 },
      { slide: 1, step: 1 },
      { slide: 1, step: 2 },
      { slide: 2, step: 0 },
      { slide: 2, step: 0 },
      { slide: 2, step: 0 },
      { slide: 2, step: 0 },
      { slide: 2, step: 0 },
      { slide: 2, step: 0 },
      { slide: 2, step: 0 },
    ])
  })

  it('na końcu pokazu zwraca tę samą pozycję', () => {
    expect(next({ slide: 1, step: 3 }, [0, 3])).toEqual({ slide: 1, step: 3 })
  })
})

describe('prev', () => {
  it('przechodzi przez wszystkie pozycje wstecz do początku', () => {
    const steps = [0, 2, 0]
    const visited = [{ slide: 2, step: 0 }]
    let pos: { slide: number; step: number } = { slide: 2, step: 0 }
    for (let i = 0; i < 6; i++) {
      pos = prev(pos, steps)
      visited.push(pos)
    }
    expect(visited).toEqual([
      { slide: 2, step: 0 },
      { slide: 1, step: 2 },
      { slide: 1, step: 1 },
      { slide: 1, step: 0 },
      { slide: 0, step: 0 },
      { slide: 0, step: 0 },
      { slide: 0, step: 0 },
    ])
  })

  it('cofając na poprzedni slajd, ustawia go w pełni odsłonięty', () => {
    expect(prev({ slide: 2, step: 0 }, [4, 1, 0])).toEqual({ slide: 1, step: 1 })
  })

  it('na początku pokazu zwraca tę samą pozycję', () => {
    expect(prev({ slide: 0, step: 0 }, [2, 2])).toEqual({ slide: 0, step: 0 })
  })
})

describe('first i last', () => {
  it('first zawsze wskazuje początek', () => {
    expect(first()).toEqual({ slide: 0, step: 0 })
  })

  it('last ustawia ostatni slajd w pełni odsłonięty', () => {
    expect(last([0, 2, 3])).toEqual({ slide: 2, step: 3 })
    expect(last([1, 0])).toEqual({ slide: 1, step: 0 })
  })
})

describe('goto', () => {
  it('skacze na slajd z krokiem 0', () => {
    expect(goto(1, [0, 2, 0])).toEqual({ slide: 1, step: 0 })
  })

  it('ucina indeks do zakresu slajdów', () => {
    expect(goto(-5, [0, 2, 0])).toEqual({ slide: 0, step: 0 })
    expect(goto(99, [0, 2, 0])).toEqual({ slide: 2, step: 0 })
  })
})

describe('isAtEnd i isAtStart', () => {
  const steps = [0, 2, 1]

  it('isAtEnd dopiero po odsłonięciu wszystkiego na ostatnim slajdzie', () => {
    expect(isAtEnd({ slide: 2, step: 0 }, steps)).toBe(false)
    expect(isAtEnd({ slide: 2, step: 1 }, steps)).toBe(true)
    expect(isAtEnd({ slide: 1, step: 2 }, steps)).toBe(false)
  })

  it('isAtStart tylko dla pozycji {0,0}', () => {
    expect(isAtStart({ slide: 0, step: 0 })).toBe(true)
    expect(isAtStart({ slide: 0, step: 1 })).toBe(false)
    expect(isAtStart({ slide: 1, step: 0 })).toBe(false)
  })
})

describe('direction', () => {
  it('zwraca 1 przy przejściu do przodu, -1 wstecz, 0 na tym samym slajdzie', () => {
    expect(direction({ slide: 0, step: 0 }, { slide: 1, step: 0 })).toBe(1)
    expect(direction({ slide: 2, step: 0 }, { slide: 1, step: 2 })).toBe(-1)
    expect(direction({ slide: 1, step: 0 }, { slide: 1, step: 2 })).toBe(0)
  })
})

describe('pusta prezentacja', () => {
  const empty: number[] = []

  it('każda funkcja zwraca {0,0}', () => {
    expect(first()).toEqual({ slide: 0, step: 0 })
    expect(next({ slide: 0, step: 0 }, empty)).toEqual({ slide: 0, step: 0 })
    expect(prev({ slide: 0, step: 0 }, empty)).toEqual({ slide: 0, step: 0 })
    expect(last(empty)).toEqual({ slide: 0, step: 0 })
    expect(goto(3, empty)).toEqual({ slide: 0, step: 0 })
  })

  it('isAtEnd jest true, isAtStart true', () => {
    expect(isAtEnd({ slide: 0, step: 0 }, empty)).toBe(true)
    expect(isAtStart({ slide: 0, step: 0 })).toBe(true)
  })

  it('direction między takimi pozycjami to 0', () => {
    expect(direction({ slide: 0, step: 0 }, { slide: 0, step: 0 })).toBe(0)
  })
})

describe('stepsForDeck', () => {
  function deckOf(slides: Slide[]): Pick<Deck, 'slides'> {
    return { slides }
  }

  it('slajdy Cytat nie mają kroków', () => {
    expect(stepsForDeck(deckOf([slide('cytat', true), slide('cytat', true)]))).toEqual([0, 0])
  })

  it('nieznany układ daje 0 kroków', () => {
    expect(stepsForDeck(deckOf([slide('nieistniejacy', true)]))).toEqual([0])
  })

  it('slajd bez pokazu po kolei ma 0 kroków', () => {
    expect(stepsForDeck(deckOf([slide('cytat', false), slide('nieistniejacy', false)]))).toEqual([0, 0])
  })

  it('pusta prezentacja daje pustą listę', () => {
    expect(stepsForDeck(deckOf([]))).toEqual([])
  })
})
