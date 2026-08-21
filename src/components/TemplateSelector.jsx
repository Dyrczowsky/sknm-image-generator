import { posterRegistry } from '../posters/registry'
import { PosterScaled } from './PosterScaled'

const THUMB_SIZE = 180

// Miniatury zawsze pokazują dane przykładowe (placeholder) - nie muszą się
// aktualizować na żywo wraz z formularzem, to robi tylko duży podgląd.
const THUMB_DATA = {}

export function TemplateSelector({ templates, selectedId, onSelect }) {
  return (
    <div className="template-selector">
      {templates.map((tpl) => {
        const poster = posterRegistry[tpl.poster_key]
        if (!poster) return null
        const { Component } = poster
        return (
          <button
            key={tpl.id}
            type="button"
            className={`template-thumb${tpl.id === selectedId ? ' is-selected' : ''}`}
            onClick={() => onSelect(tpl.id)}
          >
            <PosterScaled size={THUMB_SIZE}>
              <Component data={THUMB_DATA} />
            </PosterScaled>
            <span>{tpl.name}</span>
          </button>
        )
      })}
    </div>
  )
}
