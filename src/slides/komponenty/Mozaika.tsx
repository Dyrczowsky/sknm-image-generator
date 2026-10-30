import { defineSlide, useSlideAspect, useSlideEdit, useSlideRender } from '../defineSlide'
import { EMPTY_PHOTO } from '../types'
import { AutoFit, Chip, EditableText, Kicker, PhotoFigure, SlideFrame, Step, fit } from './_wspolne'

// Mozaika 2×2 zdjęć + kolumna tekstu (16:9: mozaika | tekst, 1:1: tekst nad mozaiką).
// Zdjęcia pojawiają się po kolei (kroki 1-4). „Odwrócony" zamienia strony.

const defaults = {
  kicker: 'Nasza konferencja',
  heading: 'WSAD',
  fullName: 'Ogólnopolskie Warsztaty Statystyki i Analizy Danych',
  lead: 'Co roku organizujemy je na Politechnice Krakowskiej. Przed nami XV edycja: referaty, plakaty i warsztaty.',
  tags: [{ text: 'statystyka' }, { text: 'inżynieria finansowa' }, { text: 'machine learning' }],
  link: 'wsad.edu.pl',
  photo1: { ...EMPTY_PHOTO },
  photo2: { ...EMPTY_PHOTO },
  photo3: { ...EMPTY_PHOTO },
  photo4: { ...EMPTY_PHOTO },
}

function Mozaika({ data }: { data: typeof defaults }) {
  const square = useSlideAspect() === '1:1'
  const { mirrored } = useSlideRender()
  const { editable } = useSlideEdit()
  const photoH = square ? 252 : 318
  const photos = [data.photo1, data.photo2, data.photo3, data.photo4]

  const mosaic = (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, order: square ? 2 : mirrored ? 2 : 0 }}>
      {photos.map((photo, i) => (
        <Step key={i} index={i + 1}>
          <PhotoFigure photo={photo} style={{ height: photoH }} />
        </Step>
      ))}
    </div>
  )

  const link = (data.link || editable) && (
    <div
      style={{
        display: 'inline-block',
        marginTop: square ? 0 : 28,
        padding: square ? '7px 16px' : '13px 24px',
        background: 'var(--s-accent)',
        color: 'var(--s-on-accent)',
        fontSize: square ? 21 : 27,
        fontWeight: 800,
        letterSpacing: '.01em',
      }}
    >
      <EditableText as="span" path="link" value={data.link} placeholder="adres strony" />
    </div>
  )

  const text = (
    <div style={{ order: square ? 1 : mirrored ? 1 : 2, minWidth: 0 }}>
      <Kicker path="kicker" value={data.kicker} />
      <AutoFit id="heading" style={{ maxHeight: square ? 130 : 160 }}>
        <EditableText
          as="h2"
          path="heading"
          value={data.heading}
          placeholder="Nagłówek"
          style={{ margin: 0, fontSize: fit(square ? 92 : 110), lineHeight: 1.05, fontWeight: 800, letterSpacing: '-.025em', color: 'var(--s-accent)' }}
        />
      </AutoFit>
      {(data.fullName || editable) && (
        <EditableText
          path="fullName"
          value={data.fullName}
          placeholder="Pełna nazwa"
          style={{ marginTop: square ? 6 : 12, fontSize: 27, fontWeight: 800, lineHeight: 1.3, color: 'var(--s-fg)' }}
        />
      )}
      <AutoFit id="lead" style={{ maxHeight: square ? 130 : 200 }}>
        <EditableText
          as="p"
          path="lead"
          value={data.lead}
          multiline
          placeholder="Opis"
          style={{ margin: 0, marginTop: square ? 14 : 22, fontSize: fit(25), lineHeight: 1.45, color: 'var(--s-fg)', textWrap: 'pretty' }}
        />
      </AutoFit>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: square ? 20 : 26 }}>
        {data.tags.map((tag, i) => (
          <Chip key={i} style={{ fontSize: 19, fontWeight: 700, letterSpacing: 0, textTransform: 'none', padding: '8px 15px' }}>
            <EditableText as="span" path={`tags.${i}.text`} value={tag.text} placeholder="Tag" />
          </Chip>
        ))}
        {square && link}
      </div>
      {!square && link}
    </div>
  )

  return (
    <SlideFrame>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: square ? '1fr' : mirrored ? '540px 1fr' : '1fr 540px',
          gap: square ? 36 : 76,
          alignContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        {text}
        {mosaic}
      </div>
    </SlideFrame>
  )
}

export default defineSlide({
  key: 'mozaika',
  label: 'Mozaika zdjęć',
  description: 'Cztery zdjęcia w mozaice obok tekstu, z tagami i linkiem.',
  group: 'zdjecia',
  icon: 'slideMosaic',
  defaults,
  fields: [
    { kind: 'photo', key: 'photo1', label: 'Zdjęcie 1' },
    { kind: 'photo', key: 'photo2', label: 'Zdjęcie 2' },
    { kind: 'photo', key: 'photo3', label: 'Zdjęcie 3' },
    { kind: 'photo', key: 'photo4', label: 'Zdjęcie 4' },
    { kind: 'list', key: 'tags', label: 'Tagi', itemLabel: 'Tag', itemFields: [{ key: 'text', label: 'Tekst' }], newItem: { text: 'nowy tag' }, max: 8 },
  ],
  steps: () => 4,
  Component: Mozaika,
})
