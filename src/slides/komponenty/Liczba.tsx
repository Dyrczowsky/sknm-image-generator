import { defineSlide, useSlideAspect } from '../defineSlide'
import { AutoFit, EditableText, Kicker, SlideFrame, Step, fit, fontMono } from './_wspolne'

const defaults = {
  kicker: 'W liczbach',
  stats: [{ value: '15', label: 'edycji warsztatów WSAD' }] as { value: string; label: string }[],
  note: 'Od pierwszej edycji przez nasze warsztaty przeszły setki studentów.',
}

function Liczba({ data }: { data: typeof defaults }) {
  const square = useSlideAspect() === '1:1'
  const n = Math.max(1, data.stats.length)
  const single = n === 1
  const valueSize = single ? (square ? 280 : 300) : n === 2 ? (square ? 170 : 200) : square ? 140 : 160
  const labelSize = single ? 44 : square ? 34 : 32
  return (
    <SlideFrame>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', maxWidth: square ? 1040 : 1400 }}>
        <Kicker path="kicker" value={data.kicker} />
        <div
          style={{
            display: 'flex',
            flexDirection: square ? 'column' : 'row',
            gap: square ? (single ? 0 : 20) : 70,
            alignItems: square ? 'flex-start' : 'flex-start',
          }}
        >
          {data.stats.map((s, i) => (
            <Step key={i} index={i + 1} style={{ flex: square ? undefined : 1, minWidth: 0, maxWidth: '100%' }}>
              <AutoFit id={`value${i}`} style={{ maxHeight: valueSize * 1.05, maxWidth: square ? 1000 : single ? 1400 : 440 }}>
                <EditableText
                  path={`stats.${i}.value`}
                  value={s.value}
                  placeholder="0"
                  style={{
                    fontFamily: fontMono,
                    fontSize: fit(valueSize),
                    lineHeight: 1,
                    fontWeight: 800,
                    letterSpacing: '-.04em',
                    color: 'var(--s-accent)',
                    whiteSpace: 'nowrap',
                  }}
                />
              </AutoFit>
              <AutoFit id={`label${i}`} style={{ maxHeight: single ? 140 : 110, marginTop: single ? 16 : 10, maxWidth: single ? 1000 : 440 }}>
                <EditableText
                  path={`stats.${i}.label`}
                  value={s.label}
                  multiline
                  placeholder="Opis"
                  style={{ fontSize: fit(labelSize), lineHeight: 1.15, fontWeight: 700, color: 'var(--s-fg)' }}
                />
              </AutoFit>
            </Step>
          ))}
        </div>
        <AutoFit id="note" style={{ maxHeight: 110, marginTop: 44, maxWidth: square ? 900 : 1000 }}>
          <EditableText
            as="p"
            path="note"
            value={data.note}
            multiline
            placeholder="Dopisek"
            style={{ margin: 0, fontSize: fit(24), lineHeight: 1.45, fontWeight: 500, color: 'var(--s-muted)' }}
          />
        </AutoFit>
      </div>
    </SlideFrame>
  )
}

export default defineSlide({
  key: 'liczba',
  label: 'Liczba',
  description: 'Duża statystyka (do trzech obok siebie).',
  group: 'wydarzenie',
  icon: 'slideStat',
  defaults,
  fields: [
    {
      kind: 'list',
      key: 'stats',
      label: 'Liczby',
      itemLabel: 'Liczba',
      itemFields: [
        { key: 'value', label: 'Wartość' },
        { key: 'label', label: 'Opis' },
      ],
      newItem: { value: '0', label: 'Opis' },
      min: 1,
      max: 3,
    },
  ],
  steps: (data) => data.stats.length,
  Component: Liczba,
})
