import type { CSSProperties } from 'react'
import { MARK } from './format'

/** Styl runu o danych znacznikach; undefined dla zwykłego tekstu. */
export function runStyle(marks: number): CSSProperties | undefined {
  const style: CSSProperties = {}
  if (marks & MARK.bold) style.fontWeight = 'bolder'
  if (marks & MARK.italic) style.fontStyle = 'italic'
  const lines = [marks & MARK.underline ? 'underline' : '', marks & MARK.strike ? 'line-through' : '']
    .filter(Boolean).join(' ')
  if (lines) style.textDecorationLine = lines
  if (marks & MARK.accent) style.color = 'var(--rich-accent, var(--accent))'
  return Object.keys(style).length ? style : undefined
}
