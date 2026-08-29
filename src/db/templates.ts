import type { Database } from 'sql.js'
import type { TemplateRow } from '../types'
import { rowsFromExec } from './utils'

export function listTemplates(db: Database): TemplateRow[] {
  const result = db.exec('SELECT id, name, poster_key FROM templates ORDER BY id')
  return rowsFromExec<TemplateRow>(result)
}
