/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| Route module index — each domain registers its own routes.
| Feature flags in config/features.ts gate each module at runtime.
|
| The `inertia` flavor ships a hand-written front: the home page and error
| pages are served by `front.*` controllers registered here, alongside the
| core SEO endpoints and the admin back-office.
*/

import features from '#config/features'
import router from '@adonisjs/core/services/router'
import { enabledAuthGuards } from '#config/auth'
import { registerAuthRoutes } from '#start/routes/auth.routes'
import { registerSettingsRoutes } from '#start/routes/settings.routes'
import { registerAdminRoutes } from '#start/routes/admin.routes'
import { registerAdminRestApiRoutes } from '#start/routes/admin_rest_api.routes'
import { registerCorePublicRoutes } from '#start/routes/core_public.routes'
import { registerFrontRoutes } from '#start/routes/front.routes'
import { registerApiRoutes } from '#start/routes/api.routes'
import { registerHealthRoutes } from '#start/routes/health.routes'
import { middleware } from '#start/kernel'

// Health routes are outside maintenance middleware (liveness/readiness probes)
registerHealthRoutes()

// Wrap all feature routes with maintenance middleware
// Health routes are registered separately above (outside this wrapper)

router
  .group(() => {
    // Core SEO endpoints (sitemap.xml, robots.txt) — flavor-independent.
    registerCorePublicRoutes()

    // Hand-written front (home + error pages) — replaces the CMS public front.
    registerFrontRoutes()

    if (features.auth) registerAuthRoutes()
    if (features.settings) registerSettingsRoutes()
    if (features.admin) registerAdminRoutes()
    if (features.adminApi) registerAdminRestApiRoutes()

    // Token-guarded identity/register REST API — only when the `api` guard
    // is enabled and the `adminApi` surface is on.
    if (features.adminApi && enabledAuthGuards.api) registerApiRoutes()
  })
  .use(features.maintenance ? middleware.maintenance() : [])
