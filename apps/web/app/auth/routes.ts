/*
|--------------------------------------------------------------------------
| Auth routes
|--------------------------------------------------------------------------
|
| Auth domain surface entry — mirrors `start/routes.ts`: each surface
| self-registers on import, co-located with the controllers it binds, and
| gates itself on its feature flag. The guest/session front surface
| (`/login`, `/register`, `/forgot-password`, `/reset-password`,
| `/accept-invitation`, `/logout`, `/verify`, `/oauth`) is gated by the
| `auth` feature flag; the token API surface (`/api/v1/auth/*`) additionally
| requires the `api` access-token guard. Public URLs are unchanged.
|
*/

import '#transport/auth/controllers/front/routes';
import '#transport/auth/controllers/api/routes';
