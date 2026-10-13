import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthGate } from './components/AuthGate.tsx'

// Offline app shell (production only: in dev it would cache Vite's modules and fight HMR).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js'))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthGate />
  </StrictMode>,
)
