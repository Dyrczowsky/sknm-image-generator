import { createElement } from 'react'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { LibraryAsset } from '../assets/remoteLibrary'
import { LogoPicker } from './LogoPicker'

const h = createElement as unknown as (type: unknown, props: object | null, ...children: unknown[]) => ReactElement
const logo = (n: number): LibraryAsset => ({ ref: `ref${n}.png`, created_at: '2031-01-01T10:00:00Z', author_email: `u${n}@b.pl`, kind: 'logo', name: `Logo ${n}` })
const render = (logos: LibraryAsset[], thumbs: Record<string, string>, remaining: number) =>
  renderToStaticMarkup(h(LogoPicker, { logos, thumbOf: (ref: string) => thumbs[ref], remaining, onPick: () => {} }))

describe('LogoPicker', () => {
  it('pusta biblioteka: komunikat', () => {
    expect(render([], {}, 3)).toContain('Biblioteka jest pusta.')
  })

  it('kafelek: miniatura, nazwa i e-mail autora, przycisk aktywny', () => {
    const html = render([logo(1)], { 'ref1.png': 'data:image/png;base64,AAA' }, 2)
    expect(html).toContain('src="data:image/png;base64,AAA"')
    expect(html).toContain('Logo 1')
    expect(html).toContain('u1@b.pl')
    expect(html).not.toContain('disabled=""')
    expect(html).not.toContain('Biblioteka jest pusta.')
  })

  it('bez wczytanej miniatury: neutralny placeholder zamiast obrazka', () => {
    const html = render([logo(1)], {}, 2)
    expect(html).not.toContain('<img')
    expect(html).toContain('data-placeholder')
  })

  it('brak miejsca: kafelki wyłączone', () => {
    const html = render([logo(1), logo(2)], {}, 0)
    expect(html.match(/disabled=""/g)).toHaveLength(2)
  })
})
