import { describe, expect, it } from 'vitest'
import { groupBlocks } from './blocks'
import type { Block } from './blocks'

const b = (id: string, type: Block['type']): Block => ({ id, type })

describe('groupBlocks', () => {
  it('nagłówek trzyma się następnego bloku, nagłówek na końcu zostaje sam', () => {
    const groups = groupBlocks([b('a', 'heading'), b('b', 'text'), b('c', 'text'), b('d', 'heading'), b('e', 'heading'), b('f', 'bullets'), b('g', 'heading')])
    expect(groups.map((g) => g.map((x) => x.block.id).join(''))).toEqual(['ab', 'c', 'def', 'g'])
    expect(groups[2].map((x) => x.index)).toEqual([3, 4, 5])
  })
})
