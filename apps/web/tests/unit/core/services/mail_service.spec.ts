import app from '@adonisjs/core/services/app';
import router from '@adonisjs/core/services/router';
import { test } from '@japa/runner';
import { MailService } from '#core/services/mail_service';
import { TOKEN_MAIL_SPECS } from '#core/token_mail_specs';
import env from '#start/env';
import { restoreMailClient, swapMailClient } from '#tests/helpers/mail';
import type { TokenMailSpec } from '#core/types/token_mail';

const PROBE_DOMAIN = 'root';
const PROBE_PATTERN = '/probe/mail_link/:token';
const PROBE_NAME = 'probe.mail_link';

/**
 * Register a self-contained probe route on the router's committed route table
 * so `buildLink()` can resolve it.
 *
 * `buildLink()` resolves candidates through the runtime table (`router.has` +
 * the URL builder), but the unit env never starts the HTTP server, so routes
 * registered at module load time sit uncommitted in the router's staging area
 * and stay unresolvable. `router.toJSON()` returns a live reference to that
 * table, so pushing the probe straight in makes it resolvable regardless of
 * whether an earlier suite already committed — and, unlike a real domain
 * route, it is flavor-agnostic (the `api` flavor prunes the front `:token`
 * routes the production mail links point at).
 */
function registerProbeRoute(): void {
	const table = router.toJSON() as Record<string, Array<Record<string, unknown>>>;
	table[PROBE_DOMAIN] ??= [];
	table[PROBE_DOMAIN].push({
		domain: PROBE_DOMAIN,
		pattern: PROBE_PATTERN,
		name: PROBE_NAME,
		methods: ['GET', 'HEAD'],
		tokens: router.parsePattern(PROBE_PATTERN, {}),
		matchers: {},
		meta: {},
		handler: () => 'ok',
		middleware: [],
	});
}

test.group('MailService', () => {
	test('send() dispatches the payload and stamps the resolved locale into the template data', async ({ assert }) => {
		const mail = swapMailClient();
		const service = await app.container.make(MailService);

		await service.send(
			{ to: 'kernel@test.com', subject: 'Hello', template: 'emails/auth_email', data: { foo: 'bar' } },
			{ locale: 'fr' },
		);

		restoreMailClient();

		assert.equal(mail.sent.length, 1);
		assert.equal(mail.sent[0].to, 'kernel@test.com');
		assert.equal(mail.sent[0].subject, 'Hello');
		assert.equal(mail.sent[0].template, 'emails/auth_email');
		assert.deepEqual(mail.sent[0].data, { locale: 'fr', foo: 'bar' });
	});

	test('send() dispatches a payload without template data', async ({ assert }) => {
		const mail = swapMailClient();
		const service = await app.container.make(MailService);

		await service.send({ to: 'kernel@test.com', subject: 'Hello', template: 'emails/auth_email' }, { locale: 'en' });

		restoreMailClient();

		assert.equal(mail.sent.length, 1);
		assert.deepEqual(mail.sent[0].data, { locale: 'en' });
	});

	test('resolveLocale() falls back to the app default locale when the preference is unset', async ({ assert }) => {
		const service = await app.container.make(MailService);

		assert.equal(service.resolveLocale(), 'en');
		assert.equal(service.resolveLocale(''), 'en');
		assert.equal(service.resolveLocale('fr'), 'fr');
	});

	test('buildLink() returns an empty string when no candidate route is registered', async ({ assert }) => {
		const service = await app.container.make(MailService);

		assert.equal(service.buildLink(['probe.no_such_route'], 'selector.validator'), '');
	});

	test('buildLink() returns the absolute URL of the first registered candidate', async ({ assert }) => {
		registerProbeRoute();
		const service = await app.container.make(MailService);

		assert.equal(
			service.buildLink(['probe.no_such_route', PROBE_NAME], 'selector.validator'),
			`${env.get('APP_URL')}${PROBE_PATTERN.replace(':token', 'selector.validator')}`,
		);
	});
});

