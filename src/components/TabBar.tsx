export type Page = 'today' | 'tasks' | 'courses' | 'voyages'

interface Props {
  page: Page
  todayLeft: number
  shoppingLeft: number
}

const Badge = ({ n }: { n: number }) => (n > 0 ? <span className="tab-badge">{n}</span> : null)

export function TabBar({ page, todayLeft, shoppingLeft }: Props) {
  return (
    <nav className="tab-bar" aria-label="Navigation">
      <a href="#/today" aria-current={page === 'today' ? 'page' : undefined}>
        <span className="tab-icon">☀️</span>
        <span>
          Today
          <Badge n={todayLeft} />
        </span>
      </a>
      <a href="#/tasks" aria-current={page === 'tasks' ? 'page' : undefined}>
        <span className="tab-icon">📋</span>
        <span>Tâches</span>
      </a>
      <a href="#/courses" aria-current={page === 'courses' ? 'page' : undefined}>
        <span className="tab-icon">🛒</span>
        <span>
          Courses
          <Badge n={shoppingLeft} />
        </span>
      </a>
      <a href="#/voyages" aria-current={page === 'voyages' ? 'page' : undefined}>
        <span className="tab-icon">🧳</span>
        <span>Voyages</span>
      </a>
    </nav>
  )
}
