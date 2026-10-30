import { defineSlide, useSlideAspect } from '../defineSlide'
import { AutoFit, EditableText, Kicker, SlideFrame, fit, fontMono } from './_wspolne'

const defaults = {
  number: '01',
  kicker: 'Rozdział',
  title: 'Czym zajmuje się koło',
  subtitle: 'Warsztaty, wydarzenia i projekty',
}

function Sekcja({ data }: { data: typeof defaults }) {
  const square = useSlideAspect() === '1:1'
  return (
    <SlideFrame>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', maxWidth: square ? 1000 : 1200 }}>
        <EditableText
          path="number"
          value={data.number}
          placeholder="01"
          style={{
            fontFamily: fontMono,
            fontSize: square ? 240 : 260,
            lineHeight: 0.9,
            fontWeight: 800,
            letterSpacing: '-.04em',
            color: 'var(--s-accent)',
            opacity: 0.3,
            marginBottom: 24,
          }}
        />
        <Kicker path="kicker" value={data.kicker} />
        <AutoFit id="title" style={{ maxHeight: square ? 300 : 240 }}>
          <EditableText
            as="h2"
            path="title"
            value={data.title}
            multiline
            placeholder="Tytuł rozdziału"
            style={{ margin: 0, fontSize: fit(74), lineHeight: 1.08, fontWeight: 800, letterSpacing: '-.025em', color: 'var(--s-accent)', textWrap: 'balance' }}
          />
        </AutoFit>
        <EditableText
          path="subtitle"
          value={data.subtitle}
          placeholder="Podtytuł (opcjonalnie)"
          style={{ marginTop: 22, fontSize: 32, fontWeight: 500, color: 'var(--s-muted)' }}
        />
      </div>
    </SlideFrame>
  )
}

export default defineSlide({
  key: 'sekcja',
  label: 'Sekcja',
  description: 'Przerywnik z dużym numerem rozdziału.',
  group: 'tytul',
  icon: 'slideSection',
  background: 'ciemne',
  defaults,
  fields: [],
  Component: Sekcja,
})
