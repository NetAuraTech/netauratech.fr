import { router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

/**
 * Determines whether the current page matches a resolved href.
 *
 * The design system's `<NavLink>` is a pure presentation atom: it renders the
 * active styles only when the caller passes `isActive`. This hook performs the
 * matching so call sites can write `isActive={useNavLinkActive(href)}`.
 *
 * Matching mirrors the previous built-in behaviour:
 * - **Path** — `window.location.pathname` equals the href's path (query string
 *   and fragment stripped from the href).
 * - **Fragment** — the href's fragment (empty when the href has none) must
 *   equal the current URL hash, so a fragment-less href only matches a URL
 *   that itself carries no hash.
 *
 * The check re-runs on every Inertia `finish` event, so the active state stays
 * correct across client-side navigation.
 *
 * @param href - The resolved URL to test (e.g. from a typed `urlFor`).
 * @returns `true` while the current page matches `href`.
 *
 * @example
 * const href = urlFor('account.profile.render');
 * <NavLink href={href} isActive={useNavLinkActive(href)} label="Profile" />
 */
export function useNavLinkActive(href: string): boolean {
	const { url } = usePage();
	const [active, setActive] = useState(false);

	useEffect(() => {
		const determineActive = () => {
			setActive(isNavLinkActive(href));
		};

		determineActive();

		const removeFinishEventListener = router.on('finish', determineActive);

		return removeFinishEventListener;
	}, [url, href]);

	return active;
}

/**
 * Pure (non-hook) variant of {@link useNavLinkActive} matching, for call sites
 * that build a list of links in a loop (e.g. a layout mapping menu entries)
 * where a hook cannot be called per item.
 *
 * Reads `window.location` at call time; the caller must re-run it whenever the
 * URL changes (Inertia re-renders layouts on every navigation, which is enough
 * for the app's list call sites). Returns `false` during SSR, mirroring the
 * hook's initial state (server markup never carries the active styles).
 *
 * @param href - The resolved URL to test (e.g. from a typed `urlFor`).
 * @returns `true` while the current page matches `href`.
 */
export function isNavLinkActive(href: string): boolean {
	if (typeof window === 'undefined') {
		return false;
	}

	let targetPath = href;
	let targetAnchor = '';

	const hashIndex = href.indexOf('#');
	if (hashIndex >= 0) {
		targetPath = href.slice(0, hashIndex);
		targetAnchor = href.slice(hashIndex + 1);
	}

	const queryIndex = targetPath.indexOf('?');
	if (queryIndex >= 0) {
		targetPath = targetPath.slice(0, queryIndex);
	}

	const pathMatches = window.location.pathname === targetPath;
	const anchorMatches = targetAnchor === window.location.hash.replace('#', '');

	return pathMatches && anchorMatches;
}
