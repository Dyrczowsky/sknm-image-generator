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
import { BLOCKS_LIST, CONTACT_FIELDS, CONTACT_LIST, groupBlocks, isSplittable } from './naukowy/blocks'
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
  // Nazwa koła w dwóch liniach: koło / uczelnia.
  const splitAt = lang === 'pl' ? ' Politechniki ' : ' of the '
  const cut = CLUB_NAME[lang].indexOf(splitAt)
  const clubLine = cut < 0 ? CLUB_NAME[lang] : CLUB_NAME[lang].slice(0, cut)
  const uniLine = cut < 0 ? '' : (lang === 'pl' ? 'Politechniki ' : '') + CLUB_NAME[lang].slice(cut + splitAt.length)
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
      {/* Pasek: sygnet | nazwa koła | logo PK. Boczne kolumny mają szerokość logo PK, więc nazwa jest na środku i nic się nie ściska. */}
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '260px 1fr 260px', alignItems: 'center', gap: 24, padding: '24px 48px', borderBottom: '2px solid color-mix(in srgb, var(--accent) 45%, transparent)' }}>
        <Sygnet name={sygnet} width={80} />
        <div style={{ textAlign: 'center', lineHeight: 1.2 }}>
          <div style={{ fontWeight: 800, fontSize: 28, letterSpacing: '.01em', textWrap: 'balance' }}>{clubLine}</div>
          {uniLine && <div style={{ marginTop: 6, fontWeight: 700, fontSize: 16, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--accent)' }}>{uniLine}</div>}
        </div>
        <div style={{ justifySelf: 'end' }}>
          {(raw.showPkLogo ?? true) && <img src={pkLogos[pk][logoVariant ?? 'dark']} alt="PK" style={{ width: 260, display: 'block' }} />}
        </div>
      </div>

      <div ref={cols} style={{ position: 'relative', flex: 1, minHeight: 0, margin: '24px 48px 0', overflow: 'hidden', columnCount: 3, columnFill: 'auto', columnGap: 28 }}>
        {groupBlocks(blocks).map((group) => (
          // Nagłówek jedzie razem z następnym blokiem - nie zostaje sam na dole kolumny.
          // Tekst/listy/ramki mogą przejść na następną kolumnę w połowie, żeby kolumny
          // nie zostawały w 1/3 puste; zdjęcia, wzory i QR zawsze w całości.
          <div key={group[0].block.id} style={{ breakInside: group.some(({ block }) => isSplittable(block.type)) ? 'auto' : 'avoid' }}>
            {group.map(({ block: b, index: i }) => (
              <div key={b.id} style={{ marginBottom: b.type === 'heading' ? 8 : 14, padding: b.type === 'heading' ? '0 4px' : '12px 14px', background: b.type === 'heading' ? undefined : 'rgba(255,255,255,.06)', borderRadius: 8, boxSizing: 'border-box', breakInside: isSplittable(b.type) ? 'auto' : 'avoid', breakAfter: b.type === 'heading' ? 'avoid' : 'auto', WebkitBoxDecorationBreak: 'clone', boxDecorationBreak: 'clone' }}>
                <BlockView block={b} index={i} scale={textScale} seed={seed} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, padding: '14px 48px 20px', fontSize: 20, color: 'var(--muted-text, var(--page-text))' }}>
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

