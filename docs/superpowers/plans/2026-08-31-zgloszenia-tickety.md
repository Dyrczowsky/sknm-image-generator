# Zgłoszenia (tickety) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dwa lekkie kanały zgłoszeń z generatora bez backendu — „Zgłoś błąd" (pływający przycisk → prefill GitHub Issue z auto-kontekstem) i „Zgłoś zapotrzebowanie na plakat" (link w stopce → `mailto:`).

**Architecture:** Cała logika składania linków to czyste funkcje w `src/utils/issueUrl.ts` (jedyna testowana jednostka; nie dotyka `window`/`navigator` — dostaje je jako argumenty). UI: jeden modal `TicketDialog` na natywnym `<dialog>`, parametryzowany typem, plus dwa cienkie wejścia (`FloatingReportButton`, `SiteFooter`). Stan „który modal otwarty" trzyma `App` w `useState<null | 'bug' | 'request'>`. Wersja builda wstrzykiwana przez Vite `define` z `GITHUB_SHA`.

**Tech Stack:** React 19 + TypeScript, Vite 8, Vitest 4 (`environment: 'node'`, `include: src/**/*.test.ts`), Tailwind v4, oxlint. Hosting: GitHub Pages, deploy z Actions na push do `main`.

**Spec:** `docs/superpowers/specs/2026-08-31-zgloszenia-tickety-design.md`

## Global Constraints

- Repo docelowe zgłoszeń: `Dyrczowsky/sknm-image-generator`. E-mail: `dyrczkuba@gmail.com`. Obie wartości jako eksportowane stałe `TICKET_REPO` / `TICKET_EMAIL` w `src/utils/issueUrl.ts`.
- Zgłoszenie błędu **nigdy** nie serializuje zawartości `form.graphics` ani `form.photos` (data-URL-e) — tylko liczności.
- Twarde limity długości: złożony URL Issues ≤ `7500` zn., `mailto:` ≤ `1800` zn. Po przekroczeniu — obcięcie treści z czytelnym markerem.
- Tytuł issue: `"Błąd: " + pierwsza niepusta linia opisu`, całość ≤ `80` zn.; brak niepustej linii → `"Zgłoszenie błędu"`.
- Escaping każdego parametru URL przez `encodeURIComponent`.
- Katalog na czyste funkcje: `src/utils/` (konwencja repo — `formatDate.ts`, `readAsDataUrl.ts`). **Nie** `src/lib/`.
- Komponenty bez testów (konwencja repo; brak jsdom, `include` łapie tylko `*.test.ts`). Testowany jest wyłącznie `issueUrl.ts`.
- UI po polsku na sztywno, pełna ortografia (ś, ż, ó, ł, ą, ę, ń).
- Każdy plik komponentu eksportuje tylko komponent (`react/only-export-components`).
- `npm test` / `npm run typecheck` / `npm run lint` / `npm run build` — wszystkie zielone.
- Commity po polsku, zakończone:
  ```
  Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_012PMGNREmRTX2LiLpQzTm6q
  ```
- Branch roboczy: `zgloszenia-tickety` (już utworzony z `main`, spec już zacommitowany).

## Stan wyjściowy (fakty z kodu)

- `src/App.tsx`: przy renderze dostępne `selectedTemplate` (`TemplateRow | undefined`, linia ~294), `selectedPoster` (~295), `SelectedForm` (~296), `selectedScheme` (`string | undefined`, stan), `form` (`FormValues`, stan). Główny `return (` ~320, `<main className={shell}>` ... `</main>` ~389. Osobna wczesna gałąź `if (!ready)` (~312–318) zwraca `<main>` z „Ładowanie..." — **nie ruszać**, stopka/FAB tylko po załadowaniu.
- Brak stopki, brak paska nagłówka, brak prymitywu modala.
- `src/vite-env.d.ts` zawiera tylko `/// <reference types="vite/client" />`.
- `vite.config.ts` — obiekt konfiguracji ma `build`, `base`, `plugins`, `test`; brak `define`.
- `FormValues` (`src/types.ts`): `title, subtitle, speaker, event_date, event_time, location, badge, badge2` (string), `visibility: Partial<Record<FormTextField, boolean>>` (`false` = ukryte), `graphics: string[]`, `showPkLogo: boolean`, `qrUrl: string`, `colors`, `photos: Record<string, PhotoValue[]>` (`PhotoValue = { src: string; x: number; y: number }`), `lists: Record<string, ListItem[]>` (`ListItem = Record<string,string>`).
- Tokeny Tailwind w użyciu: `bg-surface`, `border-border`, `text-muted`, `text-fg`, `bg-accent`, `bg-accent-hover`, `bg-field`, `border-field-border`.
- `SCHEME_LABELS` eksportowany z `src/posters/schemes.ts`.

