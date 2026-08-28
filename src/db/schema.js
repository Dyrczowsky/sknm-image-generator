import { rowsFromExec } from './utils'

// Lista domyślnych szablonów synchronizowana do bazy przy każdym uruchomieniu
// (patrz syncTemplates). `poster_key` odpowiada kluczowi w src/posters/registry.js.
export const DEFAULT_TEMPLATES = [
  { name: 'Wykład', poster_key: '1a' },
  { name: 'Gość', poster_key: '1b' },
  { name: 'Warsztat', poster_key: '1c' },
  { name: 'Data', poster_key: '1d' },
  { name: 'Konferencja', poster_key: '1e' },
  { name: 'Rekrutacja', poster_key: '1f' },
  { name: 'Gala', poster_key: '1g' },
  { name: 'Wykład — złoto', poster_key: '1h' },
  { name: 'Wykład — czerń', poster_key: '1i' },
  { name: 'Wykład — jasny', poster_key: '1j' },
  { name: 'Wykład — szary', poster_key: '1k' },
  { name: 'Ogłoszenie', poster_key: '1l' },

  { name: 'Gość — czerń', poster_key: '1b-czern' },
  { name: 'Gość — złoto', poster_key: '1b-zloto' },
  { name: 'Gość — jasny', poster_key: '1b-jasny' },
  { name: 'Gość — szary', poster_key: '1b-szary' },

  { name: 'Warsztat — czerń', poster_key: '1c-czern' },
  { name: 'Warsztat — złoto', poster_key: '1c-zloto' },
  { name: 'Warsztat — jasny', poster_key: '1c-jasny' },
  { name: 'Warsztat — szary', poster_key: '1c-szary' },

  { name: 'Data — czerń', poster_key: '1d-czern' },
  { name: 'Data — złoto', poster_key: '1d-zloto' },
  { name: 'Data — jasny', poster_key: '1d-jasny' },
  { name: 'Data — szary', poster_key: '1d-szary' },

  { name: 'Konferencja — czerń', poster_key: '1e-czern' },
  { name: 'Konferencja — złoto', poster_key: '1e-zloto' },
  { name: 'Konferencja — jasny', poster_key: '1e-jasny' },
  { name: 'Konferencja — szary', poster_key: '1e-szary' },

  { name: 'Rekrutacja — czerń', poster_key: '1f-czern' },
  { name: 'Rekrutacja — złoto', poster_key: '1f-zloto' },
  { name: 'Rekrutacja — jasny', poster_key: '1f-jasny' },
  { name: 'Rekrutacja — szary', poster_key: '1f-szary' },

  { name: 'Ogłoszenie — czerń', poster_key: '1l-czern' },
  { name: 'Ogłoszenie — złoto', poster_key: '1l-zloto' },
  { name: 'Ogłoszenie — jasny', poster_key: '1l-jasny' },
  { name: 'Ogłoszenie — szary', poster_key: '1l-szary' },
]

export function createSchema(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      poster_key TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS generated_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER REFERENCES templates(id),
      title TEXT,
      subtitle TEXT,
      speaker TEXT,
      event_date TEXT,
      event_time TEXT,
      location TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS draft (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      title TEXT,
      subtitle TEXT,
      speaker TEXT,
      event_date TEXT,
      event_time TEXT,
      location TEXT,
      badge TEXT,
      badge2 TEXT,
      template_id INTEGER,
      updated_at TEXT
    );
  `)
}

// Kolumny tabeli `draft` dodane po pierwszym wydaniu. CREATE TABLE IF NOT
// EXISTS pomija je w bazach zapisanych wcześniej w IndexedDB, więc
// migrateDraftColumns dogrywa brakujące przy każdym uruchomieniu.
const DRAFT_EXTRA_COLUMNS = ['badge', 'badge2']

export function migrateDraftColumns(db) {
  const columns = new Set(
    rowsFromExec(db.exec('PRAGMA table_info(draft)')).map((row) => row.name)
  )
  const missing = DRAFT_EXTRA_COLUMNS.filter((col) => !columns.has(col))
  if (missing.length === 0) return false

  for (const col of missing) {
    db.run(`ALTER TABLE draft ADD COLUMN ${col} TEXT`)
  }
  return true
}

// Dogrywa do bazy szablony z DEFAULT_TEMPLATES, których tam jeszcze nie ma
// (dopasowanie po poster_key) - działa zarówno przy pierwszym uruchomieniu
// (pusta tabela), jak i przy każdym kolejnym, żeby nowo dodane szablony
// pojawiły się automatycznie w bazach zapisanych wcześniej w IndexedDB.
// Nie dotyka wierszy już istniejących, więc ręczne zmiany (np. nazwy) nie
// są nadpisywane.
export function syncTemplates(db) {
  const existingKeys = new Set(
    rowsFromExec(db.exec('SELECT poster_key FROM templates')).map((row) => row.poster_key)
  )
  const missing = DEFAULT_TEMPLATES.filter((t) => !existingKeys.has(t.poster_key))
  if (missing.length === 0) return false

  const stmt = db.prepare(
    'INSERT INTO templates (name, poster_key) VALUES (:name, :poster_key)'
  )
  for (const t of missing) {
    stmt.run({ ':name': t.name, ':poster_key': t.poster_key })
  }
  stmt.free()
  return true
}
