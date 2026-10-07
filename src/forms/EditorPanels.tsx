import type { FormProps, RegistryEntry } from '../types'
import { UI_HEADING, UI_HINT } from '../components/styles'
import { FormBanner } from './FormBanner'

// Styk między powłoką edytora (`src/pages/EditorPage.tsx`) a formularzami.
// Powłoka renderuje `ContentPanel` w zakładce „Treść" i `LookPanel` w zakładce
// „Wygląd" i nie wie nic więcej o formularzach - ich podział i wygląd zmienia
// się wyłącznie w `src/forms/`.
export interface EditorPanelProps extends FormProps {
  // Wpis rejestru wybranego szablonu (`undefined`, gdy żaden nie jest wybrany).
  poster: RegistryEntry | undefined
  // Rodzaj grafiki „Baner": wspólny, krótki formularz zamiast formularza layoutu.
  banner: boolean
}

// Zakładka „Treść". NA RAZIE trzyma cały dotychczasowy formularz layoutu
// (suwaki rozmiaru, pola, grafiki stopki, kod QR, zdjęcia) - komponent `Form`
// z rejestru jest jednym `<form>` i nie da się go rozdzielić na dwie zakładki
// bez przebudowy `PosterForm`.
export function ContentPanel({ poster, banner, value, onChange }: EditorPanelProps) {
  if (!poster) return null
  // Baner ma wspólny, krótki formularz - dane wydarzenia zostają w stanie
  // i wracają po przejściu na „Social media i druk".
  if (banner) return <FormBanner value={value} onChange={onChange} photo={poster.bannerPhoto} />
  const LayoutForm = poster.Form
  return <LayoutForm value={value} onChange={onChange} />
}

// Zakładka „Wygląd". Docelowo: rozmiar tekstu, logo PK i logotypy stopki.
// Dopóki formularze nie są podzielone, mówi wprost, gdzie te ustawienia są.
export function LookPanel({ poster }: EditorPanelProps) {
  if (!poster) return null
  return (
    <section className="flex flex-col gap-2">
      <h2 className={UI_HEADING}>Wygląd</h2>
      <p className={UI_HINT}>
        Rozmiar tekstu, logo Politechniki Krakowskiej i logotypy stopki są na razie w zakładce „Treść" — na początku i na końcu formularza.
      </p>
    </section>
  )
}
