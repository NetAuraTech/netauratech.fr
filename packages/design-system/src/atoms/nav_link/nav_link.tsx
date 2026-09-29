import { Link } from '@inertiajs/react';
import { cn, tv, type VariantProps } from 'tailwind-variants';
import { getFontSizeClass, type FontSize } from '../../tokens';
import type { MouseEvent, ReactNode } from 'react';

const navLink = tv({
	base: '',
	variants: {
		variant: {
			link: 'text-secondary hover:text-secondary-deep',
			nav: 'uppercase text-xs text-ink current:text-secondary hover:text-secondary',
			setting_nav:
				'px-4 py-2.5 border-b-2 -mb-px border-transparent current:border-secondary hover:border-secondary text-ink-muted current:text-secondary hover:text-secondary cursor-pointer',
			pagination:
				'button font-normal hover:bg-primary hover:text-ink-inverted current:bg-primary current:text-ink-inverted px-2 py-1',
			admin_nav:
				'flex items-center gap-2 p-3 rounded hover:text-ink-inverted hover:bg-primary-deep current:text-ink-inverted current:bg-primary-deep',
			external: 'text-secondary hover:text-secondary-light font-semibold font-cormorant tracking-wide italic text-lg',
			footer: 'text-ink-inverted hover:text-primary-light text-sm flex items-center',
		},
		state: {
			active: '',
			disabled: 'opacity-50 cursor-not-allowed pointer-events-none',
		},
	},
	defaultVariants: {
		variant: 'link',
		state: 'active',
	},
});

export { navLink };

export type NavLinkVariant = NonNullable<VariantProps<typeof navLink>['variant']>;

interface NavLinkProps {
	/** Visible link text. */
	label: string;
	/**
	 * Resolved URL to navigate to. The caller builds it (e.g. with a typed
	 * `urlFor()`); append the fragment (`#anchor`) and query string to the
	 * string itself — the component never resolves routes.
	 */
	href: string;
	/**
	 * Whether the link points at the current page. Active links get
	 * `aria-current="page"` and the variant's `current:` styles are applied.
	 * The caller computes this (e.g. by comparing the current URL to `href`).
	 */
	isActive?: boolean;
	/**
	 * HTTP method used when the link is activated.
	 *
	 * Defaults to `'get'`, which renders a plain anchor and performs client-side
	 * navigation. Any other value renders a button that issues an Inertia visit
	 * with that method instead — use it for state-changing actions (e.g. logout)
	 * whose endpoint does not accept a GET.
	 */
	method?: 'get' | 'post' | 'put' | 'patch' | 'delete';
	/**
	 * Visual variant.
	 *
	 * - `'link'` — secondary underline-style link, default.
	 * - `'nav'` — neutral text that turns secondary on hover and when active.
	 * - `'setting_nav'` — tab-style link with a bottom border indicator.
	 * - `'pagination'` — button-shaped link used inside `<Pagination>`.
	 * - `'admin_nav'` — button-shaped link used inside Administration.
	 * - `'external'` — italic serif link for off-site destinations.
	 * - `'footer'` — light-on-dark link used in the footer.
	 */
	variant?: NavLinkVariant;
	/** Disables pointer events and applies a reduced-opacity style. */
	disabled?: boolean;
	/** Tooltip / accessible title attribute. */
	title?: string;
	/** Optional leading content (e.g. an `<Icon>`). Rendered before `label`. */
	children?: ReactNode;
	/** Click handler forwarded to the anchor element. */
	onClick?: (e: MouseEvent) => void;
	/** Font size token. Defaults to `'base'`. */
	fs?: FontSize;
	/** Additional Tailwind classes. */
	className?: string;
}

/**
 * Navigation link component with an explicit active state.
 *
 * Renders an Inertia `<Link>` (client-side navigation for internal URLs) and
 * applies `aria-current="page"` plus the variant's `current:` styles when
 * `isActive` is set. The component does not detect the active state itself —
 * the caller compares the current URL against `href` and passes the result,
 * keeping the component free of router hooks.
 *
 * @example
 * // Simple nav link
 * <NavLink href={urlFor('core.home.render')} label="Home" variant="nav" isActive={isActive} />
 *
 * // Settings tab
 * <NavLink href={urlFor('account.profile.render')} label="Profile" variant="setting_nav" />
 *
 * // Pagination link with query string
 * <NavLink href={`${urlFor('admin.identity.users.render')}?page=2`} label="2" variant="pagination" />
 */
export function NavLink(props: NavLinkProps) {
	const {
		label,
		href,
		isActive = false,
		method,
		variant = 'link',
		disabled = false,
		title,
		children,
		onClick,
		fs = 'base',
		className,
	} = props;

	const state = disabled ? 'disabled' : 'active';
	const classNames = cn(navLink({ variant, state }), getFontSizeClass(fs), className);

	return (
		<Link
			href={href}
			method={method}
			aria-current={isActive ? 'page' : undefined}
			onClick={onClick}
			className={classNames}
			title={title}
		>
			{children}
			{label}
		</Link>
	);
}
