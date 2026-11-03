import { defineSlide, useSlideAspect, useSlideEdit, useSlideRender } from '../defineSlide'
import { EMPTY_PHOTO } from '../types'
import { AutoFit, Chip, EditableText, Kicker, PhotoFigure, SlideFrame, Step, fit } from './_wspolne'

// Tekst z jednym lub dwoma zdjęciami (16:9: tekst | zdjęcia, 1:1: tekst nad zdjęciami).
// „Odwrócony" (mirrored) zamienia strony.

const defaults = {
  kicker: 'O nas',
  heading: 'Matematyka po zajęciach',
  lead: 'Spotykamy się, żeby robić matematykę dla przyjemności: referaty, zadania i długie rozmowy po zajęciach.',
  lead2: 'Zaglądnij na kolejne spotkanie - każdy jest mile widziany.',
  place: '',
  photo: { ...EMPTY_PHOTO },
  photo2: { ...EMPTY_PHOTO },
  caption: 'Pierwsze spotkanie',
  showPhoto2: true,
}

const leadStyle = { margin: 0, lineHeight: 1.45, color: 'var(--s-fg)', textWrap: 'pretty' } as const

function TekstZdjecia({ data }: { data: typeof defaults }) {
  const square = useSlideAspect() === '1:1'
  const { mirrored } = useSlideRender()
  const { editable } = useSlideEdit()
  const two = data.showPhoto2
  const showLead2 = !!data.lead2 || editable
  const showPlace = !!data.place || editable

  const text = (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: square ? 'flex-start' : 'center', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <Kicker path="kicker" value={data.kicker} style={{ marginBottom: 26 }} />
        {showPlace && (
          <Chip style={{ marginBottom: 26, fontSize: 19, padding: '6px 16px' }}>
            <EditableText as="span" path="place" value={data.place} placeholder="Miejsce" />
          </Chip>
        )}
      </div>
      <AutoFit id="heading" style={{ maxHeight: square ? 170 : 240 }}>
        <EditableText
          as="h2"
          path="heading"
          value={data.heading}
          placeholder="Nagłówek"
          style={{ margin: 0, fontSize: fit(square ? 72 : 74), lineHeight: 1.05, fontWeight: 800, letterSpacing: '-.025em', color: 'var(--s-accent)', textWrap: 'balance' }}
        />
      </AutoFit>
      <AutoFit id="lead" style={{ marginTop: square ? 24 : 30, maxHeight: square ? 170 : 330, maxWidth: square ? 900 : 560 }}>
        <EditableText as="p" path="lead" value={data.lead} multiline placeholder="Akapit tekstu" style={{ ...leadStyle, fontSize: fit(square ? 27 : 29) }} />
        {showLead2 && (
          <EditableText
            as="p"
            path="lead2"
            value={data.lead2}
            multiline
            placeholder="Drugi akapit (opcjonalnie)"
            style={{ ...leadStyle, marginTop: 18, fontSize: fit(square ? 27 : 29) }}
          />
        )}
      </AutoFit>
    </div>
  )

  // Strona zdjęć: w kwadracie lustro zamienia lewą i prawą.
  const flip = square && mirrored
  const side = (px: number) => (flip ? { right: px } : { left: px })
  const otherSide = (px: number) => (flip ? { left: px } : { right: px })
  const fill = { position: 'absolute', inset: 0, pointerEvents: 'none' } as const
  const live = { pointerEvents: 'auto' } as const

  let mainBox
  if (two) {
    mainBox = square
      ? { ...side(0), top: 0, width: 610, height: 458 }
      : { left: 0, top: 0, width: 590, height: 442 }
  } else {
    mainBox = square
      ? { ...side(0), top: 0, width: 'calc(100% - 16px)', height: 'calc(100% - 16px)' }
      : { left: 0, top: 44, width: 714, height: 580 }
  }
  const secondBox = square
    ? { ...otherSide(0), bottom: 0, width: 440, height: 330 }
    : { right: mirrored ? 16 : 0, bottom: 44, width: 400, height: 300 }

  const photos = (
    <div style={{ position: 'relative', height: square ? 458 : 700, marginBottom: square ? 44 : 0, flexShrink: 0 }}>
      <Step index={1} style={fill}>
        <PhotoFigure
          photo={data.photo}
          variant="cien"
          caption={two ? undefined : { path: 'caption', value: data.caption }}
          style={{ position: 'absolute', ...live, ...mainBox }}
        />
      </Step>
      {two && (
        <Step index={2} style={fill}>
          <PhotoFigure
            photo={data.photo2}
            variant="ramka"
            caption={{ path: 'caption', value: data.caption }}
            style={{ position: 'absolute', ...live, ...secondBox }}
          />
        </Step>
      )}
    </div>
  )

  if (square) {
    return (
      <SlideFrame>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 44 }}>
          <div style={{ flex: 1, minHeight: 0 }}>{text}</div>
          {photos}
        </div>
      </SlideFrame>
    )
  }
  return (
    <SlideFrame>
      <div style={{ display: 'grid', gridTemplateColumns: mirrored ? '1fr 590px' : '590px 1fr', gap: 70, height: '100%', alignItems: 'center' }}>
        <div style={{ order: mirrored ? 2 : 0, height: '100%', minHeight: 0 }}>{text}</div>
        {photos}
      </div>
    </SlideFrame>
  )
}

export default defineSlide({
  key: 'tekstZdjecia',
  label: 'Tekst i zdjęcia',
  description: 'Nagłówek z akapitami i jednym lub dwoma zdjęciami obok.',
  group: 'zdjecia',
  icon: 'slidePhotoText',
  defaults,
  fields: [
    { kind: 'photo', key: 'photo', label: 'Zdjęcie główne' },
    { kind: 'toggle', key: 'showPhoto2', label: 'Drugie zdjęcie w ramce' },
    { kind: 'photo', key: 'photo2', label: 'Drugie zdjęcie' },
  ],
  steps: (data) => (data.showPhoto2 ? 2 : 1),
  Component: TekstZdjecia,
})
