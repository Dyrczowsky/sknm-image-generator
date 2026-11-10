export const MAX_BODY_BYTES = 25 * 1024 * 1024

// Treść do 25 MB; sprawdza nagłówek i faktycznie odczytane bajty.
export async function readBody(request: Request): Promise<string | null> {
  const declared = Number(request.headers.get('content-length'))
  if (declared > MAX_BODY_BYTES) return null
  const reader = request.body?.getReader()
  if (!reader) return ''
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.length
    if (size > MAX_BODY_BYTES) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  const all = new Uint8Array(size)
  let offset = 0
  for (const c of chunks) {
    all.set(c, offset)
    offset += c.length
  }
  return new TextDecoder().decode(all)
}
