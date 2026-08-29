import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import initSqlJs, { type Database } from 'sql.js'
import { rowsFromExec } from './utils'
import { createSchema, resetIfStale, SCHEMA_VERSION } from './schema'

const require = createRequire(import.meta.url)
const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm')
const SQL = await initSqlJs({ locateFile: () => wasmPath })

function freshDb(): Database {
  return new SQL.Database()
}

describe('resetIfStale', () => {
  it('zwraca true dla świeżej bazy (user_version 0)', () => {
    const db = freshDb()
    expect(resetIfStale(db)).toBe(true)
    const [row] = rowsFromExec<Record<string, number>>(db.exec('PRAGMA user_version'))
    expect(Number(Object.values(row ?? {})[0] ?? 0)).toBe(SCHEMA_VERSION)
    db.close()
  })

  it('zwraca false przy drugim wywołaniu (baza już na bieżącej wersji)', () => {
    const db = freshDb()
    resetIfStale(db)
    expect(resetIfStale(db)).toBe(false)
    db.close()
  })
})

describe('rowsFromExec', () => {
  it('mapuje kolumny + wiersze na obiekty', () => {
    const db = freshDb()
    createSchema(db)
    db.run("INSERT INTO templates (name, poster_key) VALUES ('Wykład', 'wyklad')")
    const rows = rowsFromExec<{ name: string; poster_key: string }>(
      db.exec('SELECT name, poster_key FROM templates')
    )
    expect(rows).toEqual([{ name: 'Wykład', poster_key: 'wyklad' }])
    db.close()
  })
})
