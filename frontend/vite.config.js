/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        // Defaults to a locally-run backend. Set VITE_BACKEND_URL to the
        // compose network hostname when running via docker compose
        // (e.g. `http://backend:3000`).
        target: process.env.VITE_BACKEND_URL || 'http://localhost:3000',
        rewrite: (path) => path.replace(/^\/api/, ''),
        // FAKE_AUTH_USER_ID (see README.md#authentication): backend requires
        // an X-Auth-User-Id header that in the real stack only Traefik's
        // ForwardAuth ever sets, after a real login. Set this to inject a
        // fixed one instead, for any workflow that talks to a directly-run
        // backend without Traefik in front -- running `npm run dev`/`npm run
        // preview` standalone against a local backend, or the CI
        // accessibility audits (frontend-and-auth-accessibility.yml), which
        // seed a project under a matching id specifically to be visible this
        // way. Unset by default, including through docker compose: that path
        // goes through Traefik like production does, and the login gate
        // being bypassed here is exactly the thing meant to be exercised
        // there.
        //
        // `configure` runs once, when Vite builds this proxy at server
        // startup -- not per request. Reading the env var here and
        // registering (or not) the `proxyReq` listener happens exactly once;
        // with FAKE_AUTH_USER_ID unset, the listener is never registered at
        // all, so there's no per-request check to skip, and no code from
        // this block runs on any request. None of this executes in a
        // production build regardless: `server.proxy` is a dev/preview-only
        // Vite feature, never part of the built bundle Traefik/nginx serves.
        configure: (proxy) => {
          const fakeUserId = process.env.FAKE_AUTH_USER_ID;
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
