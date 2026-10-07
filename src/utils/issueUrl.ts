import { FORM_TEXT_FIELDS } from '../types'
import type { FormValues, PosterLang } from '../types'

export const TICKET_REPO = 'Dyrczowsky/sknm-image-generator'
export const TICKET_EMAIL = 'dyrczkuba@gmail.com'

const MAX_ISSUE_URL = 7500
const MAX_MAILTO_URL = 1800
const TITLE_MAX = 80
const TITLE_PREFIX = 'Błąd: '
const TRUNCATION_MARK = '\n\n_(kontekst skrócony — wklej resztę ręcznie)_'
const SUBJECT_EVENT_MAX = 120
const MAILTO_MARK = '\n\n(treść skrócona — dopisz resztę w mailu)'

export interface BugContextInput {
  templateName?: string
  posterKey?: string
  schemeKey?: string
  schemeLabel?: string
  lang?: PosterLang
  form: FormValues
  appUrl: string
  userAgent: string
  version: string
}

function trimTrailingHighSurrogate(s: string): string {
  return /[\uD800-\uDBFF]$/.test(s) ? s.slice(0, -1) : s
}

// Usuwa osamotnione połówki par surogatów (np. z wklejenia uciętego emoji) —
// inaczej `encodeURIComponent` rzuca URIError.
function stripLoneSurrogates(s: string): string {
  return s.replace(/\p{Surrogate}/gu, '')
}

// Lista po przecinku albo pauza, gdy nie ma nic do wypisania.
const listOrDash = (parts: string[]): string => (parts.length ? parts.join(', ') : '—')

// Buduje URL z `body`, a gdy wychodzi dłuższy niż `maxLength`, przycina treść
// (po `step` znaków naraz) i dokleja `mark` - informację, że resztę trzeba
// dopisać ręcznie. Limit dotyczy długości PO zakodowaniu znaków.
function fitUrl(build: (body: string) => string, body: string, limits: { maxLength: number; mark: string; step: number }): string {
  const url = build(body)
  if (url.length <= limits.maxLength) return url

  const room = limits.maxLength - build('').length - encodeURIComponent(limits.mark).length
  if (room <= 0) return build('')
  let sliced = body
  while (sliced.length > 0 && encodeURIComponent(sliced).length > room) {
    sliced = trimTrailingHighSurrogate(sliced.slice(0, Math.max(0, sliced.length - limits.step)))
  }
  return build(sliced + limits.mark)
}

function fieldsSummary(form: FormValues): string {
  return listOrDash(
    FORM_TEXT_FIELDS
      .filter((name) => typeof form[name] === 'string' && form[name].trim() !== '')
      .map((name) => `${name}="${form[name]}"`),
  )
}

function hiddenSummary(form: FormValues): string {
  return listOrDash(
    Object.entries(form.visibility ?? {})
      .filter(([, visible]) => visible === false)
      .map(([name]) => name),
  )
}

function attachmentsSummary(form: FormValues): string {
  const parts: string[] = []
  const graphics = form.graphics?.length ?? 0
  if (graphics) parts.push(`grafiki ×${graphics}`)
  const photos = Object.values(form.photos ?? {}).reduce((n, arr) => n + arr.length, 0)
  if (photos) parts.push(`zdjęcia ×${photos}`)
  const lists = Object.entries(form.lists ?? {})
    .filter(([, arr]) => arr.length > 0)
    .map(([name, arr]) => `${name} ×${arr.length}`)
  if (lists.length) parts.push(`listy: ${lists.join(', ')}`)
  if (form.showPkLogo) parts.push('logo PK')
  return listOrDash(parts)
}

export function formatBugContext(input: BugContextInput): string {
  const template = input.templateName
    ? `${input.templateName} (\`${input.posterKey ?? '?'}\`)`
    : '—'
  const scheme = input.schemeKey
    ? `${input.schemeLabel ?? input.schemeKey} (\`${input.schemeKey}\`)`
    : '—'
  const qr = input.form.qrUrl?.trim() ? input.form.qrUrl.trim() : '—'
  return [
    '## Kontekst (dołączone automatycznie)',
    '',
    `- **Szablon:** ${template}`,
    `- **Schemat:** ${scheme}`,
    `- **Język plakatu:** ${input.lang ?? 'pl'}`,
    `- **Pola:** ${fieldsSummary(input.form)}`,
    `- **Ukryte pola:** ${hiddenSummary(input.form)}`,
    `- **QR:** ${qr}`,
    `- **Załączniki:** ${attachmentsSummary(input.form)}`,
    `- **Wersja:** ${input.version} · ${input.appUrl}`,
    `- **Przeglądarka:** ${input.userAgent}`,
  ].join('\n')
}

function issueTitle(userText: string): string {
  const firstLine = userText.split('\n').map((line) => line.trim()).find((line) => line !== '')
  if (!firstLine) return 'Zgłoszenie błędu'
  const room = TITLE_MAX - TITLE_PREFIX.length
  const body = firstLine.length > room ? `${trimTrailingHighSurrogate(firstLine.slice(0, room - 1))}…` : firstLine
  return `${TITLE_PREFIX}${body}`
}

export function buildBugIssueUrl(args: {
  userText: string
  contact?: string
  context: BugContextInput
}): string {
  const userText = stripLoneSurrogates(args.userText)
  const contact = stripLoneSurrogates(args.contact ?? '').trim()
  const contactLine = contact ? `\n\n**Kontakt:** ${contact}` : ''
  const fullBody = stripLoneSurrogates(`${userText.trim()}${contactLine}\n\n${formatBugContext(args.context)}`)
  const base = `https://github.com/${TICKET_REPO}/issues/new`
  const title = issueTitle(userText)
  const build = (body: string) =>
    `${base}?title=${encodeURIComponent(title)}&labels=bug&body=${encodeURIComponent(body)}`

  return fitUrl(build, fullBody, { maxLength: MAX_ISSUE_URL, mark: TRUNCATION_MARK, step: 64 })
}

export interface PosterRequestInput {
  event: string
  eventDate?: string
  neededBy?: string
  details: string
  contact: string
}

export function buildPosterRequestMailto(input: PosterRequestInput): string {
  const event = stripLoneSurrogates(input.event)
  const details = stripLoneSurrogates(input.details)
  const contact = stripLoneSurrogates(input.contact)
  const eventDate = input.eventDate ? stripLoneSurrogates(input.eventDate) : undefined
  const neededBy = input.neededBy ? stripLoneSurrogates(input.neededBy) : undefined
  const eventForSubject = event.length > SUBJECT_EVENT_MAX
    ? `${trimTrailingHighSurrogate(event.slice(0, SUBJECT_EVENT_MAX - 1).trimEnd())}…`
    : event
  const subject = `Zapotrzebowanie na plakat: ${eventForSubject}`
  const lines = [
    `Wydarzenie: ${event}`,
    eventDate ? `Data wydarzenia: ${eventDate}` : null,
    neededBy ? `Plakat potrzebny do: ${neededBy}` : null,
    '',
    'Treść / czego potrzeba:',
    details,
    '',
    `Kontakt: ${contact}`,
  ].filter((line): line is string => line !== null)
  const build = (body: string) =>
    `mailto:${TICKET_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  return fitUrl(build, lines.join('\n'), { maxLength: MAX_MAILTO_URL, mark: MAILTO_MARK, step: 32 })
}
