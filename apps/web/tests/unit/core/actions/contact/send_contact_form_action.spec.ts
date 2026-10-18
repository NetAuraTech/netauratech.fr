import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { SendContactFormAction } from '#core/actions/contact/send_contact_form_action';
import env from '#start/env';
import { restoreMailClient, swapMailClient } from '#tests/helpers/mail';

/**
 * Unit tests for the front contact-form relay.
 *
 * The action is a spec-driven mail-sending leaf: it assembles the mail from
 * the `contactForm` row of `MAIL_SPECS` and dispatches it through the kernel
 * mail service. Specs swap the mail client for a recording one and assert the
 * envelope — recipient, template, subject and the localized `fields` slot.
 */
test.group('SendContactFormAction', () => {
	test('execute() relays the submission by mail to the site address', async ({ assert }) => {
		const mail = swapMailClient();
		const action = await app.container.make(SendContactFormAction);

		await action.execute({
			name: 'Jeanne Dupont',
			email: 'jeanne@exemple.fr',
			service: 'sites-vitrines',
			message: 'Bonjour, je souhaite un site vitrine.',
			locale: 'fr',
		});

		restoreMailClient();

		assert.equal(mail.sent.length, 1);
		const message = mail.sent[0];
		assert.equal(message.to, env.get('MAIL_FROM_ADDRESS'));
		assert.equal(message.template, 'emails/contact_form_email');
		assert.equal(message.subject, 'Nouvelle demande de Jeanne Dupont — formulaire de contact');
		assert.deepEqual(message.data?.fields, {
			Nom: 'Jeanne Dupont',
			'E-mail': 'jeanne@exemple.fr',
			Service: 'Sites vitrines',
			Projet: 'Bonjour, je souhaite un site vitrine.',
		});
	});

	test('execute() omits the service field when the visitor picked none', async ({ assert }) => {
		const mail = swapMailClient();
		const action = await app.container.make(SendContactFormAction);

		await action.execute({
			name: 'Paul Martin',
			email: 'paul@exemple.fr',
			message: 'Une question sur vos tarifs.',
			locale: 'fr',
		});

		restoreMailClient();

		assert.equal(mail.sent.length, 1);
		assert.deepEqual(mail.sent[0].data?.fields, {
			Nom: 'Paul Martin',
			'E-mail': 'paul@exemple.fr',
			Projet: 'Une question sur vos tarifs.',
		});
	});

	test('execute() renders the mail in the app default locale when none is given', async ({ assert }) => {
		const mail = swapMailClient();
		const action = await app.container.make(SendContactFormAction);

		await action.execute({
			name: 'John Smith',
			email: 'john@example.com',
			message: 'I would like a brochure site.',
		});

		restoreMailClient();

		assert.equal(mail.sent.length, 1);
		assert.deepEqual(mail.sent[0].data?.fields, {
			Name: 'John Smith',
			Email: 'john@example.com',
			Project: 'I would like a brochure site.',
		});
	});
});
