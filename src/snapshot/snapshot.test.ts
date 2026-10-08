import { describe, expect, it } from 'vitest'
import {
  SNAPSHOT_VERSION,
  assetRefsOf,
  fromSnapshot,
  isBlank,
  parseSnapshot,
  snapshotFromLegacyDraft,
  snapshotFromLegacyHistory,
  toSnapshot,
} from './snapshot'
import type { EditorSnapshot, EditorState, SnapshotForm } from './snapshot'
import { EMPTY_FORM } from '../editor/formState'
import { DEFAULT_EXPORT_SETTINGS } from '../posters/formats'
import type { ExportSettings } from '../posters/formats'
import { MAX_GRAPHICS } from '../posters/theme'
import { FORM_TEXT_FIELDS } from '../types'
import type { DraftRow, FormValues, HistoryEntry } from '../types'

const LAYOUTS = ['wyklad', 'warsztat', 'gosc']

// Rejestr grafik na potrzeby testów: data URL <-> ref.
const IMAGES: Record<string, string> = {
  'data:image/png;base64,LOGO1': 'aaa1.png',
  'data:image/svg+xml;base64,LOGO2': 'aaa2.svg',
  'data:image/jpeg;base64,FOTO1': 'bbb1.jpg',
  'data:image/jpeg;base64,FOTO2': 'bbb2.jpg',
}
const [LOGO1, LOGO2, FOTO1, FOTO2] = Object.keys(IMAGES)
const refOf = (dataUrl: string): string | undefined => IMAGES[dataUrl]
const srcOf = (ref: string): string | undefined => Object.keys(IMAGES).find((dataUrl) => IMAGES[dataUrl] === ref)

// Każde pole różni się od wartości domyślnej - inaczej test obiegu nie
// odróżniłby „przetrwało" od „wróciło do domyślnej".
const FULL_FORM: FormValues = {
  title: 'Tytuł',
  subtitle: 'Podtytuł',
  speaker: 'dr Anna Nowak',
  event_date: '2031-03-04',
  event_time: '18:15',
  location: 'Sala 113',
  badge: 'Wstęp wolny',
  badge2: 'Zapisy',
  body: 'Dłuższy akapit\nw dwóch liniach.',
  visibility: { subtitle: false, badge2: false },
  graphics: [LOGO2, LOGO1],
  showPkLogo: false,
  qrUrl: 'https://example.org/zapisy',
  photos: {
    photo: [
      { src: FOTO1, x: 12, y: 88 },
      { src: FOTO2, x: 0, y: 100 },
    ],
    guest: [{ src: FOTO1, x: 33.5, y: 50 }],
  },
  lists: {
    agenda: [{ time: '10:00', label: 'Otwarcie' }, {}, { time: '11:30' }],
    sponsors: [{ name: 'ACME' }],
  },
  titleScale: 1.25,
  textScale: 0.8,
  scaleLinked: false,
}

const FULL_EXPORT: ExportSettings = { medium: 'banner', format: 'fbEvent', orientation: 'landscape', fileType: 'pdf' }

const FULL_STATE: EditorState = {
  posterKey: 'gosc',
  colorScheme: 'czern~zloty',
  lang: 'en',
  exportSettings: FULL_EXPORT,
  form: FULL_FORM,
}

const EMPTY_STATE: EditorState = {
  posterKey: 'wyklad',
  colorScheme: null,
  lang: 'pl',
  exportSettings: DEFAULT_EXPORT_SETTINGS,
  form: EMPTY_FORM,
}

const EMPTY_SNAPSHOT_FORM: SnapshotForm = { ...EMPTY_FORM, graphics: [], photos: {} }

const DEFAULT_SNAPSHOT: EditorSnapshot = {
  v: 1,
  poster_key: 'wyklad',
  color_scheme: null,
  lang: 'pl',
  export: DEFAULT_EXPORT_SETTINGS,
  form: EMPTY_SNAPSHOT_FORM,
}