## File Structure

| Plik | Odpowiedzialność | Task |
|---|---|---|
| `src/utils/issueUrl.ts` | czyste buildery: `formatBugContext`, `buildBugIssueUrl`, `buildPosterRequestMailto` + stałe | 1 |
| `src/utils/issueUrl.test.ts` | testy builderów (jedyny plik testowy) | 1 |
| `src/vite-env.d.ts` | `declare const __APP_VERSION__: string` | 2 |
| `vite.config.ts` | `define.__APP_VERSION__` z `GITHUB_SHA` | 2 |
| `src/components/TicketDialog.tsx` | modal `<dialog>`, oba zestawy pól wg `type` | 2 |
| `src/components/FloatingReportButton.tsx` | FAB prawy dolny róg | 2 |
| `src/components/SiteFooter.tsx` | stopka + wejście „zapotrzebowanie" | 2 |
| `src/App.tsx` | montaż trójki + stan `ticket` + `bugContext` | 2 |

---

## Task 1: `src/utils/issueUrl.ts` — buildery linków + testy

**Files:**
- Create: `src/utils/issueUrl.ts`
- Create: `src/utils/issueUrl.test.ts`

**Interfaces:**
- Consumes: `FormValues` (type) z `../types`
- Produces:
  - `export const TICKET_REPO: string` = `'Dyrczowsky/sknm-image-generator'`
  - `export const TICKET_EMAIL: string` = `'dyrczkuba@gmail.com'`
  - `export interface BugContextInput { templateName?: string; posterKey?: string; schemeKey?: string; schemeLabel?: string; form: FormValues; appUrl: string; userAgent: string; version: string }`
  - `export function formatBugContext(input: BugContextInput): string` — blok markdown „## Kontekst…"
  - `export function buildBugIssueUrl(args: { userText: string; contact?: string; context: BugContextInput }): string`
  - `export interface PosterRequestInput { event: string; eventDate?: string; neededBy?: string; details: string; contact: string }`
  - `export function buildPosterRequestMailto(input: PosterRequestInput): string`

