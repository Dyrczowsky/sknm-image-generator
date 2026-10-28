import type { FieldSpec } from '../../slides/defineSlide'
import { layoutOf } from '../../slides/komponenty'
import { EMPTY_PHOTO, photoSrc } from '../../slides/types'
import type { PhotoValue, Slide, SlideAspect, SlideData, SlideItem, SlideThemeKey, SlideValue } from '../../slides/types'
import { ImageUpload } from '../ImageUpload'
import { UI_HEADING, UI_HINT, UI_LABEL } from '../styles'
import { Button, Field, Icon, IconButton, Input, Popover, Select, Textarea } from '../ui'
import { LayoutGallery } from './LayoutGallery'

interface InspectorProps {
  slide: Slide
  theme: SlideThemeKey
  aspect: SlideAspect
  // `historyKey` skleja kolejne zmiany tego samego pola (pisanie, suwak kadru) w jedno cofnięcie.
  onData: (key: string, value: SlideValue, historyKey?: string) => void
  onChangeLayout: (layoutKey: string) => void
}

type Spec = FieldSpec<SlideData>
type ListSpec = Extract<Spec, { kind: 'list' }>

const asPhoto = (value: SlideValue | undefined): PhotoValue =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : EMPTY_PHOTO
const asItems = (value: SlideValue | undefined): SlideItem[] => (Array.isArray(value) ? value : [])

// Zamiana dwóch pozycji listy (przenieś w górę / w dół).
function swapItems<T>(items: readonly T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) return [...items]
  return items.map((item, i) => (i === from ? items[to] : i === to ? items[from] : item))
}

// Prawy panel: to, czego nie da się zmienić klikając w slajd - zdjęcia,
// listy, warianty, przełączniki. Pola wynikają z `fields` układu.
export function Inspector({ slide, theme, aspect, onData, onChangeLayout }: InspectorProps) {
  const layout = layoutOf(slide.layout)
  if (!layout) return null
  const data = { ...layout.defaults, ...slide.data }

  return (
    <section aria-label="Właściwości slajdu" className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface">
      <header className="flex flex-none items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Icon name={layout.icon} className="text-muted" />
          <h2 className={`${UI_HEADING} truncate`}>{layout.label}</h2>
        </div>
        <Popover
          label="Zmień układ"
          align="end"
          className="max-h-[70dvh] overflow-y-auto"
          trigger={(props) => (
            <Button {...props} variant="ghost" iconEnd="chevronDown">
              Zmień układ
            </Button>
          )}
        >
          {(close) => (
            <div className="flex flex-col gap-3">
              <p className={UI_HINT}>Treść, która pasuje do nowego układu, zostanie przeniesiona.</p>
              <LayoutGallery
                theme={theme}
                aspect={aspect}
                onPick={(key) => {
                  close()
                  onChangeLayout(key)
                }}
              />
            </div>
          )}
        </Popover>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 min-[900px]:overflow-y-auto min-[900px]:[scrollbar-gutter:stable]">
        {layout.fields.length === 0 ? (
          <p className={UI_HINT}>Ten układ edytujesz bezpośrednio na slajdzie.</p>
        ) : (
          layout.fields.map((field) => <FieldControl key={`${slide.id}:${field.key}`} field={field} value={data[field.key]} onData={onData} />)
        )}
      </div>
    </section>
  )
}

interface FieldControlProps {
  field: Spec
  value: SlideValue | undefined
  onData: InspectorProps['onData']
}

function FieldControl({ field, value, onData }: FieldControlProps) {
  switch (field.kind) {
    case 'photo': {
      const photo = asPhoto(value)
      return (
        <ImageUpload
          label={field.label}
          value={photoSrc(photo)}
          onChange={(src) => onData(field.key, { ...photo, src, ...(src ? {} : { x: 50, y: 50, zoom: 1 }) })}
          position={{ x: photo.x, y: photo.y, zoom: photo.zoom }}
          onPositionChange={(next) => onData(field.key, { ...photo, ...next }, `${field.key}:kadr`)}
        />
      )
    }
    case 'list':
      return <ListField field={field} items={asItems(value)} onChange={(items, historyKey) => onData(field.key, items, historyKey)} />
    case 'select':
      return (
        <Field label={field.label}>
          <Select value={typeof value === 'string' ? value : ''} onChange={(event) => onData(field.key, event.target.value)}>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      )
    case 'toggle':
      return (
        <label className="flex cursor-pointer items-center gap-2.5 text-[0.875rem]">
          <input type="checkbox" className="size-4 flex-none cursor-pointer accent-[var(--accent)]" checked={value === true} onChange={(event) => onData(field.key, event.target.checked)} />
          <span className={UI_LABEL}>{field.label}</span>
        </label>
      )
    case 'text':
      return (
        <Field label={field.label}>
          <Input value={typeof value === 'string' ? value : ''} placeholder={field.placeholder} onChange={(event) => onData(field.key, event.target.value, field.key)} />
        </Field>
      )
  }
}

interface ListFieldProps {
  field: ListSpec
  items: SlideItem[]
  onChange: (items: SlideItem[], historyKey?: string) => void
}

function ListField({ field, items, onChange }: ListFieldProps) {
  const min = field.min ?? 0
  const max = field.max ?? Infinity
  const canAdd = items.length < max
  const canRemove = items.length > min
  const setItem = (index: number, key: string, text: string) =>
    onChange(items.map((item, i) => (i === index ? { ...item, [key]: text } : item)), `${field.key}.${index}.${key}`)

  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-2.5 border-0 p-0">
      <legend className={`${UI_LABEL} mb-2.5 flex w-full items-center justify-between gap-2 p-0`}>
        <span>
          {field.label} <span className="font-normal text-muted">({items.length}{Number.isFinite(max) ? ` z ${max}` : ''})</span>
        </span>
      </legend>
      <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
        {items.map((item, index) => {
          const name = `${field.itemLabel} ${index + 1}`
          return (
            <li key={index} className="flex flex-col gap-2 rounded-xl border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[0.8125rem] font-semibold text-muted">{name}</span>
                <span className="flex items-center gap-0.5">
                  <IconButton icon="arrowUp" label={`Przenieś w górę: ${name}`} disabled={index === 0} onClick={() => onChange(swapItems(items, index, index - 1))} />
                  <IconButton icon="arrowDown" label={`Przenieś w dół: ${name}`} disabled={index === items.length - 1} onClick={() => onChange(swapItems(items, index, index + 1))} />
                  <IconButton icon="trash" label={`Usuń: ${name}`} disabled={!canRemove} onClick={() => onChange(items.filter((_, i) => i !== index))} />
                </span>
              </div>
              {field.itemFields.map((itemField) => (
                <Field key={itemField.key} label={itemField.label}>
                  {itemField.multiline ? (
                    <Textarea size="sm" rows={3} value={item[itemField.key] ?? ''} onChange={(event) => setItem(index, itemField.key, event.target.value)} />
                  ) : (
                    <Input size="sm" value={item[itemField.key] ?? ''} onChange={(event) => setItem(index, itemField.key, event.target.value)} />
                  )}
                </Field>
              ))}
            </li>
          )
        })}
      </ol>
      <Button icon="plus" disabled={!canAdd} onClick={() => onChange([...items, { ...field.newItem }])} className="self-start">
        {`Dodaj: ${field.itemLabel.toLowerCase()}`}
      </Button>
      {!canAdd && <p className={UI_HINT}>Ten układ mieści najwyżej {max} pozycji.</p>}
    </fieldset>
  )
}
