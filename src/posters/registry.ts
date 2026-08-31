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
import type { RegistryEntry } from '../types'

// Każdy wpis to `{ name, Component, Form }`:
//
// - `name` - podpis kafelki layoutu w TemplateSelector.
// - `Component` - komponent plakatu; przyjmuje `data` (dane formularza) oraz
//   `scheme` (nazwa schematu kolorów) i sam woła `resolveScheme(layout, scheme)`.
// - `Form` - jawnie napisany komponent formularza (patrz src/forms/), renderowany
//   po wybraniu danego layoutu. Dane formularza (App.jsx) są globalne i
//   przeżywają zmianę layoutu - zmienia się tylko to, który komponent je edytuje.
//
// Lista schematów kolorów NIE jest tutaj - wynika wprost z `schemes.ts`
// (`schemesFor(poster_key)`, kolejność = kolejność zapisu w bloku layoutu).
//
// Klucz (poster_key) jest zapisywany w tabeli `templates` w SQLite.
export const posterRegistry: Record<string, RegistryEntry> = {
  wyklad: { name: 'Wykład', Component: PosterWyklad, Form: FormWyklad },
  warsztat: { name: 'Warsztat', Component: PosterWarsztat, Form: FormWarsztat },
  konferencja: { name: 'Konferencja', Component: PosterKonferencja, Form: FormKonferencja },
  rekrutacja: { name: 'Rekrutacja', Component: PosterRekrutacja, Form: FormRekrutacja },
  data: { name: 'Data', Component: PosterData, Form: FormData },
  gosc: { name: 'Gość', Component: PosterGosc, Form: FormGosc },
  gala: { name: 'Gala', Component: PosterGala, Form: FormGala },
  ogloszenie: { name: 'Ogłoszenie', Component: PosterOgloszenie, Form: FormOgloszenie },
}
