import type { Frequency, Task } from '../data/tasks'

export type Status = 'en-retard' | 'jamais' | 'aujourdhui' | 'bientot' | 'ok' | 'fait' | 'checklist'

export const STATUS_ORDER: Record<Status, number> = {
  'en-retard': 0,
  jamais: 1,
  aujourdhui: 2,
  bientot: 3,
  ok: 4,
  fait: 5,
  checklist: 6,
}

export const STATUS_LABELS: Record<Status, string> = {
  'en-retard': 'En retard',
  jamais: 'À faire',
  aujourdhui: "Aujourd'hui",
  bientot: 'Bientôt',
  ok: 'À jour',
  fait: 'Fait',
  checklist: 'Checklists',
}

type Schedule = Pick<Task, 'frequency' | 'dates' | 'km'>

export interface DoneRecord {
  last?: string
  /** Odometer reading when the task was last done. */
  km?: number
}

const INTERVALS: Partial<Record<Frequency, { days?: number; months?: number }>> = {
  daily: { days: 1 },
  weekly: { days: 7 },
  biweekly: { days: 14 },
  monthly: { months: 1 },
  quarterly: { months: 3 },
  semiannual: { months: 6 },
  annual: { months: 12 },
  biennial: { months: 24 },
  '3y': { months: 36 },
  '5y': { months: 60 },
  '10y': { months: 120 },
}

/** A fixed-date task done up to this many days early counts for that date. */
const FIXED_EARLY_DAYS = 30

/** Local calendar date as YYYY-MM-DD. */
export function toISODate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function parse(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso: string, days: number): string {
  const d = parse(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

function addMonths(d: Date, months: number): Date {
  const target = new Date(d.getFullYear(), d.getMonth() + months, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(d.getDate(), lastDay))
  return target
}

function daysBetween(from: string, to: string): number {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / 86_400_000)
}

/** Next MM-DD anchor still to do. Never done: anchors from the last 30 days are still pending. */
function nextAnchor(dates: string[], last: string | undefined, today: string): string | null {
  if (!dates.length) return null
  const from = last ? addDays(last, FIXED_EARLY_DAYS + 1) : addDays(today, -FIXED_EARLY_DAYS)
  const year = parse(from).getFullYear()
  const candidates = [year, year + 1].flatMap((y) => dates.map((md) => `${y}-${md}`)).sort()
  return candidates.find((c) => c >= from) ?? null
}

export function nextDue(task: Schedule, last: string | undefined, today: string): string | null {
  if (task.frequency === 'fixed') return nextAnchor(task.dates ?? [], last, today)
  const interval = INTERVALS[task.frequency]
  if (!interval || !last) return null
  const d = parse(last)
  if (interval.days) d.setDate(d.getDate() + interval.days)
  return toISODate(interval.months ? addMonths(d, interval.months) : d)
}

export function nextDueKm(task: Schedule, record: DoneRecord | undefined): number | null {
  return task.km && record?.km != null ? record.km + task.km : null
}

export function getStatus(task: Schedule, record: DoneRecord | undefined, today: string, odometer?: number): Status {
  const last = record?.last
  if (task.frequency === 'trigger') return 'checklist'
  if (task.frequency === 'once') return last ? 'fait' : 'jamais'
  if (!last && task.frequency !== 'fixed') return 'jamais'

  const due = nextDue(task, last, today)
  if (!due) return 'jamais'
  const remaining = daysBetween(today, due)
  let status: Status
  if (remaining < 0) status = 'en-retard'
  else if (remaining === 0) status = 'aujourdhui'
  else {
    const interval = last ? daysBetween(last, due) : 0
    const soonWindow =
      task.frequency === 'fixed' ? FIXED_EARLY_DAYS : interval < 7 ? 0 : Math.max(1, Math.round(interval * 0.1))
    status = remaining <= soonWindow ? 'bientot' : 'ok'
  }

  // Whichever comes first: date or mileage.
  const dueKm = nextDueKm(task, record)
  if (dueKm != null && odometer != null && task.km) {
    const kmLeft = dueKm - odometer
    const kmStatus: Status = kmLeft < 0 ? 'en-retard' : kmLeft <= task.km * 0.1 ? 'bientot' : 'ok'
    if (STATUS_ORDER[kmStatus] < STATUS_ORDER[status]) status = kmStatus
  }
  return status
}