// Snapshot tak, jak wraca z bazy: po serializacji do JSON.
const viaJson = (snapshot: EditorSnapshot): unknown => JSON.parse(JSON.stringify(snapshot))

function parsed(raw: unknown, layouts: readonly string[] = LAYOUTS): EditorSnapshot {
  const result = parseSnapshot(raw, layouts)
  if (!result.ok) throw new Error(`parseSnapshot: ${result.reason}`)
  return result.snapshot
}

const roundTrip = (state: EditorState) => fromSnapshot(parsed(viaJson(toSnapshot(state, refOf))), srcOf)

// Poprawny surowy snapshot z podmienionym fragmentem formularza.
const rawWithForm = (form: Record<string, unknown>): unknown => ({ ...(viaJson(toSnapshot(FULL_STATE, refOf)) as object), form })
const fullRawForm = (): Record<string, unknown> => (viaJson(toSnapshot(FULL_STATE, refOf)) as { form: Record<string, unknown> }).form

describe('obieg: toSnapshot → JSON → parseSnapshot → fromSnapshot', () => {
  it('zachowuje każde pole formularza, wszystkie ustawienia eksportu, szablon, kolory i język', () => {
    expect(roundTrip(FULL_STATE)).toEqual({ ...FULL_STATE, missing: [] })
  })

  it('pusty edytor wraca jako pusty edytor', () => {
    expect(roundTrip(EMPTY_STATE)).toEqual({ ...EMPTY_STATE, missing: [] })
  })

  it('wzorzec testowy pokrywa KAŻDY klucz EMPTY_FORM wartością inną niż domyślna', () => {
    // Nowe pole w EMPTY_FORM musi trafić do FULL_FORM (inaczej ten test pada),
    // a wtedy test obiegu wyżej wymusza dopisanie go do snapshotu.
    expect(Object.keys(FULL_FORM).sort()).toEqual(Object.keys(EMPTY_FORM).sort())
    for (const key of Object.keys(EMPTY_FORM) as (keyof FormValues)[]) {
      expect(FULL_FORM[key], key).not.toEqual(EMPTY_FORM[key])
    }
  })

  it('każdy klucz EMPTY_FORM z osobna przeżywa obieg', () => {
    const restored = roundTrip(FULL_STATE).form
    for (const key of Object.keys(EMPTY_FORM) as (keyof FormValues)[]) {
      expect(restored[key], key).toEqual(FULL_FORM[key])
    }
    expect(Object.keys(restored).sort()).toEqual(Object.keys(EMPTY_FORM).sort())
  })

  it('wzorzec testowy różni się od domyślnych we wszystkich czterech ustawieniach eksportu', () => {
    expect(Object.keys(FULL_EXPORT).sort()).toEqual(Object.keys(DEFAULT_EXPORT_SETTINGS).sort())
    for (const key of Object.keys(DEFAULT_EXPORT_SETTINGS) as (keyof ExportSettings)[]) {
      expect(FULL_EXPORT[key], key).not.toBe(DEFAULT_EXPORT_SETTINGS[key])
    }
    expect(roundTrip(FULL_STATE).exportSettings).toEqual(FULL_EXPORT)
  })

  it('parseSnapshot jest idempotentne', () => {
    const once = parsed(viaJson(toSnapshot(FULL_STATE, refOf)))
    expect(parsed(viaJson(once))).toEqual(once)
  })
})

