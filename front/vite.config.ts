import { execSync } from 'node:child_process'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Commit built: given by Cloudflare (Workers Builds or Pages) at build time, else the local checkout.
function currentCommit(): string {
  const ci = process.env.WORKERS_CI_COMMIT_SHA ?? process.env.CF_PAGES_COMMIT_SHA
  if (ci) return ci
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'inconnu'
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify({ commit: currentCommit(), builtAt: new Date().toISOString() }),
  },
})
