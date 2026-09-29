import '@scalar/api-reference/style.css';
import { createApiReference } from '@scalar/api-reference';

// Standalone, self-hosted OpenAPI reference. It is its own Vite entry point
// (registered in `vite.config.ts`) rendered from `resources/views/docs.edge`,
// and is deliberately not part of the Inertia app: no router, no shared props,
// no app layout. The document is fetched client-side from the generated spec
// route, so the page ships no API data — only the viewer.
createApiReference('#scalar-app', {
	url: '/api/v1/openapi.json',
	title: 'AdonisJS Foundry API',
});
