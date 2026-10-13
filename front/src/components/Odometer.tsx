import { useState, type FormEvent } from 'react'

interface Props {
  value: { km: number; date: string } | undefined
  onChange: (km: number) => void
}

export function Odometer({ value, onChange }: Props) {
  const [draft, setDraft] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const km = Number(draft.replace(/\s/g, ''))
    if (!Number.isFinite(km) || km <= 0) return
    onChange(Math.round(km))
    setDraft('')
  }

  return (
    <form className="odometer" onSubmit={submit}>
      <span className="odometer-label">
        🚗 Compteur Yaris
        <strong>{value ? `${value.km.toLocaleString('fr-FR')} km` : 'non renseigné'}</strong>
        {value && (
          <span className="odometer-date">
            relevé le {new Date(`${value.date}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        )}
      </span>
      <span className="odometer-input">
        <input
          inputMode="numeric"
          placeholder="Nouveau relevé (km)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Kilométrage actuel"
        />
        <button type="submit" disabled={!draft.trim()}>
          OK
        </button>
      </span>
    </form>
  )
}
