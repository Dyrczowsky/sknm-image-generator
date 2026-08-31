# Zgłoszenia (tickety): błąd → GitHub Issues, zapotrzebowanie → e-mail

## Cel

Dwa lekkie kanały zgłoszeń z poziomu generatora, bez backendu (statyczny
hosting GitHub Pages):

1. **Zgłoś błąd** — pływający przycisk w prawym dolnym rogu. Otwiera modal,
   po wysłaniu otwiera nową kartę z **prefill-URL do GitHub Issues** repo
   `Dyrczowsky/sknm-image-generator`, z auto-dołączonym kontekstem (wybrany
   szablon, schemat kolorów, stan pól formularza).
2. **Zgłoś zapotrzebowanie na plakat** — link w stopce. Otwiera modal, po
   wysłaniu otwiera **`mailto:dyrczkuba@gmail.com`** z uzupełnionym tematem
   i treścią. (E-mail, nie Issues, bo zgłaszający — zwykły członek SKNM —
   zwykle nie ma konta GitHub.)

„Tylko dostarczenie" — aplikacja niczego nie zapisuje, nie ma listy ani
statusów.

## Stan wyjściowy

`src/App.tsx` renderuje `<main className={shell}>` z `<h1>` i jednym `<div>`
z siatką sekcji (`<section className={panel}>`). **Brak stopki, brak paska
nagłówka.** Dostępne w `App` przy renderze: `selectedTemplate` (`TemplateRow
| undefined`), `selectedScheme` (`string | undefined`), `form` (`FormValues`),
`selectedPoster` (`RegistryEntry | undefined`).

Tailwind v4 (tokeny: `bg-surface`, `border-border`, `text-muted`, `text-fg`,
`bg-accent`, `bg-accent-hover`, `bg-field`, `border-field-border`). Brak
jakiegokolwiek prymitywu modala w repo.

`FormValues` (z `src/types.ts`): pola tekstowe (`title`, `subtitle`, `speaker`,
`event_date`, `event_time`, `location`, `badge`, `badge2`), `visibility:
Partial<Record<FormTextField, boolean>>` (`false` = ukryte), `graphics:
string[]` (**data-URL-e**), `showPkLogo: boolean`, `qrUrl: string`,
`colors: Partial<Record<FormColorField,string>>`, `photos: Record<string,
PhotoValue[]>` (**data-URL-e w `PhotoValue.src`**), `lists: Record<string,
ListItem[]>`.

## Architektura

Cała logika budowania linków to czyste funkcje w `src/lib/issueUrl.ts`
(jedyna rzecz warta testów). UI: jeden modal `TicketDialog` parametryzowany
typem, plus dwa cienkie wejścia (`FloatingReportButton`, `SiteFooter`).
Stan „który modal otwarty" trzyma `App` (`useState<null | 'bug' |
'request'>`).

### `src/lib/issueUrl.ts`

```ts
export const TICKET_REPO = 'Dyrczowsky/sknm-image-generator'
export const TICKET_EMAIL = 'dyrczkuba@gmail.com'

// Twardy limit na złożony URL. GitHub/przeglądarki tną prefill ~8 KB;
// zostawiamy zapas. mailto w praktyce ~2 KB.
const MAX_ISSUE_URL = 7500
const MAX_MAILTO_URL = 1800

export interface BugContextInput {
  templateName: string | undefined       // selectedTemplate?.name
  posterKey: string | undefined          // selectedTemplate?.poster_key
  schemeKey: string | undefined          // selectedScheme
  schemeLabel: string | undefined        // SCHEME_LABELS[selectedScheme]
  form: FormValues
  appUrl: string                         // window.location.href
  userAgent: string                      // navigator.userAgent
  version: string                        // __APP_VERSION__
}

// Zwraca gotowy blok markdown „## Kontekst" — BEZ zawartości data-URL-i:
// z `graphics`/`photos` bierze tylko liczności.
export function formatBugContext(input: BugContextInput): string

// title = "Błąd: " + pierwsza niepusta linia `userText` (trim, ≤74 zn.),
//         całość ≤80 zn.; brak niepustej linii → "Zgłoszenie błędu".
// body  = userText + '\n\n' + formatBugContext(...) + (kontakt jeśli podany)
// Jeśli po złożeniu URL > MAX_ISSUE_URL: obcina body i dokleja
//   '\n\n_(kontekst skrócony — wklej resztę ręcznie)_'.
export function buildBugIssueUrl(args: {
  userText: string
  contact?: string
  context: BugContextInput
}): string

export interface PosterRequestInput {
  event: string           // wymagane
  eventDate?: string       // yyyy-mm-dd
  neededBy?: string        // yyyy-mm-dd
  details: string          // wymagane
  contact: string          // wymagane (imię + e-mail)
}

