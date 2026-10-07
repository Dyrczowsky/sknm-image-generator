import type { FormProps } from '../types'
import { COMPACT_INPUT, FORM_SECTION } from '../components/styles'
import { addListItem, removeListItem, setListItemField } from '../editor/formState'
import { DEFAULT_BADGE } from '../posters/copy'
import { FIELDS, badgeField } from './fields'
import type { FieldSpec } from './fields'
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

// Pola jednego punktu programu: klucz w `ListItem`, typ pola i jego szerokość.
const AGENDA_COLUMNS = [
  { name: 'time', type: 'time', placeholder: 'Godzina', width: 'w-[100px] flex-none' },
  { name: 'title', type: 'text', placeholder: 'Nazwa punktu programu', width: 'min-w-0 flex-1' },
  { name: 'subtitle', type: 'text', placeholder: 'Prelegent / opis (opcjonalnie)', width: 'min-w-0 flex-1' },
]

// Powtarzalna lista punktów programu (`value.lists.agenda`).
function AgendaField({ value, onChange }: FormProps) {
  const agenda = value.lists.agenda ?? []
  return (
    <div className={FORM_SECTION}>
      <span className="text-[0.9rem] font-medium">Program konferencji</span>
      {agenda.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {AGENDA_COLUMNS.map((column) => (
            <input
              key={column.name}
              type={column.type}
              placeholder={column.placeholder}
              value={item[column.name] ?? ''}
              onChange={(e) => onChange(setListItemField('agenda', index, column.name, e.target.value))}
              className={`${column.width} ${COMPACT_INPUT}`}
            />
          ))}
          <button
            type="button"
            className="flex-none rounded-lg border border-field-border bg-transparent px-3 py-[9px] text-[0.8rem] text-muted transition-[border-color,color] hover:border-danger hover:text-danger"
            onClick={() => onChange(removeListItem('agenda', index))}
            aria-label="Usuń"
          >
            Usuń
          </button>
        </div>
      ))}
      <button
        type="button"
        className="self-start rounded-lg border border-dashed border-field-border bg-transparent px-4 py-[9px] text-[0.85rem] text-accent transition-[border-color,background-color] hover:border-accent hover:bg-accent-soft"
        onClick={() => onChange(addListItem('agenda'))}
      >
        + Dodaj punkt programu
      </button>
    </div>
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
