import { defineSlide } from '../defineSlide'
import { useSlideAspect } from '../defineSlide'
import { AutoFit, EditableText, Kicker, SlideFrame, fit, fontMono } from './_wspolne'

// WZORZEC KOMPONENTU SLAJDU - nowy układ zacznij od kopii tego pliku.
// Jeden plik = jeden kompletny układ: treść domyślna, pola panelu, rysunek.
// Kolory tylko przez `var(--s-...)` (themes.ts), rozmiary w px układu
// (16:9 = 1600×900, 1:1 = 1200×1200), font zmniejszany przez AutoFit - `fit(px)`.

const defaults = {
  kicker: 'Cytat',
  quote: 'Matematyka jest królową nauk, a arytmetyka jest królową matematyki.',
  author: 'Carl Friedrich Gauss',
}

function Cytat({ data }: { data: typeof defaults }) {
  const square = useSlideAspect() === '1:1'
  return (
    <SlideFrame>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', maxWidth: square ? 1000 : 1180 }}>
        <Kicker path="kicker" value={data.kicker} />
        <div aria-hidden style={{ fontSize: 220, lineHeight: 0.6, height: 90, fontWeight: 800, color: 'var(--s-accent)', opacity: 0.25 }}>„</div>
        <AutoFit id="quote" style={{ maxHeight: square ? 640 : 460 }}>
          <EditableText
            as="p"
            path="quote"
            value={data.quote}
            multiline
            placeholder="Treść cytatu"
            style={{ margin: 0, fontSize: fit(square ? 66 : 64), lineHeight: 1.15, fontWeight: 800, letterSpacing: '-.02em', color: 'var(--s-accent)', textWrap: 'balance' }}
          />
        </AutoFit>
        <EditableText
          path="author"
          value={data.author}
          placeholder="Autor"
          style={{ marginTop: 40, fontFamily: fontMono, fontSize: 22, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--s-muted)' }}
        />
      </div>
    </SlideFrame>
  )
}

export default defineSlide({
  key: 'cytat',
  label: 'Cytat',
  description: 'Duży cytat z autorem.',
  group: 'tekst',
  icon: 'slideQuote',
  defaults,
  fields: [],
  Component: Cytat,
})
