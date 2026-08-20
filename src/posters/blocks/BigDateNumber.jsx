import { typography } from '../theme'
import { getDay, getMonthShort } from '../../utils/formatDate'

// Duży "dzień + skrócony miesiąc" w jednej linii (np. "12 LIS").
export function BigDateNumber({ event_date, color, style }) {
  return (
    <div style={{ ...typography.bigDay, whiteSpace: 'nowrap', flex: '0 0 auto', color, ...style }}>
      {getDay(event_date)}
      <span style={typography.bigMonth}> {getMonthShort(event_date, { upperCase: true })}</span>
    </div>
  )
}
