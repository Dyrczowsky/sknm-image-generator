import type { ListItem } from '../../types'

// Plakat naukowy (B2): treść to jeden strumień bloków w `form.lists.blocks`,
// rozkładany przez CSS na 3 kolumny. Blok to zwykły `ListItem` (same stringi),
// więc przechodzi przez snapshot/historię bez migracji.
export const BLOCKS_LIST = 'blocks'
// Dane stopki: jeden wiersz w `form.lists.contact`.
export const CONTACT_LIST = 'contact'

export const BLOCK_TYPES = ['heading', 'text', 'bullets', 'photo', 'photoText', 'latex', 'qr', 'callout'] as const
export type BlockType = (typeof BLOCK_TYPES)[number]

export const BLOCK_LABELS: Record<BlockType, string> = {
  heading: 'Nagłówek',
  text: 'Akapit',
  bullets: 'Lista punktowana',
  photo: 'Zdjęcie z podpisem',
  photoText: 'Zdjęcie + tekst',
  latex: 'Wzór (LaTeX)',
  qr: 'Kod QR',
  callout: 'Wyróżniona ramka',
}

export type CalloutTone = 'twierdzenie' | 'wniosek' | 'ciekawostka'
export const CALLOUT_LABELS: Record<CalloutTone, string> = {
  twierdzenie: 'Twierdzenie',
  wniosek: 'Wniosek',
  ciekawostka: 'Ciekawostka',
}

// Pola bloku (wszystkie opcjonalne poza id/type):
// - title: nagłówek / podpis zdjęcia / tytuł ramki / podpis QR
// - text: treść; dla `bullets` jedna linia = jeden punkt; dla `latex` źródło TeX
// - photo: ref zasobu (isAssetRef) albo data URL
// - side: 'left' | 'right' - strona zdjęcia w `photoText`
// - url: treść kodu QR
// - tone: CalloutTone dla `callout`
export interface Block extends ListItem {
  id: string
  type: BlockType
}

export const CONTACT_FIELDS = ['email', 'www', 'facebook', 'instagram', 'linkedin'] as const
export type ContactField = (typeof CONTACT_FIELDS)[number]

export function isBlockType(value: string | undefined): value is BlockType {
  return (BLOCK_TYPES as readonly string[]).includes(value ?? '')
}

export function newBlock(type: BlockType): Block {
  const block: Block = { id: crypto.randomUUID(), type }
  if (type === 'photoText') block.side = 'left'
  if (type === 'callout') block.tone = 'twierdzenie'
  return block
}

// Linie listy punktowanej (puste pomijamy).
export function bulletLines(text: string | undefined): string[] {
  return (text ?? '').split('\n').map((line) => line.trim()).filter(Boolean)
}
