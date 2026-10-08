import { createElement } from 'react'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// Dzieci jako argumenty: typy Reacta wymagają `children` w propsach, a linter
// zabrania przekazywać je tamtędy.
export const h = createElement as unknown as (type: unknown, props: object | null, ...children: unknown[]) => ReactElement

export const render = (element: ReactElement): string => renderToStaticMarkup(element)

// Znacznik otwierający pierwszego elementu pasującego do wzorca (np. `<button`).
export function openingTag(html: string, start: string): string {
  const from = html.indexOf(start)
  if (from === -1) throw new Error(`brak ${start} w: ${html}`)
  return html.slice(from, html.indexOf('>', from) + 1)
}