describe('toSnapshot', () => {
  it('zamienia data URL-e na refy i zachowuje kolejność oraz kadry', () => {
    const snapshot = toSnapshot(FULL_STATE, refOf)
    expect(snapshot.v).toBe(SNAPSHOT_VERSION)
    expect(snapshot.poster_key).toBe('gosc')
    expect(snapshot.color_scheme).toBe('czern~zloty')
    expect(snapshot.lang).toBe('en')
    expect(snapshot.export).toEqual(FULL_EXPORT)
    expect(snapshot.form.graphics).toEqual(['aaa2.svg', 'aaa1.png'])
    expect(snapshot.form.photos).toEqual({
      photo: [
        { asset: 'bbb1.jpg', x: 12, y: 88 },
        { asset: 'bbb2.jpg', x: 0, y: 100 },
      ],
      guest: [{ asset: 'bbb1.jpg', x: 33.5, y: 50 }],
    })
  })

  it('zserializowany snapshot nigdy nie zawiera „data:"', () => {
    expect(JSON.stringify(toSnapshot(FULL_STATE, refOf))).not.toContain('data:')
  })

  it('grafika i zdjęcie bez refa wypadają - także z serializacji', () => {
    const state: EditorState = {
      ...FULL_STATE,
      form: {
        ...FULL_FORM,
        graphics: [LOGO1, 'data:image/png;base64,NIEZNANA', LOGO2],
        photos: { photo: [{ src: 'data:image/jpeg;base64,NIEZNANE', x: 1, y: 2 }, { src: FOTO2, x: 3, y: 4 }] },
      },
    }
    const snapshot = toSnapshot(state, refOf)
    expect(snapshot.form.graphics).toEqual(['aaa1.png', 'aaa2.svg'])
    expect(snapshot.form.photos).toEqual({ photo: [{ asset: 'bbb2.jpg', x: 3, y: 4 }] })
    expect(JSON.stringify(snapshot)).not.toContain('data:')
  })

  it('ref, który sam jest data URL-em, też nie trafia do snapshotu', () => {
    const snapshot = toSnapshot(FULL_STATE, (dataUrl) => dataUrl)
    expect(snapshot.form.graphics).toEqual([])
    expect(JSON.stringify(snapshot)).not.toContain('data:')
  })

  it('nie mutuje stanu edytora', () => {
    const before = JSON.stringify(FULL_STATE)
    toSnapshot(FULL_STATE, refOf)
    expect(JSON.stringify(FULL_STATE)).toBe(before)
  })
})

describe('fromSnapshot', () => {
  it('ref bez źródła wypada z formularza i trafia do `missing` (raz)', () => {
    const snapshot = toSnapshot(FULL_STATE, refOf)
    const state = fromSnapshot(snapshot, (ref) => (ref === 'bbb1.jpg' || ref === 'aaa2.svg' ? undefined : srcOf(ref)))
    expect(state.form.graphics).toEqual([LOGO1])
    expect(state.form.photos).toEqual({ photo: [{ src: FOTO2, x: 0, y: 100 }], guest: [] })
    expect(state.missing).toEqual(['aaa2.svg', 'bbb1.jpg'])
  })

  it('bez żadnych źródeł oddaje resztę formularza i pełną listę braków', () => {
    const state = fromSnapshot(toSnapshot(FULL_STATE, refOf), () => undefined)
    expect(state.form).toEqual({ ...FULL_FORM, graphics: [], photos: { photo: [], guest: [] } })
    expect([...state.missing].sort()).toEqual(['aaa1.png', 'aaa2.svg', 'bbb1.jpg', 'bbb2.jpg'])
    expect(state.exportSettings).toEqual(FULL_EXPORT)
    expect(state.posterKey).toBe('gosc')
  })
})

