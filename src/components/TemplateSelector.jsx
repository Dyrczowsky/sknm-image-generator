import { posterRegistry } from '../posters/registry'
import { PosterScaled } from './PosterScaled'

const THUMB_SIZE = 130

export function TemplateSelector({ templates, selectedId, onSelect, data }) {
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
              <Component data={data} />
            </PosterScaled>
            <span>{tpl.name}</span>
          </button>
        )
      })}
    </div>
  )
}
