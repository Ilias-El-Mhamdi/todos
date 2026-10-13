import { readLocal, writeLocal } from './storage'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const TOKEN_KEY = 'entretien.token'
export const AUTH_EVENT = 'entretien:auth'

export class UnauthorizedError extends Error {}

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, message: string, body: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

export function getToken(): string | null {
  return readLocal<string | null>(TOKEN_KEY, null)
}

export function setToken(token: string | null) {
  writeLocal(TOKEN_KEY, token ?? undefined)
  window.dispatchEvent(new Event(AUTH_EVENT))
}

/** JSON call to the back. A 401 on an authenticated call drops the token, which sends the app back to login. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(API_URL + path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })
  if (res.status === 401) {
    if (token) setToken(null)
    throw new UnauthorizedError('Identifiants invalides')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const message = body?.message
    throw new ApiError(res.status, Array.isArray(message) ? message.join(', ') : (message ?? `Erreur ${res.status}`), body)
  }
  return res.json()
}
