import { HttpContextFactory } from '@adonisjs/core/factories/http';
import { I18n } from '@adonisjs/i18n';
import { test } from '@japa/runner';
import HttpExceptionHandler from '#transport/core/exceptions/handler';

/**
 * Regression seam for the exception handler's i18n guard.
 *
 * Unmatched URLs (e.g. `/.env`, `/config.json`) raise a 404 with no route
 * middleware chain having run, so `ctx.i18n` is undefined. In production the
 * status page then renders an Inertia error page whose shared props read
 * `ctx.i18n`, which used to crash in `I18nService` (`undefined.t`) and turn
 * the 404 into a 500 — scraped repeatedly by bots. `ensureI18n` binds a
 * header-derived locale before any error page renders.
 *
 * The end-to-end path (no route → status page) is not reachable through the
 * test HTTP client: the Vite dev server intercepts unmatched URLs, and
 * `renderStatusPages` is production-only. The guard is therefore exercised
 * directly.
 */
interface BindRecorder {
	bound: Array<{ key: unknown; value: unknown }>;
}

function makeCtx(languages: string[] = ['fr-FR']): {
	ctx: any;
	binds: BindRecorder;
} {
	const binds: BindRecorder = { bound: [] };
	const ctx = {
		i18n: undefined,
		request: { languages: () => languages },
		containerResolver: {
			bindValue: (key: unknown, value: unknown) => {
				binds.bound.push({ key, value });
			},
		},
	};
	return { ctx, binds };
}

test.group('HttpExceptionHandler ensureI18n', () => {
	test('binds a request-scoped i18n from Accept-Language when none is present', async ({ assert }) => {
		const handler = new HttpExceptionHandler() as any;
		const { ctx, binds } = makeCtx(['fr-FR']);

		handler.ensureI18n(ctx);

		assert.isDefined(ctx.i18n);
		assert.equal(ctx.i18n.locale, 'fr');
		assert.lengthOf(binds.bound, 1);
		assert.equal(binds.bound[0].key, I18n);
		assert.equal(binds.bound[0].value, ctx.i18n);
	});

	test('falls back to the default locale when no supported language is sent', async ({ assert }) => {
		const handler = new HttpExceptionHandler() as any;
		const { ctx } = makeCtx(['de']);

		handler.ensureI18n(ctx);

		assert.isDefined(ctx.i18n);
		assert.equal(ctx.i18n.locale, 'en');
	});

	test('leaves an already-bound i18n instance untouched', async ({ assert }) => {
		const handler = new HttpExceptionHandler() as any;
		const { ctx, binds } = makeCtx();
		const existing = { locale: 'fr', t: () => 'x' } as any;
		ctx.i18n = existing;

		handler.ensureI18n(ctx);

		assert.equal(ctx.i18n, existing);
		assert.lengthOf(binds.bound, 0);
	});

	test('handle() binds i18n and does not crash for a request with none', async ({ assert }) => {
		const handler = new HttpExceptionHandler() as any;
		const ctx = new HttpContextFactory().create() as any;
		// Simulate the unmatched-route state: no middleware ran, so i18n is
		// absent and the container binding was never performed.
		ctx.i18n = undefined;
		ctx.request.wantsJSON = () => true;
		if (typeof ctx.containerResolver?.bindValue !== 'function') {
			ctx.containerResolver = { bindValue: () => {} };
		}

		// The wiring under test: handle() must run ensureI18n before any
		// rendering, so a request that arrives without a bound locale (the
		// unmatched-route case) still gets one and does not crash.
		await assert.doesNotReject(() => handler.handle(new Error('boom'), ctx));

		assert.isDefined(ctx.i18n);
	});
});
