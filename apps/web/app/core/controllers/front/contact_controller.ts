import { inject } from '@adonisjs/core';
import { SendContactFormAction } from '#core/actions/contact/send_contact_form_action';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { stripEmptyStrings } from '#transport/core/helpers/strip_empty_strings';
import { ContactFormValidator } from '#transport/core/validators/contact_form';
import type { HttpContext } from '@adonisjs/core/http';

/**
 * Front contact-form controller.
 *
 * Execute-only endpoint: the shared `contact_form` organism of every public
 * page posts here, the submission is validated and relayed by
 * {@link SendContactFormAction} as a notification mail to the site address —
 * nothing is written to the database.
 *
 * The controller follows the app's standard form contract: on success it
 * flashes a `success` message and redirects the visitor back to the page that
 * submitted the form (the front layout toasts the flash); on validation
 * failure the session middleware flashes the field errors and redirects back,
 * and the Inertia shared `errors` prop hands them to the form.
 */
@inject()
export default class ContactController {
	constructor(
		protected i18n: I18nService,
		protected sendContactFormAction: SendContactFormAction,
	) {}

	/**
	 * `POST /contact` — validates the form fields and relays the submission
	 * by mail.
	 *
	 * @param ctx - The HTTP context; the locale is resolved from it so the
	 *   notification mail is rendered in the visitor's language.
	 * @returns A `302` redirect back to the submitting page, with the
	 *   `success` flash message once the mail was dispatched.
	 */
	async execute(ctx: HttpContext) {
		const { request, response, session } = ctx;
		const data = await ContactFormValidator.validate(stripEmptyStrings(request.all()));

		await this.sendContactFormAction.execute({ ...data, locale: this.i18n.getLocale() });

		session.flash('success', this.i18n.translate('core.contact_form.submitted'));

		return response.redirect().back();
	}
}
