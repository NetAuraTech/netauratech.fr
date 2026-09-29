/*
|--------------------------------------------------------------------------
| Log routes
|--------------------------------------------------------------------------
|
| Log domain surface entry — mirrors `start/routes.ts`: each surface
| self-registers on import, co-located with the controllers it binds, and
| gates itself on its feature flag. The admin Inertia surface (session
| guard) and the versioned REST API (access-token guard) live under
| `controllers/`. Public URLs are unchanged from the previous
| `start/routes` placement: `/admin/logs` and `/api/v1/admin/logs`.
|
*/

import '#transport/log/controllers/admin/routes';
import '#transport/log/controllers/api/routes';
