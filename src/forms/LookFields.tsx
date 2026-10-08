import type { FormProps } from '../types'
import { FormGroup, PANEL_STACK } from './FormGroup'
import { LogosField } from './LogosField'
import { TitleTextScaleFields } from './TitleTextScaleFields'

// Wygląd (zakładka „Wygląd"): wspólny dla wszystkich layoutów i dla banera -
// rozmiar tekstu oraz logotypy w stopce.
export function LookFields({ value, onChange }: FormProps) {
  return (
    <div className={PANEL_STACK}>
      <FormGroup title="Rozmiar tekstu">
        <TitleTextScaleFields value={value} onChange={onChange} />
      </FormGroup>
      <FormGroup title="Logotypy">
        <LogosField value={value} onChange={onChange} />
      </FormGroup>
    </div>
  )
}
