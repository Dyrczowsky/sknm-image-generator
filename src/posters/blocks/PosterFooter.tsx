import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { textInkHeight } from '../../utils/textInk'
import { useElementSize } from '../../utils/useElementSize'
import { LOGO_CLEAR, LOGO_HEIGHT, LOGO_MAX_HEIGHT, LOGO_SQUEEZE_HEIGHT, POSTER_QR } from '../theme'
import type { QrSizing } from '../theme'
import { FooterLogos } from './FooterLogos'
import type { LogoSlotSource } from './LogoSlots'
import { QrSlot } from './QrSlot'
import { fitLogoHeight, logoRowWidth } from './logoFit'
import type { LogoVariant, QrPlacement, QrSide } from '../../types'

interface PosterFooterProps {
  qrUrl: string
  qrSide: QrSide
  // `inline` - kod w rzędzie stopki, `above` - we własnym wierszu nad nią.
  qrPlacement: QrPlacement
  // Rozmiary kodu (plakat/baner), patrz `QrSizing`.
  qrSizing?: QrSizing
  // Logo na wysokość treści stopki (domyślnie). `false` przy wielkiej dacie
  // w stopce (Gala, Wykład, Komunikat) - logo zostaje na LOGO_HEIGHT.
  matchLogo?: boolean
  // Czy stopka może się spiętrzyć (treść nad logotypami), gdy sponsorów jest
  // dużo. `false` w układach bez zapasu w pionie - logotypy maleją wtedy
  // do LOGO_SQUEEZE_HEIGHT.
  stack?: boolean
  // Treść lewego rogu stopki (data, adres strony, etykieta...). Opcjonalna.
  lead?: ReactNode
  slots: LogoSlotSource[]
  variant?: LogoVariant
  slotStyle?: CSSProperties
  // Odstęp między elementami rzędu.
  gap?: number
  // Nadpisania rzędu (np. `justifyContent: 'center'` w wyśrodkowanym banerze).
  rowStyle?: CSSProperties
  // Nadpisania kolumny logotypów (domyślnie wypełnia resztę rzędu).
  logosStyle?: CSSProperties
  style?: CSSProperties
}

