import type { FormProps } from '../types'
import { PLACEHOLDERS } from '../posters/fallback'
import { FormField } from './FormField'
import { GraphicsField } from './GraphicsField'

// Formularz dla Konferencji - krótszy zestaw pól (bez podtytułu,
// prelegenta i godziny) + powtarzalna lista punktów programu + logo PK.
export function FormKonferencja({ value, onFieldChange, onVisibilityChange, onGraphicsAdd, onGraphicRemove, onGraphicMove, onShowPkChange, onQrUrlChange, onListItemAdd, onListItemChange, onListItemRemove }: FormProps) {
  const agenda = value.lists.agenda ?? []
  const vis = { visibility: value.visibility, onVisibilityChange }
  const gfx = { value, onGraphicsAdd, onGraphicRemove, onGraphicMove, onShowPkChange, onQrUrlChange }

  return (
    <form className="flex flex-col gap-3.5" onSubmit={(e) => e.preventDefault()}>
      <FormField name="badge" {...vis} type="text" label="Etykieta nagłówka" placeholder="SEMINARIUM SKNM" value={value.badge} onChange={(v) => onFieldChange('badge', v)} />
      <FormField name="title" {...vis} type="text" label="Tytuł" placeholder={PLACEHOLDERS.title} value={value.title} onChange={(v) => onFieldChange('title', v)} />
      <FormField name="event_date" {...vis} type="date" label="Data" placeholder={PLACEHOLDERS.event_date} value={value.event_date} onChange={(v) => onFieldChange('event_date', v)} />
      <FormField name="location" {...vis} type="text" label="Lokalizacja" placeholder={PLACEHOLDERS.location} value={value.location} onChange={(v) => onFieldChange('location', v)} />
      <FormField name="badge2" {...vis} type="text" label="Etykieta stopki" placeholder="WIĘCEJ INFORMACJI" value={value.badge2} onChange={(v) => onFieldChange('badge2', v)} />

      <div className="mt-[18px] flex flex-col gap-2.5 border-t border-border pt-[18px]">
        <span className="text-[0.9rem] font-medium">Program konferencji</span>
        {agenda.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="time"
              placeholder="Godzina"
              value={item.time ?? ''}
              onChange={(e) => onListItemChange('agenda', index, 'time', e.target.value)}
              className="w-[100px] flex-none rounded-lg border border-field-border bg-field px-3 py-[9px] text-[0.9rem] text-fg"
            />
            <input
              type="text"
              placeholder="Nazwa punktu programu"
              value={item.title ?? ''}
              onChange={(e) => onListItemChange('agenda', index, 'title', e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-field-border bg-field px-3 py-[9px] text-[0.9rem] text-fg"
            />
            <input
              type="text"
              placeholder="Prelegent / opis (opcjonalnie)"
              value={item.subtitle ?? ''}
              onChange={(e) => onListItemChange('agenda', index, 'subtitle', e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-field-border bg-field px-3 py-[9px] text-[0.9rem] text-fg"
            />
            <button
              type="button"
              className="flex-none rounded-lg border border-field-border bg-transparent px-3 py-[9px] text-[0.8rem] text-muted transition-[border-color,color] hover:border-danger hover:text-danger"
              onClick={() => onListItemRemove('agenda', index)}
              aria-label="Usuń"
            >
              Usuń
            </button>
          </div>
        ))}
        <button
          type="button"
          className="self-start rounded-lg border border-dashed border-field-border bg-transparent px-4 py-[9px] text-[0.85rem] text-accent transition-[border-color,background-color] hover:border-accent hover:bg-accent-soft"
          onClick={() => onListItemAdd('agenda')}
        >
          + Dodaj punkt programu
        </button>
      </div>

      <GraphicsField {...gfx} />
    </form>
  )
}
