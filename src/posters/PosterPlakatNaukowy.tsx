import 'katex/dist/katex.min.css'
import { useLayoutEffect, useRef } from 'react'
import type { PosterProps } from '../types'
import { CLUB_NAME } from './copy'
import { withPlaceholders } from './fallback'
import { pkLogos } from './logos'
import { resolveScheme } from './schemes'
import { PosterFrame } from './blocks/PosterFrame'
import { QrSlot } from './blocks/QrSlot'
import { Sygnet } from './blocks/Sygnet'
import { BLOCKS_LIST, CONTACT_FIELDS, CONTACT_LIST } from './naukowy/blocks'
import type { Block } from './naukowy/blocks'
import { BlockView } from './naukowy/BlockView'
import { reportOverflow } from './naukowy/overflow'
import { Pattern } from './naukowy/Pattern'
import { SocialIcon } from './naukowy/SocialIcon'
import { SAMPLE_BLOCKS } from './naukowy/sample'

// Pion/poziom: wymiary daje PosterFrame (PosterShapeContext), kolumny CSS wypełniają resztę.
export function PosterPlakatNaukowy({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { lists, qrUrl, textScale, raw } = withPlaceholders(data)
  const { cssVars, sygnet, logoVariant } = resolveScheme('plakatNaukowy', scheme, accent)
  const stored = lists[BLOCKS_LIST] as Block[] | undefined
  const blocks = stored?.length ? stored : SAMPLE_BLOCKS
  const seed = stored?.length ? undefined : SAMPLE_BLOCKS
  const storedContact = lists[CONTACT_LIST]?.[0]
  // Bez wpisanych kontaktów stopka pokazuje stronę koła, jak inne plakaty.
  const contact = storedContact && CONTACT_FIELDS.some((f) => storedContact[f]?.trim()) ? storedContact : { www: 'sknm.pk.edu.pl' }
  const pk = raw.pkLogo === 'wiim' || raw.pkLogo === 'kms' ? raw.pkLogo : 'pk'
  const [name, ...rest] = CLUB_NAME[lang].split(' Politechniki ')
  const cols = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = cols.current
    if (!el) return
    const measure = () => reportOverflow(el.scrollWidth > el.clientWidth + 1)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [blocks, textScale])

  const contacts = CONTACT_FIELDS.filter((f) => contact[f]?.trim())

  return (
    <PosterFrame vars={cssVars} style={{ position: 'relative', overflow: 'hidden', justifyContent: 'flex-start' }}>
      <Pattern />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, padding: '36px 56px', background: 'rgba(0,0,0,.25)' }}>
        <Sygnet name={sygnet} width={110} />
        <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 30, lineHeight: 1.25, textTransform: 'uppercase', letterSpacing: '.04em' }}>
          <div>{name}</div>
          {rest.length > 0 && <div style={{ color: 'var(--accent)' }}>Politechniki {rest.join(' Politechniki ')}</div>}
        </div>
        {raw.showPkLogo ?? true ? <img src={pkLogos[pk][logoVariant ?? 'dark']} alt="PK" style={{ height: 90, display: 'block' }} /> : <div style={{ width: 110 }} />}
      </div>

      <div ref={cols} style={{ position: 'relative', flex: 1, minHeight: 0, margin: '32px 56px 0', overflow: 'hidden', columnCount: 3, columnFill: 'auto', columnGap: 32 }}>
        {blocks.map((b, i) => (
          <div key={b.id} style={{ breakInside: 'avoid', marginBottom: 20, padding: b.type === 'heading' ? '0 4px' : 18, background: b.type === 'heading' ? undefined : 'rgba(255,255,255,.06)', borderRadius: 8, boxSizing: 'border-box' }}>
            <BlockView block={b} index={i} scale={textScale} seed={seed} />
          </div>
        ))}
      </div>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, padding: '20px 56px 28px', fontSize: 22, color: 'var(--muted-text, var(--page-text))' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 28px' }}>
          {contacts.map((f) => (
            <span key={f} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <SocialIcon field={f} />
              {contact[f]}
            </span>
          ))}
        </div>
        <QrSlot value={qrUrl} size={96} />
      </div>
    </PosterFrame>
  )
}
