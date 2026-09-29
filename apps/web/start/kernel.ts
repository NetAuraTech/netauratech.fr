/*
|--------------------------------------------------------------------------
| HTTP kernel file
|--------------------------------------------------------------------------
|
| The HTTP kernel file is used to register the middleware with the server
| or the router.
|
*/

import router from '@adonisjs/core/services/router';
import server from '@adonisjs/core/services/server';
import { assetMiddleware } from '#start/asset_middleware';

/**
 * The error handler is used to convert an exception
 * to a HTTP response.
 */
server.errorHandler(() => import('#transport/core/exceptions/handler'));

/**
 * The server middleware stack runs middleware on all the HTTP
 * requests, even if there is no route registered for
 * the request URL.
 */
server.use([
	() => import('#transport/core/middleware/container_bindings_middleware'),
	() => import('@adonisjs/static/static_middleware'),
	() => import('@adonisjs/cors/cors_middleware'),
	...assetMiddleware,
]);

/**
 * The router middleware stack runs middleware on all the HTTP
 * requests with a registered route.
 */
router.use([
	() => import('@adonisjs/core/bodyparser_middleware'),
	() => import('@adonisjs/session/session_middleware'),
	() => import('@adonisjs/shield/shield_middleware'),
	() => import('@adonisjs/auth/initialize_auth_middleware'),
	() => import('#transport/auth/middleware/silent_auth_middleware'),
	() => import('#transport/core/middleware/detect_user_locale_middleware'),
]);

/**
 * Named middleware collection must be explicitly assigned to
 * the routes or the routes group.
 */
export const middleware = router.named({
	role: () => import('#transport/identity/middleware/role_middleware'),
	permission: () => import('#transport/identity/middleware/permission_middleware'),
	guest: () => import('#transport/auth/middleware/guest_middleware'),
	auth: () => import('#transport/auth/middleware/auth_middleware'),
	maintenance: () => import('#transport/core/middleware/maintenance_middleware'),
});