- [ ] **Step 1: Napisz plik testowy `src/utils/issueUrl.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import {
  buildBugIssueUrl,
  buildPosterRequestMailto,
  formatBugContext,
  TICKET_EMAIL,
  TICKET_REPO,
  type BugContextInput,
} from './issueUrl'
import type { FormValues } from '../types'

const emptyForm: FormValues = {
  title: '', subtitle: '', speaker: '', event_date: '', event_time: '',
  location: '', badge: '', badge2: '', visibility: {}, graphics: [],
  showPkLogo: false, qrUrl: '', colors: {}, photos: {}, lists: {},
}

const ctx = (over: Partial<BugContextInput> = {}): BugContextInput => ({
  templateName: 'Wykład', posterKey: 'wyklad',
  schemeKey: 'okazjonalnyZloty', schemeLabel: 'Okazjonalny złoty',
  form: emptyForm, appUrl: 'https://example.test/app',
  userAgent: 'TestUA/1.0', version: 'a1b2c3d', ...over,
})

describe('formatBugContext', () => {
  it('zawiera szablon + poster_key oraz schemat + etykietę', () => {
    const s = formatBugContext(ctx())
    expect(s).toContain('Wykład (`wyklad`)')
    expect(s).toContain('Okazjonalny złoty (`okazjonalnyZloty`)')
  })

  it('z data-URL-i w graphics/photos bierze tylko liczby — zero base64', () => {
    const form: FormValues = {
      ...emptyForm,
      graphics: ['data:image/png;base64,AAAA', 'data:image/png;base64,BBBB'],
      photos: { photo: [{ src: 'data:image/jpeg;base64,CCCC', x: 0, y: 0 }] },
    }
    const s = formatBugContext(ctx({ form }))
    expect(s).toContain('grafiki ×2')
    expect(s).toContain('zdjęcia ×1')
    expect(s).not.toContain('data:')
    expect(s).not.toContain('base64')
  })

  it('puste schemeKey / qrUrl → „—"', () => {
    const s = formatBugContext(ctx({ schemeKey: undefined, schemeLabel: undefined }))
    expect(s).toMatch(/\*\*Schemat:\*\* —/)
    expect(s).toMatch(/\*\*QR:\*\* —/)
  })

  it('ukryte pola wypisane, widoczne pominięte', () => {
    const form: FormValues = { ...emptyForm, visibility: { speaker: false, location: false, title: true } }
    const s = formatBugContext(ctx({ form }))
    expect(s).toMatch(/\*\*Ukryte pola:\*\*[^\n]*speaker/)
    expect(s).toMatch(/\*\*Ukryte pola:\*\*[^\n]*location/)
    expect(s).not.toMatch(/\*\*Ukryte pola:\*\*[^\n]*title/)
  })
})

describe('buildBugIssueUrl', () => {
  it('poprawny host, ścieżka i parametry', () => {
    const url = buildBugIssueUrl({ userText: 'Coś nie działa', context: ctx() })
    const u = new URL(url)
    expect(u.origin + u.pathname).toBe(`https://github.com/${TICKET_REPO}/issues/new`)
    expect(u.searchParams.get('labels')).toBe('bug')
    expect(u.searchParams.get('title')).toBe('Błąd: Coś nie działa')
    expect(u.searchParams.get('body')).toContain('Coś nie działa')
    expect(u.searchParams.get('body')).toContain('## Kontekst')
  })

  it('tytuł „Błąd: " + I linia, całość ≤ 80 zn.', () => {
    const url = buildBugIssueUrl({ userText: `\n\n${'x'.repeat(200)}\ndruga`, context: ctx() })
    const title = new URL(url).searchParams.get('title') as string
    expect(title.startsWith('Błąd: ')).toBe(true)
    expect(title.length).toBeLessThanOrEqual(80)
  })

  it('brak niepustej linii → „Zgłoszenie błędu"', () => {
    const url = buildBugIssueUrl({ userText: '   \n  \n', context: ctx() })
    expect(new URL(url).searchParams.get('title')).toBe('Zgłoszenie błędu')
  })

  it('znaki specjalne i polskie przechodzą round-trip', () => {
    const text = 'Tło #fff & <coś> — źdźbło ączęńó'
    const url = buildBugIssueUrl({ userText: text, context: ctx() })
    expect(new URL(url).searchParams.get('body')).toContain(text)
  })

  it('kontakt dołączany tylko gdy podany', () => {
    const withC = buildBugIssueUrl({ userText: 'x', contact: 'jan@ex.pl', context: ctx() })
    expect(new URL(withC).searchParams.get('body')).toContain('jan@ex.pl')
    const without = buildBugIssueUrl({ userText: 'x', context: ctx() })
    expect(new URL(without).searchParams.get('body')).not.toContain('Kontakt:')
  })

  it('gigantyczny opis → URL ≤ 7500 i marker obcięcia', () => {
    const url = buildBugIssueUrl({ userText: 'A'.repeat(20000), context: ctx() })
    expect(url.length).toBeLessThanOrEqual(7500)
    expect(new URL(url).searchParams.get('body')).toContain('kontekst skrócony')
  })
})

