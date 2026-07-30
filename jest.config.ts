import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  moduleDirectories: ['node_modules', __dirname],
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Raw `.sql` imports (see next.config.js's asset/source webpack rule) need
  // their own transform since Jest doesn't go through webpack.
  transform: {
    '^.+\\.sql$': '<rootDir>/jest.sql-transformer.js',
  },
  // Playwright e2e specs (e2e/**/*.spec.ts) use @playwright/test, not Jest — exclude
  // them so Jest doesn't try to run them as unit tests.
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config)