describe('parseSnapshot: odmowy', () => {
  it('nowsza wersja → newer (nawet gdy reszta jest nieczytelna)', () => {
    expect(parseSnapshot({ ...DEFAULT_SNAPSHOT, v: 2 }, LAYOUTS)).toEqual({ ok: false, reason: 'newer' })
    expect(parseSnapshot({ v: 7 }, LAYOUTS)).toEqual({ ok: false, reason: 'newer' })
    expect(parseSnapshot({ v: 3, poster_key: 'nieznany' }, LAYOUTS)).toEqual({ ok: false, reason: 'newer' })
  })

  it('nieznany layout → unknownLayout', () => {
    expect(parseSnapshot({ ...DEFAULT_SNAPSHOT, poster_key: 'hologram' }, LAYOUTS)).toEqual({ ok: false, reason: 'unknownLayout' })
    expect(parseSnapshot(DEFAULT_SNAPSHOT, [])).toEqual({ ok: false, reason: 'unknownLayout' })
  })

  it('nie obiekt → invalid', () => {
    for (const raw of [null, undefined, 'tekst', 5, true, [], [DEFAULT_SNAPSHOT]]) {
      expect(parseSnapshot(raw, LAYOUTS)).toEqual({ ok: false, reason: 'invalid' })
    }
  })

  it('brak albo zły typ `v` / `poster_key` → invalid', () => {
    const { v: _v, ...withoutVersion } = DEFAULT_SNAPSHOT
    const { poster_key: _key, ...withoutLayout } = DEFAULT_SNAPSHOT
    const broken: unknown[] = [
      {},
      withoutVersion,
      withoutLayout,
      { ...DEFAULT_SNAPSHOT, v: '1' },
      { ...DEFAULT_SNAPSHOT, v: 0 },
      { ...DEFAULT_SNAPSHOT, v: Number.NaN },
      { ...DEFAULT_SNAPSHOT, v: null },
      { ...DEFAULT_SNAPSHOT, poster_key: '' },
      { ...DEFAULT_SNAPSHOT, poster_key: 3 },
      { ...DEFAULT_SNAPSHOT, poster_key: null },
    ]
    for (const raw of broken) expect(parseSnapshot(raw, LAYOUTS), JSON.stringify(raw)).toEqual({ ok: false, reason: 'invalid' })
  })
})

describe('parseSnapshot: wartości domyślne', () => {
  it('samo `v` i `poster_key` → w pełni domyślny snapshot', () => {
    expect(parsed({ v: 1, poster_key: 'wyklad' })).toEqual(DEFAULT_SNAPSHOT)
  })

  it('`form` i `export` złego typu → domyślne', () => {
    for (const junk of [null, 'x', 4, [], true]) {
      expect(parsed({ v: 1, poster_key: 'wyklad', form: junk, export: junk })).toEqual(DEFAULT_SNAPSHOT)
    }
  })

  it('każde brakujące pole formularza z osobna wraca do EMPTY_FORM, reszta zostaje', () => {
    const full = parsed(viaJson(toSnapshot(FULL_STATE, refOf))).form
    for (const key of Object.keys(EMPTY_SNAPSHOT_FORM) as (keyof SnapshotForm)[]) {
      const { [key]: _dropped, ...rest } = fullRawForm()
      expect(parsed(rawWithForm(rest)).form, key).toEqual({ ...full, [key]: EMPTY_SNAPSHOT_FORM[key] })
    }
  })

  it('każde pole formularza z osobna, wypełnione śmieciem złego typu, wraca do EMPTY_FORM', () => {
    const full = parsed(viaJson(toSnapshot(FULL_STATE, refOf))).form
    // Śmieć dobrany tak, żeby dla każdego pola był złym typem.
    const junkFor = (key: keyof SnapshotForm): unknown[] => {
      const expected = EMPTY_SNAPSHOT_FORM[key]
      if (typeof expected === 'string') return [null, 12, true, {}, ['a']]
      if (typeof expected === 'number') return [null, '1.2', true, {}, [], Number.NaN, Number.POSITIVE_INFINITY]
      if (typeof expected === 'boolean') return [null, 'true', 1, 0, {}, []]
      if (Array.isArray(expected)) return [null, 'aaa1.png', 3, true, { 0: 'aaa1.png' }]
      return [null, 'x', 3, true, ['a']]
    }
    for (const key of Object.keys(EMPTY_SNAPSHOT_FORM) as (keyof SnapshotForm)[]) {
      for (const junk of junkFor(key)) {
        const form = parsed(rawWithForm({ ...fullRawForm(), [key]: junk })).form
        expect(form, `${key} = ${JSON.stringify(junk)}`).toEqual({ ...full, [key]: EMPTY_SNAPSHOT_FORM[key] })
      }
    }
  })

  it('nieznane klucze są pomijane', () => {
    const snapshot = parsed({ ...DEFAULT_SNAPSHOT, bonus: 1, form: { ...EMPTY_SNAPSHOT_FORM, bonus: 'x' } })
    expect(snapshot).toEqual(DEFAULT_SNAPSHOT)
  })

  it('color_scheme: tekst zostaje, wszystko inne → null', () => {
    expect(parsed({ ...DEFAULT_SNAPSHOT, color_scheme: 'granat~zolty' }).color_scheme).toBe('granat~zolty')
    for (const junk of [undefined, null, '', 5, {}, []]) {
      expect(parsed({ ...DEFAULT_SNAPSHOT, color_scheme: junk }).color_scheme).toBeNull()
    }
  })

  it('lang: tylko „en" i „pl", reszta → „pl"', () => {
    expect(parsed({ ...DEFAULT_SNAPSHOT, lang: 'en' }).lang).toBe('en')
    for (const junk of [undefined, null, 'de', 'EN', 1, {}]) {
      expect(parsed({ ...DEFAULT_SNAPSHOT, lang: junk }).lang).toBe('pl')
    }
  })
})