describe('buildPosterRequestMailto', () => {
  it('mailto z tematem i wymaganymi polami', () => {
    const url = buildPosterRequestMailto({ event: 'Dzień Liczby Pi', details: 'Plakat A2', contact: 'Jan, jan@ex.pl' })
    expect(url.startsWith(`mailto:${TICKET_EMAIL}?`)).toBe(true)
    const q = new URLSearchParams(url.slice(url.indexOf('?') + 1))
    expect(q.get('subject')).toBe('Zapotrzebowanie na plakat: Dzień Liczby Pi')
    expect(q.get('body')).toContain('Dzień Liczby Pi')
    expect(q.get('body')).toContain('Jan, jan@ex.pl')
  })

  it('puste opcjonalne pola pominięte w treści', () => {
    const url = buildPosterRequestMailto({ event: 'X', details: 'Y', contact: 'Z' })
    const body = new URLSearchParams(url.slice(url.indexOf('?') + 1)).get('body') as string
    expect(body).not.toContain('Data wydarzenia:')
    expect(body).not.toContain('Plakat potrzebny do:')
  })

  it('bardzo długie details → URL ≤ 1800', () => {
    const url = buildPosterRequestMailto({ event: 'X', details: 'D'.repeat(5000), contact: 'Z' })
    expect(url.length).toBeLessThanOrEqual(1800)
  })
})
```

- [ ] **Step 2: Uruchom testy — mają nie skompilować / paść**

Run: `npx vitest run src/utils/issueUrl.test.ts`
Expected: FAIL — `./issueUrl` nie istnieje.

- [ ] **Step 3: Napisz `src/utils/issueUrl.ts`**

```ts
import type { FormValues } from '../types'

export const TICKET_REPO = 'Dyrczowsky/sknm-image-generator'
export const TICKET_EMAIL = 'dyrczkuba@gmail.com'

const MAX_ISSUE_URL = 7500
const MAX_MAILTO_URL = 1800
const TITLE_MAX = 80
const TITLE_PREFIX = 'Błąd: '
const TRUNCATION_MARK = '\n\n_(kontekst skrócony — wklej resztę ręcznie)_'

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
  const body = firstLine.length > room ? `${firstLine.slice(0, room - 1)}…` : firstLine
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
    sliced = sliced.slice(0, Math.max(0, sliced.length - 64))
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
  const subject = `Zapotrzebowanie na plakat: ${input.event}`
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

  let body = linesFull.join('\n')
  let url = build(body)
  while (url.length > MAX_MAILTO_URL && body.length > 0) {
    body = body.slice(0, Math.max(0, body.length - 32))
    url = build(body)
  }
  return url
}
```

- [ ] **Step 4: Uruchom testy — mają przejść**

Run: `npx vitest run src/utils/issueUrl.test.ts`
Expected: PASS (13 asercji w 3 blokach).

- [ ] **Step 5: Pełny zestaw**

Run: `npm run typecheck && npm test && npm run lint`
Expected: zielone (18 dotychczasowych + nowe).

- [ ] **Step 6: Commit**

```bash
git add src/utils/issueUrl.ts src/utils/issueUrl.test.ts
git commit -m "$(cat <<'EOF'
Buildery linków zgłoszeń: GitHub Issue (błąd) + mailto (zapotrzebowanie)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012PMGNREmRTX2LiLpQzTm6q
EOF
)"
```

---

## Task 2: UI zgłoszeń — modal, FAB, stopka, montaż w App

**Files:**
- Modify: `src/vite-env.d.ts` (dopisać 1 linię)
- Modify: `vite.config.ts` (dodać `define`)
- Create: `src/components/TicketDialog.tsx`
- Create: `src/components/FloatingReportButton.tsx`
- Create: `src/components/SiteFooter.tsx`
- Modify: `src/App.tsx` (import, stan `ticket`, `bugContext`, montaż w JSX)

**Interfaces:**
- Consumes z Task 1: `BugContextInput`, `buildBugIssueUrl`, `buildPosterRequestMailto`, `formatBugContext` z `../utils/issueUrl`
- Produces:
  - `export function TicketDialog(props: { type: 'bug' | 'request' | null; onClose: () => void; bugContext: BugContextInput }): JSX.Element`
  - `export function FloatingReportButton(props: { onClick: () => void }): JSX.Element`
  - `export function SiteFooter(props: { onRequestClick: () => void }): JSX.Element`
  - globalny `__APP_VERSION__: string`

- [ ] **Step 1: `src/vite-env.d.ts` — deklaracja `__APP_VERSION__`**

Dopisz na końcu pliku (po linii `/// <reference types="vite/client" />`):

