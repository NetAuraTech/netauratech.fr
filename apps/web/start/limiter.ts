/*
|--------------------------------------------------------------------------
| Define HTTP limiters
|--------------------------------------------------------------------------
|
| The "limiter.define" method creates an HTTP middleware to apply rate
| limits on a route or a group of routes. Feel free to define as many
| throttle middleware as needed.
|
*/

import app from '@adonisjs/core/services/app';
import limiter from '@adonisjs/limiter/services/main';
import env from '#start/env';
import type { errors } from '@adonisjs/limiter';

/**
 * Custom handler applied to every limiter's `limitExceeded` hook so 429s
 * always render the app JSON error envelope (`{ error: { code, message,
 * details } }`) and a flash-backed redirect for browser requests.
 */
const onLimitExceeded = (error: errors.ThrottleException) => {
	error.handle = async (throttleError, ctx): Promise<void> => {
		const { request, response, session, i18n } = ctx;

		const message = i18n.t(`exceptions.${error.code}`, {
			limit: throttleError.response.limit,
			remaining: throttleError.response.remaining,
			availableIn: Math.ceil(throttleError.response.availableIn / 60),
		});

		const limitHeaders = error.getDefaultHeaders();
		Object.entries(limitHeaders).forEach(([key, value]) => response.header(key, value));

		if (request.wantsJSON()) {
			return response.status(error.status).send({
				error: {
					code: error.code,
					message: message,
					details: {
						limit: throttleError.response.limit,
						remaining: throttleError.response.remaining,
						availableIn: Math.ceil(throttleError.response.availableIn / 60),
					},
					...(app.inDev && { stack: error.stack }),
				},
			});
		}

		session.flash('error', message);
		return response.redirect().back();
	};
};

export const throttle = (max: number = 10, limit: string | number = '1 minute') =>
	limiter.define('global', () => {
		return limiter.allowRequests(max).every(limit).limitExceeded(onLimitExceeded);
	});

/**
 * Per-API-client rate limiter applied to every authenticated `/api/v1/*`
 * route group on top of the shared `throttle` login budget.
 *
 * The key is the authenticated user id (never the raw IP), so each client
 * gets its own budget across the whole API surface. The allowed requests per
 * minute come from the user's `apiRateLimit` column, falling back to the
 * `API_RATE_LIMIT_DEFAULT` env value.
 */
export const apiClientThrottle = () =>
	limiter.define('api_client', (ctx) => {
		const user = ctx.auth?.user;
		const maxRequests = user?.apiRateLimit ?? env.get('API_RATE_LIMIT_DEFAULT', 60);

		return limiter
			.allowRequests(maxRequests)
			.every('1 minute')
			.usingKey(`user_${user?.id ?? ctx.request.ip()}`)
			.limitExceeded(onLimitExceeded);
	});
