import type { FormProps } from '../types'
import { Button, ConfirmButton, Input } from '../components/ui'
import { UI_LABEL } from '../components/styles'
import { addListItem, removeListItem, setListItemField } from '../editor/formState'
import { DEFAULT_BADGE } from '../posters/copy'
import { FIELDS, badgeField } from './fields'
import type { FieldSpec } from './fields'
import { FormGroup } from './FormGroup'
import { PosterForm } from './PosterForm'

// Krótszy zestaw pól (bez podtytułu, prelegenta i godziny) + druga plakietka
// w stopce plakatu.
const KONFERENCJA_FIELDS: FieldSpec[] = [
  badgeField(DEFAULT_BADGE.seminarium.pl, 'Etykieta nagłówka'),
  FIELDS.title,
  FIELDS.date,
  FIELDS.location,
  { name: 'badge2', label: 'Etykieta stopki', placeholder: DEFAULT_BADGE.wiecejInformacji.pl },
]

// Pola jednego punktu programu: klucz w `ListItem`, typ pola i jego podpis.
// Godzina i nazwa stoją w jednym rzędzie, opis zajmuje cały następny - tak
// wiersz mieści się też w panelu 340 px i na telefonie.
const AGENDA_COLUMNS = [
  { name: 'time', type: 'time', label: 'Godzina', placeholder: 'Godzina', className: undefined },
  { name: 'title', type: 'text', label: 'Nazwa punktu', placeholder: 'Nazwa punktu programu', className: undefined },
  { name: 'subtitle', type: 'text', label: 'Prelegent / opis', placeholder: 'Prelegent / opis (opcjonalnie)', className: 'col-span-2' },
]

// Powtarzalna lista punktów programu (`value.lists.agenda`).
function AgendaField({ value, onChange }: FormProps) {
  const agenda = value.lists.agenda ?? []
  return (
    <FormGroup title="Program">
      {agenda.map((item, index) => {
        const remove = () => onChange(removeListItem('agenda', index))
        const filled = AGENDA_COLUMNS.some((column) => Boolean(item[column.name]))
        return (
          <div key={index} role="group" aria-label={`Punkt programu ${index + 1}`} className="flex flex-col gap-2 rounded-xl border border-border p-3">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={UI_LABEL}>Punkt {index + 1}</span>
              {filled ? (
                <ConfirmButton variant="ghost" icon="trash" className="ml-auto" question={`Usunąć punkt ${index + 1}?`} onConfirm={remove}>
                  Usuń
                </ConfirmButton>
              ) : (
                <Button variant="ghost" icon="trash" className="ml-auto" onClick={remove}>
                  Usuń
                </Button>
              )}
            </div>
            <div className="grid grid-cols-[6.75rem_minmax(0,1fr)] gap-2">
              {AGENDA_COLUMNS.map((column) => (
                <Input
                  key={column.name}
                  type={column.type}
                  size="sm"
                  aria-label={`${column.label}, punkt ${index + 1}`}
                  placeholder={column.placeholder}
                  value={item[column.name] ?? ''}
                  onChange={(e) => onChange(setListItemField('agenda', index, column.name, e.target.value))}
                  className={column.className}
                />
              ))}
            </div>
          </div>
        )
      })}
      <Button icon="plus" className="self-start" onClick={() => onChange(addListItem('agenda'))}>
        Dodaj punkt programu
      </Button>
    </FormGroup>
  )
}

// Formularz Konferencji - pola nagłówka i stopki + program.
export function FormKonferencja(props: FormProps) {
  return (
    <PosterForm {...props} fields={KONFERENCJA_FIELDS}>
      <AgendaField {...props} />
    </PosterForm>
  )
}
