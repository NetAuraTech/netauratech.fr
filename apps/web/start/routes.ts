/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| Route module index — each domain registers its own routes.
| Feature flags in config/features.ts gate each module at runtime.
|
| The `inertia` flavor ships a hand-written front: the core home route is
| registered here (it is dead on `main`, where the CMS page home serves
| the site root), alongside the self-registering core surfaces (SEO,
| admin, API) and the admin back-office.
*/

// Auth, identity, account, file, log and core routes self-register on import (feature-gated inside the modules).
import '#transport/account/routes';
import '#transport/auth/routes';
import '#transport/file/routes';
import '#transport/identity/routes';
import '#transport/log/routes';
import router from '@adonisjs/core/services/router';
import features from '#config/features';
import { middleware } from '#start/kernel';
import { registerCoreHealthRoutes } from '#transport/core/health.routes';
import { registerCoreHomeRoute } from '#transport/core/routes';

// Health routes are outside maintenance middleware (liveness/readiness probes)
registerCoreHealthRoutes();

// Wrap all feature routes with maintenance middleware
// Health routes are registered separately above (outside this wrapper)

router
	.group(() => {
		// Hand-written front (home + error pages) — replaces the CMS public front.
		registerCoreHomeRoute();
	})
	.use(features.maintenance ? middleware.maintenance() : []);
