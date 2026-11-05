import { PosterFooter } from './blocks/PosterFooter'
import type { ListItem, PosterProps } from '../types'
import { formatFullDate } from '../utils/formatDate'
import { DEFAULT_BADGE, SITE_URL } from './copy'
import { PLACEHOLDERS, withPlaceholders } from './fallback'
import { resolveScheme } from './schemes'
import { usePosterShape } from './shape'
import { fontMono, leading, TITLE_TRACKING } from './theme'
import { Badge } from './blocks/Badge'
import { PosterFrame } from './blocks/PosterFrame'
import { PosterText } from './blocks/PosterText'
import { KonferencjaAgenda } from './KonferencjaAgenda'
import { Sygnet } from './blocks/Sygnet'

const DEFAULT_AGENDA: ListItem[] = [
  { time: '09:30', title: 'Otwarcie i wykład plenarny', subtitle: 'prof. dr hab. Jan Nowak' },
  { time: '11:00', title: 'Sesja studencka I', subtitle: 'analiza numeryczna, optymalizacja' },
  { time: '13:00', title: 'Sesja studencka II', subtitle: 'statystyka, uczenie maszynowe' },
]

// KONFERENCJA — nagłówek + lista programu
export function PosterKonferencja({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { raw, event_date, logoSlots, qrUrl, qrSide, lists, hidden, fx, titleScale, fillAgenda } = withPlaceholders(data)
  const agenda = lists.agenda?.length ? lists.agenda : DEFAULT_AGENDA
  const { cssVars, sygnet, logoVariant } = resolveScheme('konferencja', scheme, accent)
  // W pionie wiersze programu dostają więcej oddechu, żeby krótka lista nie
  // zostawiała pustej połowy strony (kwadrat/poziom: ky = 1 → 22px jak dotąd).
  const { ky, shape } = usePosterShape()
  const rowPad = Math.round(22 * ky ** 3)

  return (
    // Z włączonym „Dopasuj program" kwadrat wydłuża się, gdy program się nie mieści.
    <PosterFrame vars={cssVars} grow={fillAgenda}>
      <div style={{ background: 'var(--panel)', color: 'var(--panel-text)', padding: '56px 72px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Badge color="var(--header-badge)" style={fx('badge')} field={{ path: 'badge', value: raw.badge, fallback: DEFAULT_BADGE.seminarium[lang], label: 'Etykieta nagłówka' }} />
          <PosterText
            path="title"
            value={raw.title}
            fallback={PLACEHOLDERS.title}
            multiline
            label="Tytuł"
            style={{ fontSize: 76 * titleScale, fontWeight: 800, lineHeight: leading(1.12, titleScale), letterSpacing: TITLE_TRACKING, fontKerning: 'none', whiteSpace: 'pre-line', ...fx('title') }}
          />
          <div style={{ fontSize: 28, fontWeight: 600 }}>
            <span style={fx('event_date')}>{formatFullDate(event_date, lang)}</span>
            {!hidden('event_date') && !hidden('location') && <span>{' · '}</span>}
            <PosterText as="span" path="location" value={raw.location} fallback={PLACEHOLDERS.location} inline label="Lokalizacja" style={fx('location')} />
          </div>
        </div>
        <Sygnet name={sygnet} style={{ flex: '0 0 auto', alignSelf: 'flex-start', marginTop: 16 }} />
      </div>

      {/* Program zawsze mieści się między nagłówkiem a stopką (druk ma stały
          format): oddech, rozmiar tekstu i kolumny dobiera KonferencjaAgenda.
          Wyjątek: kwadrat z „Dopasuj program" rośnie w dół. */}
      <div style={{ flex: 1, minHeight: 0, padding: '48px 72px 72px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 32 }}>
        <KonferencjaAgenda agenda={agenda} seed={DEFAULT_AGENDA} startPad={rowPad} spread={fillAgenda} grow={fillAgenda && shape === 'square'} canGrow={shape === 'square'} />

        {/* Layout wypełniony po brzegi - wiersz z kodem nad stopką wypchnąłby
            ją poza kadr, więc kod zawsze stoi w rzędzie stopki. */}
        <PosterFooter
          qrUrl={qrUrl} qrSide={qrSide} qrPlacement="inline" slots={logoSlots} variant={logoVariant}
          lead={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Badge color="var(--footer-badge)" style={{ font: `700 20px ${fontMono}`, letterSpacing: '.12em', ...fx('badge2') }}
                field={{ path: 'badge2', value: raw.badge2, fallback: DEFAULT_BADGE.wiecejInformacji[lang], label: 'Etykieta stopki' }}
              />
              <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--muted-text)' }}>{SITE_URL}</div>
            </div>
          }
        />
      </div>
    </PosterFrame>
  )
}