// subject = `Zapotrzebowanie na plakat: ${event}`
// body    = lista „Pole: wartość" (pomija puste opcjonalne)
// Zwraca `mailto:dyrczkuba@gmail.com?subject=…&body=…`,
// przycięte do MAX_MAILTO_URL.
export function buildPosterRequestMailto(input: PosterRequestInput): string
```

**Escaping:** każdy parametr przez `encodeURIComponent`. Issues:
`https://github.com/${TICKET_REPO}/issues/new?title=…&body=…&labels=bug`.
Etykieta `bug` istnieje w repo domyślnie — jeśli nie, GitHub i tak utworzy
issue (ostrzeżenie, bez błędu); nie tworzymy etykiet w tym zadaniu.

**Kontekst (markdown), przykład:**

```
## Kontekst (dołączone automatycznie)

- **Szablon:** Wykład (`wyklad`)
- **Schemat:** Okazjonalny złoty (`okazjonalnyZloty`)
- **Pola:** title="…", speaker="…", event_date="2026-09-10"
- **Ukryte pola:** location, badge2
- **QR:** https://…  (albo „—")
- **Załączniki:** grafiki ×2, zdjęcia ×1, listy: agenda ×3
- **Wersja:** a1b2c3d · <appUrl>
- **Przeglądarka:** <userAgent>
```

Puste sekcje → „—". `Pola:` pomija pola puste. **Nigdy** nie serializuje
`form.graphics` / `form.photos` (tylko `.length`).

### `src/components/TicketDialog.tsx`

Natywny `<dialog>` + `ref`; `dialog.showModal()` w `useEffect`, gdy `type`
niepusty, `dialog.close()` w cleanup; `onClose` (Esc / backdrop) woła
`props.onClose`. Backdrop: `[&::backdrop]:bg-black/50`.

Props:
```ts
{
  type: 'bug' | 'request' | null
  onClose: () => void
  bugContext: BugContextInput   // używane tylko dla type==='bug'
}
```

Pola kontrolowane lokalnym `useState` (reset przy zmianie `type`):

- **`bug`:** `opis` (textarea, wymagane), `kontakt` (input, opcjonalne,
  placeholder „e-mail lub @nick, jeśli chcesz odpowiedź"). Rozwijany
  `<details>` „Co zostanie dołączone" pokazujący `formatBugContext(bugContext)`
  (read-only). Przycisk „Otwórz zgłoszenie na GitHub" (disabled gdy `opis`
  pusty) → `window.open(buildBugIssueUrl(...), '_blank', 'noopener')` →
  `onClose()`.
- **`request`:** `event` (input, wymagane), `eventDate` (input date,
  opcjonalne), `neededBy` (input date, opcjonalne), `details` (textarea,
  wymagane), `contact` (input, wymagane). Przycisk „Wyślij e-mailem"
  (disabled gdy wymagane puste) → `window.location.href =
  buildPosterRequestMailto(...)` → `onClose()`.

Nagłówek modala i submit label zależą od `type`. Stylowanie: `panel`-owe
tokeny, szerokość `max-w-[520px]`, `w-[calc(100vw-2rem)]`.

### `src/components/FloatingReportButton.tsx`

```tsx
export function FloatingReportButton({ onClick }: { onClick: () => void }) { … }
```
`<button type="button" onClick={onClick}>` — `fixed bottom-4 right-4 z-40`,
`rounded-full` (lub `rounded-lg`), `bg-accent text-white`, ikona 🐞 + tekst
„Zgłoś błąd" (na wąskich ekranach sama ikona: tekst `hidden min-[480px]:inline`).
`aria-label="Zgłoś błąd"`. Cień, `hover:bg-accent-hover`.

### `src/components/SiteFooter.tsx`

```tsx
export function SiteFooter({ onRequestClick }: { onRequestClick: () => void }) { … }
```
`<footer className="mt-10 border-t border-border pt-6 pb-4 text-sm text-muted flex flex-wrap gap-x-4 gap-y-2 justify-between">`:
- lewa: `sknm.pk.edu.pl`
- prawa: `<button type="button" onClick={onRequestClick} className="underline …">Potrzebujesz plakatu? Zgłoś zapotrzebowanie</button>`

### `src/App.tsx` — montaż

- `import { SCHEME_LABELS } from './posters/schemes'`, trzy nowe komponenty.
- `const [ticket, setTicket] = useState<null | 'bug' | 'request'>(null)`
- `bugContext` liczony inline przy renderze (nie `useMemo` — tanie):
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
- W drzewie: po zamknięciu `<div>` siatki, wewnątrz `<main>`:
  `<SiteFooter onRequestClick={() => setTicket('request')} />`
- Po `</main>` (rodzeństwo): `<FloatingReportButton onClick={() => setTicket('bug')} />`
  i `<TicketDialog type={ticket} onClose={() => setTicket(null)} bugContext={bugContext} />`
- Gałąź `if (!ready)` zostaje bez zmian (stopka/FAB tylko po załadowaniu).

