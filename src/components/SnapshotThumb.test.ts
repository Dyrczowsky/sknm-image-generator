import { createElement } from 'react'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { EMPTY_FORM } from '../editor/formState'
import { DEFAULT_EXPORT_SETTINGS } from '../posters/formats'
import { posterRegistry } from '../posters/registry'
import type { EditorSnapshot } from '../snapshot/snapshot'
import { PosterScaled } from './PosterScaled'
import { SnapshotThumb } from './SnapshotThumb'

const h = createElement as unknown as (type: unknown, props: object | null, ...children: unknown[]) => ReactElement

const snap = (over: Partial<EditorSnapshot> = {}): EditorSnapshot => ({
  v: 1, poster_key: 'wyklad', color_scheme: null, lang: 'pl', export: { ...DEFAULT_EXPORT_SETTINGS },
  form: { ...EMPTY_FORM, graphics: [], photos: {}, title: 'Mój wykład' }, ...over,
})
const render = (snapshot: EditorSnapshot, box = 120) => renderToStaticMarkup(h(SnapshotThumb, { snapshot, box }))

describe('SnapshotThumb', () => {
  it('kwadrat: plakat layoutu w całym pudełku', () => {
    const html = render(snap())
    expect(html).toContain('width:120px;height:120px')
    expect(html).toContain('Mój wykład')
  })

  it('A4 poziomo: dłuższy bok ma 120 px, całość wyśrodkowana', () => {
    const html = render(snap({ export: { ...DEFAULT_EXPORT_SETTINGS, format: 'a4', orientation: 'landscape' } }))
    expect(html).toContain('width:120px;height:84.8')
    expect(html).toContain('width:1528px;height:1080px')
    expect(html).toContain('justify-center')
  })

  it('A4 pionowo: wysokość 120 px, szerokość ok. 85 px', () => {
    const html = render(snap({ export: { ...DEFAULT_EXPORT_SETTINGS, format: 'a4', orientation: 'portrait' } }))
    expect(html).toMatch(/width:84\.\d+px;height:120px/)
  })

  it('baner: komponent Banner zamiast plakatu', () => {
    const banner = snap({ export: { ...DEFAULT_EXPORT_SETTINGS, medium: 'banner', format: 'fbCover' } })
    const expected = renderToStaticMarkup(
      h(PosterScaled, { size: 120, shape: 'cover' }, h(posterRegistry.wyklad.Banner, { data: banner.form, lang: 'pl' })),
    )
    // Bez <link rel=preload>, które React dokleja na początku markupu.
    const body = (html: string) => html.replace(/<link[^>]*>/g, '')
    expect(body(render(banner))).toContain(body(expected))
    expect(render(banner)).not.toBe(render(snap()))
  })

  it('nieznany layout: szara miniatura', () => {
    const html = render(snap({ poster_key: 'piknik' }), 90)
    expect(html).toContain('bg-border')
    expect(html).toContain('width:90px;height:90px')
  })
})
