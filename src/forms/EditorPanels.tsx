import type { FormProps, RegistryEntry } from '../types'
import { FormBanner } from './FormBanner'
import { LookFields } from './LookFields'

// Styk między powłoką edytora (`src/pages/EditorPage.tsx`) a formularzami.
// Powłoka renderuje `ContentPanel` w zakładce „Treść" i `LookPanel` w zakładce
// „Wygląd" i nie wie nic więcej o formularzach - ich podział i wygląd zmienia
// się wyłącznie w `src/forms/`. Oba panele są zawsze zamontowane (nieaktywny
// jest `hidden`), więc żaden nie opakowuje się w `<form>` ani w padding.
export interface EditorPanelProps extends FormProps {
  // Wpis rejestru wybranego szablonu (`undefined`, gdy żaden nie jest wybrany).
  poster: RegistryEntry | undefined
  // Rodzaj grafiki „Baner": wspólny, krótki formularz zamiast formularza
  // layoutu. Czyta go tylko `ContentPanel`; `LookPanel` jest taki sam dla
  // plakatu i banera i go pomija (propsy mają wspólny kształt dla `EditorPage`).
  banner: boolean
}

// Zakładka „Treść": pola tekstowe layoutu, program (Konferencja), zdjęcia
// i kod QR. Komponent `Form` z rejestru to tylko tę część - rozmiar tekstu
// i logotypy renderuje `LookPanel`.
export function ContentPanel({ poster, banner, value, onChange }: EditorPanelProps) {
  if (!poster) return null
  // Baner ma wspólny, krótki formularz - dane wydarzenia zostają w stanie
  // i wracają po przejściu na „Social media i druk".
  if (banner) return <FormBanner value={value} onChange={onChange} photo={poster.bannerPhoto} />
  const LayoutForm = poster.Form
  return <LayoutForm value={value} onChange={onChange} />
}

// Zakładka „Wygląd": rozmiar tekstu (dwa suwaki ze spięciem), logo PK
// i logotypy stopki. Taka sama dla każdego layoutu i dla banera.
export function LookPanel({ poster, value, onChange }: EditorPanelProps) {
  if (!poster) return null
  return <LookFields value={value} onChange={onChange} />
}
