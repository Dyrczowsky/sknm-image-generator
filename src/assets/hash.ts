// Nazwa pliku grafiki = skrót SHA-256 jej treści + rozszerzenie, np.
// `ba78…15ad.png`. Ta sama grafika ma zawsze tę samą nazwę, więc wgrywa się
// ją do Storage tylko raz, a plik pod daną nazwą nigdy się nie zmienia.

const EXTENSION_OF_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
}

const MIME_OF_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
}

// Ten sam wzorzec pilnuje nazw w bazie (polityka Storage i tabela `sknm_assets`).
const ASSET_REF = /^[0-9a-f]{64}\.(jpg|png|svg)$/

export function isAssetRef(value: string): boolean {
  return ASSET_REF.test(value)
}

// Typ MIME z rozszerzenia nazwy; wyjątek, gdy to nie jest nazwa grafiki.
export function mimeOfRef(ref: string): string {
  const mime = isAssetRef(ref) ? MIME_OF_EXTENSION[ref.slice(ref.lastIndexOf('.') + 1)] : undefined
  if (!mime) throw new Error(`Nieprawidłowa nazwa grafiki: ${ref}`)
  return mime
}

export async function refFor(bytes: ArrayBuffer | Uint8Array, mime: string): Promise<string> {
  const extension = EXTENSION_OF_MIME[mime]
  if (!extension) throw new Error(`Nieobsługiwany format grafiki: ${mime || 'nieznany'}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource)
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex}.${extension}`
}
