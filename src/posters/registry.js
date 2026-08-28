import { Poster1a } from './Poster1a'
import { Poster1b } from './Poster1b'
import { Poster1c } from './Poster1c'
import { Poster1d } from './Poster1d'
import { Poster1e } from './Poster1e'
import { Poster1f } from './Poster1f'
import { Poster1g } from './Poster1g'
import { Poster1h } from './Poster1h'
import { Poster1i } from './Poster1i'
import { Poster1j } from './Poster1j'
import { Poster1k } from './Poster1k'
import { Poster1l } from './Poster1l'
import { Form1a } from '../forms/Form1a'
import { Form1b } from '../forms/Form1b'
import { Form1c } from '../forms/Form1c'
import { Form1d } from '../forms/Form1d'
import { Form1e } from '../forms/Form1e'
import { Form1f } from '../forms/Form1f'
import { Form1g } from '../forms/Form1g'
import { Form1h } from '../forms/Form1h'
import { Form1i } from '../forms/Form1i'
import { Form1j } from '../forms/Form1j'
import { Form1k } from '../forms/Form1k'
import { Form1l } from '../forms/Form1l'

// Każdy szablon plakatu ma własny, jawnie napisany komponent formularza (patrz
// src/forms/) - `Form` poniżej wskazuje, który z nich się renderuje po
// wybraniu danego szablonu. Dane formularza (App.jsx) są globalne i
// przeżywają zmianę szablonu - zmienia się tylko to, który komponent je
// edytuje.
//
// Klucz (poster_key) jest zapisywany w tabeli `templates` w SQLite.
//
// `family` grupuje warianty kolorystyczne tego samego layoutu (patrz Wykład
// 1a/1h/1i/1j/1k) - TemplateSelector pokazuje jedną kafelkę na `family`
// (z podpisem `familyLabel`) zamiast osobnej dla każdego koloru, a warianty
// wybiera się osobnym paskiem swatchy (`colorLabel`). Szablony bez `family`
// są traktowane jako jednoelementowa grupa (bez paska kolorystyki).
export const posterRegistry = {
  '1a': {
    name: 'Wykład',
    Component: Poster1a,
    Form: Form1a,
    family: 'wyklad',
    familyLabel: 'Wykład',
    colorLabel: 'Granat',
  },
  '1b': {
    name: 'Gość',
    Component: Poster1b,
    Form: Form1b,
  },
  '1c': {
    name: 'Warsztat',
    Component: Poster1c,
    Form: Form1c,
  },
  '1d': {
    name: 'Data',
    Component: Poster1d,
    Form: Form1d,
  },
  '1e': {
    name: 'Konferencja',
    Component: Poster1e,
    Form: Form1e,
  },
  '1f': {
    name: 'Rekrutacja',
    Component: Poster1f,
    Form: Form1f,
  },
  '1g': {
    name: 'Gala',
    Component: Poster1g,
    Form: Form1g,
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
  '1l': {
    name: 'Ogłoszenie',
    Component: Poster1l,
    Form: Form1l,
  },
}
