import { defineSlide, useSlideAspect, useSlideEdit, useSlideRender } from '../defineSlide'
import { EMPTY_PHOTO } from '../types'
import { colors } from '../../posters/theme'
import { AutoFit, Chip, EditableText, Kicker, SlideFrame, Step, fit, fontMono } from './_wspolne'

// Zaproszenie na wydarzenie: tekst z datą i miejscem | plakat (PNG z generatora).
// „Odwrócony" zamienia strony. Tagi pojawiają się po kolei.

const defaults = {
  kicker: 'Zaproszenie',
  heading: 'Wpadnij na spotkanie',
  date: '14 października',
  timePlace: '19:30 · sala S3, GIL',
  lead: 'Nie trzeba nic umieć ani nic przygotowywać. Wystarczy przyjść.',
  also: 'Przydadzą nam się też inne umiejętności',
  tags: [
    { text: 'planowanie' },
    { text: 'social media' },
    { text: 'grafika komputerowa' },
    { text: 'zdjęcia i wideo' },
    { text: 'pisanie tekstów' },
    { text: 'kontakt z partnerami' },
    { text: 'strony WWW' },
  ],
  poster: { ...EMPTY_PHOTO },
}

function Zaproszenie({ data }: { data: typeof defaults }) {
  const square = useSlideAspect() === '1:1'
  const { mirrored } = useSlideRender()
  const { editable } = useSlideEdit()
  const box = square ? 490 : 600
  const poster = data.poster

  const text = (
    <div style={{ order: mirrored ? 2 : 0, minWidth: 0 }}>
      <Kicker path="kicker" value={data.kicker} />
      <AutoFit id="heading" style={{ maxHeight: 200 }}>
        <EditableText
          as="h2"
          path="heading"
          value={data.heading}
          placeholder="Nagłówek"
          style={{ margin: 0, fontSize: fit(78), lineHeight: 1.05, fontWeight: 800, letterSpacing: '-.025em', color: 'var(--s-accent)' }}
        />
      </AutoFit>
      <div style={{ marginTop: 28, padding: '4px 0 6px 24px', borderLeft: '8px solid var(--s-fg)' }}>
        <EditableText
          path="date"
          value={data.date}
          placeholder="Data"
          style={{ fontSize: square ? 46 : 50, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-.015em' }}
        />
        <EditableText
          path="timePlace"
          value={data.timePlace}
          placeholder="Godzina · miejsce"
          style={{ marginTop: 4, fontSize: square ? 34 : 38, fontWeight: 700, lineHeight: 1.25 }}
        />
      </div>
      {(data.lead || editable) && (
        <AutoFit id="lead" style={{ maxHeight: 160 }}>
          <EditableText
            as="p"
            path="lead"
            value={data.lead}
            multiline
            placeholder="Zachęta"
            style={{ margin: 0, marginTop: 24, fontSize: fit(25), lineHeight: 1.45, color: 'var(--s-fg)', textWrap: 'pretty' }}
          />
        </AutoFit>
      )}
      {(data.also || editable) && (
        <EditableText
          path="also"
          value={data.also}
          placeholder="Przydadzą nam się…"
          style={{ marginTop: 28, fontSize: 21, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--s-muted)' }}
        />
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
        {data.tags.map((tag, i) => (
          <Step key={i} index={i + 1}>
            <Chip style={{ fontSize: 21, fontWeight: 700, letterSpacing: 0, textTransform: 'none', padding: '9px 16px' }}>
              <EditableText as="span" path={`tags.${i}.text`} value={tag.text} placeholder="Tag" />
            </Chip>
          </Step>
        ))}
      </div>
    </div>
  )

  const posterBox = (
    <div style={{ order: mirrored ? 0 : 2, width: box, height: box, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {poster.src ? (
        <img
          src={poster.src}
          alt="Plakat"
          style={{ display: 'block', maxWidth: '100%', maxHeight: '100%', outline: '5px solid var(--s-frame)', boxShadow: '0 24px 60px rgba(0,0,0,.35)' }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: '5px solid var(--s-frame)',
            background: `repeating-linear-gradient(135deg, ${colors.placeholderBg} 0 10px, ${colors.placeholderBgAlt} 10px 20px)`,
            color: colors.placeholderText,
            fontFamily: fontMono,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '.16em',
          }}
        >
          PLAKAT
        </div>
      )}
    </div>
  )

  return (
    <SlideFrame>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: mirrored ? `${box}px 1fr` : `1fr ${box}px`,
          gap: square ? 44 : 70,
          alignItems: 'center',
          height: '100%',
          // Miejsce na sygnet w prawym górnym rogu (16:9).
          [mirrored ? 'paddingLeft' : 'paddingRight']: square ? 0 : 110,
        }}
      >
        {text}
        {posterBox}
      </div>
    </SlideFrame>
  )
}

export default defineSlide({
  key: 'zaproszenie',
  label: 'Zaproszenie',
  description: 'Zaproszenie na spotkanie: data, miejsce i plakat z generatora.',
  group: 'wydarzenie',
  icon: 'slideInvite',
  background: 'ciemne',
  defaults,
  fields: [
    { kind: 'photo', key: 'poster', label: 'Plakat (PNG z generatora)' },
    { kind: 'list', key: 'tags', label: 'Tagi', itemLabel: 'Tag', itemFields: [{ key: 'text', label: 'Tekst' }], newItem: { text: 'nowy tag' }, max: 12 },
  ],
  steps: (data) => data.tags.length,
  Component: Zaproszenie,
})