test.group('MailService buildTokenMail', () => {
	test('assembles a new token mail flow from a synthetic spec row', async ({ assert }) => {
		registerProbeRoute();
		const service = await app.container.make(MailService);

		const spec: TokenMailSpec = {
			keys: {
				subject: 'identity.admin.users.mail.subject',
				greeting: 'identity.admin.users.mail.greeting',
				intro: 'identity.admin.users.mail.intro',
				action: 'identity.admin.users.mail.action',
				outro: 'identity.admin.users.mail.outro',
				expiry: 'identity.admin.users.mail.expiry',
				footer: 'identity.admin.users.mail.footer',
			},
			linkRoutes: [PROBE_NAME],
			linkSlot: 'magic_link',
			ttlHours: 168,
			template: 'emails/synthetic_flow',
		};

		const payload = service.buildTokenMail(spec, {
			to: 'synthetic@test.com',
			locale: 'en',
			token: 'selector.validator',
		});

		assert.deepEqual(payload, {
			to: 'synthetic@test.com',
			subject: 'You have been invited to join AdonisJS Foundry',
			template: 'emails/synthetic_flow',
			data: {
				app_name: 'AdonisJS Foundry',
				subject: 'You have been invited to join AdonisJS Foundry',
				greeting: 'You have been invited,',
				intro:
					'An administrator has invited you to join AdonisJS Foundry. Click the button below to accept your invitation and set up your account.',
				action: 'Accept invitation',
				outro:
					'Once you’ve accepted, you’ll be able to set your password and start using your account straight away. Your email address will be verified automatically.',
				expiry: 'This invitation link will expire in 7 days.',
				footer: "If you're having trouble clicking the button, copy and paste the URL below into your web browser:",
				magic_link: `${env.get('APP_URL')}${PROBE_PATTERN.replace(':token', 'selector.validator')}`,
			},
		});
	});

	test('assembles a linkless spec row with per-send i18n params and extra data slots', async ({ assert }) => {
		const service = await app.container.make(MailService);

		const payload = service.buildTokenMail(TOKEN_MAIL_SPECS.emailChangeNotification, {
			to: 'current@test.com',
			locale: 'en',
			i18nParams: { old: 'current@test.com', new: 'updated@test.com' },
			data: { support: 'support@example.com' },
		});

		assert.equal(payload.to, 'current@test.com');
		assert.equal(payload.template, 'emails/account_email');
		assert.equal(payload.subject, 'Your email address is being changed');
		assert.equal(
			payload.data.intro,
			'This email is to notify you that your account email address is being changed from current@test.com to updated@test.com.',
		);
		assert.equal(
			payload.data.warning,
			'If you did not initiate this change, your account may be compromised. Please contact our support team immediately.',
		);
		assert.equal(payload.data.support, 'support@example.com');
		assert.isUndefined(payload.data.outro);
		assert.isUndefined(payload.data.expiry);
		assert.isUndefined(payload.data.verification_link);
	});

	test('registers a spec row per token mail flow with its TTL, template and candidate routes', async ({ assert }) => {
		assert.deepEqual(
			Object.fromEntries(
				Object.entries(TOKEN_MAIL_SPECS).map(([flow, spec]) => [
					flow,
					{ ttlHours: spec.ttlHours, template: spec.template, linkRoutes: spec.linkRoutes, linkSlot: spec.linkSlot },
				]),
			),
			{
				emailVerification: {
					ttlHours: 24,
					template: 'emails/auth_email',
					linkRoutes: ['auth.email_verification.execute', 'api.v1.auth.email_verification.store'],
					linkSlot: 'verification_link',
				},
				passwordReset: {
					ttlHours: 1,
					template: 'emails/auth_email',
					linkRoutes: ['auth.reset_password.render', 'api.v1.auth.reset_password.store'],
					linkSlot: 'reset_link',
				},
				invitation: {
					ttlHours: 168,
					template: 'emails/admin_invite_email',
					linkRoutes: ['auth.accept_invitation.render', 'api.v1.auth.accept_invitation.store'],
					linkSlot: 'accept_link',
				},
				emailChangeConfirmation: {
					ttlHours: 24,
					template: 'emails/account_email',
					linkRoutes: ['account.email_change.render'],
					linkSlot: 'confirmation_link',
				},
				emailChangeNotification: {
					ttlHours: undefined,
					template: 'emails/account_email',
					linkRoutes: [],
					linkSlot: undefined,
				},
			},
		);
	});

	test('throws when the spec row defines candidate routes but no token is given', async ({ assert }) => {
		const service = await app.container.make(MailService);

		let thrown: unknown;
		try {
			service.buildTokenMail(TOKEN_MAIL_SPECS.passwordReset, { to: 'notoken@test.com', locale: 'en' });
		} catch (error) {
			thrown = error;
		}

		assert.ok(thrown instanceof Error);
		assert.equal((thrown as Error & { code?: string }).code, 'E_TOKEN_MAIL_MISSING_TOKEN');
	});
});
