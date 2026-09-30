import { inject } from '@adonisjs/core';
import { resolveProjectCovers } from '#core/services/project_covers';
import { SiteContentService } from '#core/services/site_content_service';
import { FindFileAction } from '#file/actions/file/find_file_action';
import { buildHomePayload } from '#transport/core/helpers/i18n_payloads/home';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';
import type { HttpContext } from '@adonisjs/core/http';

/**
 * Serves the hand-written home page of the public front.
 *
 * The home page is content-driven: services and projects come from the
 * committed markdown sources in `content/`, parsed by {@link SiteContentService}
 * into the JSON payload the Inertia page consumes. Project covers are resolved
 * server-side against the backend file module.
 */
@inject()
export default class HomeController {
	constructor(
		protected i18n: I18nService,
		protected siteContent: SiteContentService,
		protected findFile: FindFileAction,
	) {}

	/**
	 * `GET /` — renders the home page as `core.home.render` with the content
	 * catalogue, the resolved project covers and the translated labels.
	 *
	 * @returns The Inertia-rendered `core/front/home` page.
	 */
	async render({ inertia }: HttpContext) {
		const content = await this.siteContent.getHomeContent();

		return renderInertiaPage(inertia, 'core/front/home', {
			translations: buildHomePayload(this.i18n),
			services: content.services,
			projects: await resolveProjectCovers(content.projects, this.findFile),
		});
	}
}
