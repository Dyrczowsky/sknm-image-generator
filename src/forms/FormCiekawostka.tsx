import type { CiekawostkaLayout, FormProps } from '../types'
import { Button } from '../components/ui'
import { setCiekawostkaLayout } from '../editor/formState'
import { DEFAULT_BADGE, SITE_URL } from '../posters/copy'
import { PLACEHOLDERS } from '../posters/fallback'
import { FIELDS, badgeField } from './fields'
import type { FieldSpec } from './fields'
import { FormGroup } from './FormGroup'
import { PosterForm } from './PosterForm'

const CIEKAWOSTKA_FIELDS: FieldSpec[] = [
  badgeField(DEFAULT_BADGE.ciekawostka.pl),
  { ...FIELDS.title, placeholder: PLACEHOLDERS.ciekawostkaTitle },
  { name: 'body', label: 'Opis', type: 'textarea', rows: 6, placeholder: PLACEHOLDERS.ciekawostkaBody },
  { name: 'year', label: 'Rok (układ „Archiwum")', placeholder: '2001' },
  { name: 'badge2', label: 'Linia na dole', placeholder: SITE_URL },
]

const LAYOUTS: { key: CiekawostkaLayout; label: string }[] = [
  { key: 'zdjecie', label: 'Zdjęcie u góry' },
  { key: 'panorama', label: 'Panorama' },
  { key: 'archiwum', label: 'Archiwum' },
]

// Formularz Ciekawostki: pytanie, akapit historii, zdjęcie i wybór układu
// (te same dane, zmienia się tylko wygląd plakatu).
export function FormCiekawostka(props: FormProps) {
  const { value, onChange } = props
  return (
    <PosterForm {...props} fields={CIEKAWOSTKA_FIELDS} photoLabel="Zdjęcie">
      <FormGroup title="Układ">
        <div role="group" aria-label="Układ plakatu" className="flex flex-wrap gap-2">
          {LAYOUTS.map(({ key, label }) => (
            <Button key={key} variant="outline" iconEnd={value.ciekawostkaLayout === key ? 'check' : undefined} aria-pressed={value.ciekawostkaLayout === key} onClick={() => onChange(setCiekawostkaLayout(key))}>
              {label}
            </Button>
          ))}
        </div>
      </FormGroup>
    </PosterForm>
  )
}
