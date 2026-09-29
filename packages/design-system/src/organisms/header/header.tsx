import { Link } from '@inertiajs/react';
import { cn, tv } from 'tailwind-variants';
import { NavLink } from '../../atoms/nav_link/nav_link';

/**
 * A single primary-navigation entry for the {@link Header}.
 *
 * The `href` is resolved by the caller (e.g. with a typed `urlFor`) — the
 * header never resolves routes itself.
 */
export interface HeaderLink {
	/** Visible link text. */
	label: string;
	/** Resolved URL the link navigates to. */
	href: string;
	/**
	 * Whether the link points at the current page, computed by the caller (the
	 * header never inspects the URL itself). Active links get
	 * `aria-current="page"` and the variant's `current:` styles.
	 */
	isActive?: boolean;
}

const header = tv({
	base: 'header',
});

interface HeaderProps {
	/** The application name, rendered as the logo link. */
	appName: string;
	/**
	 * Primary navigation links, rendered in order inside the nav. Hrefs and
	 * active states are computed by the caller. The first entry also drives the
	 * logo's href — put the home link first.
	 */
	links: HeaderLink[];
	/**
	 * Whether the mobile navigation is open (small viewports). The open/close
	 * state is owned by the caller — the header is a controlled presentational
	 * component and owns no state of its own.
	 */
	isMenuOpen: boolean;
	/** Invoked by the burger button to toggle the mobile navigation. */
	onToggleMenu: () => void;
	/**
	 * Invoked by the logo and navigation-link clicks to close the mobile
	 * navigation. The caller is responsible for any close-on-navigation
	 * behaviour (e.g. subscribing to the Inertia `router` `success` event).
	 */
	onMenuClose: () => void;
	/** Additional Tailwind classes merged onto the `<header>`. */
	className?: string;
}

/**
 * Renders one navigation entry. Kept as a private child so the `NavLink` is
 * instantiated once per entry rather than inline in the list callback. The
 * active state is injected through the `link.isActive` prop.
 */
function HeaderNavLink(props: { link: HeaderLink; onClick?: () => void }) {
	const { link, onClick } = props;

	return <NavLink href={link.href} label={link.label} variant="nav" isActive={link.isActive} onClick={onClick} />;
}

/**
 * Public-facing top bar.
 *
 * Shows the application name as a home link, the injected primary navigation,
 * and a burger toggle that opens the navigation on small viewports. All data —
 * the app name, the resolved link hrefs and the menu open/close state — is
 * injected by the caller; the header owns no app data, no state, and resolves
 * no routes.
 *
 * @example
 * <Header
 *   appName="Foundry"
 *   links={[{ label: 'Home', href: urlFor('core.home.render') }]}
 *   isMenuOpen={isMenuOpen}
 *   onToggleMenu={() => setIsMenuOpen(!isMenuOpen)}
 *   onMenuClose={closeMenu}
 * />
 */
export function Header(props: HeaderProps) {
	const { appName, links, className, isMenuOpen, onToggleMenu, onMenuClose } = props;

	const menuState = isMenuOpen ? 'opened' : 'closed';
	const isExpanded = isMenuOpen ? 'true' : 'false';
	const homeHref = links[0]?.href ?? '/';

	return (
		<header className={cn(header(), className)} data-state={menuState} aria-expanded={isExpanded}>
			<Link
				href={homeHref}
				className="header__logo font-semibold tracking-wide text-xl font-cormorant"
				onClick={onMenuClose}
			>
				{appName}
			</Link>

			<nav id="primary-navigation" className="header__nav" data-state={menuState} aria-expanded={isExpanded}>
				{links.map((link) => (
					<HeaderNavLink key={link.href} link={link} onClick={onMenuClose} />
				))}
			</nav>
			<button
				className="header__burger md:display-hidden"
				aria-controls="primary-navigation"
				aria-expanded={isExpanded}
				data-state={menuState}
				aria-label="Menu"
				onClick={onToggleMenu}
			>
				<svg stroke="currentColor" fill="none" className="hamburger" viewBox="-10 -10 120 120" width="50">
					<path
						className="line"
						strokeWidth="6"
						strokeLinecap="round"
						strokeLinejoin="round"
						d="m 20 40 h 60 a 1 1 0 0 1 0 20 h -60 a 1 1 0 0 1 0 -40 h 30 v 70"
					></path>
				</svg>
			</button>
		</header>
	);
}
