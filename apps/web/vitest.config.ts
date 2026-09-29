import path from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Minimal Vitest setup for frontend seams: deterministic, framework-free
 * helpers under `inertia/components/` (e.g. `cloneBlock`), `inertia/helpers/`
 * (e.g. the authorization checks) and `inertia/lib/` (e.g. the Sentry PII
 * scrubbing), pure functions under `inertia/hooks/` (e.g. nav-link
 * active-state matching), plus Inertia page
 * specs under `inertia/pages/` that pin conditional-rendering contracts.
 * Page specs opt into jsdom individually via a `// @vitest-environment
 * jsdom` docblock, so helper specs keep the fast node environment.
 * Everything else (HTTP flows, auth, server side-effects) is covered by
 * the Japa functional suite (`@japa/api-client`).
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
		include: [
			'inertia/components/**/*.spec.ts',
			'inertia/components/**/*.spec.tsx',
			'inertia/helpers/**/*.spec.ts',
			'inertia/hooks/**/*.spec.ts',
			'inertia/lib/**/*.spec.ts',
			'inertia/pages/**/*.spec.tsx',
		],
	},
});