describe('parseSnapshot: ustawienia eksportu', () => {
  const exportOf = (settings: unknown) => parsed({ ...DEFAULT_SNAPSHOT, export: settings }).export

  it('nieznany format „a9" → domyślny format swojej zakładki', () => {
    expect(exportOf({ medium: 'social', format: 'a9', orientation: 'landscape', fileType: 'pdf' })).toEqual({
      medium: 'social',
      format: 'square',
      orientation: 'landscape',
      fileType: 'pdf',
    })
    expect(exportOf({ medium: 'banner', format: 'a9' })).toMatchObject({ medium: 'banner', format: 'fbCover' })
  })

  it('format banera wymusza zakładkę „banner"', () => {
    expect(exportOf({ medium: 'social', format: 'fbCover' })).toMatchObject({ medium: 'banner', format: 'fbCover' })
  })

  it('każde brakujące albo błędne ustawienie z osobna wraca do domyślnego', () => {
    const valid: ExportSettings = { medium: 'social', format: 'a3', orientation: 'landscape', fileType: 'pdf' }
    expect(exportOf(valid)).toEqual(valid)
    expect(exportOf({ ...valid, orientation: undefined })).toEqual({ ...valid, orientation: 'portrait' })
    expect(exportOf({ ...valid, orientation: 'ukos' })).toEqual({ ...valid, orientation: 'portrait' })
    expect(exportOf({ ...valid, fileType: undefined })).toEqual({ ...valid, fileType: 'png' })
    expect(exportOf({ ...valid, fileType: 'gif' })).toEqual({ ...valid, fileType: 'png' })
    expect(exportOf({ ...valid, medium: undefined })).toEqual(valid)
    expect(exportOf({ ...valid, format: undefined })).toEqual({ ...valid, format: 'square' })
  })
})

