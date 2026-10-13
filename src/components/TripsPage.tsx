import { useState } from 'react'
import { taskLink } from '../lib/route'
import type { PackCategory, PackItem, Phase, Trip } from '../lib/trips'
import {
  PACK_CATEGORIES,
  TRIP_TAGS,
  addPackItem,
  createTrip,
  duplicateTrip,
  generateItems,
  itemsFor,
  nights,
  progress,
  sortTrips,
} from '../lib/trips'
import { sameItem } from '../lib/shopping'
import type { TripFields } from './TripForm'
import { TripForm } from './TripForm'

interface Props {
  trips: Trip[]
  today: string
  update: (fn: (trips: Trip[]) => Trip[]) => void
}

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

function dateRange(trip: Trip): string {
  if (!trip.start) return 'Dates à définir'
  const n = nights(trip)
  const end = trip.end ? ` → ${shortDate(trip.end)}` : ''
  return `${shortDate(trip.start)}${end}${trip.end ? ` · ${n} nuit${n > 1 ? 's' : ''}` : ''}`
}

export function TripsPage({ trips, today, update }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)
  // undefined trip = creating one
  const [editing, setEditing] = useState<{ trip?: Trip } | null>(null)
  const open = trips.find((t) => t.id === openId)

  const save = (fields: TripFields) => {
    const current = editing?.trip
    if (current) {
      // New trip types complete the list; nothing is removed.
      const added = fields.tags.filter((t) => !current.tags.includes(t))
      const extra = generateItems(added, nights(fields)).filter(
        (i) => !current.items.some((x) => sameItem(x.name, i.name)),
      )
      update((ts) => ts.map((t) => (t.id === current.id ? { ...t, ...fields, items: [...t.items, ...extra] } : t)))
    } else {
      const trip = createTrip(fields)
      update((ts) => [...ts, trip])
      setOpenId(trip.id)
    }
    setEditing(null)
  }

  return (
    <div className="trips-page">
      {open ? (
        <TripDetail
          key={open.id}
          trip={open}
          today={today}
          onBack={() => setOpenId(null)}
          onEdit={() => setEditing({ trip: open })}
          onDuplicate={() => {
            const copy = duplicateTrip(open, `${open.name} (copie)`)
            update((ts) => [...ts, copy])
            setOpenId(copy.id)
            setEditing({ trip: copy })
          }}
          onChange={(fn) => update((ts) => ts.map((t) => (t.id === open.id ? fn(t) : t)))}
        />
      ) : (
        <>
          <div className="today-head">
            <h2>Voyages</h2>
            <button className="primary" onClick={() => setEditing({})}>
              + Nouveau voyage
            </button>
          </div>

          {trips.length === 0 && (
            <p className="empty">
              Aucun voyage.
              <br />
              Crée-en un : la liste d’affaires est pré-remplie selon la durée et le type de voyage, avec une checklist
              pour l’aller et une pour le retour.
            </p>
          )}

          <ul className="recipe-list">
            {sortTrips(trips, today).map((trip) => {
              const out = progress(trip, 'out')
              const back = progress(trip, 'back')
              const past = !!trip.end && trip.end < today
              return (
                <li key={trip.id}>
                  <button className={`recipe-card trip-card${past ? ' past' : ''}`} onClick={() => setOpenId(trip.id)}>
                    <span className="recipe-card-title">
                      {trip.name}
                      <span className="hint"> · {dateRange(trip)}</span>
                    </span>
                    <span className="trip-tags">{trip.tags.map((t) => TRIP_TAGS[t].icon).join(' ')}</span>
                    <span className="hint">
                      🧳 Aller {out.done}/{out.total} · 🏠 Retour {back.done}/{back.total}
                      {past && ' · terminé'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {editing && (
        <TripForm
          trip={editing.trip}
          onSave={save}
          onDelete={() => {
            if (editing.trip) update((ts) => ts.filter((t) => t.id !== editing.trip!.id))
            setEditing(null)
            setOpenId(null)
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

interface DetailProps {
  trip: Trip
  today: string
  onBack: () => void
  onEdit: () => void
  onDuplicate: () => void
  onChange: (fn: (trip: Trip) => Trip) => void
}

function TripDetail({ trip, today, onBack, onEdit, onDuplicate, onChange }: DetailProps) {
  // Once the trip has started, the useful list is the way back.
  const [phase, setPhase] = useState<Phase>(trip.start && trip.start <= today ? 'back' : 'out')
  const [text, setText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const items = itemsFor(trip, phase)
  const { done, total } = progress(trip, phase)
  const out = progress(trip, 'out')
  const back = progress(trip, 'back')

  const setItem = (id: string, patch: Partial<PackItem>) =>
    onChange((t) => ({ ...t, items: t.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }))

  const groups = (Object.keys(PACK_CATEGORIES) as PackCategory[])
    .map((category) => ({ category, items: items.filter((i) => i.category === category) }))
    .filter((g) => g.items.length)

  const renderItem = (item: PackItem) => {
    const checked = item[phase]
    const editing = editingId === item.id
    return (
      <li key={item.id} className={`shop-item pack-item${checked ? ' done' : ''}${editing ? ' editing' : ''}`}>
        <button
          className={`check${checked ? ' checked' : ''}`}
          onClick={() => setItem(item.id, { [phase]: !checked })}
          aria-label={checked ? `Décocher ${item.name}` : `Cocher ${item.name}`}
        >
          {checked ? '✓' : ''}
        </button>
        <button
          className="shop-name stock-name"
          onClick={() => setEditingId(editing ? null : item.id)}
          aria-expanded={editing}
        >
          {item.name}
          {item.qty !== undefined && <span className="qty-badge">×{item.qty}</span>}
        </button>
        <button
          className="remove"
          onClick={() => onChange((t) => ({ ...t, items: t.items.filter((i) => i.id !== item.id) }))}
          aria-label={`Retirer ${item.name}`}
          title="Retirer de la liste"
        >
          ✕
        </button>
        {editing && (
          <div className="item-editor">
            <span className="qty-stepper" role="group" aria-label="Quantité">
              <button
                onClick={() => setItem(item.id, { qty: (item.qty ?? 1) > 1 ? (item.qty ?? 1) - 1 : undefined })}
                disabled={item.qty === undefined}
                aria-label="Un de moins"
              >
                −
              </button>
              <span className="qty">{item.qty ?? 1}</span>
              <button onClick={() => setItem(item.id, { qty: (item.qty ?? 1) + 1 })} aria-label="Un de plus">
                +
              </button>
            </span>
            <select
              value={item.category}
              onChange={(e) => setItem(item.id, { category: e.target.value as PackCategory })}
              aria-label="Catégorie"
            >
              {(Object.keys(PACK_CATEGORIES) as PackCategory[]).map((c) => (
                <option key={c} value={c}>
                  {PACK_CATEGORIES[c].icon} {PACK_CATEGORIES[c].label}
                </option>
              ))}
            </select>
            <button className="secondary" onClick={() => setEditingId(null)}>
              OK
            </button>
          </div>
        )}
      </li>
    )
  }

  return (
    <>
      <div className="recipe-detail-head">
        <button className="link" onClick={onBack}>
          ← Voyages
        </button>
        <span className="item-links">
          <button className="link" onClick={onDuplicate}>
            Dupliquer
          </button>
          <button className="link" onClick={onEdit}>
            Modifier
          </button>
        </span>
      </div>
      <h2 className="recipe-title">{trip.name}</h2>
      <p className="trip-meta">
        {dateRange(trip)}
        {trip.tags.length > 0 && ` · ${trip.tags.map((t) => `${TRIP_TAGS[t].icon} ${TRIP_TAGS[t].label}`).join(' · ')}`}
      </p>

      <div className="tabs view-switch" role="tablist">
        <button role="tab" aria-selected={phase === 'out'} onClick={() => setPhase('out')}>
          🧳 Aller {out.done}/{out.total}
        </button>
        <button role="tab" aria-selected={phase === 'back'} onClick={() => setPhase('back')}>
          🏠 Retour {back.done}/{back.total}
        </button>
      </div>

      <span className="progress today-progress">
        <span className="progress-bar" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </span>

      {phase === 'out' ? (
        <div className="quick-add">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              onChange((t) => addPackItem(t, text))
              setText('')
            }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ajouter… (ex. 2 shorts, adaptateur)"
              aria-label="Ajouter une affaire"
              enterKeyHint="done"
            />
            <button type="submit" className="primary" aria-label="Ajouter" disabled={!text.trim()}>
              +
            </button>
          </form>
        </div>
      ) : (
        <p className="hint phase-hint">
          {out.done > 0
            ? 'Seulement ce qui est parti à l’aller : coche au fur et à mesure en refaisant la valise.'
            : 'Rien n’a été coché à l’aller : toute la liste est affichée.'}
        </p>
      )}

      {done === total && total > 0 && (
        <p className="added-note trip-done">{phase === 'out' ? 'Valise prête 🎉' : 'Rien d’oublié, bon retour 🏠'}</p>
      )}

      {groups.map((g) => (
        <section key={g.category} className="aisle">
          <h3>
            {PACK_CATEGORIES[g.category].icon} {PACK_CATEGORIES[g.category].label}
          </h3>
          <ul className="shop-list">{g.items.map(renderItem)}</ul>
        </section>
      ))}

      <div className="shop-actions">
        {done > 0 && (
          <button
            className="secondary"
            onClick={() => onChange((t) => ({ ...t, items: t.items.map((i) => ({ ...i, [phase]: false })) }))}
          >
            Tout décocher ({phase === 'out' ? 'aller' : 'retour'})
          </button>
        )}
        <a className="secondary link-button" href={taskLink('Avant de partir en vacances')}>
          🏠 Checklist logement avant de partir
        </a>
      </div>
    </>
  )
}
