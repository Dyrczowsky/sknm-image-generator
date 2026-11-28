import { useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import type { FormProps } from '../types'
import { Button, ConfirmButton, Field, Icon, Input, Select, Textarea } from '../components/ui'
import { ImageUpload } from '../components/ImageUpload'
import { SegmentedToggle } from '../components/SegmentedToggle'
import { UI_LABEL } from '../components/styles'
import { addBlock, loadSampleBlocks, moveListItem, removeListItem, setListItemField, setQrUrl, addListItem } from '../editor/formState'
import { dropSlot, slotToIndex } from '../slides/useDeckEditor'
import { BLOCKS_LIST, BLOCK_LABELS, BLOCK_TYPES, CALLOUT_LABELS, CONTACT_FIELDS, CONTACT_LIST, isBlockType } from '../posters/naukowy/blocks'
import type { BlockType, CalloutTone, ContactField } from '../posters/naukowy/blocks'
import { useBlocksOverflow } from '../posters/naukowy/overflow'
import type { ListItem } from '../types'
import { FormGroup, PANEL_STACK } from './FormGroup'

const CONTACT_LABELS: Record<ContactField, string> = {
  email: 'E-mail',
  www: 'Strona www',
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
}

const SIDES = [
  { value: 'left', label: 'Zdjęcie z lewej' },
  { value: 'right', label: 'Zdjęcie z prawej' },
] as const

const preview = (item: ListItem) => (item.title || item.text || item.url || '').split('\n')[0].slice(0, 40)

function BlocksField({ value, onChange }: FormProps) {
  const blocks = value.lists[BLOCKS_LIST] ?? []
  const listRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ from: number; pointerId: number } | null>(null)
  const [slot, setSlot] = useState<number | null>(null)
  const [adding, setAdding] = useState('')

  const move = (from: number, to: number) => {
    onChange(moveListItem(BLOCKS_LIST, from, to))
    requestAnimationFrame(() => listRef.current?.querySelectorAll<HTMLElement>('[data-block-grip]')[to]?.focus())
  }
  const centers = () =>
    [...(listRef.current?.querySelectorAll<HTMLElement>('[data-block-item]') ?? [])].map((el) => {
      const rect = el.getBoundingClientRect()
      return rect.top + rect.height / 2
    })
  const startDrag = (event: PointerEvent<HTMLButtonElement>, index: number) => {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { from: index, pointerId: event.pointerId }
  }
  const endDrag = (commit: boolean) => {
    const state = drag.current
    drag.current = null
    if (state && commit && slot !== null) {
      const to = slotToIndex(state.from, slot)
      if (to !== state.from) move(state.from, to)
    }
    setSlot(null)
  }
  const dropLine = (show: boolean, edge: 'top' | 'bottom') =>
    show ? <span aria-hidden="true" className={`pointer-events-none absolute right-0 left-0 h-[3px] rounded-full bg-accent ${edge === 'top' ? '-top-[8px]' : '-bottom-[8px]'}`} /> : null

  return (
    <FormGroup title="Bloki treści">
      {blocks.length === 0 && (
        <div className="flex flex-col items-start gap-2 text-sm text-muted">
          Na podglądzie jest przykładowa treść. Dodaj pierwszy blok albo wczytaj przykład i go przerób.
          <Button variant="ghost" onClick={() => onChange(loadSampleBlocks)}>Wczytaj przykład do edycji</Button>
        </div>
      )}
      <div ref={listRef} className="flex flex-col gap-3">
        {blocks.map((item, index) => {
          const type: BlockType = isBlockType(item.type) ? item.type : 'text'
          const set = (name: string, v: string) => onChange(setListItemField(BLOCKS_LIST, index, name, v))
          const label = (name: string) => `${name}, blok ${index + 1}`
          const remove = () => onChange(removeListItem(BLOCKS_LIST, index))
          const filled = Boolean(item.title || item.text || item.photo || item.url)
          return (
            <div key={item.id ?? index} data-block-item="" role="group" aria-label={`Blok ${index + 1}: ${BLOCK_LABELS[type]}`} className="relative flex flex-col gap-2 rounded-xl border border-border p-3">
              {dropLine(slot === index, 'top')}
              {dropLine(slot === blocks.length && index === blocks.length - 1, 'bottom')}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {blocks.length > 1 && (
                  <button
                    type="button"
                    data-block-grip=""
                    aria-label={`Przesuń blok ${index + 1} (przeciągnij albo strzałki w górę i w dół)`}
                    title="Przeciągnij, żeby zmienić kolejność"
                    className={`-ml-1 inline-flex size-7 touch-none items-center justify-center rounded-md text-muted hover:bg-fg/[0.07] hover:text-fg ${slot !== null ? 'cursor-grabbing' : 'cursor-grab'}`}
                    onPointerDown={(event) => startDrag(event, index)}
                    onPointerMove={(event) => {
                      if (drag.current?.pointerId === event.pointerId) setSlot(dropSlot(event.clientY, centers()))
                    }}
                    onPointerUp={() => endDrag(true)}
                    onPointerCancel={() => endDrag(false)}
                    onKeyDown={(event) => {
                      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
                      event.preventDefault()
                      move(index, index + (event.key === 'ArrowUp' ? -1 : 1))
                    }}
                  >
                    <Icon name="grip" />
                  </button>
                )}
                <span className={UI_LABEL}>
                  {BLOCK_LABELS[type]}
                  {preview(item) && <span className="font-normal text-muted"> · {preview(item)}</span>}
                </span>
                {filled ? (
                  <ConfirmButton variant="ghost" icon="trash" className="ml-auto" question={`Usunąć blok ${index + 1}?`} onConfirm={remove}>
                    Usuń
                  </ConfirmButton>
                ) : (
                  <Button variant="ghost" icon="trash" className="ml-auto" onClick={remove}>
                    Usuń
                  </Button>
                )}
              </div>
              {type === 'callout' && (
                <Select size="sm" aria-label={label('Rodzaj ramki')} value={item.tone ?? 'twierdzenie'} onChange={(e) => set('tone', e.target.value)}>
                  {(Object.keys(CALLOUT_LABELS) as CalloutTone[]).map((tone) => (
                    <option key={tone} value={tone}>
                      {CALLOUT_LABELS[tone]}
                    </option>
                  ))}
                </Select>
              )}
              {(type === 'photo' || type === 'photoText') && (
                <ImageUpload label="Zdjęcie" value={item.photo || null} onChange={(src) => set('photo', src ?? '')} />
              )}
              {type === 'photoText' && (
                <SegmentedToggle ariaLabel={label('Strona zdjęcia')} options={SIDES} value={item.side === 'right' ? 'right' : 'left'} onChange={(side) => set('side', side)} />
              )}
              {type === 'qr' && <Input size="sm" aria-label={label('Adres w kodzie QR')} placeholder="https://…" value={item.url ?? ''} onChange={(e) => set('url', e.target.value)} />}
              {(type === 'heading' || type === 'callout' || type === 'bullets') && (
                <Input size="sm" aria-label={label(type === 'heading' ? 'Nagłówek' : type === 'bullets' ? 'Podtytuł listy' : 'Tytuł ramki')} placeholder={type === 'heading' ? 'Nagłówek' : type === 'bullets' ? 'Podtytuł (opcjonalnie)' : 'Tytuł (opcjonalnie)'} value={item.title ?? ''} onChange={(e) => set('title', e.target.value)} />
              )}
              {(type === 'photo' || type === 'qr') && (
                <Input size="sm" aria-label={label('Podpis')} placeholder="Podpis (opcjonalnie)" value={item.title ?? ''} onChange={(e) => set('title', e.target.value)} />
              )}
              {type !== 'heading' && type !== 'photo' && type !== 'qr' && (
                <Field label="Treść" labelHidden hint={type === 'bullets' ? 'Jedna linia = jeden punkt' : type === 'latex' ? 'Np. \\int_0^1 x^2\\,dx' : undefined}>
                  <Textarea
                    rows={type === 'latex' ? 2 : 3}
                    size="sm"
                    aria-label={label('Treść')}
                    placeholder={type === 'bullets' ? 'Punkt 1\nPunkt 2' : 'Treść'}
                    className={`min-h-0! field-sizing-content ${type === 'latex' ? 'font-mono' : ''}`}
                    value={item.text ?? ''}
                    onChange={(e) => set('text', e.target.value)}
                  />
                </Field>
              )}
            </div>
          )
        })}
      </div>
      <Select size="sm" aria-label="Dodaj blok" className="self-start" value={adding} onChange={(e) => {
        if (isBlockType(e.target.value)) onChange(addBlock(e.target.value))
        setAdding('')
      }}>
        <option value="">+ Dodaj blok…</option>
        {BLOCK_TYPES.map((type) => (
          <option key={type} value={type}>
            {BLOCK_LABELS[type]}
          </option>
        ))}
      </Select>
    </FormGroup>
  )
}

