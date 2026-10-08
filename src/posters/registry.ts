import { PosterWarsztat } from './PosterWarsztat'
import { PosterRekrutacja } from './PosterRekrutacja'
import { PosterData } from './PosterData'
import { PosterGala } from './PosterGala'
import { PosterGosc } from './PosterGosc'
import { PosterOgloszenie } from './PosterOgloszenie'
import { PosterWyklad } from './PosterWyklad'
import { PosterKonferencja } from './PosterKonferencja'
import { PosterKomunikat } from './PosterKomunikat'
import { BannerWyklad } from './banners/BannerWyklad'
import { BannerWarsztat } from './banners/BannerWarsztat'
import { BannerKonferencja } from './banners/BannerKonferencja'
import { BannerRekrutacja } from './banners/BannerRekrutacja'
import { BannerData } from './banners/BannerData'
import { BannerGosc } from './banners/BannerGosc'
import { BannerGala } from './banners/BannerGala'
import { BannerOgloszenie } from './banners/BannerOgloszenie'
import { BannerKomunikat } from './banners/BannerKomunikat'
import { FormWarsztat } from '../forms/FormWarsztat'
import { FormRekrutacja } from '../forms/FormRekrutacja'
import { FormData } from '../forms/FormData'
import { FormGala } from '../forms/FormGala'
import { FormGosc } from '../forms/FormGosc'
import { FormOgloszenie } from '../forms/FormOgloszenie'
import { FormWyklad } from '../forms/FormWyklad'
import { FormKonferencja } from '../forms/FormKonferencja'
import { FormKomunikat } from '../forms/FormKomunikat'
import type { RegistryEntry } from '../types'

// Każdy wpis to `{ name, Component, Banner, Form }`:
//
// - `name` - podpis kafelki layoutu w TemplateSelector.
// - `Component` - komponent plakatu; przyjmuje `data` (dane formularza) oraz
//   `scheme` (nazwa schematu kolorów) i sam woła `resolveScheme(layout, scheme)`.
// - `Banner` - szeroka wersja tego samego layoutu (rodzaj grafiki „Baner", patrz
//   src/posters/banners/); te same propsy, ten sam klucz schematów kolorów.
//   Baner niesie stałą nazwę koła, nie dane wydarzenia. `bannerPhoto` - baner
//   ma miejsce na zdjęcie (`FormBanner` pokaże wtedy galerię zdjęć).
// - `Form` - treść layoutu (zakładka „Treść"): lista pól na wspólnym `PosterForm`
//   (patrz src/forms/), renderowana przez `ContentPanel` po wybraniu danego layoutu.
//   To NIE cały formularz: rozmiar tekstu i logotypy są wspólne dla wszystkich
//   layoutów i rysuje je zakładka „Wygląd" (`LookFields`), a w trybie „Baner"
//   zamiast `Form` renderuje się wspólny `FormBanner`. Dane formularza
//   (editor/useEditor.ts) są globalne i przeżywają zmianę layoutu - zmienia się
//   tylko to, który komponent je edytuje.
//
// Lista schematów kolorów NIE jest tutaj - wynika wprost z `schemes.ts`
// (`schemesFor(poster_key)`, kolejność = kolejność zapisu w bloku layoutu).
//
// Klucz (poster_key) jest zapisywany w tabeli `templates` w SQLite.
export const posterRegistry: Record<string, RegistryEntry> = {
  wyklad: { name: 'Wykład', Component: PosterWyklad, Banner: BannerWyklad, Form: FormWyklad },
  warsztat: { name: 'Warsztat', Component: PosterWarsztat, Banner: BannerWarsztat, bannerPhoto: true, Form: FormWarsztat },
  konferencja: { name: 'Konferencja', Component: PosterKonferencja, Banner: BannerKonferencja, Form: FormKonferencja },
  rekrutacja: { name: 'Rekrutacja', Component: PosterRekrutacja, Banner: BannerRekrutacja, Form: FormRekrutacja },
  data: { name: 'Data', Component: PosterData, Banner: BannerData, Form: FormData },
  gosc: { name: 'Gość', Component: PosterGosc, Banner: BannerGosc, bannerPhoto: true, Form: FormGosc },
  gala: { name: 'Gala', Component: PosterGala, Banner: BannerGala, Form: FormGala },
  ogloszenie: { name: 'Ogłoszenie', Component: PosterOgloszenie, Banner: BannerOgloszenie, Form: FormOgloszenie },
  komunikat: { name: 'Komunikat rozszerzony', Component: PosterKomunikat, Banner: BannerKomunikat, Form: FormKomunikat },
}
