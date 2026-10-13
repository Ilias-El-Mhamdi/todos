import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Trip, TripTag } from '../lib/trips'
import { TRIP_TAGS } from '../lib/trips'

export type TripFields = Pick<Trip, 'name' | 'start' | 'end' | 'tags'>

interface Props {
  /** Trip being edited; undefined to create one. */
  trip: Trip | undefined
  onSave: (fields: TripFields) => void
  onDelete: () => void
  onClose: () => void
}

export function TripForm({ trip, onSave, onDelete, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState(trip?.name ?? '')
  const [start, setStart] = useState(trip?.start ?? '')
  const [end, setEnd] = useState(trip?.end ?? '')
  const [tags, setTags] = useState<TripTag[]>(trip?.tags ?? [])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  const toggleTag = (tag: TripTag) => setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('Donne un nom au voyage.')
    if (start && end && end < start) return setError('La date de retour est avant le départ.')
    onSave({ name: name.trim(), start: start || undefined, end: end || undefined, tags })
  }

  return (
    <dialog ref={dialogRef} className="task-form" onClose={onClose}>
      <form onSubmit={submit}>
        <h2>{trip ? 'Modifier le voyage' : 'Nouveau voyage'}</h2>

        <label>
          Destination / nom
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Week-end à Lyon" autoFocus />
        </label>

        <div className="form-row">
          <label>
            Départ
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label>
            Retour
            <input type="date" value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)} />
          </label>
        </div>

        <div className="form-field">
          <span className="form-label">
            Type de voyage{' '}
            <span className="hint">{trip ? '(un type ajouté complète la liste)' : '(pour pré-remplir la liste)'}</span>
          </span>
          <div className="chips">
            {(Object.keys(TRIP_TAGS) as TripTag[]).map((tag) => (
              <button
                type="button"
                key={tag}
                className={`chip${tags.includes(tag) ? ' active' : ''}`}
                aria-pressed={tags.includes(tag)}
                onClick={() => toggleTag(tag)}
              >
                {TRIP_TAGS[tag].icon} {TRIP_TAGS[tag].label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          {trip && (
            <button
              type="button"
              className="danger"
              onClick={() => window.confirm(`Supprimer le voyage « ${trip.name} » ?`) && onDelete()}
            >
              Supprimer
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="secondary" onClick={() => dialogRef.current?.close()}>
            Annuler
          </button>
          <button type="submit" className="primary">
            {trip ? 'Enregistrer' : 'Créer la liste'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
