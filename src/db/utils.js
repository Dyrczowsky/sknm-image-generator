// Zamienia wynik db.exec(...) (kolumny + wiersze) na tablicę zwykłych obiektów.
export function rowsFromExec(execResult) {
  if (!execResult || execResult.length === 0) return []
  const { columns, values } = execResult[0]
  return values.map((row) =>
    Object.fromEntries(row.map((value, i) => [columns[i], value]))
  )
}
