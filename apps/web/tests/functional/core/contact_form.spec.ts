import { readFileSync } from 'node:fs';
import app from '@adonisjs/core/services/app';
import limiter from '@adonisjs/limiter/services/main';
import { test } from '@japa/runner';
import edge from 'edge.js';
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

	test('the notification mail template renders the recorded payload', async ({ client, assert }) => {
		const mail = swapMailClient();

		await client
			.post('/contact')
			.redirects(0)
			.withCsrfToken()
			.form({
				name: 'Jeanne Dupont',
				email: 'jeanne@exemple.fr',
				message: 'Ligne un\nLigne deux <script>alert(1)</script>',
			})
			.send();

		restoreMailClient();

		assert.equal(mail.sent.length, 1);
		const message = mail.sent[0];
		// The recording client keeps the template name and data: render the
		// template with them (the dispatch path does the same through the mail
		// driver) so template syntax drift fails the suite.
		const viewPath = app.makePath(`resources/views/${message.template}.edge`);
		const html = await edge.renderRaw(readFileSync(viewPath, 'utf8'), message.data);

		assert.include(html, 'Jeanne Dupont');
		assert.include(html, 'jeanne@exemple.fr');
		// Newlines of the project message become line breaks...
		assert.include(html, 'Ligne un<br>Ligne deux');
		// ...and any HTML the visitor typed stays inert.
		assert.include(html, '&lt;script&gt;');
		assert.notInclude(html, '<script>alert(1)</script>');
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
