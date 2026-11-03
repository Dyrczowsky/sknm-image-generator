import { defineSlide, useSlideAspect, useSlideRender } from '../defineSlide'
import { EMPTY_PHOTO } from '../types'
import { AutoFit, EditableText, Kicker, PhotoFigure, SlideFrame, Step, fit } from './_wspolne'

// Lista wpisów z opisami (kreska akcentu z lewej) i opcjonalnym zdjęciem obok.
// „Odwrócony" (mirrored) zamienia strony; bez zdjęcia lista idzie w dwóch kolumnach.

const defaults = {
  kicker: 'Wyjazdy',
  heading: 'Poznań i Kraków',
  entries: [
    {
      title: 'θβℓιcℤε',
      text: 'Coroczna ogólnopolska studencka konferencja matematyczna w Poznaniu, organizowana przez Koło Naukowe Matematyków UAM. Od teorii po zastosowania i informatykę.',
    },
    {
      title: 'OSSM',
      text: 'Ogólnopolska Sesja Studentów Matematyki, organizowana przez Koło Matematyków Studentów UJ. Trzy dni referatów i plakatów ze wszystkich działów matematyki.',
    },
  ],
  photo: { ...EMPTY_PHOTO },
  caption: 'OSSM UJ, Kraków',
  showPhoto: true,
}

type Entry = (typeof defaults)['entries'][number]

function Wpis({ entry, i, square, wide }: { entry: Entry; i: number; square: boolean; wide: boolean }) {
  return (
    <Step index={i + 1}>
      <div style={{ borderLeft: '6px solid var(--s-accent)', paddingLeft: 22, breakInside: 'avoid' }}>
        <EditableText
          as="div"
          path={`entries.${i}.title`}
          value={entry.title}
          placeholder="Tytuł"
          style={{ fontSize: fit(wide ? 40 : 38), fontWeight: 800, lineHeight: 1.1, letterSpacing: '-.01em', color: 'var(--s-accent)' }}
        />
        <EditableText
          as="div"
          path={`entries.${i}.text`}
          value={entry.text}
          multiline
          placeholder="Opis"
          style={{ marginTop: 4, fontSize: fit(square ? 22 : 24), lineHeight: 1.4, color: 'var(--s-muted)', textWrap: 'pretty' }}
        />
      </div>
    </Step>
  )
}

function Lista({ data }: { data: typeof defaults }) {
  const square = useSlideAspect() === '1:1'
  const { mirrored } = useSlideRender()
  const photoOn = data.showPhoto
  // W kwadracie zdjęcie mieści się pod tekstem tylko przy krótkiej liście.
  const photoBelow = square && photoOn && data.entries.length <= 2
  const sideBySide = !square && photoOn
  const twoCols = !photoOn && !square

  const list = (
    <AutoFit id="entries" style={{ marginTop: square ? 28 : 34, height: square ? (photoBelow ? 380 : 640) : sideBySide ? 430 : 400 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: twoCols ? '1fr 1fr' : '1fr',
          columnGap: 56,
          rowGap: square ? 22 : 26,
          alignContent: 'start',
          maxWidth: sideBySide ? 590 : square ? 940 : undefined,
        }}
      >
        {data.entries.map((e, i) => (
          <Wpis key={i} entry={e} i={i} square={square} wide={twoCols} />
        ))}
      </div>
    </AutoFit>
  )

  const text = (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: square ? 'flex-start' : 'center', height: '100%', minHeight: 0 }}>
      <Kicker path="kicker" value={data.kicker} />
      <AutoFit id="heading" style={{ maxHeight: square ? 170 : 240 }}>
        <EditableText
          as="h2"
          path="heading"
          value={data.heading}
          placeholder="Nagłówek"
          style={{ margin: 0, fontSize: fit(square ? 72 : 74), lineHeight: 1.05, fontWeight: 800, letterSpacing: '-.025em', color: 'var(--s-accent)', textWrap: 'balance' }}
        />
      </AutoFit>
      {list}
    </div>
  )

  const photo = (
    <PhotoFigure
      photo={data.photo}
      variant="cien"
      caption={{ path: 'caption', value: data.caption }}
      style={{ width: square ? 700 : '100%', maxWidth: 714, height: square ? 300 : 363, flexShrink: 0 }}
    />
  )

  if (sideBySide) {
    return (
      <SlideFrame>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: mirrored ? '1fr 590px' : '590px 1fr',
            columnGap: 70,
            height: '100%',
            alignItems: 'center',
          }}
        >
          {mirrored ? (
            <>
              <div style={{ paddingRight: 16 }}>{photo}</div>
              {text}
            </>
          ) : (
            <>
              {text}
              <div style={{ paddingRight: 16 }}>{photo}</div>
            </>
          )}
        </div>
      </SlideFrame>
    )
  }

  return (
    <SlideFrame>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flex: 1, minHeight: 0 }}>{text}</div>
        {photoBelow && <div style={{ marginBottom: 44 }}>{photo}</div>}
      </div>
    </SlideFrame>
  )
}

export default defineSlide({
  key: 'lista',
  label: 'Lista z opisami',
  description: 'Wpisy z tytułem i opisem, opcjonalnie ze zdjęciem obok.',
  group: 'tekst',
  icon: 'slideList',
  defaults,
  fields: [
    {
      kind: 'list',
      key: 'entries',
      label: 'Wpisy',
      itemLabel: 'Wpis',
      itemFields: [
        { key: 'title', label: 'Tytuł' },
        { key: 'text', label: 'Opis', multiline: true },
      ],
      newItem: { title: 'Nowy wpis', text: 'Opis' },
      min: 1,
      max: 5,
    },
    { kind: 'toggle', key: 'showPhoto', label: 'Zdjęcie obok' },
    { kind: 'photo', key: 'photo', label: 'Zdjęcie' },
  ],
  steps: (d) => d.entries.length,
  Component: Lista,
})
