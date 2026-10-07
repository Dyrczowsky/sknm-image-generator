// Dwukierunkowa mapa w pamięci: nazwa grafiki (`<sha256>.<rozszerzenie>`) ↔
// data URL trzymany w stanie edytora. Zamiana stanu na snapshot i z powrotem
// woła te funkcje przy każdej zmianie formularza, więc są synchroniczne
// i sprowadzają się do jednego odczytu z `Map` - bez liczenia skrótów.

const srcByRef = new Map<string, string>()
const refBySrc = new Map<string, string>()

export function register(ref: string, dataUrl: string): void {
  srcByRef.set(ref, dataUrl)
  refBySrc.set(dataUrl, ref)
}

export function refOf(dataUrl: string): string | undefined {
  return refBySrc.get(dataUrl)
}

export function srcOf(ref: string): string | undefined {
  return srcByRef.get(ref)
}

// Tylko dla testów - rejestr jest wspólny dla całego modułu.
export function resetRegistry(): void {
  srcByRef.clear()
  refBySrc.clear()
}
