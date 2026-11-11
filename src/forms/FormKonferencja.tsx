import { useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import type { FormProps } from '../types'
import { Button, ConfirmButton, Icon, Input, Textarea } from '../components/ui'
import { UI_LABEL } from '../components/styles'
import { addListItem, moveListItem, removeListItem, setFillAgenda, setListItemField } from '../editor/formState'
import { dropSlot, slotToIndex } from '../slides/useDeckEditor'
import { applyPlainEdit, toPlain } from '../richText'
import { DEFAULT_BADGE } from '../posters/copy'
import { FIELDS, badgeField } from './fields'
import type { FieldSpec } from './fields'
import { FormGroup } from './FormGroup'
import { PosterForm } from './PosterForm'

// Krótszy zestaw pól (bez podtytułu, prelegenta i godziny) + druga plakietka
// w stopce plakatu.
export const KONFERENCJA_FIELDS: FieldSpec[] = [
  badgeField(DEFAULT_BADGE.seminarium.pl, 'Etykieta nagłówka'),
  FIELDS.title,
  FIELDS.date,
  FIELDS.location,
  { name: 'badge2', label: 'Etykieta stopki', placeholder: DEFAULT_BADGE.wiecejInformacji.pl },
]

// Pola jednego punktu programu: klucz w `ListItem`, typ pola i jego podpis.
// Godzina i nazwa stoją w jednym rzędzie, opis zajmuje cały następny - tak
// wiersz mieści się też w panelu 340 px i na telefonie. Nazwa i opis są
// wieloliniowe: Enter łamie wiersz na plakacie.
const AGENDA_COLUMNS = [
  { name: 'time', type: 'time', label: 'Godzina', placeholder: 'Godzina', className: 'self-start' },
  { name: 'title', type: 'textarea', label: 'Nazwa punktu', placeholder: 'Nazwa punktu programu', className: undefined },
  { name: 'subtitle', type: 'textarea', label: 'Prelegent / opis', placeholder: 'Prelegent / opis (opcjonalnie)', className: 'col-span-2' },
]

// Powtarzalna lista punktów programu (`value.lists.agenda`). Kolejność
// zmienia się uchwytem: przeciąganiem (mysz, dotyk) albo strzałkami ↑/↓.
function AgendaField({ value, onChange }: FormProps) {
  const agenda = value.lists.agenda ?? []
  const listRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ from: number; pointerId: number } | null>(null)
  const [slot, setSlot] = useState<number | null>(null)

  const move = (from: number, to: number) => {
    onChange(moveListItem('agenda', from, to))
    // Fokus idzie za przeniesionym punktem.
    requestAnimationFrame(() => listRef.current?.querySelectorAll<HTMLElement>('[data-agenda-grip]')[to]?.focus())
  }
  const centers = () =>
    [...(listRef.current?.querySelectorAll<HTMLElement>('[data-agenda-item]') ?? [])].map((el) => {
      const rect = el.getBoundingClientRect()
      return rect.top + rect.height / 2
    })
  const startDrag = (event: PointerEvent<HTMLButtonElement>, index: number) => {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { from: index, pointerId: event.pointerId }
  }
  const endDrag = (commit: boolean) => {
    const state = drag.current
    drag.current = null
    if (state && commit && slot !== null) {
      const to = slotToIndex(state.from, slot)
      if (to !== state.from) move(state.from, to)
    }
    setSlot(null)
  }
  const dropLine = (show: boolean, edge: 'top' | 'bottom') =>
    show ? <span aria-hidden="true" className={`pointer-events-none absolute right-0 left-0 h-[3px] rounded-full bg-accent ${edge === 'top' ? '-top-[8px]' : '-bottom-[8px]'}`} /> : null

  return (
    <FormGroup title="Program">
      <div ref={listRef} className="flex flex-col gap-3">
      {agenda.map((item, index) => {
        const remove = () => onChange(removeListItem('agenda', index))
        const filled = AGENDA_COLUMNS.some((column) => Boolean(item[column.name]))
        return (
          <div key={index} data-agenda-item="" role="group" aria-label={`Punkt programu ${index + 1}`} className="relative flex flex-col gap-2 rounded-xl border border-border p-3">
            {dropLine(slot === index, 'top')}
            {dropLine(slot === agenda.length && index === agenda.length - 1, 'bottom')}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {agenda.length > 1 && (
                <button
                  type="button"
                  data-agenda-grip=""
                  aria-label={`Przesuń punkt ${index + 1} (przeciągnij albo strzałki w górę i w dół)`}
                  title="Przeciągnij, żeby zmienić kolejność"
                  className={`-ml-1 inline-flex size-7 touch-none items-center justify-center rounded-md text-muted hover:bg-fg/[0.07] hover:text-fg ${slot !== null ? 'cursor-grabbing' : 'cursor-grab'}`}
                  onPointerDown={(event) => startDrag(event, index)}
                  onPointerMove={(event) => {
                    if (drag.current?.pointerId === event.pointerId) setSlot(dropSlot(event.clientY, centers()))
                  }}
                  onPointerUp={() => endDrag(true)}
                  onPointerCancel={() => endDrag(false)}
                  onKeyDown={(event) => {
                    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
                    event.preventDefault()
                    move(index, index + (event.key === 'ArrowUp' ? -1 : 1))
                  }}
                >
                  <Icon name="grip" />
                </button>
              )}
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
              {AGENDA_COLUMNS.map((column) => {
                const control = {
                  size: 'sm' as const,
                  'aria-label': `${column.label}, punkt ${index + 1}`,
                  placeholder: column.placeholder,
                  value: toPlain(item[column.name] ?? ''),
                  onChange: (e: { target: { value: string } }) =>
                    onChange(setListItemField('agenda', index, column.name, applyPlainEdit(item[column.name] ?? '', e.target.value))),
                  className: column.className,
                }
                return column.type === 'textarea' ? <Textarea key={column.name} rows={2} {...control} className={`${column.className ?? ''} min-h-0! field-sizing-content`} /> : <Input key={column.name} type={column.type} {...control} />
              })}
            </div>
          </div>
        )
      })}
      </div>
      <Button icon="plus" className="self-start" onClick={() => onChange(addListItem('agenda'))}>
        Dodaj punkt programu
      </Button>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 cursor-pointer accent-accent"
          checked={value.fillAgenda}
          onChange={(e) => onChange(setFillAgenda(e.target.checked))}
        />
        Dopasuj program: rozłóż punkty na całą wysokość, a gdy się nie mieszczą, wydłuż kwadrat
      </label>
    </FormGroup>
  )
}

// Formularz Konferencji - pola nagłówka i stopki + program.
export function FormKonferencja(props: FormProps) {
  return (
    <PosterForm {...props} fields={KONFERENCJA_FIELDS} qrInlineOnly>
      <AgendaField {...props} />
    </PosterForm>
  )
}
