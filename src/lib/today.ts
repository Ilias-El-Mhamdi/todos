export interface TodayList {
  /** Day the list was planned for (YYYY-MM-DD). */
  date: string
  /** Task ids, in the user's order. */
  ids: string[]
}

/** On a new day, carry over unfinished items and drop the ones done since the list was planned. */
export function rollover(list: TodayList, today: string, done: Record<string, { last?: string }>): TodayList {
  if (list.date === today) return list
  return {
    date: today,
    ids: list.ids.filter((id) => {
      const last = done[id]?.last
      return !last || last < list.date
    }),
  }
}

/** Moves `id` to `index` among the other items. */
export function moveTo(ids: string[], id: string, index: number): string[] {
  const rest = ids.filter((i) => i !== id)
  rest.splice(Math.max(0, Math.min(index, rest.length)), 0, id)
  return rest
}
