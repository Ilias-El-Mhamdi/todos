import { useState } from 'react'
import type { Habit, HabitsState } from '../lib/habits'
import {
  addHabit,
  countOn,
  increment,
  isDone,
  lastDays,
  removeHabit,
  reorderHabits,
  setCount,
  streak,
  updateHabit,
} from '../lib/habits'
import { useDragReorder } from '../lib/useDragReorder'

interface Props {
  habits: HabitsState
  today: string
  update: (fn: (s: HabitsState) => HabitsState) => void
}

const weekday = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'narrow' }).toUpperCase()

const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

export function HabitsView({ habits, today, update }: Props) {
  const [name, setName] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const days = lastDays(today)
  const doneToday = habits.list.filter((h) => isDone(h, countOn(habits, h.id, today))).length

  const [reordering, setReordering] = useState(false)
  const { listRef, order, draggingId, handleProps } = useDragReorder(
    habits.list.map((h) => h.id),
    (ids) => update((s) => reorderHabits(s, ids)),
  )
  const byId = new Map(habits.list.map((h) => [h.id, h]))

  // Reorder mode: compact rows, the whole row is the drag handle.
  const renderReorderRow = (habit: Habit) => (
    <li
      key={habit.id}
      data-id={habit.id}
      className={`habit-reorder${draggingId === habit.id ? ' dragging' : ''}`}
      {...handleProps(habit.id)}
    >
      <span className="drag-grip" aria-hidden>
        ⋮⋮
      </span>
      <span className="habit-name">{habit.name}</span>
    </li>
  )

  const add = () => {
    update((s) => addHabit(s, name, today))
    setName('')
  }

  const renderHabit = (habit: Habit) => {
    const count = countOn(habits, habit.id, today)
    const done = isDone(habit, count)
    const state = habit.kind === 'bad' ? (done ? 'clean' : 'slipped') : done ? 'done' : count > 0 ? 'partial' : 'todo'
    const n = streak(habits, habit, today)
    const open = openId === habit.id

    return (
      <li key={habit.id} className={`habit habit-${state}${open ? ' open' : ''}`}>
        <div className="habit-row">
          <button
            className="habit-plus"
            onClick={() => update((s) => increment(s, habit.id, today, 1))}
            aria-label={habit.kind === 'bad' ? `Noter un écart : ${habit.name}` : `+1 ${habit.name}`}
          >
            {habit.kind === 'bad' ? '!' : done ? '✓' : '+'}
          </button>

          <button className="habit-body" onClick={() => setOpenId(open ? null : habit.id)} aria-expanded={open}>
            <span className="habit-name">{habit.name}</span>
            <span className="habit-meta">
              {habit.kind === 'good' ? (
                <span className="habit-count">
                  {count}/{habit.target}
                </span>
              ) : (
                <span className="habit-count">{count ? `${count} écart${count > 1 ? 's' : ''}` : 'Aucun écart'}</span>
              )}
              {n > 0 && (
                <span className="habit-streak" title={habit.kind === 'bad' ? 'Jours sans écart' : 'Jours d’affilée'}>
                  🔥 {n} j
                </span>
              )}
            </span>
            <span className="habit-week" aria-hidden>
              {days.map((d) => {
                const c = countOn(habits, habit.id, d)
                const ok = d >= habit.createdAt || c > 0 ? isDone(habit, c) : null
                const cls = ok === null ? 'none' : ok ? 'ok' : c > 0 ? (habit.kind === 'bad' ? 'ko' : 'part') : 'miss'
                return (
                  <span key={d} className={`habit-dot dot-${cls}${d === today ? ' is-today' : ''}`}>
                    {weekday(d)}
                  </span>
                )
              })}
            </span>
          </button>

          <button
            className="habit-minus"
            onClick={() => update((s) => increment(s, habit.id, today, -1))}
            disabled={count === 0}
            aria-label={`-1 ${habit.name}`}
          >
            −
          </button>
        </div>

        {open && (
          <div className="habit-settings">
            <label>
              Nom
              <input
                value={habit.name}
                onChange={(e) => update((s) => updateHabit(s, habit.id, { name: e.target.value }))}
              />
            </label>
            <span className="tabs" role="group" aria-label="Type d’habitude">
              <button
                aria-selected={habit.kind === 'good'}
                onClick={() => update((s) => updateHabit(s, habit.id, { kind: 'good' }))}
              >
                À faire
              </button>
              <button
                aria-selected={habit.kind === 'bad'}
                onClick={() => update((s) => updateHabit(s, habit.id, { kind: 'bad' }))}
              >
                À éviter
              </button>
            </span>
            {habit.kind === 'good' && (
              <label>
                Objectif
                <span className="qty-stepper">
                  <button
                    onClick={() => update((s) => updateHabit(s, habit.id, { target: Math.max(1, habit.target - 1) }))}
                    disabled={habit.target <= 1}
                    aria-label="Objectif -1"
                  >
                    −
                  </button>
                  <span className="qty">{habit.target}</span>
                  <button
                    onClick={() => update((s) => updateHabit(s, habit.id, { target: habit.target + 1 }))}
                    aria-label="Objectif +1"
                  >
                    +
                  </button>
                </span>
                fois / jour
              </label>
            )}

            <div className="habit-history">
              <span className="hint">Corriger les jours précédents :</span>
              <span className="habit-week editable">
                {days.map((d) => {
                  const c = countOn(habits, habit.id, d)
                  const ok = isDone(habit, c)
                  return (
                    <button
                      key={d}
                      className={`habit-dot dot-${ok ? 'ok' : c > 0 ? (habit.kind === 'bad' ? 'ko' : 'part') : 'miss'}`}
                      title={longDate(d)}
                      aria-label={`${longDate(d)} : ${c}`}
                      onClick={() =>
                        update((s) =>
                          setCount(s, habit.id, d, habit.kind === 'good' ? (ok ? 0 : habit.target) : c ? 0 : 1),
                        )
                      }
                    >
                      {weekday(d)}
                    </button>
                  )
                })}
              </span>
            </div>

            <div className="form-actions">
              <button
                className="danger"
                onClick={() =>
                  window.confirm(`Supprimer « ${habit.name} » et son historique ?`) &&
                  update((s) => removeHabit(s, habit.id))
                }
              >
                Supprimer
              </button>
              <span className="spacer" />
              <button className="primary" onClick={() => setOpenId(null)}>
                OK
              </button>
            </div>
          </div>
        )}
      </li>
    )
  }

  return (
    <div className="habits-view">
      <div className="today-head">
        <h2>Habitudes</h2>
        {habits.list.length > 0 && !reordering && (
          <span className="today-count">
            {doneToday}/{habits.list.length} aujourd’hui
          </span>
        )}
        {habits.list.length > 1 && (
          <button
            className={reordering ? 'primary' : 'secondary'}
            onClick={() => {
              setReordering(!reordering)
              setOpenId(null)
            }}
          >
            {reordering ? 'Terminé' : '↕ Ordonner'}
          </button>
        )}
      </div>

      {reordering && (
        <p className="hint reorder-hint">Fais glisser les habitudes pour les ranger dans l’ordre voulu.</p>
      )}

      {!reordering && (
        <div className="quick-add">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              add()
            }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nouvelle habitude…"
              aria-label="Nouvelle habitude"
              enterKeyHint="done"
            />
            <button type="submit" className="primary" aria-label="Ajouter l’habitude" disabled={!name.trim()}>
              +
            </button>
          </form>
        </div>
      )}

      {reordering ? (
        <ul className="habit-list" ref={listRef}>
          {order.map((id) => {
            const habit = byId.get(id)
            return habit ? renderReorderRow(habit) : null
          })}
        </ul>
      ) : habits.list.length === 0 ? (
        <div className="empty">
          <p>
            Aucune habitude.
            <br />
            Touche <strong>+</strong> à chaque fois que tu la fais ; touche le nom pour régler l’objectif ou en faire
            une habitude à éviter.
          </p>
        </div>
      ) : (
        <ul className="habit-list">{habits.list.map(renderHabit)}</ul>
      )}
    </div>
  )
}
