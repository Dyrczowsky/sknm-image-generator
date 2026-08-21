import { Poster1a } from './Poster1a'
import { Poster1b } from './Poster1b'
import { Poster1c } from './Poster1c'
import { Poster1d } from './Poster1d'
import { Poster1e } from './Poster1e'
import { Poster1f } from './Poster1f'
import { Poster1g } from './Poster1g'

// Formularz (PosterForm) jest generowany wyłącznie na podstawie `fields`
// poniżej - jeśli szablon czegoś nie deklaruje, w formularzu tego nie ma.
// Dzięki temu formularz zawsze dokładnie odpowiada temu, czego dany plakat
// faktycznie potrzebuje.
//
// Typy pól: 'text' | 'date' | 'time' - zwykły input.
//           'logo' - jeden upload z checkboxem włącz/wyłącz (LogoSlot).
//           'photo' - galeria (0..N zdjęć), każde z pozycją X/Y (PhotoGallery).
//           'list' - powtarzalne wiersze złożone z `itemFields`.
const BASE_FIELDS = [
  { type: 'text', key: 'title', label: 'Tytuł' },
  { type: 'text', key: 'subtitle', label: 'Opis / podtytuł' },
  { type: 'text', key: 'speaker', label: 'Prelegent / organizator' },
  { type: 'date', key: 'event_date', label: 'Data' },
  { type: 'time', key: 'event_time', label: 'Godzina' },
  { type: 'text', key: 'location', label: 'Lokalizacja' },
]

function logoField(key, label) {
  return { type: 'logo', key, label }
}

function photoField(key, label) {
  return { type: 'photo', key, label, max: 4 }
}

const LOGO_PK_ONLY = [logoField('pk', 'Logo PK')]
const LOGO_PK_AND_FACULTY = [logoField('pk', 'Logo PK'), logoField('faculty', 'Logo wydziału')]

// Klucz (poster_key) jest zapisywany w tabeli `templates` w SQLite.
export const posterRegistry = {
  '1a': {
    name: 'Wykład',
    Component: Poster1a,
    fields: [...BASE_FIELDS, ...LOGO_PK_AND_FACULTY],
  },
  '1b': {
    name: 'Gość',
    Component: Poster1b,
    fields: [...BASE_FIELDS, ...LOGO_PK_AND_FACULTY, photoField('photo', 'Zdjęcie prelegenta')],
  },
  '1c': {
    name: 'Warsztat',
    Component: Poster1c,
    fields: [...BASE_FIELDS, ...LOGO_PK_AND_FACULTY, photoField('photo', 'Zdjęcie z warsztatów')],
  },
  '1d': {
    name: 'Data',
    Component: Poster1d,
    fields: [...BASE_FIELDS, ...LOGO_PK_AND_FACULTY, photoField('photo', 'Zdjęcie z wydarzenia')],
  },
  '1e': {
    name: 'Konferencja',
    Component: Poster1e,
    fields: [
      { type: 'text', key: 'title', label: 'Tytuł' },
      { type: 'date', key: 'event_date', label: 'Data' },
      { type: 'text', key: 'location', label: 'Lokalizacja' },
      {
        type: 'list',
        key: 'agenda',
        label: 'Program konferencji',
        addLabel: '+ Dodaj punkt programu',
        itemFields: [
          { key: 'time', type: 'time', label: 'Godzina', width: 'small' },
          { key: 'title', type: 'text', label: 'Nazwa punktu programu' },
        ],
      },
      ...LOGO_PK_ONLY,
    ],
  },
  '1f': {
    name: 'Rekrutacja',
    Component: Poster1f,
    fields: [...BASE_FIELDS, ...LOGO_PK_ONLY],
  },
  '1g': {
    name: 'Gala',
    Component: Poster1g,
    fields: [...BASE_FIELDS, ...LOGO_PK_ONLY],
  },
}
