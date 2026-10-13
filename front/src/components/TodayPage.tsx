import { useState } from 'react'
import type { Task } from '../data/tasks'
import { CATEGORIES } from '../data/tasks'
import type { DoneRecord, Status } from '../lib/frequency'
import { STATUS_LABELS } from '../lib/frequency'
import { useDragReorder } from '../lib/useDragReorder'
import { useLocalStorage } from '../lib/storage'
import { SubtaskGroups } from './TaskItem'

export interface TodayRow {
  task: Task
  record: DoneRecord | undefined
  status: Status
}

interface Props {
  rows: TodayRow[]
  suggestions: TodayRow[]
  /** Daily tasks, checked straight from Today. */
  daily: TodayRow[]
  /** Opens the task in the full list. */
  onOpenTask: (task: Task) => void
  onReorderDaily: (ids: string[]) => void
  today: string
  progress: Record<string, string[]>
  onToggleDone: (task: Task) => void
  /** Checking the last subtask completes the task. */
  onToggleSubtask: (task: Task, subId: string) => void
  onRemove: (id: string) => void
  onAdd: (id: string) => void
  onReorder: (ids: string[]) => void
  /** Tasks that can be added to Today. */
  candidates: TodayRow[]
  /** Opens the task form to create a task that goes straight into Today. */
  onCreate: (title: string) => void
}

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

