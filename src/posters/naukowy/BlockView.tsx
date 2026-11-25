import katex from 'katex'
import { useLayoutEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { CSSProperties } from 'react'
import { PosterText } from '../blocks/PosterText'
import { BLOCKS_LIST, CALLOUT_LABELS, bulletLines } from './blocks'
import type { Block, CalloutTone } from './blocks'
import type { ListItem } from '../../types'

interface Props {
  block: Block
  index: number
  scale: number
  seed?: ListItem[]
}

export function BlockView({ block, index, scale, seed }: Props) {
  const fs = 20 * scale
  const base: CSSProperties = { fontSize: fs, lineHeight: 1.45, whiteSpace: 'pre-line' }
  const field = (key: 'title' | 'text', style: CSSProperties, label: string) => (
    <PosterText path={`lists.${BLOCKS_LIST}.${index}.${key}`} value={block[key]} multiline label={label} listSeed={seed} style={style} />
  )
  const text = (style?: CSSProperties) => field('text', { ...base, ...style }, 'Tekst')

  switch (block.type) {
    case 'heading':
      return field('title', { fontSize: 38 * scale, fontWeight: 800, lineHeight: 1.1, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.03em' }, 'Nagłówek')
    case 'text':
      return text()
    case 'bullets':
      return (
        <ul style={{ ...base, margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 * scale }}>
          {bulletLines(block.text).map((line, i) => (
            <li key={i} style={{ display: 'flex', gap: 12 * scale }}>
              <span style={{ color: 'var(--accent)', fontWeight: 800 }}>▸</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )
    case 'photo':
      return (
        <figure style={{ margin: 0 }}>
          <Photo src={block.photo} height={260 * scale} />
          {block.title && <figcaption style={{ ...base, fontSize: fs * 0.8, marginTop: 8, color: 'var(--muted-text)' }}>{block.title}</figcaption>}
        </figure>
      )
    case 'photoText':
      return (
        <div style={{ display: 'flex', gap: 16, flexDirection: block.side === 'right' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
          <div style={{ flex: '0 0 40%' }}><Photo src={block.photo} height={200 * scale} /></div>
          <div style={{ flex: 1 }}>{text()}</div>
        </div>
      )
    case 'latex':
      return <Latex tex={block.text ?? ''} fontSize={24 * scale} />
    case 'qr':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          {block.url?.trim() && <QRCodeSVG value={block.url} size={150 * scale} marginSize={1} bgColor="transparent" fgColor="var(--page-text)" level="M" />}
          {block.title && <div style={{ ...base, fontSize: fs * 0.85, textAlign: 'center' }}>{block.title}</div>}
        </div>
      )
    case 'callout': {
      const label = CALLOUT_LABELS[(block.tone as CalloutTone) in CALLOUT_LABELS ? (block.tone as CalloutTone) : 'twierdzenie']
      return (
        <div style={{ borderLeft: '6px solid var(--accent)', background: 'rgba(255,255,255,.07)', padding: `${12 * scale}px ${16 * scale}px`, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: fs * 0.7, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--accent)' }}>{label}</div>
          {field('title', { ...base, fontWeight: 700 }, 'Tytuł')}
          {text()}
        </div>
      )
    }
  }
}

function Photo({ src, height }: { src?: string; height: number }) {
  return src
    ? <img src={src} alt="" style={{ width: '100%', height, objectFit: 'cover', display: 'block', borderRadius: 6 }} />
    : <div style={{ width: '100%', height, borderRadius: 6, background: 'rgba(255,255,255,.1)' }} />
}

// Wzór szerszy niż kolumna zmniejszamy tak, żeby zmieścił się w całości.
function Latex({ tex, fontSize }: { tex: string; fontSize: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const html = katex.renderToString(tex, { displayMode: true, throwOnError: false })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    let size = fontSize
    el.style.fontSize = `${size}px`
    // KaTeX ma stałe marginesy, więc skalowanie nie jest liniowe - kilka przybliżeń.
    for (let i = 0; i < 5 && el.scrollWidth > el.clientWidth; i++) {
      size *= (el.clientWidth / el.scrollWidth) * 0.98
      el.style.fontSize = `${size}px`
    }
  }, [html, fontSize])
  return <div ref={ref} style={{ fontSize, textAlign: 'center', overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: html }} />
}