describe('parseSnapshot: czyszczenie formularza', () => {
  const formOf = (form: Record<string, unknown>) => parsed({ ...DEFAULT_SNAPSHOT, form }).form

  it('skale są przycinane do zakresu suwaka 70%-130%', () => {
    expect(formOf({ titleScale: 5, textScale: 0.1 })).toMatchObject({ titleScale: 1.3, textScale: 0.7 })
    expect(formOf({ titleScale: -2, textScale: 130 })).toMatchObject({ titleScale: 0.7, textScale: 1.3 })
    expect(formOf({ titleScale: 0.7, textScale: 1.3 })).toMatchObject({ titleScale: 0.7, textScale: 1.3 })
    expect(formOf({ titleScale: 1.15, textScale: 0.95 })).toMatchObject({ titleScale: 1.15, textScale: 0.95 })
  })

  it('grafiki: najwyżej MAX_GRAPHICS, bez data URL-i, pustych tekstów i nie-tekstów', () => {
    const many = Array.from({ length: MAX_GRAPHICS + 3 }, (_, i) => `g${i}.png`)
    expect(formOf({ graphics: many }).graphics).toEqual(many.slice(0, MAX_GRAPHICS))
    expect(formOf({ graphics: ['data:image/png;base64,AAAA', 'a.png', '', 7, null, ' DATA:image/png;base64,BBBB', 'b.svg'] }).graphics).toEqual([
      'a.png',
      'b.svg',
    ])
  })

  it('limit grafik liczy się po odrzuceniu śmieci', () => {
    const graphics = ['data:image/png;base64,AAAA', null, ...Array.from({ length: MAX_GRAPHICS }, (_, i) => `g${i}.png`)]
    expect(formOf({ graphics }).graphics).toHaveLength(MAX_GRAPHICS)
  })

  it('zdjęcia: kadr przycinany do 0-100, zły kadr → środek, zły wpis wypada', () => {
    const photos = {
      photo: [
        { asset: 'a.jpg', x: -20, y: 250 },
        { asset: 'b.jpg', x: 'lewo', y: null },
        { asset: 'c.jpg' },
        { asset: 'data:image/jpeg;base64,CCCC', x: 1, y: 1 },
        { asset: '', x: 1, y: 1 },
        { asset: 9, x: 1, y: 1 },
        { src: 'd.jpg', x: 1, y: 1 },
        null,
        'e.jpg',
        { asset: 'f.jpg', x: Number.NaN, y: 100, extra: true },
      ],
      junk: 'nie lista',
      empty: [],
    }
    expect(formOf({ photos }).photos).toEqual({
      photo: [
        { asset: 'a.jpg', x: 0, y: 100 },
        { asset: 'b.jpg', x: 50, y: 50 },
        { asset: 'c.jpg', x: 50, y: 50 },
        { asset: 'f.jpg', x: 50, y: 100 },
      ],
      empty: [],
    })
  })

  it('listy: zostają tylko obiekty z tekstowymi wartościami', () => {
    const lists = {
      agenda: [{ time: '10:00', label: 'Start', n: 3, nested: { a: 1 } }, {}, null, 'tekst', ['a'], { time: null }],
      junk: 42,
    }
    expect(formOf({ lists }).lists).toEqual({ agenda: [{ time: '10:00', label: 'Start' }, {}, {}] })
  })

  it('widoczność: tylko `false` przy znanych polach tekstowych', () => {
    const visibility = { title: false, subtitle: true, badge: 'false', body: 0, qrUrl: false, nieznane: false }
    expect(formOf({ visibility }).visibility).toEqual({ title: false })
  })

  it('klucz `__proto__` z JSON-a nie podmienia prototypu', () => {
    const raw: unknown = JSON.parse(
      '{"v":1,"poster_key":"wyklad","form":{"photos":{"__proto__":[{"asset":"a.jpg","x":1,"y":2}]},"lists":{"__proto__":[{"a":"b"}]},"visibility":{"__proto__":false}}}',
    )
    const { form } = parsed(raw)
    expect(Object.getPrototypeOf(form.photos)).toBe(Object.prototype)
    expect(Object.getPrototypeOf(form.lists)).toBe(Object.prototype)
    expect(Object.getPrototypeOf(form.visibility)).toBe(Object.prototype)
    expect(({} as Record<string, unknown>).a).toBeUndefined()
  })

  it('data URL w dowolnej pozycji obrazu nie przechodzi przez parser', () => {
    const snapshot = parsed({
      ...DEFAULT_SNAPSHOT,
      form: {
        ...EMPTY_SNAPSHOT_FORM,
        graphics: ['data:image/png;base64,AAAA'],
        photos: { photo: [{ asset: 'data:image/png;base64,BBBB', x: 1, y: 1 }] },
      },
    })
    expect(JSON.stringify(snapshot)).not.toContain('data:')
    expect(assetRefsOf(snapshot)).toEqual([])
  })
})

