import { readFileSync } from 'node:fs';
import adonisjs from '@adonisjs/vite/client';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
	version: string;
};

export default defineConfig(({ mode }) => {
	// Sentry web values are inlined at build time so the browser bundle reads
	// the same `SENTRY_DSN` as the Node runtime. Real environment variables win
	// (CI / production inject them); otherwise fall back to the `.env` file via
	// Vite's own loader, which is independent of the Adonis env-loading order.
	// `SENTRY_RELEASE` overrides the release tag; it defaults to the app version.
	const env = loadEnv(mode, import.meta.dirname, ['SENTRY_']);
	const sentryDsn = process.env.SENTRY_DSN || env.SENTRY_DSN || '';
	const appRelease = `foundry-${process.env.SENTRY_RELEASE || env.SENTRY_RELEASE || packageJson.version}`;

	return {
		define: {
			'import.meta.env.SENTRY_DSN': JSON.stringify(sentryDsn),
			'import.meta.env.APP_RELEASE': JSON.stringify(appRelease),
		},

		plugins: [
			react(),
			adonisjs({
				entryPoints: ['inertia/app.tsx', 'inertia/docs.tsx'],
				serverEntryPoints: ['inertia/ssr.tsx'],
				reload: ['resources/views/**/*.edge'],
			}),
			tailwindcss(),
		],

		resolve: {
			alias: {
				'~/': `${import.meta.dirname}/inertia/`,
				'@generated': `${import.meta.dirname}/.adonisjs/client/`,
			},
			dedupe: ['react', 'react-dom'],
		},

		server: {
			watch: {
				ignored: ['**/storage/**', '**/tmp/**'],
			},
			allowedHosts: [new URL(process.env.APP_URL ?? 'http://localhost:3333').hostname],
		},

		build: {
			chunkSizeWarningLimit: 1000,
		},
	};
});
