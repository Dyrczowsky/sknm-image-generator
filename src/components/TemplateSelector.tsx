import { posterRegistry } from '../posters/registry'
import { SCHEME_LABELS } from '../posters/schemes'
import { PosterScaled } from './PosterScaled'
import type { TemplateRow } from '../types'
import type { RawPosterData } from '../types'

const THUMB_SIZE = 180
const SWATCH_SIZE = 64

interface TemplateSelectorProps {
  templates: TemplateRow[]
  selectedId: number | null
  selectedScheme: string | undefined
  onSelect: (id: number) => void
  onSelectScheme: (name: string) => void
}

// Miniatury zawsze pokazują dane przykładowe (placeholder) - nie muszą się
// aktualizować na żywo wraz z formularzem, to robi tylko duży podgląd.
const THUMB_DATA: RawPosterData = {}

export function TemplateSelector({ templates, selectedId, selectedScheme, onSelect, onSelectScheme }: TemplateSelectorProps) {
  const selected = templates.find((t) => t.id === selectedId)
  const selectedEntry = selected ? posterRegistry[selected.poster_key] : null
  const schemeList = selectedEntry?.schemes ?? []
  const SwatchComponent = selectedEntry?.Component

  return (
    <div>
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
                  <Component data={THUMB_DATA} scheme={entry.schemes?.[0]} />
                </PosterScaled>
              </div>
              <span>{entry.name}</span>
            </button>
          )
        })}
      </div>

      {schemeList.length > 1 && SwatchComponent && (
        <div className="mt-[18px] flex flex-col gap-2.5 border-t border-border pt-[18px]">
          <span className="text-[0.8rem] font-semibold uppercase tracking-[0.04em] text-muted">Kolorystyka</span>
          <div className="flex flex-wrap gap-2.5">
            {schemeList.map((name) => (
              <button
                key={name}
                type="button"
                className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 bg-transparent p-1 text-[0.72rem] transition-[border-color,transform] hover:-translate-y-0.5 ${
                  name === selectedScheme ? 'border-accent text-fg' : 'border-transparent text-muted'
                }`}
                onClick={() => onSelectScheme(name)}
              >
                <div className="overflow-hidden rounded-[5px] shadow-[0_1px_2px_rgba(0,0,0,0.12)]">
                  <PosterScaled size={SWATCH_SIZE}>
                    <SwatchComponent data={THUMB_DATA} scheme={name} />
                  </PosterScaled>
                </div>
                <span>{SCHEME_LABELS[name] ?? name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
