# Supabase: login, shared history, shared to-do notes — design

## Goal

Let the club's board share two things across people and devices: the history
of exported posters, and a short to-do list. Both live in a Supabase database
behind a login. The generator itself stays usable by anyone.

Today history is the `generated_images` table in the in-browser SQLite file
(`src/db/history.ts`, persisted to IndexedDB), so each browser has its own
list. There is no login and no notes feature.

## Decisions (from brainstorming)

- **Login:** invite-only, e-mail + password. Public sign-up is disabled in the
  Supabase dashboard; members are invited there.
- **Signed out:** the generator works as today (templates, form, preview,
  export, local draft). History and notes show a sign-in prompt. Exports made
  while signed out are not recorded.
- **History:** one shared list. Any signed-in member can read, add and delete.
- **Notes:** one shared to-do list: text, done checkbox, author, date. Any
  signed-in member can add, edit, tick off and delete any item.
- **Old local history is dropped**, not migrated.
- **Client:** the official `@supabase/supabase-js` SDK.
- **No live sync** between open browsers in this version.
- Tables carry an **`sknm_` prefix** (`sknm_poster_history`, `sknm_notes`): the
  Supabase project is shared with another app, and so are its logins.
- Drafts and templates **stay local** (sql.js + IndexedDB), unchanged.

## Configuration

Two build-time variables, read through `import.meta.env`:

| Variable | Meaning |
|---|---|
| `VITE_SUPABASE_URL` | project URL, e.g. `https://abc.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | the project's public anon key |

- Development: `.env.local` (already gitignored by `*.local`). A committed
  `.env.example` lists both names with empty values.
- Deploy: `.github/workflows/deploy.yml` passes both to the `Build` step from
  repository **variables** (`vars.VITE_SUPABASE_URL`,
  `vars.VITE_SUPABASE_ANON_KEY`). The anon key is public by design; access is
  enforced by row-level security.
- `src/vite-env.d.ts` declares both on `ImportMetaEnv` as optional strings.
- **Unconfigured** (either variable missing or empty): no Supabase client is
  created, the login button is not rendered, and the History and Notes panels
  are not rendered. The generator behaves exactly as a signed-out user sees
  it, minus the prompts.

## Database

One migration file, `supabase/migrations/20261007000000_history_and_notes.sql`,
run once in the Supabase SQL editor.

```sql
create table public.sknm_poster_history (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  created_by  uuid not null default auth.uid() references auth.users (id),
  poster_key  text not null check (char_length(poster_key) <= 40),
  title       text not null default '' check (char_length(title) <= 500),
  subtitle    text not null default '' check (char_length(subtitle) <= 500),
  speaker     text not null default '' check (char_length(speaker) <= 200),
  event_date  text not null default '' check (char_length(event_date) <= 10),
  event_time  text not null default '' check (char_length(event_time) <= 5),
  location    text not null default '' check (char_length(location) <= 200),
  color_scheme text check (char_length(color_scheme) <= 80)
);

create table public.sknm_notes (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  created_by   uuid not null default auth.uid() references auth.users (id),
  author_email text not null default (auth.jwt() ->> 'email'),
  text         text not null check (char_length(text) between 1 and 500),
  done         boolean not null default false
);

alter table public.sknm_poster_history enable row level security;
alter table public.sknm_notes enable row level security;

create policy "members read history"   on public.sknm_poster_history for select to authenticated using (true);
create policy "members add history"    on public.sknm_poster_history for insert to authenticated with check (created_by = auth.uid());
create policy "members delete history" on public.sknm_poster_history for delete to authenticated using (true);

create policy "members read notes"   on public.sknm_notes for select to authenticated using (true);
create policy "members add notes"    on public.sknm_notes for insert to authenticated with check (created_by = auth.uid());
create policy "members update notes" on public.sknm_notes for update to authenticated using (true) with check (true);
create policy "members delete notes" on public.sknm_notes for delete to authenticated using (true);
```

- The `anon` role has no policy on either table, so a visitor holding only the
  anon key reads and writes nothing.
- `event_date` / `event_time` stay text (`YYYY-MM-DD`, `HH:MM`, or empty), the
  same values the form holds, so no conversion is needed either way.
- `poster_key` replaces today's `template_id`: local template ids are
  autoincremented per browser and would not match between devices.
- `author_email` is filled by the database from the session token, so a
  client cannot post a note under someone else's address.

## Modules

```
src/supabase/
  client.ts        supabase: SupabaseClient | null   (null = unconfigured)
  useSession.ts    useSession(): { status, email, signIn, signOut, ... }
