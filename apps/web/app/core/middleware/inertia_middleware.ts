import { inject } from '@adonisjs/core';
import BaseInertiaMiddleware from '@adonisjs/inertia/inertia_middleware';
import { GetPreferencesAction } from '#account/actions/preferences/get_preferences_action';
import { DEFAULT_PREFERENCES } from '#account/types/preferences';
import { NavRegistry } from '#core/services/nav_registry';
import env from '#start/env';
import { buildCommonPayload } from '#transport/core/helpers/i18n_payloads/common';
import { I18nService } from '#transport/core/helpers/i18n_service';
import UserTransformer from '#transport/identity/transformers/user_transformer';
import type { AdminNavGroup } from '#core/types/nav';
import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';

@inject()
export default class InertiaMiddleware extends BaseInertiaMiddleware {
	constructor(
		private getPreferencesAction: GetPreferencesAction,
		private navRegistry: NavRegistry,
	) {
		super();
	}

	async share(ctx: HttpContext) {
		/**
		 * The share method is called everytime an Inertia page is rendered. In
		 * certain cases, a page may get rendered before the session middleware
		 * or the auth middleware are executed. For example: During a 404 request.
		 *
		 * In that case, we must always assume that HttpContext is not fully hydrated
		 * with all the properties
		 */
		const { auth } = ctx as Partial<HttpContext>;

		const user = auth?.user;

		await user?.load((loader) => {
			loader.load('role', (role) => {
				role.preload('permissions');
			});
		});

		const preferences = ctx.inertia.always(
			user ? await this.getPreferencesAction.execute({ user }) : DEFAULT_PREFERENCES,
		);

		const routeName = ctx.route?.name ?? '';
		const isAdmin = routeName.startsWith('admin.');

		/**
		 * Data shared with all Inertia pages. Make sure you are using
		 * transformers for rich data-types like Models.
		 */
		return {
			errors: ctx.inertia.always(this.getValidationErrors(ctx)),
			currentUser: ctx.inertia.always(user ? UserTransformer.transform(user.toDomain()) : undefined),
			preferences,
			csrfToken: ctx.request.csrfToken,
			app_name: env.get('APP_NAME'),
			app_url: env.get('APP_URL'),
			email: env.get('MAIL_FROM_ADDRESS'),
			common_translations: buildCommonPayload(new I18nService(ctx.i18n)),
			admin_menu: isAdmin ? this.buildAdminMenu(ctx) : undefined,
		};
	}

	/**
	 * First-class flash bag sent to every Inertia page under the top-level
	 * `flash` field (a sibling of `props`, not merged into them). Kept out of
	 * `share()` so flash messages are stripped from browser history and never
	 * replay when the user navigates back.
	 *
	 * Keys and types stay identical to the legacy shared `flash` prop so the
	 * existing toasts (`flash.error`, `flash.success`, `flash.info`) keep
	 * working.
	 */
	flash(ctx: HttpContext) {
		/**
		 * The session may not be hydrated yet (e.g. during a 404 render before
		 * the session middleware ran), so flash messages may be unavailable.
		 */
		const { session } = ctx as Partial<HttpContext>;

		/**
		 * Fetching the first error from the flash messages
		 */
		const errorsBag = session?.flashMessages.get('errorsBag') ?? {};
		const errorFromBag: string | undefined = Object.keys(errorsBag)
			.filter((code) => code !== 'E_VALIDATION_ERROR')
			.map((code) => errorsBag[code])[0];

		const success: string | undefined = session?.flashMessages.get('success');
		const info: string | undefined = session?.flashMessages.get('info');
		const error: string | undefined = session?.flashMessages.get('error') || errorFromBag;

		return {
			error,
			success,
			info,
		};
	}

	/**
	 * Compose the admin navigation shared with every admin page: the entries
	 * registered by each domain in `start/nav.ts`, grouped by category in
	 * registration order, with labels resolved in the request locale. Domains
	 * absent from the composition simply contribute no group.
	 */
	private buildAdminMenu(ctx: HttpContext): AdminNavGroup[] {
		const groups: AdminNavGroup[] = [];

		for (const [, entries] of this.navRegistry.entries()) {
			for (const entry of entries) {
				let group = groups.find((g) => g.category === entry.category);
				if (!group) {
					group = {
						category: entry.category,
						label: entry.category === 'no_category' ? null : ctx.i18n.t(`admin.category.${entry.category}`),
						entries: [],
					};
					groups.push(group);
				}
				group.entries.push({
					label: ctx.i18n.t(entry.label),
					icon: entry.icon,
					route: entry.route,
					routeParams: entry.routeParams,
					permission: entry.permission,
				});
			}
		}

		return groups;
	}

	async handle(ctx: HttpContext, next: NextFn) {
		await this.init(ctx);

		const output = await next();
		this.dispose(ctx);

		return output;
	}
}

declare module '@adonisjs/inertia/types' {
	type MiddlewareSharedProps = InferSharedProps<InertiaMiddleware>;
	export interface SharedProps extends MiddlewareSharedProps {}
}
