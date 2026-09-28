/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Defaults to a locally-run backend. Set VITE_BACKEND_URL to the
      // compose network hostname when running via docker compose
      // (e.g. `http://backend:3000`).
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:3000',
        rewrite: (path) => path.replace(/^\/api/, ''),
        // Accessibility audits (see
        // .github/workflows/frontend-and-auth-accessibility.yml) run the
        // backend directly, without Traefik in front to inject a real
        // X-Auth-User-Id from a logged-in session -- so a seeded board is
        // otherwise invisible (every route needing it would 401). Opt-in
        // only: unset in dev and prod, where Traefik's ForwardAuth is the
        // real thing being tested and must not be short-circuited.
        configure: (proxy) => {
          const fakeUserId = process.env.VITE_A11Y_FAKE_AUTH_USER_ID;
          if (!fakeUserId) return;
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('X-Auth-User-Id', fakeUserId);
          });
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{ts,tsx}'],
    },
  },
})
