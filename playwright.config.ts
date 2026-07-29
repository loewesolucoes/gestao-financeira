import { defineConfig, devices } from '@playwright/test';

// Kept as its own constant (not imported from next.config.js) since that file computes
// basePath conditionally at Next's build time based on NODE_ENV. Source of truth for the
// real value is next.config.js's `basePath = isDev ? '' : '/gestao-financeira'`.
const basePath = '/gestao-financeira';
const port = 4173;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Each worker boots its own sql.js/localforage instance under real browser load; capping
  // parallelism (esp. in CI's more limited runners) avoids resource-contention timeouts
  // seen with the default worker count derived from CPU cores.
  workers: process.env.CI ? 2 : 4,
  timeout: 45_000,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    // Trailing slash matters: relative goto('caixa') resolves against baseURL as a
    // directory only when baseURL itself ends in '/' (WHATWG URL resolution rules) —
    // without it, page.goto('/caixa') would silently drop the basePath segment.
    baseURL: `http://127.0.0.1:${port}${basePath}/`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    // Builds the real static export and serves it exactly as GitHub Pages would
    // (basePath included), so the suite catches basePath-only regressions.
    command: 'npm run build && node e2e/static-server.mjs',
    url: `http://127.0.0.1:${port}${basePath}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // AuthProvider (src/app/contexts/auth.tsx) throws at module-load time if these are
      // unset, which breaks static export prerendering. Smoke tests never exercise the
      // Google Drive OAuth flow (see spec's non-goals), so dummy values are sufficient
      // here; real CI runs can still override via actual secrets when present.
      NEXT_PUBLIC_API_KEY: process.env.NEXT_PUBLIC_API_KEY || 'TEST_NEXT_PUBLIC_API_KEY',
      NEXT_PUBLIC_CLIENT_ID: process.env.NEXT_PUBLIC_CLIENT_ID || 'TEST_NEXT_PUBLIC_CLIENT_ID',
      PORT: String(port),
    },
  },
});
