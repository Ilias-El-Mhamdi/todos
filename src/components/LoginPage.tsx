import { useState } from 'react'
import type { FormEvent } from 'react'
import { apiFetch, setToken } from '../lib/api'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const login = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { token } = await apiFetch<{ token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      setToken(token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible')
      setBusy(false)
    }
  }

  return (
    <main className="app login-page">
      <form className="login-card" onSubmit={login}>
        <h1>Connexion</h1>
        <label>
          Utilisateur
          <input autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          Mot de passe
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="primary" disabled={busy}>
          {busy ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
      <HashTool />
    </main>
  )
}

/** Account setup helper: hashes a password so it can be inserted by hand into the "User" table. */
function HashTool() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [hash, setHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generate = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const res = await apiFetch<{ hash: string }>('/auth/hash', { method: 'POST', body: JSON.stringify({ password }) })
      setHash(res.hash)
    } catch (err) {
      setHash(null)
      setError(err instanceof Error ? err.message : 'Erreur')
    }
  }

  const sql = hash && `INSERT INTO "User" (username, "passwordHash") VALUES ('${username.replaceAll("'", "''")}', '${hash}');`

  return (
    <details className="login-card hash-tool">
      <summary>Créer le compte (générer un hash)</summary>
      <form onSubmit={generate}>
        <label>
          Utilisateur
          <input autoComplete="off" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          Mot de passe <span className="hint">(8 caractères min.)</span>
          <input
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="secondary">
          Générer
        </button>
        {sql && (
          <>
            <p className="hint">À exécuter dans le SQL Editor de Neon (base todos) :</p>
            <textarea readOnly rows={5} value={sql} onFocus={(e) => e.target.select()} />
            <button type="button" className="secondary" onClick={() => navigator.clipboard.writeText(sql)}>
              Copier
            </button>
          </>
        )}
      </form>
    </details>
  )
}
