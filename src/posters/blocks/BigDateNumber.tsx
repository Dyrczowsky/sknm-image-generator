import type { CSSProperties } from 'react'
import { typography } from '../theme'
import { getDay, getMonthShort } from '../../utils/formatDate'
import type { PosterLang } from '../../types'

interface BigDateNumberProps {
  event_date: string
  color?: string
  style?: CSSProperties
  lang?: PosterLang
}

// Duży "dzień + skrócony miesiąc" w jednej linii (np. "12 LIS" / "12 NOV").
export function BigDateNumber({ event_date, color, style, lang }: BigDateNumberProps) {
  return (
    <div style={{ ...typography.bigDay, whiteSpace: 'nowrap', flex: '0 0 auto', color, ...style }}>
      {getDay(event_date)}
      <span style={typography.bigMonth}> {getMonthShort(event_date, { upperCase: true, lang })}</span>
    </div>
  )
}
