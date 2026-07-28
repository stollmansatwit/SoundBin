import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Empty prefix loads *all* variables from .env (not just VITE_ ones) so the
  // dev-server port can be configured there too. Note this only affects the
  // config below — Vite still only ships VITE_-prefixed values to the browser.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: Number(env.PORT) || 5173,
      // Listen on all interfaces so the Docker container is reachable from the host.
      host: true,
    },
  }
})
