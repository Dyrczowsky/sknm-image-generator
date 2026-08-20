import { Poster1a } from './Poster1a'
import { Poster1b } from './Poster1b'
import { Poster1c } from './Poster1c'
import { Poster1d } from './Poster1d'
import { Poster1e } from './Poster1e'
import { Poster1f } from './Poster1f'
import { Poster1g } from './Poster1g'

// Klucz (poster_key) jest zapisywany w tabeli `templates` w SQLite.
// `photoSlots` opisuje dodatkowe miejsca na zdjęcia (poza logo, które jest
// wspólne dla wszystkich szablonów) - formularz pokazuje jedno pole
// wgrywania na każdy wpis. Szablon może mieć ich zero, jeden lub więcej.
export const posterRegistry = {
  '1a': { name: 'Wykład', Component: Poster1a },
  '1b': {
    name: 'Gość',
    Component: Poster1b,
    photoSlots: [{ key: 'photo', label: 'Zdjęcie prelegenta' }],
  },
  '1c': {
    name: 'Warsztat',
    Component: Poster1c,
    photoSlots: [{ key: 'photo', label: 'Zdjęcie z warsztatów' }],
  },
  '1d': {
    name: 'Data',
    Component: Poster1d,
    photoSlots: [{ key: 'photo', label: 'Zdjęcie z wydarzenia' }],
  },
  '1e': { name: 'Konferencja', Component: Poster1e },
  '1f': { name: 'Rekrutacja', Component: Poster1f },
  '1g': { name: 'Gala', Component: Poster1g },
}
