import { useEffect, useRef, useState } from 'react'
import {
  buildBugIssueUrl,
  buildPosterRequestMailto,
  formatBugContext,
  type BugContextInput,
} from '../utils/issueUrl'

interface TicketDialogProps {
  type: 'bug' | 'request' | null
  onClose: () => void
  bugContext: BugContextInput
}

const fieldCls = 'w-full rounded-lg border border-field-border bg-field px-3 py-2 text-[0.9rem] text-fg'
const labelCls = 'mb-1 block text-[0.8rem] font-semibold text-muted'
const primaryCls = 'rounded-lg bg-accent px-4 py-2 text-[0.9rem] font-medium text-white hover:bg-accent-hover disabled:opacity-50'
const ghostCls = 'rounded-lg px-3 py-2 text-[0.9rem] text-muted hover:text-fg'

// Modal zgłoszeń na natywnym <dialog>. Jeden komponent, dwa zestawy pól
// wg `type`. Pola resetują się przy każdym otwarciu. Esc / klik w tło /
// „Anuluj" wołają `onClose`; wysłanie otwiera GitHub Issue (błąd) albo
// klienta poczty (zapotrzebowanie) i też woła `onClose`.
export function TicketDialog({ type, onClose, bugContext }: TicketDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  const [bugText, setBugText] = useState('')
  const [bugContact, setBugContact] = useState('')
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [neededBy, setNeededBy] = useState('')
  const [details, setDetails] = useState('')
  const [contact, setContact] = useState('')

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (type) {
      setBugText(''); setBugContact('')
      setEventName(''); setEventDate(''); setNeededBy(''); setDetails(''); setContact('')
      if (!el.open) el.showModal()
    } else if (el.open) {
      el.close()
    }
  }, [type])

  const submitBug = () => {
    if (!bugText.trim()) return
    window.open(
      buildBugIssueUrl({ userText: bugText, contact: bugContact || undefined, context: bugContext }),
      '_blank',
      'noopener',
    )
    onClose()
  }

  const submitRequest = () => {
    if (!eventName.trim() || !details.trim() || !contact.trim()) return
    window.location.href = buildPosterRequestMailto({
      event: eventName,
      eventDate: eventDate || undefined,
      neededBy: neededBy || undefined,
      details,
      contact,
    })
    onClose()
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose() }}
      className="m-auto w-[calc(100vw-2rem)] max-w-[520px] rounded-[14px] border border-border bg-surface p-5 text-fg [&::backdrop]:bg-black/50"
    >
      {type === 'bug' && (
        <form onSubmit={(e) => { e.preventDefault(); submitBug() }} className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Zgłoś błąd</h2>
          <div>
            <label className={labelCls} htmlFor="bug-text">Co jest nie tak?</label>
            <textarea id="bug-text" required rows={4} className={fieldCls}
              value={bugText} onChange={(e) => setBugText(e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="bug-contact">Twój kontakt (opcjonalnie)</label>
            <input id="bug-contact" className={fieldCls}
              placeholder="e-mail lub @nick, jeśli chcesz odpowiedź"
              value={bugContact} onChange={(e) => setBugContact(e.target.value)} />
          </div>
          <details className="text-[0.8rem] text-muted">
            <summary className="cursor-pointer">Co zostanie dołączone</summary>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-field p-2 text-[0.72rem]">
              {formatBugContext(bugContext)}
            </pre>
          </details>
          <div className="mt-1 flex justify-end gap-2">
            <button type="button" className={ghostCls} onClick={onClose}>Anuluj</button>
            <button type="submit" className={primaryCls} disabled={!bugText.trim()}>
              Otwórz zgłoszenie na GitHub
            </button>
          </div>
        </form>
      )}

      {type === 'request' && (
        <form onSubmit={(e) => { e.preventDefault(); submitRequest() }} className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Zgłoś zapotrzebowanie na plakat</h2>
          <div>
            <label className={labelCls} htmlFor="req-event">Nazwa wydarzenia</label>
            <input id="req-event" required className={fieldCls}
              value={eventName} onChange={(e) => setEventName(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={labelCls} htmlFor="req-date">Data wydarzenia</label>
              <input id="req-date" type="date" className={fieldCls}
                value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className={labelCls} htmlFor="req-needed">Plakat potrzebny do</label>
              <input id="req-needed" type="date" className={fieldCls}
                value={neededBy} onChange={(e) => setNeededBy(e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="req-details">Co ma się znaleźć na plakacie?</label>
            <textarea id="req-details" required rows={4} className={fieldCls}
              value={details} onChange={(e) => setDetails(e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="req-contact">Twój kontakt (imię + e-mail)</label>
            <input id="req-contact" required className={fieldCls}
              value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
          <div className="mt-1 flex justify-end gap-2">
            <button type="button" className={ghostCls} onClick={onClose}>Anuluj</button>
            <button type="submit" className={primaryCls}
              disabled={!eventName.trim() || !details.trim() || !contact.trim()}>
              Wyślij e-mailem
            </button>
          </div>
        </form>
      )}
    </dialog>
  )
}
