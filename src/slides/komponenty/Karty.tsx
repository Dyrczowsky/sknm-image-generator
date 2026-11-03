import { defineSlide, useSlideAspect, useSlideEdit } from '../defineSlide'
import { AutoFit, EditableText, Kicker, SlideFrame, Step, fit } from './_wspolne'

// Karty: siatka kart (3 kolumny, w kwadracie 2) albo numerowana lista (2 kolumny, w kwadracie 1).

const defaults = {
  kicker: 'Po co to wszystko',
  heading: 'Koło to nie tylko matematyka',
  lead: 'Przy okazji referatów, wyjazdów i organizowania konferencji uczysz się rzeczy, których nie ma w sylabusie.',
  variant: 'siatka',
  cards: [
    { title: 'Pewność siebie', text: 'Pierwszy referat przed znajomymi z koła to najlepszy trening przed każdym następnym.' },
    { title: 'Wystąpienia publiczne', text: 'Od spotkania w sali po aulę na ogólnopolskiej konferencji.' },
    { title: 'Organizacja pracy', text: 'Terminy, podział zadań i projekty, które trzeba doprowadzić do końca.' },
    { title: 'Praca w zespole', text: 'Konferencji nie da się zorganizować w pojedynkę.' },
    { title: 'Ludzie', text: 'Znajomi z innych roczników, uczelni i miast.' },
    { title: 'Doświadczenie', text: 'Konkretne rzeczy do CV jeszcze przed pierwszą pracą.' },
  ],
}

type Card = (typeof defaults)['cards'][number]

function Karty({ data }: { data: typeof defaults }) {
  const square = useSlideAspect() === '1:1'
  const { editable } = useSlideEdit()
  const numbered = data.variant === 'numerowane'
  const columns = numbered ? (square ? 1 : 2) : square ? 2 : 3
  const showLead = !!data.lead || editable

  const card = (c: Card, i: number) => (
    <Step key={i} index={i + 1} style={{ height: '100%' }}>
      {numbered ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: square ? '84px 1fr' : '96px 1fr',
            alignItems: 'start',
            boxSizing: 'border-box',
            height: '100%',
            background: 'var(--s-soft)',
            borderTop: '6px solid var(--s-accent)',
            padding: square ? '24px 30px 26px' : '30px 34px 32px',
          }}
        >
          <div aria-hidden style={{ fontSize: fit(62), fontWeight: 800, lineHeight: 1, letterSpacing: '-.03em', color: 'var(--s-accent)', opacity: 0.32 }}>
            {String(i + 1).padStart(2, '0')}
          </div>
          <div>
            <EditableText as="div" path={`cards.${i}.title`} value={c.title} placeholder="Tytuł" style={{ fontSize: fit(32), fontWeight: 800, lineHeight: 1.12, letterSpacing: '-.01em', color: 'var(--s-accent)' }} />
            <EditableText as="div" path={`cards.${i}.text`} value={c.text} multiline placeholder="Opis" style={{ marginTop: 8, fontSize: fit(23), lineHeight: 1.42, color: 'var(--s-muted)', textWrap: 'pretty' }} />
          </div>
        </div>
      ) : (
        <div style={{ boxSizing: 'border-box', height: '100%', background: 'var(--s-soft)', borderTop: '6px solid var(--s-accent)', padding: '26px 30px 28px' }}>
          <EditableText as="div" path={`cards.${i}.title`} value={c.title} placeholder="Tytuł" style={{ fontSize: fit(29), fontWeight: 800, lineHeight: 1.12, letterSpacing: '-.01em', color: 'var(--s-accent)' }} />
          <EditableText as="div" path={`cards.${i}.text`} value={c.text} multiline placeholder="Opis" style={{ marginTop: 8, fontSize: fit(21), lineHeight: 1.42, color: 'var(--s-muted)', textWrap: 'pretty' }} />
        </div>
      )}
    </Step>
  )

  return (
    <SlideFrame>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: square ? 'flex-start' : 'center', height: '100%' }}>
        <Kicker path="kicker" value={data.kicker} />
        <AutoFit id="heading" style={{ maxHeight: square ? 170 : 200 }}>
          <EditableText
            as="h2"
            path="heading"
            value={data.heading}
            placeholder="Nagłówek"
            style={{ margin: 0, maxWidth: 1180, fontSize: fit(square ? 72 : 74), lineHeight: 1.05, fontWeight: 800, letterSpacing: '-.025em', color: 'var(--s-accent)', textWrap: 'balance' }}
          />
        </AutoFit>
        {showLead && (
          <AutoFit id="lead" style={{ marginTop: 22, maxHeight: square ? 140 : 130, maxWidth: square ? 900 : 1050 }}>
            <EditableText as="p" path="lead" value={data.lead} multiline placeholder="Wstęp (opcjonalnie)" style={{ margin: 0, fontSize: fit(square ? 27 : 29), lineHeight: 1.45, color: 'var(--s-fg)', textWrap: 'pretty' }} />
          </AutoFit>
        )}
        <AutoFit id="cards" style={{ marginTop: square ? 38 : 44, height: square ? 560 : 360 }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gridAutoRows: '1fr', gap: 22, alignContent: 'start' }}>
            {data.cards.map(card)}
          </div>
        </AutoFit>
      </div>
    </SlideFrame>
  )
}

export default defineSlide({
  key: 'karty',
  label: 'Karty',
  description: 'Siatka kart albo numerowana lista z tytułem i opisem.',
  group: 'tekst',
  icon: 'slideCards',
  defaults,
  fields: [
    {
      kind: 'select',
      key: 'variant',
      label: 'Wygląd',
      options: [
        { value: 'siatka', label: 'Siatka kart' },
        { value: 'numerowane', label: 'Numerowana lista' },
      ],
    },
    {
      kind: 'list',
      key: 'cards',
      label: 'Karty',
      itemLabel: 'Karta',
      itemFields: [
        { key: 'title', label: 'Tytuł' },
        { key: 'text', label: 'Opis', multiline: true },
      ],
      newItem: { title: 'Nowa karta', text: 'Opis' },
      min: 1,
      max: 9,
    },
  ],
  steps: (d) => d.cards.length,
  Component: Karty,
})
