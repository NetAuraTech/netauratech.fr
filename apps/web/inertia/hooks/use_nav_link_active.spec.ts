// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isNavLinkActive } from './use_nav_link_active';

/**
 * Pure active-state matching shared by `useNavLinkActive`: the href's path
 * (query string and fragment stripped) must equal the current pathname, and
 * the href's fragment (empty string when the href has none) must equal the
 * current URL hash.
 */
describe('isNavLinkActive', () => {
	afterEach(() => {
		window.history.pushState({}, '', '/');
	});

	it('matches when the pathname equals the href', () => {
		window.history.pushState({}, '', '/admin/dashboard');
		expect(isNavLinkActive('/admin/dashboard')).toBe(true);
	});

	it('does not match a different pathname', () => {
		window.history.pushState({}, '', '/admin/pages');
		expect(isNavLinkActive('/admin/dashboard')).toBe(false);
	});

	it('ignores the href query string when matching the path', () => {
		window.history.pushState({}, '', '/admin/files');
		expect(isNavLinkActive('/admin/files?folder_id=3&search=alpha')).toBe(true);
	});

	it('matches a fragment href only when the current hash equals it', () => {
		window.history.pushState({}, '', '/page#section-two');
		expect(isNavLinkActive('/page#section-two')).toBe(true);
		expect(isNavLinkActive('/page#section-one')).toBe(false);
	});

	it('only matches a fragment-less href when the current URL carries no hash', () => {
		window.history.pushState({}, '', '/page');
		expect(isNavLinkActive('/page')).toBe(true);

		window.history.pushState({}, '', '/page#somewhere');
		expect(isNavLinkActive('/page')).toBe(false);
	});

	it('returns false when window is unavailable (SSR)', () => {
		vi.stubGlobal('window', undefined);
		try {
			expect(isNavLinkActive('/admin/dashboard')).toBe(false);
		} finally {
			vi.unstubAllGlobals();
		}
	});
});
