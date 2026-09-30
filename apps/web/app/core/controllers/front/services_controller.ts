import { inject } from '@adonisjs/core';
import { SiteContentService } from '#core/services/site_content_service';
import { buildServicesPayload } from '#transport/core/helpers/i18n_payloads/services';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';
import type { HttpContext } from '@adonisjs/core/http';

/**
 * Serves the hand-written services page of the public front.
 *
 * The services page is content-driven: every offer comes from the committed
 * markdown sources in `content/services/`, parsed by {@link SiteContentService}
 * into the JSON payload the Inertia page consumes.
 */
@inject()
export default class ServicesController {
	constructor(
		protected i18n: I18nService,
		protected siteContent: SiteContentService,
	) {}

	/**
	 * `GET /services` — renders the services page as `core.services.render` with
	 * the service catalogue and the resolved translations.
	 *
	 * @returns The Inertia-rendered `core/front/services` page.
	 */
	async render({ inertia }: HttpContext) {
		const services = await this.siteContent.getServices();

		return renderInertiaPage(inertia, 'core/front/services', {
			translations: buildServicesPayload(this.i18n),
			services,
		});
	}
}
