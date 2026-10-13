import type { Status } from '../lib/frequency'
import { STATUS_LABELS } from '../lib/frequency'

const SHOWN: Status[] = ['en-retard', 'aujourdhui', 'bientot', 'jamais']

interface Props {
  counts: Record<Status, number>
  active: Status | null
  onSelect: (status: Status | null) => void
}

export function Summary({ counts, active, onSelect }: Props) {
  return (
    <div className="summary">
      {SHOWN.map((s) => (
        <button
          key={s}
          className={`stat stat-${s}${active === s ? ' active' : ''}`}
          onClick={() => onSelect(active === s ? null : s)}
          aria-pressed={active === s}
        >
          <span className="stat-value">{counts[s]}</span>
          <span className="stat-label">{STATUS_LABELS[s]}</span>
        </button>
      ))}
    </div>
  )
}
