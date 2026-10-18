import vine from '@vinejs/vine';
import { email } from './rules.js';

/**
 * Slugs of the front service options, mirroring the select of the shared
 * `contact_form` organism (see the labels in
 * `src/core/actions/contact/send_contact_form_action.ts`).
 */
const SERVICE_SLUGS = ['sites-vitrines', 'boutiques-en-ligne', 'applications-web', 'autre'] as const;

/**
 * Validator for front contact-form submissions.
 *
 * The service field is optional — the visitor may skip the selector — and is
 * whitelisted against the front option slugs. Blank values are dropped by
 * `stripEmptyStrings` before validation, so the rule only sees a real slug or
 * absence.
 */
export const ContactFormValidator = vine.create({
	name: vine.string().trim().minLength(1).maxLength(200),
	email: email(),
	service: vine
		.string()
		.trim()
		.maxLength(100)
		.in([...SERVICE_SLUGS])
		.optional(),
	message: vine.string().trim().minLength(1).maxLength(5000),
});
