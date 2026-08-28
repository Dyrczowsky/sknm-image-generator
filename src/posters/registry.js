import { Poster1a } from './Poster1a'
import { Poster1c } from './Poster1c'
import { Poster1cCzern } from './Poster1cCzern'
import { Poster1cZloto } from './Poster1cZloto'
import { Poster1cJasny } from './Poster1cJasny'
import { Poster1cSzary } from './Poster1cSzary'
import { Poster1e } from './Poster1e'
import { Poster1eCzern } from './Poster1eCzern'
import { Poster1eZloto } from './Poster1eZloto'
import { Poster1eJasny } from './Poster1eJasny'
import { Poster1eSzary } from './Poster1eSzary'
import { Poster1f } from './Poster1f'
import { Poster1fCzern } from './Poster1fCzern'
import { Poster1fZloto } from './Poster1fZloto'
import { Poster1fJasny } from './Poster1fJasny'
import { Poster1fSzary } from './Poster1fSzary'
import { Poster1h } from './Poster1h'
import { Poster1i } from './Poster1i'
import { Poster1j } from './Poster1j'
import { Poster1k } from './Poster1k'
import { PosterData } from './PosterData'
import { PosterGala } from './PosterGala'
import { PosterGosc } from './PosterGosc'
import { PosterOgloszenie } from './PosterOgloszenie'
import { Form1a } from '../forms/Form1a'
import { Form1c } from '../forms/Form1c'
import { Form1e } from '../forms/Form1e'
import { Form1f } from '../forms/Form1f'
import { Form1h } from '../forms/Form1h'
import { Form1i } from '../forms/Form1i'
import { Form1j } from '../forms/Form1j'
import { Form1k } from '../forms/Form1k'
import { FormData } from '../forms/FormData'
import { FormGala } from '../forms/FormGala'
import { FormGosc } from '../forms/FormGosc'
import { FormOgloszenie } from '../forms/FormOgloszenie'

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
  '1a': {
    name: 'Wykład',
    Component: Poster1a,
    Form: Form1a,
    family: 'wyklad',
    familyLabel: 'Wykład',
    colorLabel: 'Granat',
  },
  '1h': {
    name: 'Wykład — złoto',
    Component: Poster1h,
    Form: Form1h,
    family: 'wyklad',
    familyLabel: 'Wykład',
    colorLabel: 'Złoto',
  },
  '1i': {
    name: 'Wykład — czerń',
    Component: Poster1i,
    Form: Form1i,
    family: 'wyklad',
    familyLabel: 'Wykład',
    colorLabel: 'Czerń',
  },
  '1j': {
    name: 'Wykład — jasny',
    Component: Poster1j,
    Form: Form1j,
    family: 'wyklad',
    familyLabel: 'Wykład',
    colorLabel: 'Jasny',
  },
  '1k': {
    name: 'Wykład — szary',
    Component: Poster1k,
    Form: Form1k,
    family: 'wyklad',
    familyLabel: 'Wykład',
    colorLabel: 'Szary',
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

  '1e': {
    name: 'Konferencja',
    Component: Poster1e,
    Form: Form1e,
    family: 'konferencja',
    familyLabel: 'Konferencja',
    colorLabel: 'Granat',
  },
  '1e-czern': {
    name: 'Konferencja — czerń',
    Component: Poster1eCzern,
    Form: Form1e,
    family: 'konferencja',
    familyLabel: 'Konferencja',
    colorLabel: 'Czerń',
  },
  '1e-zloto': {
    name: 'Konferencja — złoto',
    Component: Poster1eZloto,
    Form: Form1e,
    family: 'konferencja',
    familyLabel: 'Konferencja',
    colorLabel: 'Złoto',
  },
  '1e-jasny': {
    name: 'Konferencja — jasny',
    Component: Poster1eJasny,
    Form: Form1e,
    family: 'konferencja',
    familyLabel: 'Konferencja',
    colorLabel: 'Jasny',
  },
  '1e-szary': {
    name: 'Konferencja — szary',
    Component: Poster1eSzary,
    Form: Form1e,
    family: 'konferencja',
    familyLabel: 'Konferencja',
    colorLabel: 'Szary',
  },

  '1f': {
    name: 'Rekrutacja',
    Component: Poster1f,
    Form: Form1f,
    family: 'rekrutacja',
    familyLabel: 'Rekrutacja',
    colorLabel: 'Limonka',
  },
  '1f-czern': {
    name: 'Rekrutacja — czerń',
    Component: Poster1fCzern,
    Form: Form1f,
    family: 'rekrutacja',
    familyLabel: 'Rekrutacja',
    colorLabel: 'Czerń',
  },
  '1f-zloto': {
    name: 'Rekrutacja — złoto',
    Component: Poster1fZloto,
    Form: Form1f,
    family: 'rekrutacja',
    familyLabel: 'Rekrutacja',
    colorLabel: 'Złoto',
  },
  '1f-jasny': {
    name: 'Rekrutacja — jasny',
    Component: Poster1fJasny,
    Form: Form1f,
    family: 'rekrutacja',
    familyLabel: 'Rekrutacja',
    colorLabel: 'Jasny',
  },
  '1f-szary': {
    name: 'Rekrutacja — szary',
    Component: Poster1fSzary,
    Form: Form1f,
    family: 'rekrutacja',
    familyLabel: 'Rekrutacja',
    colorLabel: 'Szary',
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
