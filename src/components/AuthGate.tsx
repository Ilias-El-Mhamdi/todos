import { useEffect, useState } from 'react'
import App from '../App'
import { AUTH_EVENT, getToken } from '../lib/api'
import { LoginPage } from './LoginPage'

export function AuthGate() {
  const [loggedIn, setLoggedIn] = useState(() => getToken() !== null)

  useEffect(() => {
    const onAuth = () => setLoggedIn(getToken() !== null)
    window.addEventListener(AUTH_EVENT, onAuth)
    return () => window.removeEventListener(AUTH_EVENT, onAuth)
  }, [])

  return loggedIn ? <App /> : <LoginPage />
}
