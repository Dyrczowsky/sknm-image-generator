import { PLACEHOLDERS } from '../posters/fallback'

const FIELDS = [
  { name: 'title', label: 'Tytuł', type: 'text', placeholder: PLACEHOLDERS.title },
  { name: 'subtitle', label: 'Opis / podtytuł', type: 'text' },
  { name: 'speaker', label: 'Prelegent / organizator', type: 'text', placeholder: PLACEHOLDERS.speaker },
  { name: 'event_date', label: 'Data', type: 'date', placeholder: PLACEHOLDERS.event_date },
  { name: 'event_time', label: 'Godzina', type: 'time', placeholder: PLACEHOLDERS.event_time },
  { name: 'location', label: 'Lokalizacja', type: 'text', placeholder: PLACEHOLDERS.location },
]

export function ImageForm({ value, onChange }) {
  return (
    <form className="image-form" onSubmit={(e) => e.preventDefault()}>
      {FIELDS.map((field) => (
        <label key={field.name} className="image-form-field">
          {field.label}
          <input
            type={field.type}
            placeholder={field.placeholder}
            value={value[field.name] ?? ''}
            onChange={(e) => onChange(field.name, e.target.value)}
          />
        </label>
      ))}
    </form>
  )
}