function FooterField({ value, onChange }: FormProps) {
  const contact = value.lists[CONTACT_LIST]?.[0] ?? {}
  // setListItemField nic nie robi na pustej liście - najpierw zakładamy wiersz.
  const setContact = (name: string, v: string) =>
    onChange((form) => setListItemField(CONTACT_LIST, 0, name, v)(form.lists[CONTACT_LIST]?.length ? form : addListItem(CONTACT_LIST)(form)))
  return (
    <FormGroup title="Stopka">
      {CONTACT_FIELDS.map((name) => (
        <Field key={name} label={CONTACT_LABELS[name]}>
          <Input size="sm" value={contact[name] ?? ''} onChange={(e) => setContact(name, e.target.value)} />
        </Field>
      ))}
      <Field label="Link w kodzie QR (stopka)">
        <Input size="sm" placeholder="https://…" value={value.qrUrl} onChange={(e) => onChange(setQrUrl(e.target.value))} />
      </Field>
    </FormGroup>
  )
}

// Formularz plakatu naukowego B2: strumień bloków + stopka.
export function FormPlakatNaukowy(props: FormProps) {
  const overflow = useBlocksOverflow()
  return (
    <div className={PANEL_STACK}>
      {overflow && (
        <p role="alert" className="m-0 rounded-lg bg-danger-soft px-3 py-2 text-[0.8125rem] leading-snug text-danger">
          Treść nie mieści się w 3 kolumnach — skróć bloki albo zmniejsz rozmiar tekstu w zakładce „Wygląd”.
        </p>
      )}
      <BlocksField {...props} />
      <FooterField {...props} />
    </div>
  )
}
