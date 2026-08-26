import initSqlJs from 'sql.js'
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import { get, set } from 'idb-keyval'
import { createSchema, syncTemplates, migrateDraftColumns } from './schema'

const DB_STORAGE_KEY = 'sknm-image-generator-db'

let dbPromise = null

async function initDb() {
  const SQL = await initSqlJs({ locateFile: () => sqlWasmUrl })
  const saved = await get(DB_STORAGE_KEY)

  const db = saved ? new SQL.Database(new Uint8Array(saved)) : new SQL.Database()
  createSchema(db)
  const templatesChanged = syncTemplates(db)
  const draftMigrated = migrateDraftColumns(db)
  if (!saved || templatesChanged || draftMigrated) persist(db)
  return db
}

// Zwraca (i pamięta) pojedynczą instancję bazy dla całej aplikacji.
export function getDb() {
  if (!dbPromise) dbPromise = initDb()
  return dbPromise
}

// Serializuje bazę i zapisuje ją w IndexedDB - wołane po każdej modyfikacji,
// żeby dane przetrwały odświeżenie strony / zamknięcie przeglądarki.
export async function persist(db) {
  const data = db.export()
  await set(DB_STORAGE_KEY, data)
}
