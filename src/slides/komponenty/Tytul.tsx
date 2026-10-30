import { Sygnet } from '../../posters/blocks/Sygnet'
import { defineSlide, useSlideAspect, useSlideRender } from '../defineSlide'
import { paletteFor } from '../themes'
import { AutoFit, EditableText, Kicker, SlideFrame, fit } from './_wspolne'

const defaults = {
  kicker: 'Poznajmy się',
  title: 'Studenckie Koło Naukowe Matematyków',
  subtitle: 'Politechniki Krakowskiej',
  tagline: 'Matematyka w praktyce: warsztaty, wydarzenia i projekty dla studentów.',
}

function Tytul({ data }: { data: typeof defaults }) {
  const square = useSlideAspect() === '1:1'
  const info = useSlideRender()
  const palette = paletteFor(info.theme, info.background)
  return (
    <SlideFrame sygnet={false} number={false}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: square ? 'flex-start' : 'center',
          height: '100%',
          maxWidth: square ? 1000 : 900,
          paddingTop: square ? 50 : 0,
          boxSizing: 'border-box',
        }}
      >
        <Kicker path="kicker" value={data.kicker} />
        <AutoFit id="title" style={{ maxHeight: square ? 330 : 300 }}>
          <EditableText
            as="h1"
            path="title"
            value={data.title}
            multiline
            placeholder="Tytuł prezentacji"
            style={{ margin: 0, fontSize: fit(92), lineHeight: 1.05, fontWeight: 800, letterSpacing: '-.025em', color: 'var(--s-fg)' }}
          />
        </AutoFit>
        <EditableText
          path="subtitle"
          value={data.subtitle}
          placeholder="Podtytuł"
          style={{ marginTop: 22, fontSize: 40, fontWeight: 500, color: 'var(--s-fg)', opacity: 0.88 }}
        />
        <AutoFit id="tagline" style={{ maxHeight: 120, marginTop: square ? 48 : 64, maxWidth: square ? 560 : 620 }}>
          <EditableText
            as="p"
            path="tagline"
            value={data.tagline}
            multiline
            placeholder="Hasło"
            style={{ margin: 0, fontSize: fit(26), lineHeight: 1.45, fontWeight: 500, color: 'var(--s-muted)' }}
          />
        </AutoFit>
      </div>
      <Sygnet
        name={palette.sygnet}
        width={square ? 400 : 520}
        style={
          square
            ? { position: 'absolute', right: 0, bottom: 40 }
            : { position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)' }
        }
      />
    </SlideFrame>
  )
}

export default defineSlide({
  key: 'tytul',
  label: 'Tytuł',
  description: 'Slajd tytułowy z dużym sygnetem koła.',
  group: 'tytul',
  icon: 'slideTitle',
  background: 'ciemne',
  defaults,
  fields: [],
  Component: Tytul,
})
