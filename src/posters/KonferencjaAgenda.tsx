import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { toPlain } from '../richText'
import type { ListItem } from '../types'
import { useElementSize } from '../utils/useElementSize'
import { AGENDA_LIMITS, agendaRows, initialAgendaFit, nextAgendaFit } from './agendaFit'
import { usePosterEdit } from './edit'
import { PosterText } from './blocks/PosterText'
import { colors, fontMono } from './theme'

interface KonferencjaAgendaProps {
  agenda: ListItem[]
  // Program domyślny - edycja jego punktu na podglądzie zapisuje całą listę.
  seed: ListItem[]
  // Oddech wiersza w pierwszym renderze (i jego górna granica bez `spread`).
  startPad: number
  // „Dopasuj program": wiersze rozkładają się na całą wysokość.
  spread: boolean
  // Kwadrat z „Dopasuj program" rośnie w dół zamiast dopasowywać program.
  grow: boolean
  // Kształt, w którym „Dopasuj program" wydłuża kadr (kwadrat) - ostrzeżenie
  // podpowiada wtedy tę opcję.
  canGrow: boolean
  // Kolor godzin (domyślnie koralowy we wszystkich schematach Konferencji).
  timeColor?: string
  // Dolna granica dopasowania (niski baner potrzebuje mniejszego tekstu niż plakat).
  minScale?: number
  minPad?: number
  // Liczba kolumn na start dopasowania (domyślnie jedna).
  startColumns?: 1 | 2
  // Węższa kolumna godzin i odstępy (baner: więcej miejsca na nazwy punktów).
  compact?: boolean
}

// [kolumna godzin, odstęp godzina–nazwa, odstęp między kolumnami] przy skali 1.
const SPACING = { regular: [140, 24, 48], compact: [96, 16, 28] }

