import { useEffect, useMemo, useState } from 'react'
import './App.css'
import type { Category, Frequency, Task } from './data/tasks'
import { CATEGORIES, FREQUENCIES, TASKS } from './data/tasks'
import type { Status } from './lib/frequency'
import { STATUS_LABELS, STATUS_ORDER, getStatus, toISODate } from './lib/frequency'
import { Odometer } from './components/Odometer'
import { mergeDefaults, useLocalStorage } from './lib/storage'
import { useSyncedState } from './lib/syncedState'
import { useSwipeTabs } from './lib/useSwipeTabs'
import { parseHash, taskLink } from './lib/route'
import type { TaskChanges } from './lib/tasks'
import { NO_CHANGES, applyChanges } from './lib/tasks'
import { TaskForm } from './components/TaskForm'
import type { Page } from './components/TabBar'
import { TabBar } from './components/TabBar'
import { VersionInfo } from './components/VersionInfo'
import { BackupControls } from './components/BackupControls'
import { ShoppingPage } from './components/ShoppingPage'
import { RecipesPage } from './components/RecipesPage'
import { HabitsView } from './components/HabitsView'
import { TripsPage } from './components/TripsPage'
import type { Trip } from './lib/trips'
import type { HabitsState } from './lib/habits'
import { EMPTY_HABITS } from './lib/habits'
import type { Recipe } from './lib/recipes'
import type { ShoppingState } from './lib/shopping'
import { EMPTY_SHOPPING } from './lib/shopping'
import { TodayPage } from './components/TodayPage'
import type { TodayList } from './lib/today'
import { rollover } from './lib/today'
import type { FilterState } from './components/Filters'
import { Filters } from './components/Filters'
import { Summary } from './components/Summary'
import { TaskItem } from './components/TaskItem'

interface TaskRecord {
  last: string
  history: string[]
  /** Odometer reading when last done (mileage-based tasks). */
  km?: number
}

interface State {
  done: Record<string, TaskRecord>
  hidden: string[]
  /** Subtasks checked during the current cycle, by task id. */
  progress: Record<string, string[]>
  odometer?: { km: number; date: string }
  changes: TaskChanges
  today: TodayList
  shopping: ShoppingState
  recipes: Recipe[]
  habits: HabitsState
  /** User order of the daily tasks shown in Today. */
  dailyOrder: string[]
  trips: Trip[]
  /** Built-in task catalog shown. New accounts start without it and add it with one button. */
  catalog: boolean
}

// Saves made before `catalog` existed always showed the built-in tasks: keep them.
const migrateState = (saved: unknown) =>
  typeof saved === 'object' && saved !== null && !('catalog' in saved) ? { ...saved, catalog: true } : saved

const STORAGE_KEY = 'entretien.v1'

const INITIAL_STATE: State = {
  done: {},
  hidden: [],
  progress: {},
  changes: NO_CHANGES,
  today: { date: '', ids: [] },
  shopping: EMPTY_SHOPPING,
  recipes: [],
  habits: EMPTY_HABITS,
  dailyOrder: [],
  trips: [],
  catalog: false,
}

type Theme = 'dark' | 'light'

const initialFilters: FilterState = {
  groupBy: 'urgence',
  category: null,
  frequency: null,
  search: '',
  showHidden: false,
}

interface Row {
  task: Task
  status: Status
  record: TaskRecord | undefined
  hidden: boolean
}

type TodayView = 'today' | 'habits'
const TODAY_VIEWS: TodayView[] = ['today', 'habits']

const PAGES: Page[] = ['today', 'tasks', 'courses', 'voyages']
const pageFromHash = (): Page => PAGES.find((p) => parseHash(window.location.hash).path === p) ?? 'today'

const BUILTIN_IDS = new Set(TASKS.map((t) => t.id))

/** Records `date` as the latest completion, snapshotting the odometer for mileage-based tasks. */
function withDone(s: State, task: Task, date: string): State {
  const id = task.id
  const prev = s.done[id]
  const history = [...(prev?.history ?? []).filter((d) => d !== date), date].sort()
  const km = task.km && s.odometer ? s.odometer.km : prev?.km
  const progress = { ...s.progress }
  delete progress[id]
  return { ...s, progress, done: { ...s.done, [id]: { last: history[history.length - 1], history, km } } }
}

