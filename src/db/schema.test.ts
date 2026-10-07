import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import initSqlJs, { type Database } from 'sql.js'
import { rowsFromExec } from './utils'
import { createSchema, dropLegacyHistory, resetIfStale, SCHEMA_VERSION } from './schema'

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

describe('dropLegacyHistory', () => {
  const tables = (db: Database) =>
    rowsFromExec<{ name: string }>(db.exec("SELECT name FROM sqlite_master WHERE type = 'table'")).map((row) => row.name)

  it('usuwa starą tabelę historii i zostawia draft oraz szablony', () => {
    const db = freshDb()
    createSchema(db)
    db.run('CREATE TABLE generated_images (id INTEGER PRIMARY KEY, title TEXT)')
    db.run("INSERT INTO draft (id, title) VALUES (1, 'Mój draft')")

    expect(dropLegacyHistory(db)).toBe(true)
    expect(tables(db)).not.toContain('generated_images')
    expect(tables(db)).toEqual(expect.arrayContaining(['draft', 'templates']))
    expect(rowsFromExec<{ title: string }>(db.exec('SELECT title FROM draft'))).toEqual([{ title: 'Mój draft' }])
    db.close()
  })

  it('bez starej tabeli nic nie robi', () => {
    const db = freshDb()
    createSchema(db)
    expect(tables(db)).not.toContain('generated_images')
    expect(dropLegacyHistory(db)).toBe(false)
    db.close()
  })
})