// Program Konferencji zawsze mieszczący się w kadrze (patrz agendaFit.ts):
// po każdym renderze mierzy miejsce i program, i poprawia oddech wierszy,
// rozmiar tekstu albo liczbę kolumn, aż wynik się ustabilizuje. Pierwszy
// render (i render statyczny bez pomiaru) to układ wyjściowy: jedna kolumna,
// pełny tekst, oddech `startPad`.
export function KonferencjaAgenda({ agenda, seed, startPad, spread, grow, canGrow, timeColor = colors.coral, minScale = AGENDA_LIMITS.minScale, minPad = AGENDA_LIMITS.minPad, startColumns = 1, compact = false }: KonferencjaAgendaProps) {
  const { onNotice } = usePosterEdit()
  const boxRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const [sizeRef, box] = useElementSize<HTMLDivElement>()
  // Rozmiar samego programu: przełamanie tekstu (np. po wczytaniu fontu)
  // mierzy na nowo, ale nie zaczyna dopasowania od zera (to robi `key`).
  const [listSizeRef, listSize] = useElementSize<HTMLDivElement>()
  const setBox = useCallback(
    (node: HTMLDivElement | null) => {
      boxRef.current = node
      return sizeRef(node)
    },
    [sizeRef],
  )
  const setList = useCallback(
    (node: HTMLDivElement | null) => {
      listRef.current = node
      return listSizeRef(node)
    },
    [listSizeRef],
  )
  // Każda zmiana treści albo miejsca zaczyna dopasowanie od nowa - inaczej
  // skrócenie programu zostawiłoby go w zmniejszonym tekście.
  const key = JSON.stringify([agenda, startPad, spread, grow, minScale, minPad, startColumns, box.width, box.height])
  const [state, setState] = useState(() => ({ key, fit: initialAgendaFit(startPad, startColumns), cut: '' }))
  const current = state.key === key
  const fit = current ? state.fit : initialAgendaFit(startPad, startColumns)
  // Punkty, które nie zmieściły się nawet w najciaśniejszym układzie: ukryte
  // w całości (`visibility`, bez zmiany układu), zamiast uciętych w pół.
  const cut = new Set(current && fit.overflow > 0 ? state.cut.split(',').filter(Boolean).map(Number) : [])
  const limits = { minScale, minPad, maxPad: spread ? 1000 : startPad }

  useLayoutEffect(() => {
    const boxNode = boxRef.current
    const list = listRef.current
    if (grow || !boxNode || !list) return
    const avail = boxNode.clientHeight
    const outside: number[] = []
    list.querySelectorAll<HTMLElement>('[data-agenda-row]').forEach((row) => {
      if (row.offsetTop + row.offsetHeight > avail) outside.push(Number(row.dataset.agendaRow))
    })
    const next = nextAgendaFit(fit, { avail, listHeight: list.offsetHeight, items: agenda.length, fitting: agenda.length - outside.length }, limits)
    const nextCut = next.overflow > 0 ? outside.join(',') : ''
    if (next !== fit || !current || nextCut !== state.cut) setState({ key, fit: next, cut: nextCut })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `limits` i `agenda` są w `key`
  }, [key, fit, grow, listSize.height, state.cut])

  const overflow = grow ? 0 : fit.overflow
  useEffect(() => {
    const remedy = canGrow ? 'Włącz „Dopasuj program" (wydłuży kwadrat), skróć opisy lub tytuł albo usuń punkty.' : 'Skróć opisy lub tytuł albo usuń punkty.'
    onNotice?.(overflow > 0 ? `Program za długi: na plakacie brakuje miejsca na ${overflow} z ${agenda.length} punktów. ${remedy}` : null)
  }, [onNotice, overflow, agenda.length, canGrow])
  useEffect(() => () => onNotice?.(null), [onNotice])

  const s = fit.scale
  const [timeW, timeGap, columnGap] = SPACING[compact ? 'compact' : 'regular']
  const perColumn = agendaRows(agenda.length, fit.columns)
  const columnIndexes = Array.from({ length: fit.columns }, (_, c) => c)
  // Jedna siatka na obie kolumny: punkt `i` stoi w kolumnie i / perColumn,
  // w wierszu i % perColumn. Wiersz siatki jest wspólny, więc sąsiednie
  // punkty mają równą wysokość i linie obu kolumn biegną na tej samej
  // wysokości. Ostatni wiersz siatki to linia zamykająca każdą kolumnę.
  // „Dopasuj program" w kwadracie: wiersze dzielą się wysokością po równo.
  const track = grow ? 'minmax(auto, 1fr)' : 'auto'

  return (
    <div
      ref={setBox}
      // `position: relative` - offsetTop wierszy liczy się od tego pudełka.
      style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', ...(!grow && { minHeight: 0, overflow: 'hidden' }) }}
    >
      <div
        ref={setList}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${fit.columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${perColumn}, ${track}) auto`,
          columnGap,
          ...(grow && { flex: 1 }),
        }}
      >
        {agenda.map((item, i) => {
          const column = Math.floor(i / perColumn)
          const row = i % perColumn
          return (
            <div
              key={i}
              data-agenda-row={i}
              style={{
                ...(cut.has(i) && { visibility: 'hidden' }),
                gridColumn: column + 1,
                gridRow: row + 1,
                display: 'grid',
                gridTemplateColumns: `${Math.round(timeW * s)}px 1fr`,
                gap: Math.round(timeGap * s),
                padding: `${fit.pad}px 0`,
                // Pierwsza linia każdej kolumny w kolorze akcentu - kolumny są równorzędne.
                borderTop: `2px solid ${row === 0 ? 'var(--line-first)' : 'var(--line-rest)'}`,
                alignItems: 'baseline',
                alignContent: grow ? 'center' : 'start',
              }}
            >
                            <div style={{ font: `700 ${26 * s}px ${fontMono}`, color: timeColor }}>{item.time}</div>
              {/* Co najmniej jedna linijka tytułu: pusty punkt też jest wierszem,
                  a nie zlepionymi liniami. */}
              <div style={{ minHeight: Math.ceil(36 * s * 1.15) }}>
                {/* Pusta lista w formularzu: edycja punktu domyślnego zapisuje cały program domyślny. */}
                <PosterText
                  path={`lists.agenda.${i}.title`}
                  value={item.title}
                  listSeed={seed}
                  label={`Nazwa punktu, punkt ${i + 1}`}
                  multiline
                  style={{ fontSize: 36 * s, fontWeight: 700, lineHeight: 1.15, fontKerning: 'none', whiteSpace: 'pre-line' }}
                />
                {toPlain(item.subtitle ?? '') !== '' && (
                  <PosterText
                    path={`lists.agenda.${i}.subtitle`}
                    value={item.subtitle}
                    listSeed={seed}
                    label={`Prelegent / opis, punkt ${i + 1}`}
                    multiline
                    style={{ fontSize: 26 * s, fontWeight: 500, color: 'var(--muted-text)', whiteSpace: 'pre-line' }}
                  />
                )}
              </div>
            </div>
          )
        })}
        {columnIndexes.map((c) => (
          // Linia tuż pod ostatnim punktem kolumny (prawa bywa o punkt krótsza).
          <div key={`end-${c}`} style={{ gridColumn: c + 1, gridRow: Math.min(perColumn, agenda.length - c * perColumn) + 1, borderTop: '2px solid var(--line-rest)' }} />
        ))}
      </div>
    </div>
  )
}
