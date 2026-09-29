import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http';
import app from '@adonisjs/core/services/app';
import * as Sentry from '@sentry/node';
import MaintenanceException from '#core/exceptions/maintenance_exception';
import { buildMaintenanceIndexPayload } from '#transport/core/helpers/i18n_payloads/maintenance_front';
import { I18nService } from '#transport/core/helpers/i18n_service';
import type { StatusPageRange, StatusPageRenderer } from '@adonisjs/core/types/http';

/**
 * Minimal shape of the Inertia view context the `@adonisjs/inertia`
 * middleware injects into `HttpContext`. Declared locally (rather than
 * relying on the package's type augmentation) so this handler still
 * type-checks in flavors where the whole Inertia stack is pruned — the
 * presence of `ctx.inertia` is detected at runtime instead.
 */
interface InertiaViewContext {
	inertia?: {
		render(page: string, data?: Record<string, unknown>): Promise<string>;
	};
}

export default class HttpExceptionHandler extends ExceptionHandler {
	/**
	 * In debug mode, the exception handler will display verbose errors
	 * with pretty printed stack traces.
	 * Only enabled in local development (NODE_ENV=development).
	 */
	protected debug = app.inDev;

	/**
	 * Status pages are used to display a custom HTML pages for certain error
	 * codes. You might want to enable them in production only, but feel
	 * free to enable them in development as well.
	 */
	protected renderStatusPages = app.inProduction;

	/**
	 * Status pages is a collection of error code range and a callback
	 * to return the HTML contents to send as a response.
	 *
	 * When the Inertia view layer is present, non-JSON requests are rendered
	 * through the configured error pages. Headless flavors (and any request
	 * reaching here without an Inertia context) get a JSON body instead.
	 */
	protected statusPages: Record<StatusPageRange, StatusPageRenderer> = {
		'404': (_, ctx) => {
			const inertiaView = (ctx as unknown as InertiaViewContext).inertia;

			if (inertiaView) {
				return inertiaView.render('errors/not_found', {});
			}

			return ctx.response.status(404).send({
				error: { code: 'E_ROUTE_NOT_FOUND', message: 'Route not found' },
			});
		},
		'500..599': (_, ctx) => {
			const inertiaView = (ctx as unknown as InertiaViewContext).inertia;

			if (inertiaView) {
				return inertiaView.render('errors/server_error', {});
			}

			return ctx.response.status(500).send({
				error: { code: 'E_INTERNAL_SERVER_ERROR', message: 'Internal server error' },
			});
		},
	};

	/**
	 * The method is used for handling errors and returning
	 * response to the client
	 */
	async handle(error: unknown, ctx: HttpContext) {
		if (error instanceof MaintenanceException) {
			return this.handleMaintenance(error, ctx);
		}

		return super.handle(error, ctx);
	}

	/**
	 * Renders the 503 maintenance response: the Inertia front maintenance page
	 * for browser requests, a JSON body for JSON API clients, `/api/*`
	 * requests, and headless flavors without an Inertia context.
	 *
	 * The HTML is written explicitly to the response because the exception
	 * handler pipeline discards the return value of custom handlers — it only
	 * works for statusPages renderers where ExceptionHandler internally calls
	 * response.send() with the result.
	 */
	protected async handleMaintenance(error: MaintenanceException, ctx: HttpContext) {
		const { request, response, i18n } = ctx;

		const inertiaView = (ctx as unknown as InertiaViewContext).inertia;

		if (request.wantsJSON() || request.url().startsWith('/api/') || !inertiaView) {
			return response.status(503).send({
				error: {
					code: error.code,
					type: 'maintenance',
					message: error.message,
					retryAfter: error.retryAfter,
					...(app.inDev && { stack: error.stack }),
				},
			});
		}

		const i18nService = new I18nService(i18n);

		const html = await inertiaView.render('maintenance/front/index', {
			message: error.message,
			retryAfter: error.retryAfter,
			redirectPath: request.url(),
			translations: buildMaintenanceIndexPayload(i18nService),
		});

		return response.status(503).type('html').send(html);
	}

	/**
	 * The method is used to report error to the logging service or
	 * the a third party error monitoring service.
	 *
	 * @note You should not attempt to send a response from this method.
	 */
	async report(error: unknown, ctx: HttpContext) {
		if (this.shouldReport(error as any)) {
			Sentry.captureException(error);
		}

		return super.report(error, ctx);
	}
}
