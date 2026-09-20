# Poster language toggle (PL/EN) — design

## Goal

Add a global PL/EN switch to the app. It changes the language of the
**built-in, non-user-supplied text baked into the generated poster**
(default badge labels, fixed micro-copy, organization branding lines,
and date/month formatting). It does **not**:

- Translate the app's own interface (form field labels, buttons, section
  headers stay Polish always — the tool's users are Polish-speaking SKNM
  members).
- Translate anything the user types (title, subtitle, speaker, location,
  custom badge overrides) — that's the user's own text.
- Translate example/placeholder content that stands in for real data
  until the user fills a field in (`PLACEHOLDERS.title/speaker/location`
  in `src/posters/fallback.ts`, `DEFAULT_AGENDA` in
  `PosterKonferencja.tsx`) — these behave like the rest of the form's
  placeholder text, not like interface labels.

## State & persistence

- New type `PosterLang = 'pl' | 'en'`, exported from `src/types.ts`.
- New state in `App.tsx`: `const [lang, setLang] = useState<PosterLang>('pl')`.
- Persisted to `localStorage` under a single key (e.g. `sknm-poster-lang`),
  read once on mount (with a `'pl'` fallback for missing/invalid values)
  and written on every change via a `useEffect`.
- This is intentionally **not** stored in the SQLite draft/history DB
  (`src/db/*`) — it's a global session preference, not per-poster data,
  so no DB schema/version bump is needed. History thumbnails
  (`HistoryList.tsx`) re-render live under whatever the *current* global
  `lang` is, the same way they already re-render live under the current
  scheme — past entries do not remember the language they were created
  under.

## Prop threading

- `PosterProps` (`src/types.ts`) gains `lang?: PosterLang` (all 8 poster
  components already destructure `{ data, scheme, accent }` from this
  type; each adds `lang` to that destructure).
- `PosterPreviewProps` (`src/components/PosterPreview.tsx`) gains
  `lang?: PosterLang`, passed through to `<Component>`.
- `SchemeSelectorProps` (`src/components/SchemeSelector.tsx`) gains
  `lang?: PosterLang`, passed to the swatch `<SwatchComponent>` calls so
  the Kolorystyka thumbnails also reflect the current language.
- `HistoryList.tsx` passes the current `lang` (received as a new prop)
  to each historical `<Component>` re-render.
- `App.tsx` passes `lang` to `<PosterPreview>` and `<SchemeSelector>`.

## UI toggle

New small component `src/components/LangToggle.tsx`: a two-option
PL/EN switch (same visual language as the rest of the app — plain
buttons/pill, no new UI library). Rendered in `App.tsx` near the page
title, always visible regardless of which template is selected, since
the setting is global.

## Date formatting (`src/utils/formatDate.ts`)

Add an English month table alongside the existing Polish ones:

```ts
const MONTHS_SHORT_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_FULL_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
```

Extend the two functions that currently hardcode Polish month names to
take a `lang` parameter (default `'pl'`, so existing call sites without
`lang` keep working):

- `getMonthShort(isoDate, { upperCase, lang })` — `"wrz"`/`"WRZ"` (PL) vs
  `"Sep"`/`"SEP"` (EN).
- `formatFullDate(isoDate, lang)` — PL keeps `"20 września 2026"`
  (day + genitive month + year); EN becomes `"20 September 2026"`
  (day + full month + year, day-first so layouts that already fit the PL
  string don't reflow).

`getDay` is unchanged (a bare numeral, language-independent).

Every poster component that calls these (`PosterWyklad`, `PosterGosc`,
`PosterWarsztat`, `PosterKonferencja`, `PosterRekrutacja`, `PosterGala`,
`PosterData`, and the shared `blocks/BigDateNumber.tsx`) passes its own
`lang` prop through to the call.

## Built-in text changes, per poster

Only the literal defaults below change; everything else in each
component (layout, roles, user-entered fields) is untouched.

| Poster | Where | PL (current, unchanged when `lang==='pl'`) | EN (`lang==='en'`) |
|---|---|---|---|
| Wykład | `badge \|\| '...'` | `WYKŁAD OTWARTY` | `OPEN LECTURE` |
| Gość | `badge \|\| '...'` | `SEMINARIUM SKNM` | `SKNM SEMINAR` |
| Gość | static line | `Wstęp wolny · sknm.pk.edu.pl` | `Free entry · sknm.pk.edu.pl` |
| Warsztat | `badge \|\| '...'` | `WARSZTATY` | `WORKSHOP` |
| Konferencja | `badge \|\| '...'` | `SEMINARIUM SKNM` | `SKNM SEMINAR` |
| Konferencja | `badge2 \|\| '...'` | `WIĘCEJ INFORMACJI` | `MORE INFORMATION` |
| Rekrutacja | `badge \|\| '...'` | `SPOTKANIE ORGANIZACYJNE` | `KICK-OFF MEETING` |
| Gala | `badge \|\| '...'` | `GALA SKNM` | `SKNM GALA` |
| Data | `BrandingText` line 1 | `WYDARZENIE` | `EVENT` (line 2 `SKNM · PK` unchanged — it's already an acronym pair) |
| Wykład, Ogłoszenie | `BrandingText` (short org form, 3 lines) | `SKNM` / `POLITECHNIKA` / `KRAKOWSKA` | `SKNM` / `KRAKOW UNIVERSITY` / `OF TECHNOLOGY` |
| Gala, Rekrutacja | `BrandingText` (long org form, 3 lines) | `STUDENCKIE KOŁO` / `NAUKOWE MATEMATYKÓW` / `POLITECHNIKI KRAKOWSKIEJ` | `STUDENT SCIENCE CLUB` / `OF MATHEMATICS` / `KRAKOW UNIVERSITY OF TECHNOLOGY` |

Ogłoszenie needs no badge/date changes beyond the org-name line above
(its only other text is the bare `sknm.pk.edu.pl` URL).

Implementation pattern per component: the existing
`badge || 'SEMINARIUM SKNM'` becomes
`badge || (lang === 'en' ? 'SKNM SEMINAR' : 'SEMINARIUM SKNM')`, and
similarly for the `BrandingText` `lines` arrays and the Gość static
line. No new central copy/dictionary module — each string is only used
in one or two components, so an inline ternary at the existing call
site is simpler and more consistent with this codebase's style than
introducing an i18n dictionary abstraction for ~10 short strings.

## Testing

- `formatDate.test.ts` (new, or extend if one exists): `getMonthShort`
  and `formatFullDate` with `lang: 'en'` produce the expected English
  strings; omitting `lang` still produces Polish (backward compatible).
- For a couple of representative posters (e.g. `PosterWyklad`,
  `PosterRekrutacja`), a component-level check (existing test setup
  permitting) that `lang="en"` swaps the default badge/org text while
  user-supplied `data.badge`/`data.title` etc. pass through unchanged.
- Manual verification in the browser: toggle PL/EN, click through all 8
  templates, confirm only the table above changes and nothing overflows
  its layout (the long-form org name's third EN line is the longest
  addition — check it doesn't clip).

## Explicitly out of scope

- Translating the app's own UI (forms, buttons, headers).
- Auto-translating user-entered free text.
- Translating placeholder/example content (`PLACEHOLDERS.*`,
  `DEFAULT_AGENDA`).
- Per-poster or per-history-entry language (it's one global setting).
- Any new dependency (no i18n library) — plain ternaries and a
  `localStorage` key are enough for this amount of text.
