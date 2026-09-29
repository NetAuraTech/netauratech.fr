/*
|--------------------------------------------------------------------------
| View-layer asset middleware composition
|--------------------------------------------------------------------------
|
| The server middleware for the browser asset pipeline (Vite + Inertia).
| This file is part of the composition set that flavor manifests may
| rewrite: the `api` flavor drops the whole Inertia/Vite stack and replaces
| this array with `[]`, so `start/kernel.ts` can keep a single unconditional
| reference without pulling the pruned packages into the type graph.
|
*/

export const assetMiddleware = [
	() => import('@adonisjs/vite/vite_middleware'),
	() => import('#transport/core/middleware/inertia_middleware'),
];
