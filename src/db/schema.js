// Lista domyślnych szablonów wgrywana do bazy przy pierwszym uruchomieniu.
// `poster_key` odpowiada kluczowi w src/posters/registry.js.
export const DEFAULT_TEMPLATES = [
  { name: 'Wykład', poster_key: '1a' },
  { name: 'Gość', poster_key: '1b' },
  { name: 'Warsztat', poster_key: '1c' },
  { name: 'Data', poster_key: '1d' },
  { name: 'Konferencja', poster_key: '1e' },
  { name: 'Rekrutacja', poster_key: '1f' },
  { name: 'Gala', poster_key: '1g' },
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
      template_id INTEGER,
      updated_at TEXT
    );
  `)
}

export function seedTemplates(db) {
  const stmt = db.prepare(
    'INSERT INTO templates (name, poster_key) VALUES (:name, :poster_key)'
  )
  for (const t of DEFAULT_TEMPLATES) {
    stmt.run({ ':name': t.name, ':poster_key': t.poster_key })
  }
  stmt.free()
}
