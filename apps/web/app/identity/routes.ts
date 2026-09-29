/*
|--------------------------------------------------------------------------
| Identity routes
|--------------------------------------------------------------------------
|
| Identity domain surface entry — mirrors `start/routes.ts`: each surface
| self-registers on import, co-located with the controllers it binds, and
| gates itself on its feature flag. The admin Inertia surface (session
| guard) and the versioned REST API (access-token guard) live under
| `controllers/`. Public URLs are unchanged from the previous `auth`
| placement: `/admin/{users,roles,permissions}` and
| `/api/v1/admin/{users,roles,permissions}`.
|
*/

import '#transport/identity/controllers/admin/routes';
import '#transport/identity/controllers/api/routes';
