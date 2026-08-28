import { posterRegistry } from '../posters/registry'
import { PosterScaled } from './PosterScaled'

const THUMB_SIZE = 180
const SWATCH_SIZE = 64

// Miniatury zawsze pokazują dane przykładowe (placeholder) - nie muszą się
// aktualizować na żywo wraz z formularzem, to robi tylko duży podgląd.
const THUMB_DATA = {}

// Grupuje szablony po `family` (patrz registry.js) - warianty kolorystyczne
// tego samego layoutu (np. Wykład) dostają jedną wspólną kafelkę zamiast
// osobnej dla każdego koloru. Kolejność grup odpowiada kolejności pierwszego
// wystąpienia w `templates` (czyli kolejności w DEFAULT_TEMPLATES).
function groupByFamily(templates) {
  const groups = new Map()
  for (const tpl of templates) {
    const poster = posterRegistry[tpl.poster_key]
    if (!poster) continue
    const key = poster.family ?? tpl.poster_key
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(tpl)
  }
  return [...groups.values()]
}

export function TemplateSelector({ templates, selectedId, onSelect }) {
  const groups = groupByFamily(templates)
  const activeGroup = groups.find((members) => members.some((m) => m.id === selectedId))

  return (
    <div>
      <div className="template-selector">
        {groups.map((members) => {
          const primary = members[0]
          const poster = posterRegistry[primary.poster_key]
          const { Component } = poster
          const isActive = members.some((m) => m.id === selectedId)
          const targetId = isActive ? selectedId : primary.id

          return (
            <button
              key={primary.poster_key}
              type="button"
              className={`template-thumb${isActive ? ' is-selected' : ''}`}
              onClick={() => onSelect(targetId)}
            >
              <PosterScaled size={THUMB_SIZE}>
                <Component data={THUMB_DATA} />
              </PosterScaled>
              <span>{poster.familyLabel ?? primary.name}</span>
            </button>
          )
        })}
      </div>

      {activeGroup && activeGroup.length > 1 && (
        <div className="color-variant-selector">
          <span className="color-variant-label">Kolorystyka</span>
          <div className="color-variant-row">
            {activeGroup.map((tpl) => {
              const poster = posterRegistry[tpl.poster_key]
              const { Component } = poster
              return (
                <button
                  key={tpl.id}
                  type="button"
                  className={`color-variant-thumb${tpl.id === selectedId ? ' is-selected' : ''}`}
                  onClick={() => onSelect(tpl.id)}
                >
                  <PosterScaled size={SWATCH_SIZE}>
                    <Component data={THUMB_DATA} />
                  </PosterScaled>
                  <span>{poster.colorLabel}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
