import initSqlJs, { type Database } from 'sql.js'
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import { get, set } from 'idb-keyval'
import { createSchema, syncTemplates, resetIfStale } from './schema'

const DB_STORAGE_KEY = 'sknm-image-generator-db'

let dbPromise: Promise<Database> | null = null

async function initDb(): Promise<Database> {
  const SQL = await initSqlJs({ locateFile: () => sqlWasmUrl })
  const saved = await get<Uint8Array | ArrayBuffer>(DB_STORAGE_KEY)

  const db = saved ? new SQL.Database(new Uint8Array(saved as ArrayBufferLike)) : new SQL.Database()
  const wiped = resetIfStale(db)
  createSchema(db)
  const templatesChanged = syncTemplates(db)
  if (!saved || wiped || templatesChanged) void persist(db)
  return db
}

// Zwraca (i pamięta) pojedynczą instancję bazy dla całej aplikacji.
export function getDb(): Promise<Database> {
  if (!dbPromise) dbPromise = initDb()
  return dbPromise
}

// Serializuje bazę i zapisuje ją w IndexedDB - wołane po każdej modyfikacji,
// żeby dane przetrwały odświeżenie strony / zamknięcie przeglądarki.
export async function persist(db: Database): Promise<void> {
  const data = db.export()
  await set(DB_STORAGE_KEY, data)
}