```ts

// Wstrzykiwane przez Vite `define` (skrót hasha commita z GITHUB_SHA, lokalnie "dev").
declare const __APP_VERSION__: string
```

- [ ] **Step 2: `vite.config.ts` — `define`**

W obiekcie przekazywanym do `defineConfig({ ... })`, obok `build` / `base` (przed `plugins`), dodaj:

```ts
  define: {
    __APP_VERSION__: JSON.stringify((process.env.GITHUB_SHA ?? '').slice(0, 7) || 'dev'),
  },
```

`process` jest dostępne — `vite.config.ts` jest w `tsconfig.node.json` z `@types/node`.

- [ ] **Step 3: Uruchom typecheck — ma przejść**

Run: `npm run typecheck`
Expected: czysto (deklaracja globalna widoczna dla `src`).

- [ ] **Step 4: `src/components/FloatingReportButton.tsx`**

```tsx
interface FloatingReportButtonProps {
  onClick: () => void
}

// Pływający przycisk „Zgłoś błąd" — prawy dolny róg, zawsze widoczny.
// Na wąskich ekranach sama ikona (tekst chowany od 480px).
export function FloatingReportButton({ onClick }: FloatingReportButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Zgłoś błąd"
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-[0.9rem] font-medium text-white shadow-lg transition-[background-color,transform] hover:bg-accent-hover active:scale-95"
    >
      <span aria-hidden>🐞</span>
      <span className="hidden min-[480px]:inline">Zgłoś błąd</span>
    </button>
  )
}
```

- [ ] **Step 5: `src/components/SiteFooter.tsx`**

```tsx
interface SiteFooterProps {
  onRequestClick: () => void
}

// Stopka aplikacji — adres strony + wejście do zgłoszenia zapotrzebowania
// na plakat (otwiera modal, ten składa `mailto:`).
export function SiteFooter({ onRequestClick }: SiteFooterProps) {
  return (
    <footer className="mt-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border pt-6 pb-4 text-sm text-muted">
      <span>sknm.pk.edu.pl</span>
      <button
        type="button"
        onClick={onRequestClick}
        className="cursor-pointer underline hover:text-fg"
      >
        Potrzebujesz plakatu? Zgłoś zapotrzebowanie
      </button>
    </footer>
  )
}
```

- [ ] **Step 6: `src/components/TicketDialog.tsx`**

```tsx
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
```

> Uwaga: gdy `onClose` ustawi `type` na `null`, efekt wywoła `el.close()`, co odpali zdarzenie `close` → ponownie `onClose`. Ustawienie stanu na tę samą wartość (`null`) to no-op Reacta — nieszkodliwe, nie komplikować.

- [ ] **Step 7: `src/App.tsx` — importy**

Dodaj do bloku importów:

```ts
import { SCHEME_LABELS } from './posters/schemes'
import { TicketDialog } from './components/TicketDialog'
import { FloatingReportButton } from './components/FloatingReportButton'
import { SiteFooter } from './components/SiteFooter'
import type { BugContextInput } from './utils/issueUrl'
```

(`import { useState }` z `react` już jest.)

- [ ] **Step 8: `src/App.tsx` — stan `ticket`**

Obok pozostałych `useState` (przy `const [selectedScheme, setSelectedScheme] = ...`):

```ts
  const [ticket, setTicket] = useState<null | 'bug' | 'request'>(null)
```

