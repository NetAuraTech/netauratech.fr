/*
|--------------------------------------------------------------------------
| File routes
|--------------------------------------------------------------------------
|
| File domain surface entry — mirrors `start/routes.ts`: each surface
| self-registers on import, co-located with the controllers it binds, and
| gates itself on its feature flag. The admin Inertia surface (session
| guard) and the versioned REST API (access-token guard) live under
| `controllers/`. Public URLs are unchanged from the previous
| `start/routes` placement: `/admin/files{,/folders}` and
| `/api/v1/admin/{files,folders}`.
|
*/

import '#transport/file/controllers/admin/routes';
import '#transport/file/controllers/api/routes';
