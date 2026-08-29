import { posterRegistry } from '../posters/registry'
import { SCHEME_LABELS } from '../posters/schemes'
import { PosterScaled } from './PosterScaled'

const THUMB_SIZE = 180
const SWATCH_SIZE = 64

// Miniatury zawsze pokazują dane przykładowe (placeholder) - nie muszą się
// aktualizować na żywo wraz z formularzem, to robi tylko duży podgląd.
const THUMB_DATA = {}

export function TemplateSelector({ templates, selectedId, selectedScheme, onSelect, onSelectScheme }) {
  const selected = templates.find((t) => t.id === selectedId)
  const selectedEntry = selected ? posterRegistry[selected.poster_key] : null
  const schemeList = selectedEntry?.schemes ?? []
  const SwatchComponent = selectedEntry?.Component

  return (
    <div>
      <div className="template-selector">
        {templates.map((tpl) => {
          const entry = posterRegistry[tpl.poster_key]
          if (!entry) return null
          const { Component } = entry
          const isActive = tpl.id === selectedId
          return (
            <button
              key={tpl.id}
              type="button"
              className={`template-thumb${isActive ? ' is-selected' : ''}`}
              onClick={() => onSelect(tpl.id)}
            >
              <PosterScaled size={THUMB_SIZE}>
                <Component data={THUMB_DATA} scheme={entry.schemes?.[0]} />
              </PosterScaled>
              <span>{entry.name}</span>
            </button>
          )
        })}
      </div>

      {schemeList.length > 1 && (
        <div className="color-variant-selector">
          <span className="color-variant-label">Kolorystyka</span>
          <div className="color-variant-row">
            {schemeList.map((name) => (
              <button
                key={name}
                type="button"
                className={`color-variant-thumb${name === selectedScheme ? ' is-selected' : ''}`}
                onClick={() => onSelectScheme(name)}
              >
                <PosterScaled size={SWATCH_SIZE}>
                  <SwatchComponent data={THUMB_DATA} scheme={name} />
                </PosterScaled>
                <span>{SCHEME_LABELS[name] ?? name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