- [ ] **Step 9: `src/App.tsx` — `bugContext`**

Zaraz po `const SelectedForm = selectedPoster?.Form` (linia ~296):

```ts
  const bugContext: BugContextInput = {
    templateName: selectedTemplate?.name,
    posterKey: selectedTemplate?.poster_key,
    schemeKey: selectedScheme,
    schemeLabel: selectedScheme ? SCHEME_LABELS[selectedScheme] : undefined,
    form,
    appUrl: window.location.href,
    userAgent: navigator.userAgent,
    version: __APP_VERSION__,
  }
```

- [ ] **Step 10: `src/App.tsx` — montaż w JSX**

Główny `return (` opakuj we fragment i domontuj trójkę. Było:

```tsx
  return (
    <main className={shell}>
      <h1 className="mb-2 text-[1.6rem] font-bold">Generator plakatów SKNM</h1>
      {/* ... */}
        <section className={`${panel} min-[900px]:[grid-area:history]`}>
          <h2 className={panelHeading}>Historia</h2>
          <HistoryList entries={history} onRestore={handleRestoreHistoryEntry} onDelete={handleDeleteHistoryEntry} />
        </section>
      </div>
    </main>
  )
```

Ma być:

```tsx
  return (
    <>
      <main className={shell}>
        <h1 className="mb-2 text-[1.6rem] font-bold">Generator plakatów SKNM</h1>
        {/* ... bez zmian ... */}
        <section className={`${panel} min-[900px]:[grid-area:history]`}>
          <h2 className={panelHeading}>Historia</h2>
          <HistoryList entries={history} onRestore={handleRestoreHistoryEntry} onDelete={handleDeleteHistoryEntry} />
        </section>
        </div>
        <SiteFooter onRequestClick={() => setTicket('request')} />
      </main>
      <FloatingReportButton onClick={() => setTicket('bug')} />
      <TicketDialog type={ticket} onClose={() => setTicket(null)} bugContext={bugContext} />
    </>
  )
```

Wcięcia dostosuj (całe drzewo `<main>` przesuwa się o jeden poziom w prawo). Wczesna gałąź `if (!ready)` **bez zmian**.

- [ ] **Step 11: Pełny zestaw kontroli**

Run: `npm run typecheck && npm test && npm run lint && npm run build`
Expected: wszystko zielone; `npm test` = 18 istniejących + testy z Task 1; build przechodzi (`__APP_VERSION__` = `'dev'`).

- [ ] **Step 12: Weryfikacja ręczna (`npm run dev`)**

- FAB „🐞 Zgłoś błąd" w prawym dolnym rogu; zwężenie okna < 480px → sama ikona.
- Klik FAB → modal „Zgłoś błąd". Rozwiń „Co zostanie dołączone" — widać realny szablon/schemat/pola. Wgraj 2 grafiki w formularzu, otwórz modal ponownie → w podglądzie kontekstu „grafiki ×2", **zero base64**.
- „Otwórz zgłoszenie na GitHub" (przy wpisanym opisie) → nowa karta na `github.com/Dyrczowsky/sknm-image-generator/issues/new` z uzupełnionym tytułem („Błąd: …"), treścią i etykietą `bug`. Modal się zamyka.
- Stopka na dole strony; „Potrzebujesz plakatu? Zgłoś zapotrzebowanie" → modal „zapotrzebowanie".
- Uzupełnij wymagane, „Wyślij e-mailem" → klient poczty z tematem „Zapotrzebowanie na plakat: …". Modal się zamyka.
- Esc oraz klik w przyciemnione tło zamykają modal; przycisk „Anuluj" też.
- Puste wymagane pola → przycisk wysyłki nieaktywny.

- [ ] **Step 13: Commit**

```bash
git add src/vite-env.d.ts vite.config.ts src/components/TicketDialog.tsx src/components/FloatingReportButton.tsx src/components/SiteFooter.tsx src/App.tsx
git commit -m "$(cat <<'EOF'
UI zgłoszeń: pływający przycisk błędu, stopka z zapotrzebowaniem, modal

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012PMGNREmRTX2LiLpQzTm6q
EOF
)"
```

