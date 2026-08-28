import { PLACEHOLDERS } from '../posters/fallback'
import { FormField } from './FormField'
import { LogoField } from './LogoField'

// Formularz dla Konferencji - krótszy zestaw pól (bez podtytułu,
// prelegenta i godziny) + powtarzalna lista punktów programu + logo PK.
export function FormKonferencja({ value, onFieldChange, onLogoChange, onLogoEnabledChange, onListItemAdd, onListItemChange, onListItemRemove }) {
  const agenda = value.lists.agenda ?? []

  return (
    <form className="image-form" onSubmit={(e) => e.preventDefault()}>
      <FormField type="text" label="Etykieta nagłówka" placeholder="SEMINARIUM SKNM" value={value.badge} onChange={(v) => onFieldChange('badge', v)} />
      <FormField type="text" label="Tytuł" placeholder={PLACEHOLDERS.title} value={value.title} onChange={(v) => onFieldChange('title', v)} />
      <FormField type="date" label="Data" placeholder={PLACEHOLDERS.event_date} value={value.event_date} onChange={(v) => onFieldChange('event_date', v)} />
      <FormField type="text" label="Lokalizacja" placeholder={PLACEHOLDERS.location} value={value.location} onChange={(v) => onFieldChange('location', v)} />
      <FormField type="text" label="Etykieta stopki" placeholder="WIĘCEJ INFORMACJI" value={value.badge2} onChange={(v) => onFieldChange('badge2', v)} />

      <div className="field-list">
        <span className="image-upload-label">Program konferencji</span>
        {agenda.map((item, index) => (
          <div key={index} className="field-list-row">
            <input
              type="time"
              placeholder="Godzina"
              value={item.time ?? ''}
              onChange={(e) => onListItemChange('agenda', index, 'time', e.target.value)}
              className="field-list-input-small"
            />
            <input
              type="text"
              placeholder="Nazwa punktu programu"
              value={item.title ?? ''}
              onChange={(e) => onListItemChange('agenda', index, 'title', e.target.value)}
              className="field-list-input"
            />
            <input
              type="text"
              placeholder="Prelegent / opis (opcjonalnie)"
              value={item.subtitle ?? ''}
              onChange={(e) => onListItemChange('agenda', index, 'subtitle', e.target.value)}
              className="field-list-input"
            />
            <button type="button" className="field-list-remove" onClick={() => onListItemRemove('agenda', index)} aria-label="Usuń">
              Usuń
            </button>
          </div>
        ))}
        <button type="button" className="field-list-add" onClick={() => onListItemAdd('agenda')}>
          + Dodaj punkt programu
        </button>
      </div>

      <LogoField fieldKey="pk" label="Logo PK" value={value} onChange={onLogoChange} onEnabledChange={onLogoEnabledChange} />
    </form>
  )
}
