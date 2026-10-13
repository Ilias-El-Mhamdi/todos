import { addDays } from './frequency'

/** good: to do (target times a day) · bad: to avoid (every + is a slip). */
export type HabitKind = 'good' | 'bad'

export interface Habit {
  id: string
  name: string
  kind: HabitKind
  /** Times per day for a good habit. */
  target: number
  /** YYYY-MM-DD; a bad habit's clean streak starts here. */
  createdAt: string
}

export interface HabitsState {
  list: Habit[]
  /** Count per habit id, per day (YYYY-MM-DD). Days with 0 are omitted. */
  log: Record<string, Record<string, number>>
}

export const EMPTY_HABITS: HabitsState = { list: [], log: {} }

export function newHabitId(): string {
  return `habit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function countOn(state: HabitsState, id: string, date: string): number {
  return state.log[id]?.[date] ?? 0
}

export function setCount(state: HabitsState, id: string, date: string, count: number): HabitsState {
  const days = { ...state.log[id] }
  if (count > 0) days[date] = count
  else delete days[date]
  return { ...state, log: { ...state.log, [id]: days } }
}

export function increment(state: HabitsState, id: string, date: string, delta: number): HabitsState {
  return setCount(state, id, date, Math.max(0, countOn(state, id, date) + delta))
}

export function isDone(habit: Habit, count: number): boolean {
  return habit.kind === 'good' ? count >= habit.target : count === 0
}

/**
 * Good habit: consecutive days reaching the target, ending today (or yesterday while today is still open).
 * Bad habit: days in a row without a slip, today included, since the habit was created.
 */
export function streak(state: HabitsState, habit: Habit, today: string): number {
  const done = (date: string) => isDone(habit, countOn(state, habit.id, date))
  let day = habit.kind === 'good' && !done(today) ? addDays(today, -1) : today
  // A good habit only counts logged days, so back-filled history before creation counts too.
  const inRange = (d: string) => habit.kind === 'good' || d >= habit.createdAt
  let n = 0
  while (inRange(day) && done(day)) {
    n++
    day = addDays(day, -1)
  }
  return n
}

/** The last `n` days, oldest first, ending today. */
export function lastDays(today: string, n = 7): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - n + 1))
}

export function addHabit(state: HabitsState, name: string, today: string, kind: HabitKind = 'good', target = 1): HabitsState {
  const clean = name.trim()
  if (!clean || state.list.some((h) => h.name.toLowerCase() === clean.toLowerCase())) return state
  const habit: Habit = { id: newHabitId(), name: clean, kind, target, createdAt: today }
  return { ...state, list: [...state.list, habit] }
}

export function updateHabit(state: HabitsState, id: string, patch: Partial<Omit<Habit, 'id'>>): HabitsState {
  return { ...state, list: state.list.map((h) => (h.id === id ? { ...h, ...patch } : h)) }
}

export function removeHabit(state: HabitsState, id: string): HabitsState {
  const log = { ...state.log }
  delete log[id]
  return { list: state.list.filter((h) => h.id !== id), log }
}

/** Puts habits in the given id order; unknown ids are ignored, missing ones keep their place at the end. */
export function reorderHabits(state: HabitsState, ids: string[]): HabitsState {
  const rank = new Map(ids.map((id, i) => [id, i]))
  const list = [...state.list].sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity))
  return { ...state, list }
}