---

## Self-Review

**Spec coverage:**

| Sekcja specu | Task / Step |
|---|---|
| `src/lib/issueUrl.ts` → `src/utils/issueUrl.ts` (konwencja repo) | Task 1 Step 3 |
| `TICKET_REPO` / `TICKET_EMAIL` stałe | Task 1 Step 3 |
| `formatBugContext` — kontekst bez data-URL-i | Task 1 Step 3 + testy Step 1 |
| `buildBugIssueUrl` — tytuł, body, `labels=bug`, limit `MAX_ISSUE_URL` | Task 1 Step 3 + testy |
| `buildPosterRequestMailto` — subject, body, limit `MAX_MAILTO_URL` | Task 1 Step 3 + testy |
| `TicketDialog` (natywny `<dialog>`, dwa zestawy pól, reset przy otwarciu) | Task 2 Step 6 |
| `FloatingReportButton` (FAB, ikona-only < 480px) | Task 2 Step 4 |
| `SiteFooter` (stopka + wejście zapotrzebowania) | Task 2 Step 5 |
| Montaż w `App.tsx` (`ticket` state, `bugContext`, fragment) | Task 2 Steps 7–10 |
| `__APP_VERSION__` przez Vite `define` z `GITHUB_SHA` | Task 2 Steps 1–2 |
| Testy tylko `issueUrl.test.ts`, komponenty bez testów | Task 1 Step 1; Global Constraints |
| Weryfikacja (`test`/`typecheck`/`lint`/`build` + ręczna) | Task 1 Step 5; Task 2 Steps 11–12 |

Brak luk. „Poza zakresem" ze specu (backend, zapis, zrzut PNG, etykiety GitHub, i18n) — świadomie nietknięte.

**Placeholder scan:** Każdy plik podany w całości. Kroki manualne (Task 2 Step 12) opisują konkretne kliknięcia i oczekiwane wyniki, nie „sprawdź czy działa".

**Type consistency:**
- `BugContextInput` — definiowany w Task 1 Step 3, importowany jako typ w `TicketDialog` (Task 2 Step 6) i `App.tsx` (Task 2 Steps 7, 9). Pola: `templateName?`, `posterKey?`, `schemeKey?`, `schemeLabel?`, `form`, `appUrl`, `userAgent`, `version` — zgodne między definicją, użyciem w `App` (Step 9) i testem (Step 1, `ctx()` helper).
- `TicketDialog` props `{ type: 'bug' | 'request' | null; onClose: () => void; bugContext: BugContextInput }` — zgodne z wywołaniem w `App` Step 10.
- `FloatingReportButton` `{ onClick: () => void }`, `SiteFooter` `{ onRequestClick: () => void }` — zgodne z wywołaniami Step 10.
- `buildBugIssueUrl(args: { userText; contact?; context })` — sygnatura identyczna w Step 3, teście (Step 1) i `TicketDialog.submitBug` (Step 6).
- `buildPosterRequestMailto(input: PosterRequestInput)` — `{ event; eventDate?; neededBy?; details; contact }` — zgodne w Step 3, teście, i `TicketDialog.submitRequest` (Step 6).
- `__APP_VERSION__: string` — deklaracja Task 2 Step 1, użycie Task 2 Step 9.
- `SCHEME_LABELS: Record<string, string>` — istniejący eksport z `src/posters/schemes.ts`, `SCHEME_LABELS[selectedScheme]` może dać `undefined` → `schemeLabel?` to dopuszcza, `formatBugContext` ma fallback `?? input.schemeKey`.

**Uwaga do wykonania (nie blokująca):** `new URL(mailtoUrl).searchParams` bywa zawodne dla schematu `mailto:` w niektórych runtime'ach — testy w Task 1 parsują `mailto` ręcznie przez `url.slice(url.indexOf('?') + 1)` + `URLSearchParams`, i tak należy zostać.
