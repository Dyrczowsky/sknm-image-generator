import { describe, expect, it } from 'vitest'
import {
  EMPTY_FORM,
  addGraphics,
  addListItem,
  addPhoto,
  formFromRow,
  moveGraphic,
  removeGraphic,
  removeListItem,
  removePhoto,
  replacePhoto,
  setField,
  setFieldVisible,
  setListItemField,
  setPhotoPosition,
  setScaleLinked,
  setTextScale,
  setTitleScale,
  textFieldsOf,
} from './formState'
import { MAX_GRAPHICS } from '../posters/theme'

const withGraphics = (...graphics: string[]) => ({ ...EMPTY_FORM, graphics })

describe('formFromRow', () => {
  it('bierze pola tekstowe z wiersza, NULL i brak kolumny → pusty tekst, reszta domyślna', () => {
    const form = formFromRow({ title: 'Tytuł', speaker: null, event_date: '2031-03-04' })
    expect(form).toEqual({ ...EMPTY_FORM, title: 'Tytuł', event_date: '2031-03-04' })
  })

  it('textFieldsOf pomija kolumny spoza pól tekstowych', () => {
    const row = { title: 'T', id: 7, color_scheme: 'czern' } as Parameters<typeof textFieldsOf>[0]
    expect(textFieldsOf(row)).toEqual({ title: 'T', subtitle: '', speaker: '', event_date: '', event_time: '', location: '', badge: '', badge2: '', body: '' })
  })
})

describe('pola tekstowe i widoczność', () => {
  it('setField ustawia jedno pole i nie mutuje wejścia', () => {
    const next = setField('title', 'Nowy')(EMPTY_FORM)
    expect(next.title).toBe('Nowy')
    expect(EMPTY_FORM.title).toBe('')
  })

  it('ukryte pole to `false`, widoczne to brak klucza', () => {
    const hidden = setFieldVisible('location', false)(EMPTY_FORM)
    expect(hidden.visibility).toEqual({ location: false })
    expect(setFieldVisible('location', true)(hidden).visibility).toEqual({})
  })
})

describe('grafiki stopki', () => {
  it('addGraphics dokleja i przycina do MAX_GRAPHICS', () => {
    const many = Array.from({ length: MAX_GRAPHICS + 2 }, (_, i) => `g${i}`)
    expect(addGraphics(many)(withGraphics('a')).graphics).toEqual(['a', ...many].slice(0, MAX_GRAPHICS))
  })

  it('removeGraphic usuwa wskazaną pozycję', () => {
    expect(removeGraphic(1)(withGraphics('a', 'b', 'c')).graphics).toEqual(['a', 'c'])
  })

  it('moveGraphic zamienia z sąsiadem, a na krawędzi listy oddaje ten sam obiekt', () => {
    const form = withGraphics('a', 'b', 'c')
    expect(moveGraphic(0, 1)(form).graphics).toEqual(['b', 'a', 'c'])
    expect(moveGraphic(2, -1)(form).graphics).toEqual(['a', 'c', 'b'])
    expect(moveGraphic(0, -1)(form)).toBe(form)
    expect(moveGraphic(2, 1)(form)).toBe(form)
  })
})

describe('galeria zdjęć', () => {
  const one = addPhoto('photo', 'p1')(EMPTY_FORM)

  it('addPhoto dokłada zdjęcie z kadrem na środku', () => {
    expect(one.photos.photo).toEqual([{ src: 'p1', x: 50, y: 50 }])
  })

  it('setPhotoPosition zmienia tylko podaną oś, replacePhoto zachowuje kadr', () => {
    const moved = setPhotoPosition('photo', 0, { x: 10 })(one)
    expect(moved.photos.photo).toEqual([{ src: 'p1', x: 10, y: 50 }])
    expect(replacePhoto('photo', 0, 'p2')(moved).photos.photo).toEqual([{ src: 'p2', x: 10, y: 50 }])
  })

  it('removePhoto usuwa wpis', () => {
    expect(removePhoto('photo', 0)(one).photos.photo).toEqual([])
  })
})

describe('listy', () => {
  it('dodaje pusty wpis, ustawia jego pole i usuwa go', () => {
    const added = addListItem('agenda')(EMPTY_FORM)
    expect(added.lists.agenda).toEqual([{}])
    const filled = setListItemField('agenda', 0, 'time', '10:00')(added)
    expect(filled.lists.agenda).toEqual([{ time: '10:00' }])
    expect(removeListItem('agenda', 0)(filled).lists.agenda).toEqual([])
  })
})

describe('suwaki rozmiaru', () => {
  it('spięte: każdy suwak ustawia oba', () => {
    expect(setTitleScale(1.2)(EMPTY_FORM)).toMatchObject({ titleScale: 1.2, textScale: 1.2 })
    expect(setTextScale(0.8)(EMPTY_FORM)).toMatchObject({ titleScale: 0.8, textScale: 0.8 })
  })

  it('rozpięte: suwaki są niezależne', () => {
    const loose = setScaleLinked(false)(EMPTY_FORM)
    expect(setTitleScale(1.2)(loose)).toMatchObject({ titleScale: 1.2, textScale: 1 })
    expect(setTextScale(0.8)(loose)).toMatchObject({ titleScale: 1, textScale: 0.8 })
  })

  it('zapięcie spinacza równa tekst do tytułu', () => {
    const apart = { ...EMPTY_FORM, scaleLinked: false, titleScale: 1.3, textScale: 0.7 }
    expect(setScaleLinked(true)(apart)).toMatchObject({ scaleLinked: true, titleScale: 1.3, textScale: 1.3 })
    expect(setScaleLinked(false)({ ...apart, scaleLinked: true })).toMatchObject({ titleScale: 1.3, textScale: 0.7 })
  })
})
