import limiter from '@adonisjs/limiter/services/main';
import { test } from '@japa/runner';
import env from '#start/env';
import { restoreMailClient, swapMailClient } from '#tests/helpers/mail';
import { fieldError } from '#tests/helpers/validation';

/**
 * Functional seam for the front contact-form endpoint (`POST /contact`).
 *
 * `POST /contact` is the execute-only surface of the shared `contact_form`
 * organism: the submission is validated and relayed by mail to the site
 * address (`MAIL_FROM_ADDRESS`) — nothing is written to the database. The
 * endpoint follows the app's standard form contract — a `302` redirect back
 * to the submitting page (a `success` flash on success; the session middleware
 * flashes the field errors on validation failure, while JSON-accepting clients
 * get the `422` field errors instead) — and a per-IP throttle (5/hour) so it
 * cannot become a spam relay. Specs swap the mail client for a recording one
 * and assert the envelope; the per-IP limiter budget is reset around every
 * test.
 */
test.group('Contact form endpoint', (group) => {
	// The route is throttled per IP (5/hour); reset the budget around every
	// test so earlier submissions do not leak into a later test's allowance.
	group.each.setup(() => limiter.clear());
	group.each.teardown(() => limiter.clear());

	test('POST /contact relays the submission by mail and redirects back', async ({ client, assert }) => {
		const mail = swapMailClient();

		const res = await client
			.post('/contact')
			.redirects(0)
			.withCsrfToken()
			.form({
				name: 'Jeanne Dupont',
				email: 'jeanne@exemple.fr',
				service: 'sites-vitrines',
				message: 'Bonjour, je souhaite un site vitrine.',
			})
			.send();

		restoreMailClient();

		res.assertStatus(302);
		res.assertHeader('location', '/');

		assert.equal(mail.sent.length, 1);
		assert.equal(mail.sent[0].to, env.get('MAIL_FROM_ADDRESS'));
		assert.equal(mail.sent[0].template, 'emails/contact_form_email');
		// Anonymous visitor, no Accept-Language header → the app default locale (en).
		assert.equal(mail.sent[0].subject, 'New contact request from Jeanne Dupont');
	});

	test('POST /contact accepts a submission without service', async ({ client, assert }) => {
		const mail = swapMailClient();

		const res = await client
			.post('/contact')
			.redirects(0)
			.withCsrfToken()
			.form({ name: 'Paul Martin', email: 'paul@exemple.fr', message: 'Une question sur vos tarifs.' })
			.send();

		restoreMailClient();

		res.assertStatus(302);
		assert.equal(mail.sent.length, 1);
	});

	test('POST /contact rejects an invalid payload with 422 field errors for JSON clients', async ({
		client,
		assert,
	}) => {
		const mail = swapMailClient();

		const res = await client
			.post('/contact')
			.redirects(0)
			.withCsrfToken()
			.accept('json')
			.form({ name: '', email: 'not-an-email', service: 'inconnu', message: '' })
			.send();

		restoreMailClient();

		res.assertStatus(422);
		assert.isDefined(fieldError(res, 'name'));
		assert.isDefined(fieldError(res, 'email'));
		assert.isDefined(fieldError(res, 'service'));
		assert.isDefined(fieldError(res, 'message'));
		assert.equal(mail.sent.length, 0);
	});

	test('POST /contact redirects an invalid payload back for non-JSON clients', async ({ client, assert }) => {
		const mail = swapMailClient();

		const res = await client
			.post('/contact')
			.redirects(0)
			.withCsrfToken()
			.form({ name: '', email: 'not-an-email', service: 'inconnu', message: '' })
			.send();

		restoreMailClient();

		// The session middleware flashes the field errors and redirects back —
		// the Inertia shared `errors` prop hands them to the form on reload.
		res.assertStatus(302);
		res.assertHeader('location', '/');
		assert.equal(mail.sent.length, 0);
	});

	test('POST /contact is throttled after exceeding the submission limit', async ({ client, assert }) => {
		const mail = swapMailClient();

		const statuses: number[] = [];
		for (let i = 0; i < 6; i++) {
			const res = await client
				.post('/contact')
				.redirects(0)
				.withCsrfToken()
				.accept('json')
				.form({
					name: `Spam ${i}`,
					email: `spam-${i}@exemple.fr`,
					message: `Tentative ${i}.`,
				})
				.send();
			statuses.push(res.status());
		}

		restoreMailClient();

		// The route is limited to 5 submissions per hour: the first five are
		// processed (302 back) and the sixth is a 429.
		assert.deepEqual(statuses, [302, 302, 302, 302, 302, 429]);
		assert.equal(mail.sent.length, 5);
	});
});
