import { defineConfig } from 'vitest/config'
import path from 'node:path'

/**
 * Minimal Vitest setup for frontend seams: deterministic, framework-free
 * helpers under `inertia/components/` (e.g. `cloneBlock`), plus Inertia page
 * specs under `inertia/pages/` that pin conditional-rendering contracts.
 * Page specs opt into jsdom individually via a `// @vitest-environment
 * jsdom` docblock, so helper specs keep the fast node environment.
 * Everything else (flows, real rendering) stays with the Japa browser
 * E2E suite.
 */
export default defineConfig({
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'inertia'),
      '@generated': path.resolve(__dirname, '.adonisjs/client'),
      '#types': path.resolve(__dirname, 'app/types'),
    },
  },
  test: {
    environment: 'node',
    include: ['inertia/components/**/*.spec.ts', 'inertia/pages/**/*.spec.tsx'],
  },
})