function QuickAdd({ candidates, onAdd, onCreate }: Pick<Props, 'candidates' | 'onAdd' | 'onCreate'>) {
  const [query, setQuery] = useState('')
  const q = normalize(query.trim())
  const matches = q ? candidates.filter((r) => normalize(r.task.title).includes(q)).slice(0, 6) : []

  const add = (id: string) => {
    onAdd(id)
    setQuery('')
  }

  const create = () => {
    onCreate(query.trim())
    setQuery('')
  }

  return (
    <div className="quick-add">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          create()
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ajouter une tâche à Today…"
          aria-label="Ajouter une tâche à Today"
        />
        <button type="submit" className="primary" aria-label="Créer une nouvelle tâche">
          +
        </button>
      </form>
      {q && (
        <ul className="quick-add-results">
          {matches.map((r) => (
            <li key={r.task.id}>
              <button onClick={() => add(r.task.id)}>
                {CATEGORIES[r.task.category].icon} {r.task.title}
              </button>
            </li>
          ))}
          <li>
            <button className="create" onClick={create}>
              ＋ Créer « {query.trim()} »
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}

export function TodayPage({
  rows,
  suggestions,
  daily,
  onOpenTask,
  onReorderDaily,
  today,
  progress,
  onToggleDone,
  onToggleSubtask,
  onRemove,
  onAdd,
  onReorder,
  candidates,
  onCreate,
}: Props) {
  const isDone = (r: TodayRow) => r.record?.last === today
  const pending = rows.filter((r) => !isDone(r))
  const done = rows.filter(isDone)
  // Only pending items are reorderable; done ones keep their place at the end.
  const ids = pending.map((r) => r.task.id)
  const doneIds = done.map((r) => r.task.id)
  const { listRef, order, draggingId, handleProps } = useDragReorder(ids, (next) => onReorder([...next, ...doneIds]))
  const byId = new Map(rows.map((r) => [r.task.id, r]))
  const doneCount = done.length

  const renderItem = (r: TodayRow, isDoneItem: boolean) => {
    const id = r.task.id
    const cat = CATEGORIES[r.task.category]
    const subs = r.task.subtasks
    return (
      <li
        key={id}
        data-id={id}
        className={`today-item${isDoneItem ? ' done' : ''}${draggingId === id ? ' dragging' : ''}`}
      >
        {isDoneItem ? (
          <span className="drag-handle" aria-hidden />
        ) : (
          <button className="drag-handle" aria-label="Déplacer" title="Glisser pour réordonner" {...handleProps(id)}>
            ⋮⋮
          </button>
        )}
        <button
          className={`check${isDoneItem ? ' checked' : ''}`}
          onClick={() => onToggleDone(r.task)}
          aria-label={isDoneItem ? 'Annuler' : 'Valider'}
        >
          {isDoneItem ? '✓' : ''}
        </button>
        <div className="today-body">
          <TaskLink task={r.task} onOpen={onOpenTask} className="task-title" />
          <div className="task-meta">
            <span className={`badge cat-${r.task.category}`}>
              {cat.icon} {cat.label}
            </span>
            {subs && !isDoneItem && (
              <span className="badge">
                Sous-tâches {progress[id]?.length ?? 0}/{subs.length}
              </span>
            )}
          </div>
        </div>
        <button className="remove" onClick={() => onRemove(id)} aria-label="Retirer de Today" title="Retirer de Today">
          ✕
        </button>
      </li>
    )
  }

  return (
    <div className="today-page">
      <div className="today-head">
        <h2>Today</h2>
        {rows.length > 0 && (
          <span className="today-count">
            {doneCount}/{rows.length} fait{doneCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
      {rows.length > 0 && (
        <span className="progress today-progress">
          <span className="progress-bar" style={{ width: `${(doneCount / rows.length) * 100}%` }} />
        </span>
      )}

      <QuickAdd candidates={candidates} onAdd={onAdd} onCreate={onCreate} />

      {rows.length === 0 ? (
        <p className="empty">
          Rien de prévu aujourd’hui.
          <br />
          Cherche une tâche existante ou crée-en une ci-dessus, ou pioche dans les suggestions.
        </p>
      ) : (
        <>
          {pending.length > 0 ? (
            <ul className="today-list" ref={listRef}>
              {order.map((id) => {
                const r = byId.get(id)
                return r ? renderItem(r, false) : null
              })}
            </ul>
          ) : (
            <p className="empty">Tout est fait pour aujourd’hui 🎉</p>
          )}

          {done.length > 0 && (
            <details className="done-section">
              <summary>
                Faits <span className="count">{done.length}</span>
              </summary>
              <ul className="today-list">{done.map((r) => renderItem(r, true))}</ul>
            </details>
          )}
        </>
      )}

      {daily.length > 0 && (
        <DailySection
          daily={daily}
          today={today}
          progress={progress}
          onToggleDone={onToggleDone}
          onToggleSubtask={onToggleSubtask}
          onReorderDaily={onReorderDaily}
          onOpenTask={onOpenTask}
        />
      )}

      {suggestions.length > 0 && (
        <section className="group">
          <h2>
            Suggestions <span className="count">en retard ou dues aujourd’hui</span>
          </h2>
          <ul className="suggestions">
            {suggestions.map((r) => (
              <li key={r.task.id} className="suggestion">
                <TaskLink task={r.task} onOpen={onOpenTask} className="suggestion-title" icon />
                <span className={`badge status-badge-${r.status}`}>{STATUS_LABELS[r.status]}</span>
                <button className="secondary" onClick={() => onAdd(r.task.id)}>
                  + Today
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function DailySection({
  daily,
  today,
  progress,
  onToggleDone,
  onToggleSubtask,
  onReorderDaily,
  onOpenTask,
}: Pick<
  Props,
  'daily' | 'today' | 'progress' | 'onToggleDone' | 'onToggleSubtask' | 'onReorderDaily' | 'onOpenTask'
>) {
  // Tasks whose subtasks are shown, remembered on this device.
  const [expanded, setExpanded] = useLocalStorage<string[]>('entretien.dailyExpanded', [])
  const toggleExpanded = (id: string) =>
    setExpanded((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]))
  const isDone = (r: TodayRow) => r.record?.last === today
  const doneCount = daily.filter(isDone).length
  // Fixed places: checking doesn't move a task; only dragging does.
  const { listRef, order, draggingId, handleProps } = useDragReorder(
    daily.map((r) => r.task.id),
    onReorderDaily,
  )
  const byId = new Map(daily.map((r) => [r.task.id, r]))
  const sorted = order.flatMap((id) => byId.get(id) ?? [])

  return (
    <section className="group daily-section">
      <h2>
        🔁 Quotidien{' '}
        <span className="count">
          {doneCount}/{daily.length}
        </span>
      </h2>
      <span className="progress today-progress">
        <span className="progress-bar" style={{ width: `${(doneCount / daily.length) * 100}%` }} />
      </span>
      <ul className="daily-list" ref={listRef}>
        {sorted.map((r) => {
          const done = isDone(r)
          const subs = r.task.subtasks
          // Done today: progress was reset for the next cycle, show the whole list as done instead.
          const checked = done && subs ? subs.map((sub) => sub.id) : (progress[r.task.id] ?? [])
          const open = !!subs && expanded.includes(r.task.id)
          return (
            <li
              key={r.task.id}
              data-id={r.task.id}
              className={`daily-item${done ? ' done' : ''}${draggingId === r.task.id ? ' dragging' : ''}`}
            >
              <button
                className="drag-handle"
                aria-label="Déplacer"
                title="Glisser pour réordonner"
                {...handleProps(r.task.id)}
              >
                ⋮⋮
              </button>
              <button
                className={`check${done ? ' checked' : ''}`}
                onClick={() => onToggleDone(r.task)}
                aria-label={done ? `Annuler : ${r.task.title}` : `Fait : ${r.task.title}`}
              >
                {done ? '✓' : ''}
              </button>
              <TaskLink task={r.task} onOpen={onOpenTask} className="daily-title" icon />
              {subs && (
                <button
                  className={`daily-expand${open ? ' open' : ''}`}
                  onClick={() => toggleExpanded(r.task.id)}
                  aria-expanded={open}
                  aria-label={`Sous-tâches de ${r.task.title}`}
                >
                  {!done && (
                    <span className="count">
                      {checked.length}/{subs.length}
                    </span>
                  )}
                  <span className="chevron" aria-hidden>
                    ▾
                  </span>
                </button>
              )}
              {open && subs && (
                <div className="daily-subtasks">
                  <SubtaskGroups
                    subtasks={subs}
                    checked={checked}
                    disabled={done}
                    onToggle={(subId) => onToggleSubtask(r.task, subId)}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** A task title that opens the task in the full list. */
function TaskLink({
  task,
  onOpen,
  className,
  icon = false,
}: {
  task: Task
  onOpen: (task: Task) => void
  className: string
  icon?: boolean
}) {
  return (
    <button className={`task-link ${className}`} onClick={() => onOpen(task)}>
      {icon && <span aria-hidden>{CATEGORIES[task.category].icon} </span>}
      {task.title}
      <span className="task-link-chevron" aria-hidden>
        ›
      </span>
    </button>
  )
}
