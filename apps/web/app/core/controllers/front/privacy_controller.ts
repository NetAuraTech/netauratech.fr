import { inject } from '@adonisjs/core';
import legalConfig from '#config/legal';
import { buildPrivacyPayload } from '#transport/core/helpers/i18n_payloads/privacy';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';
import type { HttpContext } from '@adonisjs/core/http';

/**
 * Serves the hand-written privacy policy page of the public front.
 *
 * The page is static: the data-collection, retention and rights notices are
 * written in the Inertia page itself; only the structural labels are
 * resolved through the i18n payload. The data-controller identity and the
 * revision date are resolved from the `LEGAL_*` environment variables
 * (see `config/legal.ts`).
 */
@inject()
export default class PrivacyController {
	constructor(protected i18n: I18nService) {}

	/**
	 * `GET /politique-de-confidentialite` — renders the privacy policy page as
	 * `core.privacy.render` with the resolved labels and data-controller
	 * identity.
	 *
	 * @returns The Inertia-rendered `core/front/privacy` page.
	 */
	async render({ inertia }: HttpContext) {
		return renderInertiaPage(inertia, 'core/front/privacy', {
			translations: buildPrivacyPayload(this.i18n),
			identity: legalConfig.identity,
			privacyUpdatedAt: legalConfig.privacyUpdatedAt,
		});
	}
}
