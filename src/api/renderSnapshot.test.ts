import { describe, expect, it } from 'vitest'
import { buildRenderState } from './renderInput'
import { snapshotFor } from './renderSnapshot'

const JPG = 'data:image/jpeg;base64,AAAA'
const stateOf = (input: unknown) => {
  const r = buildRenderState(input)
  if (!r.ok) throw new Error(r.error.message)
  return r.state
}
const run = async (state: ReturnType<typeof stateOf>) => {
  const r = await snapshotFor(state)
  if (!r.ok) throw new Error(r.error.message)
  return r
}

describe('snapshotFor', () => {
  it('te same zdjęcia dają ten sam ref, a snapshot nie zawiera data URL', async () => {
    const state = stateOf({ template: 'gosc', photos: { photo: [{ src: JPG }, { src: JPG }] } })
    const { snapshot, photoRefs, historyRow } = await run(state)
    expect(photoRefs).toHaveLength(2)
    expect(photoRefs[0]).toMatch(/^[0-9a-f]{64}\.jpg$/)
    expect(photoRefs[1]).toBe(photoRefs[0])
    expect(snapshot.form.photos.photo[0].asset).toBe(photoRefs[0])
    expect(JSON.stringify(snapshot)).not.toContain('data:')
    expect(historyRow.snapshot).toBe(snapshot)
    expect(historyRow.poster_key).toBe(state.posterKey)
  })

  it('PNG dostaje rozszerzenie png', async () => {
    const state = stateOf({ template: 'gosc', photos: { photo: [{ src: 'data:image/png;base64,AAAA' }] } })
    expect((await run(state)).photoRefs[0]).toMatch(/\.png$/)
  })

  it('zbyt duży snapshot to too_large', async () => {
    const state = stateOf({ template: 'gosc' })
    state.form.title = 'a'.repeat(70000)
    const r = await snapshotFor(state)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.code).toBe('too_large')
  })
})
