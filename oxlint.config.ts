import { defineConfig } from 'oxlint';

export default defineConfig({
	ignorePatterns: ['**/.adonisjs/**'],
	plugins: ['typescript', 'react'],
	rules: {
		'typescript/no-namespace': 'off',
		'react/rules-of-hooks': 'error',
		'react/jsx-no-target-blank': 'error',
	},
	overrides: [
		{
			// Business layer (src) never depends on the app delivery layer
			// (the `app/` transport tree): the BFF boundary guards against
			// HTTP details, not framework plumbing, so the shared
			// infrastructure aliases (#start, #config, #database, #generated,
			// #types) stay reachable from src. See docs/agents/models.md.
			// This path-scoped override is the reference mechanism.
			files: ['apps/web/src/**/*.{ts,tsx}'],
			rules: {
				'no-restricted-imports': [
					'error',
					{
						patterns: [
							{
								regex: '^#transport/',
								message: 'Business code under src must not depend on the app delivery layer.',
							},
							{
								regex: '^\\.\\./(?:\\.\\./)*app(?:/|$)',
								message: 'Business code under src must not escape the src tree to reach the app delivery layer.',
							},
						],
					},
				],
			},
		},
		{
			files: ['apps/web/inertia/**/*.{ts,tsx}'],
			rules: {
				'no-restricted-imports': [
					'error',
					{
						patterns: [
							{
								regex: '^#(?:generated|providers|database|factories|shared|tests|config)/',
								message:
									'Frontend code must not import backend modules. Shared imports belong in the #transport, #cms, #types and #start aliases and the domain business-layer aliases.',
							},
							{
								regex: '^\\.\\./(\\.\\./)*app(?:/|$)',
								message: 'Frontend code must not escape the frontend tree to reach backend modules.',
							},
						],
					},
				],
			},
		},
		{
			// The design-system package is a consumer, never a depender, of the
			// app. It has no knowledge of the app's aliases or layout, so any
			// import that reaches the app (via a #* alias or a relative escape)
			// is a boundary violation. The package's own tsconfig/bundler
			// resolution is the second gate: it cannot resolve app aliases.
			files: ['packages/design-system/**/*.{ts,tsx}'],
			rules: {
				'no-restricted-imports': [
					'error',
					{
						patterns: [
							{
								regex: '^#',
								message:
									'The design-system package must not import app modules via #* aliases; it is a standalone package with no app aliases.',
							},
							{
								regex: '^(?:\\.\\./)+apps(?:/|$)',
								message: 'The design-system package must not escape the package tree to reach the app.',
							},
							{
								regex: '^apps(?:/|$)',
								message: 'The design-system package must not import from the app tree.',
							},
							{
								regex: '^(?:\\.\\./)+tooling(?:/|$)',
								message: 'The design-system package must not import from the repo tooling.',
							},
						],
					},
				],
			},
		},
	],
});
