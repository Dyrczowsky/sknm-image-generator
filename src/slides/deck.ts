import { layoutOf } from './komponenty'
import { THEME_KEYS } from './themes'
import {
  DECK_VERSION,
  DEFAULT_DURATION,
  EMPTY_PHOTO,
  MAX_DURATION,
  MIN_DURATION,
  TRANSITION_KEYS,
} from './types'
import type { Deck, PhotoValue, Slide, SlideAspect, SlideBackground, SlideData, SlideItem, SlideThemeKey, SlideValue, TransitionKey } from './types'

// Czyste, niemutujące operacje na prezentacji. Żadna nie rusza `updatedAt` -
// robi to warstwa zapisu (deckStore).

export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function createSlide(layoutKey: string): Slide {
  const layout = layoutOf(layoutKey)
  if (!layout) throw new Error(`Nieznany układ slajdu: ${layoutKey}`)
  return {
    id: newId(),
    layout: layoutKey,
    data: structuredClone(layout.defaults),
    background: layout.background ?? 'jasne',
    mirrored: false,
    reveal: false,
  }
}

export function createDeck(name: string, slides: Slide[] = []): Deck {
  return {
    v: DECK_VERSION,
    id: newId(),
    name,
    theme: 'granat',
    transition: 'przenikanie',
    duration: DEFAULT_DURATION,
    viewAspect: '16:9',
    slides,
    updatedAt: Date.now(),
  }
}

export function addSlide(deck: Deck, slide: Slide, afterIndex?: number): Deck {
  const at = afterIndex === undefined ? deck.slides.length : Math.min(Math.max(afterIndex + 1, 0), deck.slides.length)
  const slides = [...deck.slides.slice(0, at), slide, ...deck.slides.slice(at)]
  return { ...deck, slides }
}

export function duplicateSlide(deck: Deck, index: number): Deck {
  const source = deck.slides[index]
  if (!source) return deck
  const copy: Slide = { ...structuredClone(source), id: newId() }
  return addSlide(deck, copy, index)
}

export function removeSlide(deck: Deck, index: number): Deck {
  if (index < 0 || index >= deck.slides.length) return deck
  return { ...deck, slides: deck.slides.filter((_, i) => i !== index) }
}

// `to` = docelowy indeks slajdu po przeniesieniu (obcięty do zakresu).
export function moveSlide(deck: Deck, from: number, to: number): Deck {
  if (from < 0 || from >= deck.slides.length) return deck
  const target = Math.min(Math.max(to, 0), deck.slides.length - 1)
  if (target === from) return deck
  const slides = [...deck.slides]
  const [moved] = slides.splice(from, 1)
  slides.splice(target, 0, moved)
  return { ...deck, slides }
}

export function updateSlide(deck: Deck, index: number, patch: Partial<Omit<Slide, 'id'>>): Deck {
  const slide = deck.slides[index]
  if (!slide) return deck
  const slides = deck.slides.map((s, i) => (i === index ? { ...s, ...patch } : s))
  return { ...deck, slides }
}

function setIn(node: unknown, keys: string[], value: unknown): unknown {
  if (keys.length === 0) return value
  const [head, ...rest] = keys
  if (Array.isArray(node)) {
    if (!/^\d+$/.test(head)) return undefined
    const i = Number(head)
    if (i >= node.length) return undefined
    const next = setIn(node[i], rest, value)
    if (next === undefined) return undefined
    const copy = [...node]
    copy[i] = next
    return copy
  }
  if (node && typeof node === 'object') {
    const record = node as Record<string, unknown>
    if (!Object.prototype.hasOwnProperty.call(record, head)) return undefined
    const next = setIn(record[head], rest, value)
    if (next === undefined) return undefined
    return { ...record, [head]: next }
  }
  return undefined
}

// `path` - kropki, np. `heading` albo `cards.2.title`. Zły lub nieistniejący
// adres zwraca prezentację bez zmian.
export function setDataPath(deck: Deck, index: number, path: string, value: SlideValue | string): Deck {
  const slide = deck.slides[index]
  if (!slide || path === '') return deck
  const data = setIn(slide.data, path.split('.'), value)
  if (!data) return deck
  return updateSlide(deck, index, { data: data as SlideData })
}

export function setDeckProps(deck: Deck, patch: Partial<Pick<Deck, 'name' | 'theme' | 'transition' | 'duration' | 'viewAspect'>>): Deck {
  const next = { ...deck, ...patch }
  if (patch.duration !== undefined) next.duration = clampDuration(patch.duration)
  return next
}

