import { inject } from '@adonisjs/core';
import { buildHomePayload } from '#transport/core/helpers/i18n_payloads/home';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';
import type { HttpContext } from '@adonisjs/core/http';

/**
 * Serves the hand-written home page of the public front.
 *
 * The `inertia` flavor ships a minimal hand-written front instead of the CMS
 * page renderer: this controller is the canonical entry point a developer
 * opens to start building their own pages. It renders a blank Inertia page so
 * the front boots end-to-end (layout, shared props, fonts) with nothing else
 * to remove.
 */
@inject()
export default class HomeController {
	constructor(protected i18n: I18nService) {}

	/**
	 * `GET /` — renders the blank home page as `core.home.render`.
	 *
	 * @returns The Inertia-rendered `core/front/home` page.
	 */
	async render({ inertia }: HttpContext) {
		return renderInertiaPage(inertia, 'core/front/home', {
			translations: buildHomePayload(this.i18n),
		});
	}
}
