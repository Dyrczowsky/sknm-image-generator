import { PosterWarsztat } from './PosterWarsztat'
import { PosterRekrutacja } from './PosterRekrutacja'
import { PosterData } from './PosterData'
import { PosterGala } from './PosterGala'
import { PosterGosc } from './PosterGosc'
import { PosterOgloszenie } from './PosterOgloszenie'
import { PosterWyklad } from './PosterWyklad'
import { PosterKonferencja } from './PosterKonferencja'
import { FormWarsztat } from '../forms/FormWarsztat'
import { FormRekrutacja } from '../forms/FormRekrutacja'
import { FormData } from '../forms/FormData'
import { FormGala } from '../forms/FormGala'
import { FormGosc } from '../forms/FormGosc'
import { FormOgloszenie } from '../forms/FormOgloszenie'
import { FormWyklad } from '../forms/FormWyklad'
import { FormKonferencja } from '../forms/FormKonferencja'

// Każdy wpis to `{ name, Component, Form, schemes? }`:
//
// - `name` - podpis kafelki layoutu w TemplateSelector.
// - `Component` - komponent plakatu; przyjmuje `data` (dane formularza) oraz
//   `scheme` (nazwa schematu kolorów) i sam woła `resolveScheme(layout, scheme)`.
// - `Form` - jawnie napisany komponent formularza (patrz src/forms/), renderowany
//   po wybraniu danego layoutu. Dane formularza (App.jsx) są globalne i
//   przeżywają zmianę layoutu - zmienia się tylko to, który komponent je edytuje.
// - `schemes` - uporządkowana lista nazw schematów kolorów (pierwsza = domyślna).
//   TemplateSelector renderuje ją jako pasek swatchy pod kafelką layoutu.
//   Layout bez `schemes` (Gala) nie pokazuje paska kolorystyki, a
//   `resolveScheme` schodzi wtedy do bloku `default` danego layoutu.
//
// Klucz (poster_key) jest zapisywany w tabeli `templates` w SQLite.
export const posterRegistry = {
  wyklad: {
    name: 'Wykład',
    Component: PosterWyklad,
    Form: FormWyklad,
    schemes: ['default', 'zloto', 'czern', 'jasny', 'szary'],
  },

  warsztat: {
    name: 'Warsztat',
    Component: PosterWarsztat,
    Form: FormWarsztat,
    schemes: ['default', 'czern', 'zloto', 'jasny', 'szary'],
  },

  konferencja: {
    name: 'Konferencja',
    Component: PosterKonferencja,
    Form: FormKonferencja,
    schemes: ['default', 'czern', 'zloto', 'jasny', 'szary'],
  },

  rekrutacja: {
    name: 'Rekrutacja',
    Component: PosterRekrutacja,
    Form: FormRekrutacja,
    schemes: ['limonka', 'czern', 'zloto', 'jasny', 'szary'],
  },

  data: {
    name: 'Data',
    Component: PosterData,
    Form: FormData,
    schemes: ['default', 'czern', 'zloto', 'jasny', 'szary'],
  },

  gosc: {
    name: 'Gość',
    Component: PosterGosc,
    Form: FormGosc,
    schemes: ['default', 'czern', 'zloto', 'jasny', 'szary'],
  },

  gala: { name: 'Gala', Component: PosterGala, Form: FormGala },

  ogloszenie: {
    name: 'Ogłoszenie',
    Component: PosterOgloszenie,
    Form: FormOgloszenie,
    schemes: ['default', 'czern', 'zloto', 'jasny', 'szary'],
  },
}
