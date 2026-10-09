import { inject } from '@adonisjs/core';
import legalConfig from '#config/legal';
import { buildMentionsPayload } from '#transport/core/helpers/i18n_payloads/mentions';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';
import type { HttpContext } from '@adonisjs/core/http';

/**
 * Serves the hand-written legal notices page of the public front.
 *
 * The page is static: the editor, hosting and intellectual-property notices
 * are written in the Inertia page itself; only the structural labels are
 * resolved through the i18n payload. The publisher identity is resolved from
 * the `LEGAL_*` environment variables (see `config/legal.ts`).
 */
@inject()
export default class MentionsController {
	constructor(protected i18n: I18nService) {}

	/**
	 * `GET /mentions-legales` — renders the legal notices page as
	 * `core.mentions.render` with the resolved labels and publisher identity.
	 *
	 * @returns The Inertia-rendered `core/front/mentions` page.
	 */
	async render({ inertia }: HttpContext) {
		return renderInertiaPage(inertia, 'core/front/mentions', {
			translations: buildMentionsPayload(this.i18n),
			identity: legalConfig.identity,
		});
	}
}
