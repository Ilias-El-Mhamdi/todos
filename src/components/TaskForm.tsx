import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Category, Frequency, Task } from '../data/tasks'
import { CATEGORIES, FREQUENCIES } from '../data/tasks'
import { formatDates, formatSubtasks, newTaskId, parseDates, parseSubtasks } from '../lib/tasks'

interface Props {
  /** Task being edited; undefined to create one. */
  task: Task | undefined
  /** Prefilled values when creating. */
  defaults?: Partial<Task>
  /** Built-in task modified by the user: can be reset to its default. */
  canReset: boolean
  onSave: (task: Task) => void
  onDelete: () => void
  onReset: () => void
  onClose: () => void
}

export function TaskForm({ task, defaults, canReset, onSave, onDelete, onReset, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [title, setTitle] = useState(task?.title ?? defaults?.title ?? '')
  const [note, setNote] = useState(task?.note ?? '')
  const [category, setCategory] = useState<Category>(task?.category ?? defaults?.category ?? 'autre')
  const [frequency, setFrequency] = useState<Frequency>(task?.frequency ?? defaults?.frequency ?? 'monthly')
  const [dates, setDates] = useState(formatDates(task?.dates))
  const [km, setKm] = useState(task?.km ? String(task.km) : '')
  const [subtasks, setSubtasks] = useState(formatSubtasks(task?.subtasks))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return setError('Le titre est obligatoire.')
    const parsedDates = frequency === 'fixed' ? parseDates(dates) : []
    if (parsedDates === null || (frequency === 'fixed' && !parsedDates.length)) {
      return setError('Dates au format jj/mm, séparées par des virgules (ex. 15/04, 15/10).')
    }
    const kmValue = km.trim() ? Number(km.replace(/\s/g, '')) : undefined
    if (kmValue !== undefined && (!Number.isFinite(kmValue) || kmValue <= 0)) {
      return setError('Le kilométrage doit être un nombre positif.')
    }
    onSave({
      id: task?.id ?? newTaskId(),
      title: title.trim(),
      note: note.trim() || undefined,
      category,
      frequency,
      dates: frequency === 'fixed' ? parsedDates : undefined,
      km: kmValue && frequency !== 'once' && frequency !== 'trigger' ? Math.round(kmValue) : undefined,
      subtasks: parseSubtasks(subtasks, task?.subtasks),
    })
  }

  const confirmDelete = () => {
    if (window.confirm(`Supprimer « ${task?.title} » et son historique ?`)) onDelete()
  }

  return (
    <dialog ref={dialogRef} className="task-form" onClose={onClose}>
      <form onSubmit={submit}>
        <h2>{task ? 'Modifier la tâche' : 'Nouvelle tâche'}</h2>

        <label>
          Titre
          <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </label>

        <label>
          <span>
            Note <span className="hint">(optionnel)</span>
          </span>
          <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>

        <div className="form-row">
          <label>
            Catégorie
            <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {(Object.keys(CATEGORIES) as Category[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORIES[c].icon} {CATEGORIES[c].label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Fréquence
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
              {(Object.keys(FREQUENCIES) as Frequency[]).map((f) => (
                <option key={f} value={f}>
                  {FREQUENCIES[f]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {frequency === 'fixed' && (
          <label>
            <span>
            Dates <span className="hint">(jj/mm, séparées par des virgules)</span>
          </span>
            <input value={dates} onChange={(e) => setDates(e.target.value)} placeholder="15/04, 15/10" />
          </label>
        )}

        {frequency !== 'once' && frequency !== 'trigger' && (
          <label>
            <span>
            Ou tous les … km <span className="hint">(optionnel, au premier atteint)</span>
          </span>
            <input inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value)} placeholder="15000" />
          </label>
        )}

        <label>
          <span>
            Sous-tâches <span className="hint">(une par ligne ; « Groupe : » pour regrouper)</span>
          </span>
          <textarea
            rows={5}
            value={subtasks}
            onChange={(e) => setSubtasks(e.target.value)}
            placeholder={'Cuisine :\nVider les placards\nNettoyer la hotte'}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          {task && (
            <button type="button" className="danger" onClick={confirmDelete}>
              Supprimer
            </button>
          )}
          {canReset && (
            <button type="button" className="secondary" onClick={onReset}>
              Réinitialiser
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="secondary" onClick={() => dialogRef.current?.close()}>
            Annuler
          </button>
          <button type="submit" className="primary">
            Enregistrer
          </button>
        </div>
      </form>
    </dialog>
  )
}
