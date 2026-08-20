import { rowsFromExec } from './utils'

export function listTemplates(db) {
  const result = db.exec('SELECT id, name, poster_key FROM templates ORDER BY id')
  return rowsFromExec(result)
}