// Wspólna stopka wszystkich szablonów: [treść lewego rogu] ... [logotypy],
// plus kod QR w jednym z czterech miejsc - zawsze przyklejony do krawędzi
// kadru albo do logotypów, nigdy „gdzieś w środku" za tekstem:
//
//   inline + left   QR na lewym marginesie, treść stopki tuż za nim
//   inline + right  QR tuż przed logotypami
//   above  + left   własny wiersz nad stopką, przy lewym marginesie
//   above  + right  własny wiersz nad stopką, nad logotypami
//
// Rozmiar: treść lewego rogu jest mierzona na żywo i wyznacza wysokość
// stopki. Logotypy mają tę wysokość w granicach LOGO_HEIGHT-LOGO_MAX_HEIGHT
// (bez `matchLogo` - LOGO_HEIGHT), kod po lewej - w granicach `min`-`max`
// z `qrSizing`, kod przy logotypach - wysokość logo. Tekst, kod i logo
// tworzą jeden równy pas. Bez pomiaru (render statyczny, brak treści) -
// wartości minimalne. Logotypy rosną tylko tak, żeby wszystkie zmieściły się
// w jednym rzędzie (logoFit.ts) - dodatkowy sponsor zmniejsza je z powrotem
// ku LOGO_HEIGHT, zamiast spychać do nowej linii.
//
// Gdy sponsorów jest tyle, że nawet w LOGO_HEIGHT nie mieszczą się obok
// treści, stopka „piętrzy się": treść (z kodem QR - zawsze po lewej, żeby nie
// zabierał miejsca logotypom) idzie wiersz wyżej, a logotypy dostają całą
// szerokość, z logo PK dalej w prawym dolnym rogu. Decyzja liczy się
// z szerokości rzędu i samej treści - obie nie zależą od układu, więc
// stopka nie przeskakuje tam i z powrotem.
//
// Wysunięcia o `LOGO_CLEAR` kładą moduły QR dokładnie na marginesie kadru,
// tak jak grafiki w FooterLogos (slot ma symetryczny padding `LOGO_CLEAR`).
export function PosterFooter({
  qrUrl, qrSide, qrPlacement, qrSizing = POSTER_QR, matchLogo = true, stack = true, lead, slots, variant, slotStyle, gap = 24, rowStyle, logosStyle, style,
}: PosterFooterProps) {
  const hasQr = qrUrl.trim() !== ''
  const above = hasQr && qrPlacement === 'above'
  const qrInline = hasQr && !above
  const [leadSizeRef, leadSize] = useElementSize<HTMLDivElement>()
  const leadNode = useRef<HTMLDivElement | null>(null)
  const leadRef = useCallback(
    (node: HTMLDivElement | null) => {
      leadNode.current = node
      return leadSizeRef(node)
    },
    [leadSizeRef],
  )
  // Wysokość samego tekstu (wielkie litery → linia bazowa), bez interlinii
  // pudełka - inaczej logo i kod wychodzą ponad tekst. Treść bez tekstu
  // (trójkąty w „Dacie") i render statyczny: wysokość pudełka.
  const [ink, setInk] = useState<number | null>(null)
  useLayoutEffect(() => {
    const next = leadNode.current ? textInkHeight(leadNode.current) : null
    setInk((prev) => (prev !== null && next !== null && Math.abs(prev - next) < 0.5 ? prev : next))
  }, [leadSize.height, leadSize.width])
  const leadHeight = Math.round(ink ?? leadSize.height)
  const clamp = (min: number, max: number) => Math.min(max, Math.max(min, leadHeight))
  const [rowRef, rowBox] = useElementSize<HTMLDivElement>()
  const [logosRef, logosBox] = useElementSize<HTMLDivElement>()
  // Proporcje grafik po wczytaniu, z adresem - zmiana grafiki na tej pozycji
  // unieważnia starą proporcję.
  const [ratios, setRatios] = useState<{ src: string; ratio: number }[]>([])
  const srcKey = (i: number) => {
    const slot = slots[i]
    return typeof slot === 'string' ? slot : 'pk' in slot ? `pk:${slot.pk}` : 'sknm'
  }
  const onRatio = (i: number, ratio: number) =>
    setRatios((prev) => {
      if (prev[i]?.src === srcKey(i) && Math.abs(prev[i].ratio - ratio) < 0.01) return prev
      const next = [...prev]
      next[i] = { src: srcKey(i), ratio }
      return next
    })
  const known = slots.map((_, i) => (ratios[i]?.src === srcKey(i) ? ratios[i].ratio : undefined))
  const leftQrSize = clamp(qrSizing.min, qrSizing.max)

  // Czy logotypy w LOGO_HEIGHT mieszczą się obok treści (w układzie z wyboru użytkownika)?
  const sideLeftQr = qrInline && qrSide === 'left'
  const leadWidth = (lead ? leadSize.width : 0) + (sideLeftQr ? leftQrSize + (lead ? gap : 0) : 0)
  const sideNeed = logoRowWidth(LOGO_HEIGHT, known, qrInline && qrSide === 'right', LOGO_CLEAR)
  const stacked = stack && (lead !== undefined || sideLeftQr) && rowBox.width > 0 && sideNeed !== null && sideNeed > rowBox.width - leadWidth - gap

  const inlineLeft = qrInline && (qrSide === 'left' || stacked)
  const inlineRight = qrInline && !inlineLeft
  const logoHeight = !matchLogo && stack
    ? LOGO_HEIGHT
    : fitLogoHeight({
        wanted: matchLogo ? clamp(LOGO_HEIGHT, LOGO_MAX_HEIGHT) : LOGO_HEIGHT,
        min: stack ? LOGO_HEIGHT : LOGO_SQUEEZE_HEIGHT,
        avail: logosBox.width + (stacked ? LOGO_CLEAR : 0),
        ratios: known,
        qrInRow: inlineRight,
        clear: LOGO_CLEAR,
      })
  const qrSize = inlineLeft || (above && qrSide === 'left') ? leftQrSize : logoHeight

  const row = (
    <div
      ref={rowRef}
      data-footer-stacked={stacked || undefined}
      style={{
        display: 'flex',
        // Kod QR, treść i logotypy mają wspólny środek w pionie: logo nie ma
        // linii bazowej, a przy różnych wysokościach dosunięcie do dołu
        // rozjeżdża i górne, i dolne krawędzie. Najwyższy element stoi na
        // dolnym marginesie, więc stopka ląduje w tym samym miejscu.
        alignItems: 'center',
        justifyContent: 'space-between',
        gap,
        ...rowStyle,
        ...(stacked && { flexDirection: 'column', alignItems: 'stretch' }),
      }}
    >
      {(inlineLeft || lead) && (
        <div data-footer-lead style={{ display: 'flex', alignItems: 'center', gap, minWidth: 0, flex: '0 1 auto', ...(stacked && { alignSelf: 'flex-start' }) }}>
          {inlineLeft && (
            // Ujemne marginesy zjadają padding slotu: z lewej moduły na
            // krawędzi kadru, z góry i z dołu po równo (środek kodu = środek
            // rzędu), z prawej - odstęp do tekstu równy `gap`.
            <div data-qr-inline="left" style={{ display: 'flex', margin: -LOGO_CLEAR }}>
              <QrSlot value={qrUrl} size={qrSize} />
            </div>
          )}
          {lead && (
            <div ref={leadRef} style={{ display: 'flex', alignItems: 'flex-end', minWidth: 0 }}>
              {lead}
            </div>
          )}
        </div>
      )}
      <div ref={logosRef} style={{ display: 'flex', flex: stacked ? '0 0 auto' : 1, minWidth: 0, ...logosStyle }}>
        <FooterLogos qrUrl={inlineRight ? qrUrl : ''} logoHeight={logoHeight} onRatio={onRatio} spread={stacked} slots={slots} variant={variant} slotStyle={slotStyle} />
      </div>
    </div>
  )

  if (!above) return style ? <div style={style}>{row}</div> : row
  return (
    <div style={{ display: 'flex', flexDirection: 'column', ...style }}>
      <div
        data-qr-row={qrSide}
        style={{
          display: 'flex',
          justifyContent: qrSide === 'left' ? 'flex-start' : 'flex-end',
          margin: qrSide === 'left' ? `0 0 0 ${-LOGO_CLEAR}px` : `0 ${-LOGO_CLEAR}px 0 0`,
        }}
      >
        <QrSlot value={qrUrl} size={qrSize} />
      </div>
      {row}
    </div>
  )
}