function clampDuration(value: number): number {
  return Math.min(MAX_DURATION, Math.max(MIN_DURATION, value))
}

// --- Odczyt z IndexedDB: naprawiamy, zamiast odrzucać (jak parseSnapshot) ---

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function repairPhoto(raw: unknown): PhotoValue | undefined {
  if (!isObject(raw)) return undefined
  return {
    src: typeof raw.src === 'string' ? raw.src : null,
    x: isNumber(raw.x) ? raw.x : EMPTY_PHOTO.x,
    y: isNumber(raw.y) ? raw.y : EMPTY_PHOTO.y,
    zoom: isNumber(raw.zoom) ? raw.zoom : EMPTY_PHOTO.zoom,
  }
}

function isPhoto(value: SlideValue): value is PhotoValue {
  return isObject(value) && !Array.isArray(value) && 'src' in value
}

function repairValue(raw: unknown, def: SlideValue): SlideValue {
  if (typeof def === 'string') return typeof raw === 'string' ? raw : def
  if (typeof def === 'boolean') return typeof raw === 'boolean' ? raw : def
  if (Array.isArray(def)) {
    if (!Array.isArray(raw)) return def
    const items: SlideItem[] = []
    for (const entry of raw) {
      if (!isObject(entry)) return def
      const item: SlideItem = {}
      for (const [k, v] of Object.entries(entry)) if (typeof v === 'string') item[k] = v
      items.push(item)
    }
    return items
  }
  if (isPhoto(def)) return repairPhoto(raw) ?? def
  return def
}

function repairSlide(raw: unknown): Slide | undefined {
  if (!isObject(raw) || typeof raw.layout !== 'string') return undefined
  const layout = layoutOf(raw.layout)
  if (!layout) return undefined
  const rawData = isObject(raw.data) ? raw.data : {}
  const data: SlideData = {}
  for (const [key, def] of Object.entries(layout.defaults)) {
    data[key] = key in rawData ? repairValue(rawData[key], structuredClone(def)) : structuredClone(def)
  }
  const background: SlideBackground = raw.background === 'jasne' || raw.background === 'ciemne' ? raw.background : (layout.background ?? 'jasne')
  const slide: Slide = {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newId(),
    layout: layout.key,
    data,
    background,
    mirrored: raw.mirrored === true,
    reveal: raw.reveal === true,
  }
  if (typeof raw.transition === 'string' && TRANSITION_KEYS.includes(raw.transition as TransitionKey)) {
    slide.transition = raw.transition as TransitionKey
  }
  return slide
}

export type ParsedDeck = { ok: true; deck: Deck } | { ok: false; reason: 'invalid' | 'newer' }

export function parseDeck(raw: unknown): ParsedDeck {
  if (!isObject(raw) || typeof raw.id !== 'string') return { ok: false, reason: 'invalid' }
  if (isNumber(raw.v) && raw.v > DECK_VERSION) return { ok: false, reason: 'newer' }
  // Slajd nieznanego układu (z nowszej wersji aplikacji): odmawiamy otwarcia,
  // jak przy snapshotach plakatów. Pominięcie go skasowałoby slajd przy
  // pierwszym autozapisie.
  const unknownLayout = (Array.isArray(raw.slides) ? raw.slides : []).some(
    (slide) => isObject(slide) && typeof slide.layout === 'string' && !layoutOf(slide.layout),
  )
  if (unknownLayout) return { ok: false, reason: 'newer' }
  const slides = (Array.isArray(raw.slides) ? raw.slides : []).map(repairSlide).filter((s): s is Slide => s !== undefined)
  const aspect: SlideAspect = raw.viewAspect === '1:1' ? '1:1' : '16:9'
  const deck: Deck = {
    v: DECK_VERSION,
    id: raw.id,
    name: typeof raw.name === 'string' ? raw.name : 'Prezentacja',
    theme: THEME_KEYS.includes(raw.theme as SlideThemeKey) ? (raw.theme as SlideThemeKey) : 'granat',
    transition: TRANSITION_KEYS.includes(raw.transition as TransitionKey) ? (raw.transition as TransitionKey) : 'przenikanie',
    duration: isNumber(raw.duration) ? clampDuration(raw.duration) : DEFAULT_DURATION,
    viewAspect: aspect,
    slides,
    updatedAt: isNumber(raw.updatedAt) ? raw.updatedAt : 0,
  }
  return { ok: true, deck }
}
