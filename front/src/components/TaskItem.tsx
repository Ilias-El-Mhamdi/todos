import { useState } from 'react'
import type { Task } from '../data/tasks'
import { CATEGORIES, FREQUENCIES } from '../data/tasks'
import type { DoneRecord, Status } from '../lib/frequency'
import { STATUS_LABELS, nextDue, nextDueKm } from '../lib/frequency'
import type { Attachment } from '../lib/attachments'
import { AttachButton, AttachmentList } from './Attachments'

interface Props {
  task: Task
  record: DoneRecord | undefined
  odometer: number | undefined
  status: Status
  today: string
  hidden: boolean
  onToggleDone: () => void
  onSetLast: (date: string | null) => void
  onSetKm: (km: number | null) => void
  onToggleHidden: () => void
  onEdit: () => void
  onRename: (title: string) => void
  inToday: boolean
  onToggleToday: () => void
  checkedSubtasks: string[]
  onToggleSubtask: (subId: string) => void
  attachments: Attachment[]
  onAddAttachment: (attachment: Attachment) => void
  onRemoveAttachment: (attachment: Attachment) => void
}

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

const formatMonthDay = (md: string) =>
  new Date(`2000-${md}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

const formatKm = (km: number) => `${km.toLocaleString('fr-FR')} km`

function frequencyLabel(task: Task): string {
  if (task.frequency === 'fixed' && task.dates) return task.dates.map(formatMonthDay).join(' · ')
  const label = FREQUENCIES[task.frequency]
  return task.km ? `${label} ou ${formatKm(task.km)}` : label
}

export function TaskItem({
  task,
  record,
  odometer,
  status,
  today,
  hidden,
  onToggleDone,
  onSetLast,
  onSetKm,
  onToggleHidden,
  onEdit,
  onRename,
  inToday,
  onToggleToday,
  checkedSubtasks,
  onToggleSubtask,
  attachments,
  onAddAttachment,
  onRemoveAttachment,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const last = record?.last
  const doneToday = last === today
  const due = nextDue(task, last, today)
  const dueKm = nextDueKm(task, record)
  const isChecklist = task.frequency === 'trigger'
  const cat = CATEGORIES[task.category]

  return (
    <li className={`task status-${status}${hidden ? ' is-hidden' : ''}`}>
      <button
        className={`check${doneToday ? ' checked' : ''}`}
        onClick={onToggleDone}
        aria-label={doneToday ? 'Annuler' : 'Marquer comme fait'}
        title={doneToday ? 'Annuler' : 'Fait aujourd’hui'}
      >
        {doneToday ? '✓' : ''}
      </button>

      <div className="task-body">
        <EditableTitle title={task.title} onRename={onRename} />
        {task.note && <div className="task-note">{task.note}</div>}
        <div className="task-meta">
          <span className={`badge cat-${task.category}`}>
            {cat.icon} {cat.label}
          </span>
          <span className="badge">{frequencyLabel(task)}</span>
          {!isChecklist && <span className={`badge status-badge-${status}`}>{STATUS_LABELS[status]}</span>}
          {due && (
            <span className="due">
              Prochaine : {formatDate(due)}
              {dueKm != null && ` ou ${formatKm(dueKm)}`}
              {dueKm != null && odometer != null && ` (reste ${formatKm(Math.max(0, dueKm - odometer))})`}
            </span>
          )}
        </div>
        {task.subtasks && (
          <Subtasks
            subtasks={task.subtasks}
            checked={checkedSubtasks}
            expanded={expanded}
            onToggleExpanded={() => setExpanded((e) => !e)}
            onToggle={onToggleSubtask}
          />
        )}
        {attachments.length > 0 && <AttachmentList attachments={attachments} onRemove={onRemoveAttachment} />}
      </div>

      <div className="task-actions">
        <label className="last-done" title="Dernière réalisation">
          <span>{isChecklist ? 'Dernière fois' : 'Fait le'}</span>
          <input
            type="date"
            value={last ?? ''}
            max={today}
            onChange={(e) => onSetLast(e.target.value || null)}
          />
        </label>
        {task.km && last && (
          <label className="last-done" title="Kilométrage à la dernière réalisation">
            <span>à (km)</span>
            <input
              className="km-input"
              type="number"
              min={0}
              step={1000}
              value={record?.km ?? ''}
              onChange={(e) => onSetKm(e.target.value ? Number(e.target.value) : null)}
            />
          </label>
        )}
        <button className={`today-toggle${inToday ? ' active' : ''}`} onClick={onToggleToday}>
          {inToday ? '☀️ Dans Today' : '+ Today'}
        </button>
        <span className="item-links">
          <AttachButton onAdded={onAddAttachment} />
          <button className="link" onClick={onEdit}>
            Modifier
          </button>
          <button className="link" onClick={onToggleHidden}>
            {hidden ? 'Afficher' : 'Masquer'}
          </button>
        </span>
      </div>
    </li>
  )
}

/** Title editable in place: the pencil turns it into a field, Enter or leaving saves, Escape cancels. */
function EditableTitle({ title, onRename }: { title: string; onRename: (title: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null)

  const save = () => {
    const next = draft?.trim()
    if (next && next !== title) onRename(next)
    setDraft(null)
  }

  if (draft === null)
    return (
      <div className="task-title">
        {title}
        <button className="title-edit" onClick={() => setDraft(title)} aria-label="Renommer" title="Renommer">
          ✎
        </button>
      </div>
    )

  return (
    <input
      className="task-title-input"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') setDraft(null)
      }}
      aria-label="Titre de la tâche"
      enterKeyHint="done"
      autoFocus
    />
  )
}

interface SubtasksProps {
  subtasks: NonNullable<Task['subtasks']>
  checked: string[]
  expanded: boolean
  onToggleExpanded: () => void
  onToggle: (subId: string) => void
}

function Subtasks({ subtasks, checked, expanded, onToggleExpanded, onToggle }: SubtasksProps) {
  return (
    <div className="subtasks">
      <button className="subtasks-toggle" onClick={onToggleExpanded} aria-expanded={expanded}>
        <span className="progress">
          <span className="progress-bar" style={{ width: `${(checked.length / subtasks.length) * 100}%` }} />
        </span>
        Sous-tâches {checked.length}/{subtasks.length} {expanded ? '▴' : '▾'}
      </button>
      {expanded && <SubtaskGroups subtasks={subtasks} checked={checked} onToggle={onToggle} />}
    </div>
  )
}

/** Checkable subtasks, by group. */
export function SubtaskGroups({
  subtasks,
  checked,
  onToggle,
  disabled = false,
}: Pick<SubtasksProps, 'subtasks' | 'checked' | 'onToggle'> & { disabled?: boolean }) {
  const groups = new Map<string, typeof subtasks>()
  for (const s of subtasks) groups.set(s.group, [...(groups.get(s.group) ?? []), s])

  return [...groups].map(([group, items]) => (
    <div key={group} className="subtask-group">
      <div className="subtask-group-title">{group}</div>
      {items.map((s) => (
        <label key={s.id} className="subtask">
          <input
            type="checkbox"
            checked={checked.includes(s.id)}
            disabled={disabled}
            onChange={() => onToggle(s.id)}
          />
          <span>{s.title}</span>
        </label>
      ))}
    </div>
  ))
}