export default function App() {
  const [state, setState, offline, replaceState] = useSyncedState<State>(STORAGE_KEY, INITIAL_STATE, migrateState)
  const [page, setPage] = useState<Page>(pageFromHash)
  const [todayView, setTodayView] = useLocalStorage<TodayView>('entretien.todayView', 'today')
  const todaySwipe = useSwipeTabs(TODAY_VIEWS, todayView, setTodayView)
  // undefined task = creating a new one; addToToday puts the created task in Today.
  const [editing, setEditing] = useState<{ task?: Task; defaults?: Partial<Task>; addToToday?: boolean } | null>(null)
  const [filters, setFilters] = useState(initialFilters)
  const [statusFilter, setStatusFilter] = useState<Status | null>(null)
  const [prefs, setPrefs] = useLocalStorage<{ theme: Theme }>('entretien.prefs', { theme: 'dark' })
  const [today, setToday] = useState(() => toISODate(new Date()))

  useEffect(() => {
    document.documentElement.dataset.theme = prefs.theme
  }, [prefs.theme])

  // Refresh "today" when the tab comes back after midnight.
  useEffect(() => {
    const refresh = () => setToday(toISODate(new Date()))
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [])

  // "#/tasks?search=…" opens the task list filtered on that text, then cleans the URL.
  useEffect(() => {
    const onHash = () => {
      setPage(pageFromHash())
      const { path, params } = parseHash(window.location.hash)
      const search = params.get('search')
      if (path !== 'tasks' || search === null) return
      setFilters({ ...initialFilters, search })
      setStatusFilter(null)
      window.history.replaceState(null, '', '#/tasks')
      window.scrollTo(0, 0)
    }
    onHash()
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // New day: carry over what wasn't done.
  useEffect(() => {
    setState((s) => {
      const next = rollover(s.today, today, s.done)
      return next === s.today ? s : { ...s, today: next }
    })
  }, [today, setState])

  // Older saves may lack newer shopping fields (e.g. stock).
  const shopping = { ...EMPTY_SHOPPING, ...state.shopping }
  const updateShopping = (fn: (s: ShoppingState) => ShoppingState) =>
    setState((s) => ({ ...s, shopping: fn({ ...EMPTY_SHOPPING, ...s.shopping }) }))

  const habits = { ...EMPTY_HABITS, ...state.habits }
  const habitsLeft = habits.list.filter((h) => h.kind === 'good' && (habits.log[h.id]?.[today] ?? 0) < h.target).length

  const tasks = useMemo(
    () => applyChanges(state.catalog ? TASKS : [], state.changes),
    [state.catalog, state.changes],
  )

  const rows: Row[] = useMemo(
    () =>
      tasks.map((task) => {
        const record = state.done[task.id]
        return {
          task,
          record,
          status: getStatus(task, record, today, state.odometer?.km),
          hidden: state.hidden.includes(task.id),
        }
      }),
    [state, tasks, today],
  )

  const todayRows = useMemo(() => {
    const byId = new Map(rows.map((r) => [r.task.id, r]))
    return state.today.ids.flatMap((id) => byId.get(id) ?? [])
  }, [rows, state.today.ids])

  const suggestions = useMemo(
    () =>
      rows
        .filter((r) => !r.hidden && !state.today.ids.includes(r.task.id) && r.task.frequency !== 'daily')
        .filter((r) => r.status === 'en-retard' || r.status === 'aujourdhui')
        .slice(0, 8),
    [rows, state.today.ids],
  )

  // Daily routine, shown on its own in Today (unless already planned in the Today list).
  // Saved order first, then any daily task not ordered yet (new ones) in catalog order.
  const dailyRows = useMemo(() => {
    const daily = rows.filter((r) => r.task.frequency === 'daily' && !r.hidden && !state.today.ids.includes(r.task.id))
    const rank = new Map(state.dailyOrder.map((id, i) => [id, i]))
    return [...daily].sort((a, b) => (rank.get(a.task.id) ?? Infinity) - (rank.get(b.task.id) ?? Infinity))
  }, [rows, state.today.ids, state.dailyOrder])

  const todayLeft = todayRows.filter((r) => r.record?.last !== today).length

  const counts = useMemo(() => {
    const c = Object.fromEntries(Object.keys(STATUS_ORDER).map((s) => [s, 0])) as Record<Status, number>
    for (const r of rows) if (!r.hidden) c[r.status]++
    return c
  }, [rows])

  const visible = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    return rows
      .filter((r) => (filters.showHidden ? r.hidden : !r.hidden))
      .filter((r) => !filters.category || r.task.category === filters.category)
      .filter((r) => !filters.frequency || r.task.frequency === filters.frequency)
      .filter((r) => !statusFilter || r.status === statusFilter)
      .filter((r) => !q || `${r.task.title} ${r.task.note ?? ''}`.toLowerCase().includes(q))
      .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
  }, [rows, filters, statusFilter])

  const groups = useMemo(() => {
    const keyOf = (r: Row): [string, string] => {
      if (filters.groupBy === 'frequence') return [r.task.frequency, FREQUENCIES[r.task.frequency]]
      if (filters.groupBy === 'categorie') {
        const c = CATEGORIES[r.task.category]
        return [r.task.category, `${c.icon} ${c.label}`]
      }
      return [r.status, STATUS_LABELS[r.status]]
    }
    const order =
      filters.groupBy === 'frequence'
        ? (Object.keys(FREQUENCIES) as Frequency[])
        : filters.groupBy === 'categorie'
          ? (Object.keys(CATEGORIES) as Category[])
          : (Object.keys(STATUS_ORDER) as Status[])
    const map = new Map<string, { label: string; rows: Row[] }>()
    for (const r of visible) {
      const [key, label] = keyOf(r)
      if (!map.has(key)) map.set(key, { label, rows: [] })
      map.get(key)!.rows.push(r)
    }
    return order.filter((k) => map.has(k)).map((k) => ({ key: k, ...map.get(k)! }))
  }, [visible, filters.groupBy])

  const setLast = (task: Task, date: string | null) =>
    setState((s) => {
      if (date) return withDone(s, task, date)
      const done = { ...s.done }
      delete done[task.id]
      return { ...s, done }
    })

  const setKm = (id: string, km: number | null) =>
    setState((s) => {
      const prev = s.done[id]
      if (!prev) return s
      return { ...s, done: { ...s.done, [id]: { ...prev, km: km ?? undefined } } }
    })

  const toggleDone = (task: Task) =>
    setState((s) => {
      const id = task.id
      const prev = s.done[id]
      if (prev?.last !== today) return withDone(s, task, today)
      const done = { ...s.done }
      const history = prev.history.filter((d) => d !== today)
      if (history.length) done[id] = { ...prev, last: history[history.length - 1], history }
      else delete done[id]
      return { ...s, done }
    })

  // Updating the odometer also completes the monthly "update mileage" task.
  const setOdometer = (km: number) =>
    setState((s) => {
      const next = { ...s, odometer: { km, date: today } }
      const task = tasks.find((t) => t.id === 'odometer')
      return task ? withDone(next, task, today) : next
    })

  // Checking the last subtask completes the parent task and starts a new cycle.
  const toggleSubtask = (task: Task, subId: string) =>
    setState((s) => {
      const current = s.progress[task.id] ?? []
      const checked = current.includes(subId) ? current.filter((c) => c !== subId) : [...current, subId]
      const progress = { ...s.progress, [task.id]: checked }
      if (!task.subtasks || checked.length < task.subtasks.length) return { ...s, progress }
      return withDone({ ...s, progress }, task, today)
    })

  const saveTask = (task: Task) => {
    setState((s) => {
      const c = s.changes
      const changes: TaskChanges = BUILTIN_IDS.has(task.id)
        ? { ...c, edited: { ...c.edited, [task.id]: task } }
        : c.added.some((t) => t.id === task.id)
          ? { ...c, added: c.added.map((t) => (t.id === task.id ? task : t)) }
          : { ...c, added: [...c.added, task] }
      // Drop progress on subtasks that no longer exist.
      const progress = { ...s.progress }
      const subIds = new Set(task.subtasks?.map((sub) => sub.id))
      if (progress[task.id]) progress[task.id] = progress[task.id].filter((id) => subIds.has(id))
      const addToToday = editing?.addToToday && !s.today.ids.includes(task.id)
      const today = addToToday ? { ...s.today, ids: [...s.today.ids, task.id] } : s.today
      return { ...s, changes, progress, today }
    })
    setEditing(null)
  }

  const deleteTask = (id: string) => {
    setState((s) => {
      const c = s.changes
      const edited = { ...c.edited }
      delete edited[id]
      const changes: TaskChanges = BUILTIN_IDS.has(id)
        ? { ...c, edited, deleted: [...c.deleted, id] }
        : { ...c, added: c.added.filter((t) => t.id !== id) }
      const done = { ...s.done }
      const progress = { ...s.progress }
      delete done[id]
      delete progress[id]
      return {
        ...s,
        changes,
        done,
        progress,
        hidden: s.hidden.filter((h) => h !== id),
        today: { ...s.today, ids: s.today.ids.filter((i) => i !== id) },
      }
    })
    setEditing(null)
  }

  const resetTask = (id: string) => {
    setState((s) => {
      const edited = { ...s.changes.edited }
      delete edited[id]
      return { ...s, changes: { ...s.changes, edited } }
    })
    setEditing(null)
  }

  const toggleToday = (id: string) =>
    setState((s) => ({
      ...s,
      today: {
        ...s.today,
        ids: s.today.ids.includes(id) ? s.today.ids.filter((i) => i !== id) : [...s.today.ids, id],
      },
    }))

  const reorderToday = (ids: string[]) => setState((s) => ({ ...s, today: { ...s.today, ids } }))

  const restoreDeleted = () => setState((s) => ({ ...s, changes: { ...s.changes, deleted: [] } }))

  // All essentials, including any deleted before the catalog was turned off.
  const addCatalog = () => setState((s) => ({ ...s, catalog: true, changes: { ...s.changes, deleted: [] } }))

  const toggleHidden = (id: string) =>
    setState((s) => ({
      ...s,
      hidden: s.hidden.includes(id) ? s.hidden.filter((h) => h !== id) : [...s.hidden, id],
    }))

  return (
    <main className="app">
      {offline && (
        <p className="sync-banner" role="status">
          Hors ligne · tes modifications restent sur l’appareil et seront synchronisées au retour du réseau.
        </p>
      )}
      <header>
        <div>
          <h1>Entretien &amp; Prévoyance</h1>
          <p className="subtitle">
            {new Date(`${today}T00:00:00`).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <button
          className="theme-toggle"
          onClick={() => setPrefs({ theme: prefs.theme === 'dark' ? 'light' : 'dark' })}
          aria-label={prefs.theme === 'dark' ? 'Passer en mode jour' : 'Passer en mode nuit'}
          title={prefs.theme === 'dark' ? 'Mode jour' : 'Mode nuit'}
        >
          {prefs.theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>

      {page === 'voyages' && (
        <TripsPage trips={state.trips} today={today} update={(fn) => setState((s) => ({ ...s, trips: fn(s.trips) }))} />
      )}

      {page === 'courses' && (
        <ShoppingPage
          shopping={shopping}
          update={updateShopping}
          recipes={
            <RecipesPage
              recipes={state.recipes}
              shopping={shopping}
              onSave={(recipe) =>
                setState((s) => ({
                  ...s,
                  recipes: s.recipes.some((r) => r.id === recipe.id)
                    ? s.recipes.map((r) => (r.id === recipe.id ? recipe : r))
                    : [...s.recipes, recipe],
                }))
              }
              onDelete={(id) => setState((s) => ({ ...s, recipes: s.recipes.filter((r) => r.id !== id) }))}
              updateShopping={updateShopping}
            />
          }
        />
      )}

      {page === 'today' && (
        <div className="swipe-area" {...todaySwipe}>
          <div className="tabs view-switch" role="tablist">
            <button role="tab" aria-selected={todayView === 'today'} onClick={() => setTodayView('today')}>
              ☀️ Today
            </button>
            <button role="tab" aria-selected={todayView === 'habits'} onClick={() => setTodayView('habits')}>
              🔁 Habits
              {habitsLeft > 0 && <span className="tab-badge">{habitsLeft}</span>}
            </button>
          </div>

          <div key={todayView} className="tab-content">
            {todayView === 'habits' ? (
              <HabitsView
                habits={habits}
                today={today}
                update={(fn) => setState((s) => ({ ...s, habits: fn({ ...EMPTY_HABITS, ...s.habits }) }))}
              />
            ) : (
              <TodayPage
                rows={todayRows}
                suggestions={suggestions}
                daily={dailyRows}
                onOpenTask={(task) => {
                  window.location.hash = taskLink(task.title)
                }}
                onReorderDaily={(ids) => setState((s) => ({ ...s, dailyOrder: ids }))}
                today={today}
                progress={state.progress}
                onToggleDone={toggleDone}
                onRemove={toggleToday}
                onAdd={toggleToday}
                onReorder={reorderToday}
                candidates={rows.filter((r) => !r.hidden && !state.today.ids.includes(r.task.id))}
                onCreate={(title) =>
                  setEditing({ defaults: { title, category: 'autre', frequency: 'once' }, addToToday: true })
                }
              />
            )}
          </div>
        </div>
      )}

      {page === 'tasks' && (
        <>
          <Summary counts={counts} active={statusFilter} onSelect={setStatusFilter} />
          <Odometer value={state.odometer} onChange={setOdometer} />
          <Filters value={filters} onChange={setFilters} />
          <div className="list-toolbar">
            <button className="primary" onClick={() => setEditing({})}>
              + Nouvelle tâche
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="empty">
              <p>Aucune tâche pour l’instant. Crée les tiennes, ou pars des tâches d’entretien essentielles.</p>
              <button className="primary" onClick={addCatalog}>
                Ajouter les essentielles ({TASKS.length})
              </button>
            </div>
          ) : (
            groups.length === 0 && <p className="empty">Aucune tâche ne correspond.</p>
          )}

          {groups.map((g) => (
            <section key={g.key} className="group">
              <h2>
                {g.label} <span className="count">{g.rows.length}</span>
              </h2>
              <ul>
                {g.rows.map((r) => (
                  <TaskItem
                    key={r.task.id}
                    task={r.task}
                    record={r.record}
                    odometer={state.odometer?.km}
                    status={r.status}
                    today={today}
                    hidden={r.hidden}
                    onToggleDone={() => toggleDone(r.task)}
                    onSetLast={(d) => setLast(r.task, d)}
                    onEdit={() => setEditing({ task: r.task })}
                    onSetKm={(km) => setKm(r.task.id, km)}
                    onToggleHidden={() => toggleHidden(r.task.id)}
                    inToday={state.today.ids.includes(r.task.id)}
                    onToggleToday={() => toggleToday(r.task.id)}
                    checkedSubtasks={state.progress[r.task.id] ?? []}
                    onToggleSubtask={(subId) => toggleSubtask(r.task, subId)}
                  />
                ))}
              </ul>
            </section>
          ))}

          {!state.catalog && tasks.length > 0 && (
            <p className="footer-note">
              <button className="link" onClick={addCatalog}>
                Ajouter les tâches essentielles ({TASKS.length})
              </button>
            </p>
          )}

          {state.catalog && state.changes.deleted.length > 0 && (
            <p className="footer-note">
              {state.changes.deleted.length} tâche(s) par défaut supprimée(s) ·{' '}
              <button className="link" onClick={restoreDeleted}>
                Restaurer
              </button>
            </p>
          )}
        </>
      )}

      <BackupControls state={state} onRestore={(data) => replaceState(mergeDefaults(INITIAL_STATE, migrateState(data)))} />

      <VersionInfo />

      <TabBar page={page} todayLeft={todayLeft} shoppingLeft={shopping.items.filter((i) => !i.checked).length} />

      {editing && (
        <TaskForm
          task={editing.task}
          defaults={editing.defaults}
          canReset={!!editing.task && editing.task.id in state.changes.edited}
          onSave={saveTask}
          onDelete={() => editing.task && deleteTask(editing.task.id)}
          onReset={() => editing.task && resetTask(editing.task.id)}
          onClose={() => setEditing(null)}
        />
      )}
    </main>
  )
}
