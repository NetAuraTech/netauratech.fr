/*
|--------------------------------------------------------------------------
| Account routes
|--------------------------------------------------------------------------
|
| Account domain surface entry — mirrors `start/routes.ts`: each surface
| self-registers on import, co-located with the controllers it binds, and
| gates itself on its feature flag. The session self-service front surface
| (`/settings/*`) is gated by the `settings` feature flag; the token API
| surface (`/api/v1/{profile,account}`) and the admin theme preference
| endpoint (`/api/v1/admin/preferences/theme`) are gated by the `adminApi`
| feature flag (the token API additionally requires the `api` access-token
| guard). Public URLs are unchanged.
|
*/

import '#transport/account/controllers/front/routes';
import '#transport/account/controllers/api/routes';
