import { posterRegistry } from '../posters/registry'
import { PosterScaled } from './PosterScaled'
import type { RawPosterData, TemplateRow } from '../types'

const THUMB_SIZE = 180

interface TemplateSelectorProps {
  templates: TemplateRow[]
  selectedId: number | null
  onSelect: (id: number) => void
}

// Miniatury zawsze pokazują dane przykładowe (placeholder) - nie muszą się
// aktualizować na żywo wraz z formularzem, to robi tylko duży podgląd.
// Wybór kolorystyki jest osobno, pod podglądem (SchemeSelector).
const THUMB_DATA: RawPosterData = {}

export function TemplateSelector({ templates, selectedId, onSelect }: TemplateSelectorProps) {
  return (
    <div className="flex flex-wrap gap-3.5">
      {templates.map((tpl) => {
        const entry = posterRegistry[tpl.poster_key]
        if (!entry) return null
        const { Component } = entry
        const isActive = tpl.id === selectedId
        return (
          <button
            key={tpl.id}
            type="button"
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-[10px] border-2 bg-transparent p-1.5 text-[0.8rem] text-fg transition-[border-color,transform] hover:-translate-y-0.5 ${
              isActive ? 'border-accent' : 'border-transparent'
            }`}
            onClick={() => onSelect(tpl.id)}
          >
            <div className="overflow-hidden rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.12)]">
              <PosterScaled size={THUMB_SIZE}>
                <Component data={THUMB_DATA} scheme={undefined} />
              </PosterScaled>
            </div>
            <span>{entry.name}</span>
          </button>
        )
      })}
    </div>
  )
}
