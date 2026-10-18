import { inject } from '@adonisjs/core';
import i18nManager from '@adonisjs/i18n/services/main';
import { MAIL_SPECS } from '#core/mail_specs';
import { MailService } from '#core/services/mail_service';
import { LogService } from '#log/services/log_service';
import env from '#start/env';
import type { MailMessage } from '#core/types/mail';

/**
 * Display labels of the front service options, mirroring the select of the
 * shared `contact_form` organism. The form submits the stable slug; the
 * notification mail shows the human-readable label instead.
 */
const SERVICE_LABELS: Record<string, string> = {
	'sites-vitrines': 'Sites vitrines',
	'boutiques-en-ligne': 'Boutiques en ligne',
	'applications-web': 'Applications web',
	autre: 'Autre',
};

interface SendContactFormPayload {
	/** Name of the visitor. */
	name: string;
	/** Contact email of the visitor — the reply address, not the recipient. */
	email: string;
	/** Slug of the selected service, when the visitor chose one. */
	service?: string;
	/** Project description written by the visitor. */
	message: string;
	/**
	 * Locale the mail is rendered in (the request's locale). Falls back to the
	 * app default when absent.
	 */
	locale?: string;
}

/**
 * Relays a front contact-form submission to the site address.
 *
 * Spec-driven mail-sending action: the mail is assembled from the
 * `contactForm` row of {@link MAIL_SPECS} through the shared kernel
 * {@link MailService.buildMail} assembly and dispatched through
 * {@link MailService.send}. The recipient is the site address
 * (`MAIL_FROM_ADDRESS`) — never the visitor's, who is only the reply
 * address — and the mail is rendered in the visitor's request locale so the
 * localized field labels match the language of the submitted values. Nothing
 * is persisted: the only trace is the business log entry.
 */
@inject()
export class SendContactFormAction {
	constructor(
		protected mailService: MailService<MailMessage>,
		protected logService: LogService,
	) {}

	/**
	 * Build and send the contact notification mail.
	 *
	 * @param payload - The validated form fields plus the request locale.
	 * @returns Nothing; the mail is dispatched synchronously.
	 */
	async execute(payload: SendContactFormPayload): Promise<void> {
		const spec = MAIL_SPECS.contactForm;
		const locale = this.mailService.resolveLocale(payload.locale);
		const i18n = i18nManager.locale(locale);

		const mail = this.mailService.buildMail(spec, {
			to: env.get('MAIL_FROM_ADDRESS'),
			locale,
			i18nParams: { name: payload.name },
			data: {
				fields: {
					[i18n.t('core.contact_form.field.name')]: payload.name,
					[i18n.t('core.contact_form.field.email')]: payload.email,
					...(payload.service
						? { [i18n.t('core.contact_form.field.service')]: SERVICE_LABELS[payload.service] ?? payload.service }
						: {}),
					[i18n.t('core.contact_form.field.message')]: payload.message,
				},
			},
		});

		await this.mailService.send(mail, { locale });

		this.logService.logBusiness(
			'contact_form.submitted',
			{},
			{
				senderEmail: payload.email,
				service: payload.service ?? null,
			},
		);
	}
}