describe('assetRefsOf', () => {
  it('zwraca refy grafik i zdjęć bez powtórzeń', () => {
    const snapshot = toSnapshot(FULL_STATE, refOf)
    expect(assetRefsOf(snapshot)).toEqual(['aaa2.svg', 'aaa1.png', 'bbb1.jpg', 'bbb2.jpg'])
    expect(assetRefsOf({ ...snapshot, form: { ...snapshot.form, graphics: ['x.png', 'x.png', 'bbb2.jpg'] } })).toEqual(['x.png', 'bbb2.jpg', 'bbb1.jpg'])
  })

  it('pusty snapshot nie ma refów', () => {
    expect(assetRefsOf(DEFAULT_SNAPSHOT)).toEqual([])
  })
})

describe('isBlank', () => {
  const withForm = (form: Partial<SnapshotForm>): EditorSnapshot => ({ ...DEFAULT_SNAPSHOT, form: { ...EMPTY_SNAPSHOT_FORM, ...form } })

  it('pusty edytor jest pusty', () => {
    expect(isBlank(DEFAULT_SNAPSHOT)).toBe(true)
    expect(isBlank(toSnapshot(EMPTY_STATE, refOf))).toBe(true)
  })

  it('szablon, kolory, język i ustawienia się nie liczą', () => {
    const tuned: EditorSnapshot = {
      ...DEFAULT_SNAPSHOT,
      poster_key: 'gosc',
      color_scheme: 'czern~zloty',
      lang: 'en',
      export: FULL_EXPORT,
      form: { ...EMPTY_SNAPSHOT_FORM, visibility: { title: false }, showPkLogo: false, titleScale: 1.3, textScale: 0.7, scaleLinked: false },
    }
    expect(isBlank(tuned)).toBe(true)
  })

  it('każde pole tekstowe z osobna czyni snapshot niepustym', () => {
    for (const name of FORM_TEXT_FIELDS) expect(isBlank(withForm({ [name]: 'x' })), name).toBe(false)
  })

  it('same białe znaki w polu tekstowym to nadal pusto', () => {
    expect(isBlank(withForm({ title: '  \n', body: '\t' }))).toBe(true)
  })

  it('grafika, zdjęcie, wpis listy i QR czynią snapshot niepustym', () => {
    expect(isBlank(withForm({ graphics: ['a.png'] }))).toBe(false)
    expect(isBlank(withForm({ photos: { photo: [{ asset: 'a.jpg', x: 50, y: 50 }] } }))).toBe(false)
    expect(isBlank(withForm({ lists: { agenda: [{ time: '10:00' }] } }))).toBe(false)
    expect(isBlank(withForm({ qrUrl: 'https://example.org' }))).toBe(false)
  })

  it('puste galerie i listy bez treści to nadal pusto', () => {
    expect(isBlank(withForm({ photos: { photo: [] }, lists: { agenda: [], sponsors: [{}, { name: '' }, { name: '  ' }] }, qrUrl: '  ' }))).toBe(true)
  })
})