### `vite.config.ts` + `src/vite-env.d.ts`

```ts
// vite.config.ts
define: {
  __APP_VERSION__: JSON.stringify(
    (process.env.GITHUB_SHA ?? '').slice(0, 7) || 'dev'
  ),
},
```
`GITHUB_SHA` ustawia GitHub Actions (workflow `deploy.yml`), lokalnie → `dev`.

```ts
// src/vite-env.d.ts (dopisać)
declare const __APP_VERSION__: string
```

## Testy — `src/lib/issueUrl.test.ts`

Jedyna testowana jednostka. Vitest, `environment: 'node'` (jak reszta repo).

1. **`formatBugContext`**
   - dołącza nazwę szablonu + `poster_key`, schemat + etykietę
   - `graphics`/`photos` z data-URL-ami → w wyniku **tylko liczby**, żaden
     `data:` string
   - puste `schemeKey` → „—"; pusty `qrUrl` → „—"
   - ukryte pola (`visibility[x] === false`) wypisane, widoczne pominięte
2. **`buildBugIssueUrl`**
   - host + ścieżka `/Dyrczowsky/sknm-image-generator/issues/new`
   - `title`/`body`/`labels=bug` obecne i poprawnie zenkodowane
     (`decodeURIComponent` odwraca)
   - tytuł = „Błąd: " + pierwsza niepusta linia opisu, całość ≤ 80 zn.;
     opis bez niepustej linii → „Zgłoszenie błędu"
   - opis wielolinijkowy z `#`, `&`, znakami PL → po dekodowaniu identyczny
   - `contact` podany → w body; nie podany → brak sekcji kontaktu
   - **gigantyczny `userText` (np. 20 000 zn.)** → URL ≤ `MAX_ISSUE_URL`,
     body kończy się markerem obcięcia
3. **`buildPosterRequestMailto`**
   - `mailto:dyrczkuba@gmail.com?subject=…&body=…`
   - `subject` = `Zapotrzebowanie na plakat: <event>` (zenkodowany)
   - opcjonalne puste (`eventDate`/`neededBy`) → pominięte w body
   - wymagane pola w body
   - bardzo długie `details` → URL ≤ `MAX_MAILTO_URL`

Komponenty (`TicketDialog`, `FloatingReportButton`, `SiteFooter`) — **bez
testów**, zgodnie z konwencją repo (`SchemeSelector`, `HistoryList` itd. też
nietestowane; brak jsdom w konfiguracji vitest).

## Weryfikacja

- `npm test` — zielone (nowy plik + istniejące 18)
- `npm run typecheck` — czysto (deklaracja `__APP_VERSION__`)
- `npm run lint` — czysto
- `npm run build` — przechodzi; `__APP_VERSION__` = `'dev'` lokalnie
- `npm run dev` — ręcznie:
  - FAB widoczny w prawym dolnym rogu, na wąskim ekranie sama ikona
  - modal błędu: „Co zostanie dołączone" pokazuje realny kontekst; po
    „Otwórz zgłoszenie" nowa karta z GitHub, tytuł + body + label `bug`
    uzupełnione; wgraj 2 grafiki → w body są tylko „grafiki ×2", zero base64
  - stopka: link otwiera modal zapotrzebowania; „Wyślij e-mailem" otwiera
    klienta z tematem `Zapotrzebowanie na plakat: …`
  - Esc i klik w tło zamykają modal; focus wraca sensownie

## Poza zakresem

- Jakikolwiek backend / zapis / lista zgłoszeń / statusy
- Wysyłka bez opuszczania strony (fetch do usługi formularzy) — świadomie
  odrzucone na rzecz prefill-URL / mailto
- Zrzut PNG plakatu w zgłoszeniu błędu (user wybrał „szablon + schemat +
  stan formularza", bez zrzutu)
- Tworzenie etykiet GitHub, szablony Issue (`.github/ISSUE_TEMPLATE`)
- i18n, tłumaczenia — UI jest po polsku na sztywno jak reszta
- Rate-limiting / anty-spam (prefill-URL nic nie wysyła automatycznie)

## Ryzyka / świadome kompromisy

- **Bariera konta GitHub przy „zgłoś błąd"** — zgłaszający musi być
  zalogowany, żeby wysłać issue. Akceptowane (błędy zgłaszają zwykle osoby
  z zespołu). Zapotrzebowanie idzie mailem właśnie po to.
- **`mailto:` bywa ułomne** na mobile-web bez skonfigurowanego klienta.
  Akceptowane; alternatywa (Google Form) do rozważenia później.
- **Limit długości prefill-URL** — rozwiązany twardym obcięciem body +
  czytelnym markerem; realnie tekst błędu + kontekst mieszczą się z zapasem.
- `window.location.href = 'mailto:…'` może w niektórych przeglądarkach dać
  pustą nawigację jeśli brak handlera — akceptowalne, modal i tak się zamyka.
