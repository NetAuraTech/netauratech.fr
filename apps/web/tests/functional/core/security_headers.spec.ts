import { test } from '@japa/runner';

/**
 * Functional seam for the framing policies the Shield middleware emits on
 * every response: `X-Frame-Options` and the CSP `frame-ancestors` directive.
 * Per spec, the CSP directive takes precedence over `X-Frame-Options` when
 * both are present, so the two must agree — a `frame-ancestors 'none'`
 * alongside `X-Frame-Options: SAMEORIGIN` effectively denies all framing
 * (same-origin included) and breaks the same-origin preview iframe of the
 * CMS page builder (issue #415).
 */
test.group('Security framing headers', () => {
	test('X-Frame-Options and CSP frame-ancestors agree on same-origin framing', async ({ client, assert }) => {
		const res = await client.get('/robots.txt');

		res.assertStatus(200);
		assert.equal(res.header('x-frame-options'), 'SAMEORIGIN');

		// In dev/test the CSP is report-only, so the directive rides the
		// report-only header; in production it is enforced directly.
		const csp = res.header('content-security-policy') ?? res.header('content-security-policy-report-only');
		assert.isString(csp, 'a CSP header is present');
		assert.include(csp, "frame-ancestors 'self'");
		assert.notInclude(csp, "frame-ancestors 'none'");
	});
});
