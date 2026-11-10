import { describe, expect, it } from 'vitest'
import { posterRegistry } from '../posters/registry'
import { schemesFor } from '../posters/schemes'
import { buildCatalog } from './catalog'

const { templates } = buildCatalog()
const keys = (pred: (t: (typeof templates)[number]) => boolean) => templates.filter(pred).map((t) => t.key)

describe('buildCatalog', () => {
  it('zawiera layouty rejestru bez warsztatBezZdjecia', () => {
    expect(templates.map((t) => t.key)).toEqual(Object.keys(posterRegistry).filter((k) => k !== 'warsztatBezZdjecia'))
  })

  it('każdy szablon ma opis, pola i domyślny schemat', () => {
    for (const t of templates) {
      expect(t.useFor, t.key).not.toBe('')
      expect(t.fields.length, t.key).toBeGreaterThan(0)
      expect(t.schemes[0].name, t.key).toBe(schemesFor(t.key)[0])
    }
  })

  it('zdjęcia, listy i story tylko tam, gdzie trzeba', () => {
    expect(keys((t) => t.photo !== null).sort()).toEqual(['ciekawostka', 'data', 'gosc', 'warsztat'])
    expect(keys((t) => t.lists !== null)).toEqual(['konferencja'])
    expect(keys((t) => t.storyShape)).toEqual(['ciekawostka'])
  })

  it('katalog zgadza się z plikiem api/src/templates.json', async () => {
    await expect(JSON.stringify(buildCatalog(), null, 2) + '\n').toMatchFileSnapshot('../../api/src/templates.json')
  })
})
