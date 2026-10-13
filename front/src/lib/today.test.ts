import { describe, expect, it } from 'vitest'
import { moveTo, rollover } from './today'

describe('rollover', () => {
  const list = { date: '2026-10-12', ids: ['a', 'b', 'c'] }

  it('keeps the list on the same day', () => {
    expect(rollover(list, '2026-10-12', {})).toBe(list)
  })

  it('carries over unfinished items and drops completed ones', () => {
    const done = { a: { last: '2026-10-12' }, b: { last: '2026-09-01' } }
    expect(rollover(list, '2026-10-13', done)).toEqual({ date: '2026-10-13', ids: ['b', 'c'] })
  })
})

describe('moveTo', () => {
  it('moves an item to a new index', () => {
    expect(moveTo(['a', 'b', 'c'], 'a', 2)).toEqual(['b', 'c', 'a'])
    expect(moveTo(['a', 'b', 'c'], 'c', 0)).toEqual(['c', 'a', 'b'])
    expect(moveTo(['a', 'b', 'c'], 'b', 99)).toEqual(['a', 'c', 'b'])
  })
})