src/history/
  remoteHistory.ts listHistory / addHistoryEntry / deleteHistoryEntry
  useHistory.ts    state + actions for the History panel
src/notes/
  remoteNotes.ts   listNotes / addNote / updateNote / deleteNote
  useNotes.ts      state + actions for the Notes panel
src/components/
  AuthControl.tsx  header button: "Zaloguj" or e-mail + "Wyloguj"
  AuthDialog.tsx   sign-in / set-password / reset-request forms
  NotesPanel.tsx   the to-do list
  RemotePanel.tsx  shared wrapper: sign-in prompt, loading, error + retry
```

### `supabase/client.ts`

Creates the client with `createClient(url, anonKey)` when both variables are
set, otherwise exports `null`. Default auth options are kept (session in
`localStorage`, token auto-refresh, session detection from the URL).

### `supabase/useSession.ts`

```ts
type SessionStatus = 'unconfigured' | 'loading' | 'signedOut' | 'signedIn' | 'settingPassword'
```

- Reads the current session once, then follows `onAuthStateChange`.
- `settingPassword` is entered on the `PASSWORD_RECOVERY` event and when the
  URL the user arrived with carries `type=invite` — both mean "this user has a
  session but must choose a password now".
- Actions: `signIn(email, password)`, `signOut()`, `requestPasswordReset(email)`
  (`resetPasswordForEmail` with `redirectTo` = the app's own URL),
  `setPassword(password)` (`updateUser`, then status becomes `signedIn`).
- Each action returns `{ error: string | null }`; the hook never throws.

### `history/remoteHistory.ts`

Functions take the client as their first argument so tests can pass a fake.

```ts
interface HistoryEntry {
  id: number
  created_at: string        // ISO timestamp
  poster_key: string
  title: string; subtitle: string; speaker: string
  event_date: string; event_time: string; location: string
  color_scheme: string | null
}
type NewHistoryEntry = Omit<HistoryEntry, 'id' | 'created_at'>

listHistory(client): Promise<HistoryEntry[]>      // newest first, limit 50
addHistoryEntry(client, entry): Promise<HistoryEntry>   // returns the stored row
deleteHistoryEntry(client, id): Promise<void>
```

Each throws an `Error` when Supabase reports one.

### `notes/remoteNotes.ts`

```ts
interface Note { id: number; created_at: string; author_email: string; text: string; done: boolean }

