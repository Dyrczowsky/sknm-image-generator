import type { Database } from 'sql.js'
import { rowsFromExec } from './utils'

// Lista domyślnych szablonów synchronizowana do bazy przy każdym uruchomieniu
// (patrz syncTemplates). `poster_key` odpowiada kluczowi w src/posters/registry.ts.
export const DEFAULT_TEMPLATES: ReadonlyArray<{ name: string; poster_key: string }> = [
  { name: 'Wykład', poster_key: 'wyklad' },
  { name: 'Gość', poster_key: 'gosc' },
  { name: 'Warsztat', poster_key: 'warsztat' },
  { name: 'Data', poster_key: 'data' },
  { name: 'Konferencja', poster_key: 'konferencja' },
  { name: 'Rekrutacja', poster_key: 'rekrutacja' },
  { name: 'Gala', poster_key: 'gala' },
  { name: 'Ogłoszenie', poster_key: 'ogloszenie' },
  { name: 'Komunikat rozszerzony', poster_key: 'komunikat' },
]

// Podbijaj przy każdej zmianie kształtu tabel wymagającej świeżego startu.
// v3: kolumna draft.visibility (JSON widoczności pól tekstowych).
// v4: przemianowane klucze schematów kolorów (zloto→okazjonalnyZloty,
//     czern→czernZolta/…); stare wartości color_scheme w draftcie/historii
//     przestały pasować, więc czyścimy tabele.
// v5: oś akcentu — usunięte klucze czernZolta/czernPomaranczowa/czernGranatowa/
//     okazjonalnyZloty/okazjonalnySrebrny z większości layoutów; stare
//     color_scheme w draftcie/historii przestały pasować.
// v6: kolumna draft.body (akapit treści szablonu „Komunikat rozszerzony").
export const SCHEMA_VERSION = 6

// Zgoda właściciela: dane lokalne (IndexedDB) można wyczyścić. Zamiast
// ostrożnej migracji kluczy `1b-czern` → layout+scheme po prostu zrzucamy
// tabele, gdy zapisana wersja jest starsza.
export function resetIfStale(db: Database): boolean {
  const [row] = rowsFromExec<Record<string, number>>(db.exec('PRAGMA user_version'))
  const current = row ? Number(Object.values(row)[0] ?? 0) : 0
  if (current >= SCHEMA_VERSION) return false
  db.run('DROP TABLE IF EXISTS generated_images; DROP TABLE IF EXISTS draft; DROP TABLE IF EXISTS templates;')
  db.run(`PRAGMA user_version = ${SCHEMA_VERSION}`)
  return true
}

// Historia wygenerowanych grafik mieszkała kiedyś lokalnie w tabeli
// `generated_images`; teraz jest wspólna, w Supabase (src/history/). Starą
// tabelę usuwamy przy starcie - bez podbijania SCHEMA_VERSION, żeby nie
// skasować przy okazji draftu. Zwraca `true`, gdy tabela istniała.
export function dropLegacyHistory(db: Database): boolean {
  const existing = rowsFromExec(db.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'generated_images'"))
  if (existing.length === 0) return false
  db.run('DROP TABLE generated_images')
  return true
}

export function createSchema(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      poster_key TEXT NOT NULL,
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
      body TEXT,
      visibility TEXT,
      color_scheme TEXT,
      template_id INTEGER,
      updated_at TEXT
    );
  `)
}

// Dogrywa do bazy szablony z DEFAULT_TEMPLATES, których tam jeszcze nie ma
// (dopasowanie po poster_key) - działa zarówno przy pierwszym uruchomieniu
// (pusta tabela), jak i przy każdym kolejnym, żeby nowo dodane szablony
// pojawiły się automatycznie w bazach zapisanych wcześniej w IndexedDB.
// Nie dotyka wierszy już istniejących, więc ręczne zmiany (np. nazwy) nie
// są nadpisywane.
export function syncTemplates(db: Database): boolean {
  const existingKeys = new Set(
    rowsFromExec<{ poster_key: string }>(db.exec('SELECT poster_key FROM templates')).map((row) => row.poster_key)
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
