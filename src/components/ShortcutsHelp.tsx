import { SHORTCUTS, formatCombo, type ShortcutId } from '../shortcuts/shortcuts'
import type { TicketType } from './TicketDialog'
import { UI_HEADING } from './styles'
import { Button, IconButton, Popover } from './ui'

interface Props {
  enabled: readonly ShortcutId[]
  isMac: boolean
  // Sterowane z zewnątrz, bo panel otwiera też klawisz „?".
  open: boolean
  onOpenChange: (open: boolean) => void
  // Wejścia do zgłoszeń: błąd (GitHub) i zapotrzebowanie na plakat (e-mail).
  onTicket: (type: TicketType) => void
}

// Pomoc w górnym pasku: lista skrótów klawiszowych i dwa zgłoszenia. Otwiera
// się kliknięciem albo klawiszem „?" (najechanie myszą niczego nie otwiera);
// zamykanie, fokus i Escape załatwia `Popover`.
export function ShortcutsHelp({ enabled, isMac, open, onOpenChange, onTicket }: Props) {
  const items = SHORTCUTS.filter((s) => enabled.includes(s.id))

  return (
    <Popover
      label="Pomoc"
      align="end"
      open={open}
      onOpenChange={onOpenChange}
      className="w-80"
      trigger={(props) => <IconButton {...props} icon="help" label="Pomoc i skróty klawiszowe" />}
    >
      {(close) => (
        <div className="flex flex-col gap-3">
          <section className="flex flex-col gap-2" aria-labelledby="help-shortcuts">
            <h2 id="help-shortcuts" className={UI_HEADING}>Skróty klawiszowe</h2>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {items.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-4">
                  <span>{s.label}</span>
                  <kbd className="flex-none rounded-md border border-border bg-sunken px-1.5 py-0.5 font-sans text-[0.8125rem] font-semibold text-fg">
                    {formatCombo(s.combo, isMac)}
                  </kbd>
                </li>
              ))}
            </ul>
          </section>
          <section className="-mx-1 flex flex-col border-t border-border pt-2" aria-label="Zgłoszenia">
            <Button
              variant="ghost"
              icon="bug"
              align="start"
              fullWidth
              onClick={() => {
                close()
                onTicket('bug')
              }}
            >
              Zgłoś błąd
            </Button>
            <Button
              variant="ghost"
              icon="idea"
              align="start"
              fullWidth
              onClick={() => {
                close()
                onTicket('request')
              }}
            >
              Zgłoś zapotrzebowanie na plakat
            </Button>
          </section>
        </div>
      )}
    </Popover>
  )
}
