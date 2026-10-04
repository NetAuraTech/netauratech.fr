import { Header, type HeaderLink } from '@foundry/design-system/header';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Regression guard for the header logo's href (issue #399).
 *
 * The logo used to derive its href from the **first** navigation entry
 * (`links[0]?.href ?? '/'`), so any layout whose primary navigation does not
 * start with a home entry — the realistic case being a one-page site whose nav
 * is made of section anchors — got a silently misrouted logo (e.g. `/#services`
 * instead of `/`). The logo must navigate to the explicit `homeHref` prop the
 * caller builds (mirroring the `Footer` organism), never to `links[0]`.
 */

const sectionLinks = [
	{ label: 'Services', href: '/#services' },
	{ label: 'About', href: '/#about' },
];

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
	container = document.createElement('div');
	document.body.appendChild(container);
	root = createRoot(container);
});

afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
});

function renderHeader(props: { homeHref: string; links: HeaderLink[] }) {
	act(() => {
		root.render(
			<Header
				appName="Site"
				homeHref={props.homeHref}
				links={props.links}
				isMenuOpen={false}
				onToggleMenu={() => {}}
				onMenuClose={() => {}}
			/>,
		);
	});
}

describe('Header — logo href', () => {
	it('points the logo at the explicit homeHref, not at the first nav entry', () => {
		renderHeader({ homeHref: '/', links: sectionLinks });

		const logo = container.querySelector<HTMLAnchorElement>('a.header__logo');
		expect(logo).not.toBeNull();
		expect(logo?.textContent).toBe('Site');
		// The regression: with the old derivation the logo would be `/#services`.
		expect(logo?.getAttribute('href')).toBe('/');
	});

	it('still renders every nav entry with its own href', () => {
		renderHeader({ homeHref: '/', links: sectionLinks });

		const navLinks = Array.from(container.querySelectorAll<HTMLAnchorElement>('#primary-navigation a'));
		expect(navLinks.map((link) => link.getAttribute('href'))).toEqual(['/#services', '/#about']);
	});

	it('uses the homeHref as-is, including paths and fragments', () => {
		renderHeader({ homeHref: '/en/#top', links: sectionLinks });

		const logo = container.querySelector<HTMLAnchorElement>('a.header__logo');
		expect(logo?.getAttribute('href')).toBe('/en/#top');
	});
});
