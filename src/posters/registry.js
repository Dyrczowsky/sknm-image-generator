import { Poster1a } from './Poster1a'
import { Poster1b } from './Poster1b'
import { Poster1c } from './Poster1c'
import { Poster1d } from './Poster1d'
import { Poster1e } from './Poster1e'
import { Poster1f } from './Poster1f'
import { Poster1g } from './Poster1g'

// Klucz (poster_key) jest zapisywany w tabeli `templates` w SQLite.
// `logoSlots` opisuje niezależne miejsca na logo (jeden szablon może mieć
// jedno miejsce - logo PK, albo dwa - logo PK i logo wydziału - każde ze
// swoim własnym uploadem). `photoSlots` opisuje dodatkowe miejsca na zdjęcia.
// Formularz pokazuje jedno pole wgrywania na każdy wpis.
const LOGO_PK_ONLY = [{ key: 'pk', label: 'Logo PK' }]
const LOGO_PK_AND_FACULTY = [
  { key: 'pk', label: 'Logo PK' },
  { key: 'faculty', label: 'Logo wydziału' },
]

export const posterRegistry = {
  '1a': { name: 'Wykład', Component: Poster1a, logoSlots: LOGO_PK_AND_FACULTY },
  '1b': {
    name: 'Gość',
    Component: Poster1b,
    logoSlots: LOGO_PK_AND_FACULTY,
    photoSlots: [{ key: 'photo', label: 'Zdjęcie prelegenta' }],
  },
  '1c': {
    name: 'Warsztat',
    Component: Poster1c,
    logoSlots: LOGO_PK_AND_FACULTY,
    photoSlots: [{ key: 'photo', label: 'Zdjęcie z warsztatów' }],
  },
  '1d': {
    name: 'Data',
    Component: Poster1d,
    logoSlots: LOGO_PK_AND_FACULTY,
    photoSlots: [{ key: 'photo', label: 'Zdjęcie z wydarzenia' }],
  },
  '1e': { name: 'Konferencja', Component: Poster1e, logoSlots: LOGO_PK_ONLY },
  '1f': { name: 'Rekrutacja', Component: Poster1f, logoSlots: LOGO_PK_ONLY },
  '1g': { name: 'Gala', Component: Poster1g, logoSlots: LOGO_PK_ONLY },
}
