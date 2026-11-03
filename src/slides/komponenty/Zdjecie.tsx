import { defineSlide, useSlideAspect, useSlideRender } from '../defineSlide'
import { EMPTY_PHOTO } from '../types'
import { AutoFit, EditableText, Kicker, PhotoFigure, SlideFrame, fit } from './_wspolne'

// Zdjęcie na cały slajd z podpisem w rogu (lustro przenosi podpis na prawą stronę).

const defaults = {
  kicker: 'Galeria',
  caption: 'Dzień otwarty Politechniki Krakowskiej',
  photo: { ...EMPTY_PHOTO },
}

function Zdjecie({ data }: { data: typeof defaults }) {
  const square = useSlideAspect() === '1:1'
  const { mirrored } = useSlideRender()
  const edge = square ? 80 : 100
  const bottom = square ? 120 : 90
  return (
    <SlideFrame padding={0} band={false} sygnet={false} number={false}>
      <PhotoFigure photo={data.photo} variant="zwykle" style={{ position: 'absolute', inset: 0 }} />
      <div
        aria-hidden
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%', background: 'linear-gradient(transparent, rgba(0,0,0,.55))', pointerEvents: 'none' }}
      />
      <div
        style={{
          position: 'absolute',
          bottom,
          ...(mirrored ? { right: edge, alignItems: 'flex-end', textAlign: 'right' } : { left: edge, alignItems: 'flex-start' }),
          display: 'flex',
          flexDirection: 'column',
          maxWidth: square ? 900 : 1100,
        }}
      >
        <Kicker path="kicker" value={data.kicker} style={{ marginBottom: 14 }} />
        <AutoFit id="caption" style={{ maxHeight: square ? 260 : 200 }}>
          <EditableText
            as="h2"
            path="caption"
            value={data.caption}
            placeholder="Podpis zdjęcia"
            style={{ margin: 0, fontSize: fit(square ? 72 : 64), lineHeight: 1.08, fontWeight: 800, letterSpacing: '-.02em', color: '#fff', textWrap: 'balance' }}
          />
        </AutoFit>
      </div>
    </SlideFrame>
  )
}

export default defineSlide({
  key: 'zdjecie',
  label: 'Zdjęcie na cały slajd',
  description: 'Zdjęcie na całą powierzchnię slajdu z podpisem.',
  group: 'zdjecia',
  icon: 'image',
  defaults,
  fields: [{ kind: 'photo', key: 'photo', label: 'Zdjęcie' }],
  Component: Zdjecie,
})