listNotes(client): Promise<Note[]>                 // open first, then done; newest first within each; limit 200
addNote(client, text): Promise<Note>
updateNote(client, id, change: { text?: string; done?: boolean }): Promise<Note>
deleteNote(client, id): Promise<void>
```

### `useHistory` / `useNotes`

Both take the session status and return

```ts
{ status: 'idle' | 'loading' | 'ready' | 'error', items, reload, ...actions }
```

- They load when the status becomes `signedIn` and clear `items` on sign-out.
- A failed load sets `error`; `reload` retries.
- A mutation updates `items` from the row Supabase returns (add, update) or
  removes the row locally (delete). A failed mutation leaves `items`
  untouched and surfaces a message in the panel.
- `useNotes` also reloads when the Notes panel is expanded.

## Changes to existing code

- **`src/types.ts`** — `HistoryRow` is removed; `HistoryEntry` (above) replaces
  it. It still fits `RawPosterData` structurally, so `HistoryList` thumbnails
  keep working.
- **`src/db/history.ts`** — deleted.
- **`src/db/schema.ts`** — `generated_images` leaves `createSchema`. A new
  `dropLegacyHistory(db)` runs `DROP TABLE IF EXISTS generated_images` on every
  start and reports whether the table existed, so `client.ts` persists the
  database once after the drop. `SCHEMA_VERSION` is **not** bumped (a bump
  would wipe everyone's draft).
- **`src/editor/useEditor.ts`** — no longer owns history. `history`,
  `removeHistoryEntry` and `recordExport` are removed. `restoreHistoryEntry`
  takes a `HistoryEntry` and finds the local template by `poster_key`; if no
  local template has that key, the current template is kept. A new
  `exportSnapshot()` returns the `NewHistoryEntry` for the current state, or
  `null` when no template is selected.
- **`src/editor/usePosterExport.ts`** — `download()` no longer treats a
  failing `onSaved` as an export failure: the file download and the history
  write are separate `try` blocks. When the write fails the note reads
  "Plik zapisany, ale nie udało się dopisać wpisu do historii."
- **`src/components/HistoryList.tsx`** — takes `HistoryEntry[]`. The template
  name comes from `posterRegistry[entry.poster_key]?.name` (fallback: the raw
  key). `created_at` is shown in local time as `YYYY-MM-DD HH:MM`. "Przywróć"
  and "Usuń" stay.
- **`src/App.tsx`** —
  - header: `AuthControl` next to `LangToggle`;
  - `handleDownload` passes an `onSaved` that records the export only when
    signed in;
  - the History panel's content is wrapped in `RemotePanel`;
  - a new collapsible "Notatki" panel under "Historia" (grid area `notes`,
    added to both grid templates);
  - `AuthDialog` rendered beside `TicketDialog`.
- **`src/utils/collapsedPanels.ts`** — `PanelKey` gains `'notes'`.

## UI

- **`AuthControl`** — signed out: a "Zaloguj" button. Signed in: the e-mail
  (truncated) and "Wyloguj". Not rendered when unconfigured.
- **`AuthDialog`** — a native `<dialog>` like `TicketDialog`, with three forms:
  - sign in: e-mail, password, "Zaloguj", and a "Nie pamiętam hasła" link;
  - reset request: e-mail, "Wyślij link";
  - set password: new password (min. 8 characters), "Zapisz hasło" — opened
    automatically while the status is `settingPassword`.
  Errors from Supabase are shown under the form; a wrong e-mail or password
  shows "Nieprawidłowy e-mail lub hasło."
- **`RemotePanel`** — renders, by state: a sign-in prompt with a button that
  opens `AuthDialog`; "Ładowanie…"; an error line with "Spróbuj ponownie"; or
  its children.
- **`NotesPanel`** — an input with "Dodaj" (Enter submits; empty or
  whitespace-only text is ignored; 500-character limit), then the list. Each
  item: checkbox, text (struck through when done), author e-mail and date in
  small muted text, "Edytuj" (turns the text into an input with "Zapisz" /
  "Anuluj") and "Usuń". Open items come first, done items below.

## Error handling

| Situation | Behaviour |
|---|---|
| Supabase unreachable on start | Editor loads normally; panels show the error state with retry. |
| Session expired / refresh failed | Status becomes `signedOut`; panels show the sign-in prompt. |
| History write fails after export | File is downloaded; the export note reports the missed entry. |
| Note add / edit / delete fails | List unchanged; message shown above the list. |
| History entry with an unknown `poster_key` | Shown with a grey thumbnail placeholder and the raw key; "Przywróć" restores the text fields and keeps the current template. |

## Testing

Vitest runs in the `node` environment, so tests cover the modules, not the
React hooks.

- **`remoteHistory.test.ts`, `remoteNotes.test.ts`** — against a hand-written
  fake client that records the query-builder calls and returns canned
  `{ data, error }`: correct table, ordering, limit, inserted columns
  (`created_by` and `author_email` are never sent by the client), returned
  row mapping, and that an `error` becomes a thrown `Error`.
- **`schema.test.ts`** — `dropLegacyHistory` removes an existing
  `generated_images` table and reports `true`; on a fresh database it reports
  `false`; `draft` and `templates` survive.
- **`formState` / editor** — `exportSnapshot` shape, and restoring an entry
  whose `poster_key` has no local template.
- **`HistoryList`, `NotesPanel`, `RemotePanel`** — `renderToStaticMarkup`
  snapshots of each state (signed-out prompt, loading, error, empty, items).
- **Live check** in the browser against the real project: invite → set
  password, sign in / out, export records an entry, restore, delete, add /
  edit / tick / delete a note, a second browser sees the changes after reload,
  and a signed-out request to either table returns no rows.

## Documentation

- `docs/architektura.md` — the new folders, the session/history/notes data
  flow, and what stays local.
- New `docs/supabase.md` (Polish, like the other docs): creating the project,
  running the migration, disabling sign-up, setting the site URL and redirect
  URLs (the GitHub Pages address and `http://localhost:5173/sknm-image-generator/`),
  inviting a member, and setting the two variables locally and in GitHub.

## Setup the owner performs (outside the code)

1. Create a Supabase project; run the migration in the SQL editor.
2. Authentication → disable "Allow new users to sign up".
3. Authentication → URL configuration: site URL = the GitHub Pages address;
   add the local dev URL to the redirect list.
4. Invite the board members.
5. Put the URL and anon key in `.env.local` and in the repository variables.

## Out of scope

- Live (realtime) updates between open browsers.
- Roles or per-user permissions; every member can do everything.
- Syncing drafts, uploaded graphics or photos.
- Storing exported image files.
- Migrating existing local history.
