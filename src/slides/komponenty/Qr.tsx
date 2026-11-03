import { QrSlot } from '../../posters/blocks/QrSlot'
import { defineSlide, useSlideAspect, useSlideEdit, useSlideRender } from '../defineSlide'
import { AutoFit, EditableText, Kicker, SlideFrame, fit, fontMono } from './_wspolne'

// Kod QR z linku + tekst zachęty (16:9: tekst | QR, 1:1: tekst nad QR).
// „Odwrócony" zamienia strony.

const defaults = {
  kicker: 'Dołącz do nas',
  heading: 'Zeskanuj i zapisz się',
  text: 'Wystarczy telefon i chwila. Nie trzeba nic umieć ani nic przygotowywać.',
  url: 'https://sknm.pk.edu.pl',
}

function Qr({ data }: { data: typeof defaults }) {
  const square = useSlideAspect() === '1:1'
  const { mirrored } = useSlideRender()
  const { editable } = useSlideEdit()
  const size = square ? 460 : 420

  const text = (
    <div style={{ order: square ? 1 : mirrored ? 2 : 0, minWidth: 0 }}>
      <Kicker path="kicker" value={data.kicker} />
      <AutoFit id="heading" style={{ maxHeight: square ? 240 : 270 }}>
        <EditableText
          as="h2"
          path="heading"
          value={data.heading}
          placeholder="Nagłówek"
          style={{ margin: 0, fontSize: fit(74), lineHeight: 1.05, fontWeight: 800, letterSpacing: '-.025em', color: 'var(--s-accent)', textWrap: 'balance' }}
        />
      </AutoFit>
      {(data.text || editable) && (
        <AutoFit id="text" style={{ maxHeight: 220 }}>
          <EditableText
            as="p"
            path="text"
            value={data.text}
            multiline
            placeholder="Opis"
            style={{ margin: 0, marginTop: 30, maxWidth: 700, fontSize: fit(29), lineHeight: 1.45, color: 'var(--s-fg)', textWrap: 'pretty' }}
          />
        </AutoFit>
      )}
    </div>
  )

  const panel = (
    <div
      style={{
        order: square ? 2 : mirrored ? 0 : 2,
        justifySelf: square ? 'center' : mirrored ? 'start' : 'end',
        boxSizing: 'border-box',
        padding: 32,
        background: 'var(--s-soft)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        ['--qr' as string]: 'var(--s-fg)',
      }}
    >
      <QrSlot value={data.url} size={size} />
      {(data.url || editable) && (
        <EditableText
          path="url"
          value={data.url}
          placeholder="https://…"
          style={{ fontFamily: fontMono, fontSize: 22, fontWeight: 700, letterSpacing: '.04em', color: 'var(--s-soft-fg)' }}
        />
      )}
    </div>
  )

  return (
    <SlideFrame>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: square ? '1fr' : mirrored ? 'auto 1fr' : '1fr auto',
          gap: square ? 48 : 80,
          alignContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        {text}
        {panel}
      </div>
    </SlideFrame>
  )
}

export default defineSlide({
  key: 'qr',
  label: 'Kod QR',
  description: 'Kod QR z linku obok krótkiego zaproszenia.',
  group: 'wydarzenie',
  icon: 'qr',
  defaults,
  fields: [{ kind: 'text', key: 'url', label: 'Link w kodzie QR', placeholder: 'https://…' }],
  Component: Qr,
})
