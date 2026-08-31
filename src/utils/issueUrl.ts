import type { FormValues } from '../types'

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
  form: FormValues
  appUrl: string
  userAgent: string
  version: string
}

const TEXT_FIELDS = [
  'title', 'subtitle', 'speaker', 'event_date', 'event_time', 'location', 'badge', 'badge2',
] as const

function trimTrailingHighSurrogate(s: string): string {
  return /[\uD800-\uDBFF]$/.test(s) ? s.slice(0, -1) : s
}

function fieldsSummary(form: FormValues): string {
  const parts = TEXT_FIELDS
    .filter((k) => typeof form[k] === 'string' && form[k].trim() !== '')
    .map((k) => `${k}="${form[k]}"`)
  return parts.length ? parts.join(', ') : '—'
}

function hiddenSummary(form: FormValues): string {
  const hidden = Object.entries(form.visibility ?? {})
    .filter(([, visible]) => visible === false)
    .map(([k]) => k)
  return hidden.length ? hidden.join(', ') : '—'
}

function attachmentsSummary(form: FormValues): string {
  const parts: string[] = []
  const graphics = form.graphics?.length ?? 0
  if (graphics) parts.push(`grafiki ×${graphics}`)
  const photos = Object.values(form.photos ?? {}).reduce((n, arr) => n + arr.length, 0)
  if (photos) parts.push(`zdjęcia ×${photos}`)
  const lists = Object.entries(form.lists ?? {})
    .filter(([, arr]) => arr.length > 0)
    .map(([k, arr]) => `${k} ×${arr.length}`)
  if (lists.length) parts.push(`listy: ${lists.join(', ')}`)
  if (form.showPkLogo) parts.push('logo PK')
  return parts.length ? parts.join(', ') : '—'
}

export function formatBugContext(input: BugContextInput): string {
  const template = input.templateName
    ? `${input.templateName} (\`${input.posterKey}\`)`
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
    `- **Pola:** ${fieldsSummary(input.form)}`,
    `- **Ukryte pola:** ${hiddenSummary(input.form)}`,
    `- **QR:** ${qr}`,
    `- **Załączniki:** ${attachmentsSummary(input.form)}`,
    `- **Wersja:** ${input.version} · ${input.appUrl}`,
    `- **Przeglądarka:** ${input.userAgent}`,
  ].join('\n')
}

function issueTitle(userText: string): string {
  const firstLine = userText.split('\n').map((l) => l.trim()).find((l) => l !== '')
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
  const contact = args.contact?.trim()
  const contactLine = contact ? `\n\n**Kontakt:** ${contact}` : ''
  const fullBody = `${args.userText.trim()}${contactLine}\n\n${formatBugContext(args.context)}`
  const base = `https://github.com/${TICKET_REPO}/issues/new`
  const title = issueTitle(args.userText)
  const build = (body: string) =>
    `${base}?title=${encodeURIComponent(title)}&labels=bug&body=${encodeURIComponent(body)}`

  const url = build(fullBody)
  if (url.length <= MAX_ISSUE_URL) return url

  const room = MAX_ISSUE_URL - build('').length - encodeURIComponent(TRUNCATION_MARK).length
  let sliced = fullBody
  while (sliced.length > 0 && encodeURIComponent(sliced).length > room) {
    sliced = trimTrailingHighSurrogate(sliced.slice(0, Math.max(0, sliced.length - 64)))
  }
  return build(sliced + TRUNCATION_MARK)
}

export interface PosterRequestInput {
  event: string
  eventDate?: string
  neededBy?: string
  details: string
  contact: string
}

export function buildPosterRequestMailto(input: PosterRequestInput): string {
  const eventForSubject = input.event.length > SUBJECT_EVENT_MAX
    ? `${trimTrailingHighSurrogate(input.event.slice(0, SUBJECT_EVENT_MAX - 1).trimEnd())}…`
    : input.event
  const subject = `Zapotrzebowanie na plakat: ${eventForSubject}`
  const linesFull = [
    `Wydarzenie: ${input.event}`,
    input.eventDate ? `Data wydarzenia: ${input.eventDate}` : null,
    input.neededBy ? `Plakat potrzebny do: ${input.neededBy}` : null,
    '',
    'Treść / czego potrzeba:',
    input.details,
    '',
    `Kontakt: ${input.contact}`,
  ].filter((l): l is string => l !== null)
  const build = (body: string) =>
    `mailto:${TICKET_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  const fullBody = linesFull.join('\n')
  const url = build(fullBody)
  if (url.length <= MAX_MAILTO_URL) return url

  const room = MAX_MAILTO_URL - build('').length - encodeURIComponent(MAILTO_MARK).length
  let sliced = fullBody
  while (sliced.length > 0 && encodeURIComponent(sliced).length > room) {
    sliced = trimTrailingHighSurrogate(sliced.slice(0, Math.max(0, sliced.length - 32)))
  }
  return build(sliced + MAILTO_MARK)
}