describe('snapshotFromLegacyHistory', () => {
  const entry: HistoryEntry = {
    id: 12,
    created_at: '2031-01-02T03:04:05Z',
    poster_key: 'warsztat',
    snapshot: null,
    title: 'Stary tytuł',
    subtitle: 'Stary podtytuł',
    speaker: 'Jan Kowalski',
    event_date: '2030-12-01',
    event_time: '17:00',
    location: 'Aula',
    color_scheme: 'granat~zolty',
  }

  it('sześć pól tekstowych, szablon i kolory z wpisu, reszta domyślna', () => {
    expect(snapshotFromLegacyHistory(entry, 'en')).toEqual({
      v: 1,
      poster_key: 'warsztat',
      color_scheme: 'granat~zolty',
      lang: 'en',
      export: DEFAULT_EXPORT_SETTINGS,
      form: {
        ...EMPTY_SNAPSHOT_FORM,
        title: 'Stary tytuł',
        subtitle: 'Stary podtytuł',
        speaker: 'Jan Kowalski',
        event_date: '2030-12-01',
        event_time: '17:00',
        location: 'Aula',
      },
    })
  })

  it('NULL-e z bazy dają pusty tekst i brak schematu, a wynik przechodzi parser bez zmian', () => {
    const sparse = { ...entry, subtitle: null, color_scheme: null } as unknown as HistoryEntry
    const snapshot = snapshotFromLegacyHistory(sparse, 'pl')
    expect(snapshot.form.subtitle).toBe('')
    expect(snapshot.color_scheme).toBeNull()
    expect(parsed(viaJson(snapshot))).toEqual(snapshot)
  })

  it('nie dzieli obiektów z EMPTY_FORM', () => {
    const snapshot = snapshotFromLegacyHistory(entry, 'pl')
    expect(snapshot.form.graphics).not.toBe(EMPTY_FORM.graphics)
    expect(snapshot.form.photos).not.toBe(EMPTY_FORM.photos)
    expect(snapshot.form.lists).not.toBe(EMPTY_FORM.lists)
    expect(snapshot.form.visibility).not.toBe(EMPTY_FORM.visibility)
    expect(snapshot.export).not.toBe(DEFAULT_EXPORT_SETTINGS)
  })
})

describe('snapshotFromLegacyDraft', () => {
  const row: DraftRow = {
    id: 1,
    title: 'Szkic',
    subtitle: 'Pod',
    speaker: 'Ktoś',
    event_date: '2031-05-06',
    event_time: '12:00',
    location: 'Sala',
    badge: 'Plakietka',
    badge2: 'Druga',
    body: 'Treść',
    visibility: '{"location":false,"badge":true,"obce":false}',
    color_scheme: 'czern',
    template_id: 4,
    updated_at: '2031-01-01 10:00:00',
  }

  it('dziewięć pól tekstowych, widoczność i kolory z wiersza, szablon z argumentu', () => {
    expect(snapshotFromLegacyDraft(row, 'gosc', 'en')).toEqual({
      v: 1,
      poster_key: 'gosc',
      color_scheme: 'czern',
      lang: 'en',
      export: DEFAULT_EXPORT_SETTINGS,
      form: {
        ...EMPTY_SNAPSHOT_FORM,
        title: 'Szkic',
        subtitle: 'Pod',
        speaker: 'Ktoś',
        event_date: '2031-05-06',
        event_time: '12:00',
        location: 'Sala',
        badge: 'Plakietka',
        badge2: 'Druga',
        body: 'Treść',
        visibility: { location: false },
      },
    })
  })

  it('pusty wiersz (same NULL-e) → domyślny snapshot', () => {
    const empty: DraftRow = {
      id: 1, title: null, subtitle: null, speaker: null, event_date: null, event_time: null, location: null,
      badge: null, badge2: null, body: null, visibility: null, color_scheme: null, template_id: null, updated_at: null,
    }
    expect(snapshotFromLegacyDraft(empty, 'wyklad', 'pl')).toEqual(DEFAULT_SNAPSHOT)
    expect(isBlank(snapshotFromLegacyDraft(empty, 'wyklad', 'pl'))).toBe(true)
  })

  it('zepsuty JSON widoczności → brak ograniczeń', () => {
    for (const visibility of ['{zepsute', '[]', '"tekst"', 'null', '']) {
      expect(snapshotFromLegacyDraft({ ...row, visibility }, 'gosc', 'pl').form.visibility, visibility).toEqual({})
    }
  })

  it('wynik przechodzi parser bez zmian', () => {
    const snapshot = snapshotFromLegacyDraft(row, 'gosc', 'pl')
    expect(parsed(viaJson(snapshot))).toEqual(snapshot)
  })
})
