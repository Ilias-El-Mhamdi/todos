import type { Subtask, Task } from '../data/tasks'

/** User changes layered on top of the built-in catalog. */
export interface TaskChanges {
  added: Task[]
  /** Full replacement of a built-in task, by id. */
  edited: Record<string, Task>
  /** Deleted built-in task ids. */
  deleted: string[]
}

export const NO_CHANGES: TaskChanges = { added: [], edited: {}, deleted: [] }

export function applyChanges(base: Task[], changes: TaskChanges): Task[] {
  const deleted = new Set(changes.deleted)
  return [...base.filter((t) => !deleted.has(t.id)).map((t) => changes.edited[t.id] ?? t), ...changes.added]
}

export function newTaskId(): string {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

const DEFAULT_GROUP = 'Étapes'

/**
 * One subtask per line; a line ending with ":" starts a group.
 * Ids of unchanged titles are kept so progress survives an edit.
 */
export function parseSubtasks(text: string, previous: Subtask[] = []): Subtask[] | undefined {
  const idsByTitle = new Map(previous.map((s) => [s.title, s.id]))
  const used = new Set<string>()
  const result: Subtask[] = []
  let group = DEFAULT_GROUP
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if (line.endsWith(':')) {
      group = line.slice(0, -1).trim() || DEFAULT_GROUP
      continue
    }
    let id = idsByTitle.get(line)
    if (!id || used.has(id)) id = `sub-${result.length}-${Math.random().toString(36).slice(2, 7)}`
    used.add(id)
    result.push({ id, group, title: line })
  }
  return result.length ? result : undefined
}

export function formatSubtasks(subtasks: Subtask[] | undefined): string {
  if (!subtasks?.length) return ''
  const groups = new Set(subtasks.map((s) => s.group))
  const showGroups = groups.size > 1 || !groups.has(DEFAULT_GROUP)
  const lines: string[] = []
  let current: string | null = null
  for (const s of subtasks) {
    if (showGroups && s.group !== current) {
      if (current !== null) lines.push('')
      lines.push(`${s.group} :`)
      current = s.group
    }
    lines.push(s.title)
  }
  return lines.join('\n')
}

/** "15/04, 15/10" → ["04-15", "10-15"]; null if any entry is invalid. */
export function parseDates(text: string): string[] | null {
  const parts = text.split(/[,;\s]+/).filter(Boolean)
  const dates: string[] = []
  for (const part of parts) {
    const m = /^(\d{1,2})\/(\d{1,2})$/.exec(part)
    if (!m) return null
    const day = Number(m[1])
    const month = Number(m[2])
    const maxDay = new Date(2001, month, 0).getDate() // non-leap year: no 29/02 anchors
    if (month < 1 || month > 12 || day < 1 || day > maxDay) return null
    dates.push(`${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
  }
  return [...new Set(dates)].sort()
}

export function formatDates(dates: string[] | undefined): string {
  return (dates ?? []).map((md) => `${md.slice(3)}/${md.slice(0, 2)}`).join(', ')
}
