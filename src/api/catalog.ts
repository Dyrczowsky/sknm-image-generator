import { posterRegistry } from '../posters/registry'
import { SCHEME_LABELS, accentsFor, schemesFor } from '../posters/schemes'
import type { FieldSpec } from '../forms/fields'
import { WYKLAD_FIELDS } from '../forms/FormWyklad'
import { WARSZTAT_FIELDS, WARSZTAT_PHOTO_LABEL } from '../forms/FormWarsztat'
import { KONFERENCJA_FIELDS } from '../forms/FormKonferencja'
import { REKRUTACJA_FIELDS } from '../forms/FormRekrutacja'
import { DATA_FIELDS, DATA_PHOTO_LABEL } from '../forms/FormData'
import { GOSC_FIELDS, GOSC_PHOTO_LABEL } from '../forms/FormGosc'
import { GALA_FIELDS } from '../forms/FormGala'
import { OGLOSZENIE_FIELDS } from '../forms/FormOgloszenie'
import { KOMUNIKAT_FIELDS } from '../forms/FormKomunikat'
import { CIEKAWOSTKA_FIELDS, CIEKAWOSTKA_PHOTO_LABEL } from '../forms/FormCiekawostka'
import type { Catalog, CatalogField, CatalogTemplate } from './types'

// Po dodaniu layoutu dopisz tu jego opis i uruchom `npx vitest run src/api -u`.
export const USE_FOR: Record<string, string> = {
  wyklad: 'Zapowiedź wykładu lub prelekcji: tytuł, prelegent, data, godzina i miejsce, bez zdjęć.',
  warsztat: 'Zapowiedź warsztatów lub zajęć praktycznych, ze zdjęciem z warsztatów.',
  konferencja: 'Konferencja, seminarium lub wydarzenie wielopunktowe z programem (lista godzin i punktów).',
  rekrutacja: 'Nabór nowych członków lub wolontariuszy, z hasłem, terminem i profilem w stopce.',
  data: 'Plakat z wyeksponowaną datą wydarzenia i zdjęciem; do wydarzeń, w których liczy się termin.',
  gosc: 'Zapowiedź gościa lub prelegenta ze zdjęciem osoby (spotkanie, wywiad, wykład gościnny).',
  gala: 'Uroczysta gala lub wydarzenie okazjonalne w eleganckiej oprawie, bez zdjęć.',
  ogloszenie: 'Krótkie ogłoszenie, cytat lub podziękowanie: sam tekst i opcjonalny podpis, bez daty i miejsca.',
  komunikat: 'Komunikat z nagłówkiem i akapitem treści (informacja dla członków, zmiana terminu, ważna wiadomość).',
  ciekawostka: 'Ciekawostka lub pytanie z historią w wysokim układzie Story, ze zdjęciem.',
}

const FIELDS_BY_KEY: Record<string, FieldSpec[]> = {
  wyklad: WYKLAD_FIELDS,
  warsztat: WARSZTAT_FIELDS,
  konferencja: KONFERENCJA_FIELDS,
  rekrutacja: REKRUTACJA_FIELDS,
  data: DATA_FIELDS,
  gosc: GOSC_FIELDS,
  gala: GALA_FIELDS,
  ogloszenie: OGLOSZENIE_FIELDS,
  komunikat: KOMUNIKAT_FIELDS,
  ciekawostka: CIEKAWOSTKA_FIELDS,
}

const PHOTO_LABELS: Record<string, string> = {
  warsztat: WARSZTAT_PHOTO_LABEL,
  data: DATA_PHOTO_LABEL,
  gosc: GOSC_PHOTO_LABEL,
  ciekawostka: CIEKAWOSTKA_PHOTO_LABEL,
}

const COMMON_OPTIONS = ['qrUrl', 'showPkLogo', 'pkLogo', 'showSknmLogo', 'titleScale', 'textScale']
const EXTRA_OPTIONS: Record<string, string[]> = {
  gala: ['wideSubtitle'],
  data: ['wideSubtitle'],
  ciekawostka: ['ciekawostkaLayout'],
  konferencja: ['fillAgenda'],
}

const toField = (f: FieldSpec): CatalogField => ({
  name: f.name,
  label: f.label,
  type: f.type ?? 'text',
  ...(f.placeholder !== undefined && { placeholder: f.placeholder }),
})

export function buildCatalog(): Catalog {
  const templates: CatalogTemplate[] = Object.entries(posterRegistry)
    .filter(([, entry]) => !entry.bannerOnly)
    .map(([key, entry]) => {
      const fields = FIELDS_BY_KEY[key]
      if (!fields) throw new Error(`Brak listy pól dla layoutu „${key}"`)
      const useFor = USE_FOR[key]
      if (!useFor) throw new Error(`Brak wpisu USE_FOR dla layoutu „${key}"`)
      return {
        key,
        name: entry.name,
        useFor,
        fields: fields.map(toField),
        photo: PHOTO_LABELS[key] ? { label: PHOTO_LABELS[key] } : null,
        lists: key === 'konferencja' ? { agenda: { itemFields: ['time', 'title', 'subtitle'] as ['time', 'title', 'subtitle'] } } : null,
        schemes: schemesFor(key).map((name) => ({ name, label: SCHEME_LABELS[name] ?? name, accents: accentsFor(key, name) })),
        storyShape: Boolean(entry.storyShape),
        options: [...COMMON_OPTIONS, ...(EXTRA_OPTIONS[key] ?? [])],
      }
    })
  return { version: 1, templates }
}
