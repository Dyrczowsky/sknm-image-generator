import { Poster1c } from './Poster1c'
import { Poster1cCzern } from './Poster1cCzern'
import { Poster1cZloto } from './Poster1cZloto'
import { Poster1cJasny } from './Poster1cJasny'
import { Poster1cSzary } from './Poster1cSzary'
import { PosterRekrutacja } from './PosterRekrutacja'
import { PosterData } from './PosterData'
import { PosterGala } from './PosterGala'
import { PosterGosc } from './PosterGosc'
import { PosterOgloszenie } from './PosterOgloszenie'
import { PosterWyklad } from './PosterWyklad'
import { PosterKonferencja } from './PosterKonferencja'
import { Form1c } from '../forms/Form1c'
import { FormRekrutacja } from '../forms/FormRekrutacja'
import { FormData } from '../forms/FormData'
import { FormGala } from '../forms/FormGala'
import { FormGosc } from '../forms/FormGosc'
import { FormOgloszenie } from '../forms/FormOgloszenie'
import { FormWyklad } from '../forms/FormWyklad'
import { FormKonferencja } from '../forms/FormKonferencja'

// Każdy szablon plakatu ma własny, jawnie napisany komponent formularza (patrz
// src/forms/) - `Form` poniżej wskazuje, który z nich się renderuje po
// wybraniu danego szablonu. Dane formularza (App.jsx) są globalne i
// przeżywają zmianę szablonu - zmienia się tylko to, który komponent je
// edytuje. Warianty kolorystyczne tego samego layoutu mają identyczny
// zestaw pól, więc reużywają Form bazowego wariantu zamiast duplikować go.
//
// Klucz (poster_key) jest zapisywany w tabeli `templates` w SQLite.
//
// `family` grupuje warianty kolorystyczne tego samego layoutu - TemplateSelector
// pokazuje jedną kafelkę na `family` (z podpisem `familyLabel`) zamiast
// osobnej dla każdego koloru, a warianty wybiera się osobnym paskiem
// swatchy (`colorLabel`). Szablony bez `family` są jednoelementową grupą
// (bez paska kolorystyki).
export const posterRegistry = {
  wyklad: {
    name: 'Wykład',
    Component: PosterWyklad,
    Form: FormWyklad,
    schemes: ['default', 'zloto', 'czern', 'jasny', 'szary'],
  },

  '1c': {
    name: 'Warsztat',
    Component: Poster1c,
    Form: Form1c,
    family: 'warsztat',
    familyLabel: 'Warsztat',
    colorLabel: 'Granat',
  },
  '1c-czern': {
    name: 'Warsztat — czerń',
    Component: Poster1cCzern,
    Form: Form1c,
    family: 'warsztat',
    familyLabel: 'Warsztat',
    colorLabel: 'Czerń',
  },
  '1c-zloto': {
    name: 'Warsztat — złoto',
    Component: Poster1cZloto,
    Form: Form1c,
    family: 'warsztat',
    familyLabel: 'Warsztat',
    colorLabel: 'Złoto',
  },
  '1c-jasny': {
    name: 'Warsztat — jasny',
    Component: Poster1cJasny,
    Form: Form1c,
    family: 'warsztat',
    familyLabel: 'Warsztat',
    colorLabel: 'Jasny',
  },
  '1c-szary': {
    name: 'Warsztat — szary',
    Component: Poster1cSzary,
    Form: Form1c,
    family: 'warsztat',
    familyLabel: 'Warsztat',
    colorLabel: 'Szary',
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
