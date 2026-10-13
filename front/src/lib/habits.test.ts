import { describe, expect, it } from 'vitest'
import type { HabitsState } from './habits'
import { EMPTY_HABITS, addHabit, countOn, increment, lastDays, removeHabit, reorderHabits, setCount, streak } from './habits'

const today = '2026-10-13'

function withHabit(kind: 'good' | 'bad' = 'good', target = 1, createdAt = '2026-10-01'): HabitsState {
  const s = addHabit(EMPTY_HABITS, 'Test', createdAt, kind, target)
  return s
}

describe('counting', () => {
  it('increments, decrements and never goes below zero', () => {
    let s = withHabit()
    const id = s.list[0].id
    s = increment(s, id, today, 1)
    s = increment(s, id, today, 1)
    expect(countOn(s, id, today)).toBe(2)
    s = increment(s, id, today, -5)
    expect(countOn(s, id, today)).toBe(0)
    expect(s.log[id]).toEqual({})
  })

  it('ignores empty names and duplicates', () => {
    let s = addHabit(EMPTY_HABITS, 'Lire', today)
    s = addHabit(s, ' lire ', today)
    s = addHabit(s, '  ', today)
    expect(s.list).toHaveLength(1)
  })
})

describe('streak', () => {
  it('counts consecutive days reaching the target', () => {
    let s = withHabit('good', 2)
    const id = s.list[0].id
    for (const d of ['2026-10-10', '2026-10-11', '2026-10-12']) s = setCount(s, id, d, 2)
    s = setCount(s, id, '2026-10-09', 1) // below target: breaks the streak
    expect(streak(s, s.list[0], today)).toBe(3) // today still open
    s = setCount(s, id, today, 2)
    expect(streak(s, s.list[0], today)).toBe(4)
  })

  it('counts days back-filled before the habit was created', () => {
    let s = withHabit('good', 1, today)
    for (const d of ['2026-10-11', '2026-10-12', today]) s = setCount(s, s.list[0].id, d, 1)
    expect(streak(s, s.list[0], today)).toBe(3)
  })

  it('is zero when yesterday was missed and today is not done', () => {
    let s = withHabit()
    s = setCount(s, s.list[0].id, '2026-10-11', 1)
    expect(streak(s, s.list[0], today)).toBe(0)
  })

  it('counts clean days for a bad habit since creation or the last slip', () => {
    let s = withHabit('bad', 1, '2026-10-10')
    expect(streak(s, s.list[0], today)).toBe(4)
    s = setCount(s, s.list[0].id, '2026-10-12', 1)
    expect(streak(s, s.list[0], today)).toBe(1)
    s = setCount(s, s.list[0].id, today, 1)
    expect(streak(s, s.list[0], today)).toBe(0)
  })
})

describe('list management', () => {
  it('lists the last days oldest first', () => {
    expect(lastDays(today, 3)).toEqual(['2026-10-11', '2026-10-12', '2026-10-13'])
  })

  it('reorders and removes habits with their log', () => {
    let s = addHabit(addHabit(addHabit(EMPTY_HABITS, 'A', today), 'B', today), 'C', today)
    const [a, b, c] = s.list
    s = reorderHabits(s, [c.id, a.id, b.id])
    expect(s.list.map((h) => h.name)).toEqual(['C', 'A', 'B'])
    expect(reorderHabits(s, [b.id]).list.map((h) => h.name)).toEqual(['B', 'C', 'A'])
    s = increment(s, a.id, today, 1)
    s = removeHabit(s, a.id)
    expect(s.list.map((h) => h.name)).toEqual(['C', 'B'])
    expect(s.log[a.id]).toBeUndefined()
  })
})
