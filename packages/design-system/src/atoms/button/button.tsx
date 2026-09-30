import { Link } from '@inertiajs/react';
import { useRef } from 'react';
import { cn, tv, type VariantProps } from 'tailwind-variants';
import { useButtonText } from './use_button_text';
import type { ReactNode } from 'react';

const button = tv({
	base: 'button',
	variants: {
		variant: {
			primary: 'hover:border-primary-soft hover:bg-primary-soft/10',
			secondary: 'border-primary-soft bg-primary-soft/10 text-primary-soft hover:bg-primary-soft/20',
			outline: 'border-2 border-solid border-primary text-primary hover:bg-primary hover:text-ink-inverted',
			danger: 'border-danger/40 text-danger hover:border-danger hover:bg-danger/10',
			success: 'border-success/40 text-success hover:border-success hover:bg-success/10',
			social: 'border-ink-inverted/25 bg-white/5 text-ink-inverted hover:bg-white/10',
			icon: 'p-3 hover:border-primary-soft hover:text-primary-soft',
			icon_success: 'bg-success/15 text-success hover:bg-success/25',
			icon_danger: 'bg-danger/15 text-danger hover:bg-danger/25',
			icon_warning: 'bg-warning/15 text-warning hover:bg-warning/25',
			icon_info: 'bg-info/15 text-info hover:bg-info/25',
			link_muted:
				'border-0 p-0 font-normal text-sm normal-case tracking-normal text-ink-inverted-muted hover:text-ink-inverted',
			link_secondary:
				'border-0 p-0 font-normal text-sm normal-case tracking-normal text-primary-soft hover:text-primary-light',
		},
		state: {
			active: '',
			disabled: 'opacity-50 cursor-not-allowed pointer-events-none',
		},
		size: {
			fit: 'w-fit',
			full: 'w-full',
		},
	},
	defaultVariants: {
		variant: 'primary',
		state: 'active',
		size: 'full',
	},
});

export { button };

export type ButtonVariant = NonNullable<VariantProps<typeof button>['variant']>;

interface ButtonProps {
	/** Shows a spinning loader and disables the button while `true`. */
	loading?: boolean;
	/** HTML button type. Defaults to `'submit'`. Ignored when `href` is set. */
	type?: 'button' | 'submit' | 'reset';
	/** HTML name attribute for form submission identification. */
	name?: string;
	/**
	 * Visual variant.
	 *
	 * - `primary` — hairline border that lights up with the accent on hover, default CTA.
	 * - `secondary` — accent-tinted border and fill, secondary CTA.
	 * - `outline` — solid accent border, inverted on hover.
	 * - `danger` / `success` — hairline semantic border, tinted on hover.
	 * - `social` — subtle surface fill with a hairline border, for OAuth buttons.
	 * - `icon` — no background, hover text only, square padding.
	 * - `icon_danger` / `icon_warning` / `icon_info` — tinted icon buttons.
	 *
	 * Defaults to `'primary'`.
	 */
	variant?: ButtonVariant;
	/** Disables the button and applies a reduced-opacity cursor-not-allowed style. */
	disabled?: boolean;
	children: ReactNode;
	/** Tooltip / accessible title attribute. */
	title?: string;
	onClick?: () => void;
	/**
	 * When `true`, the button shrinks to fit its content (`w-fit`).
	 * When `false` (default), it stretches to full width (`w-full`).
	 */
	fitContent?: boolean;
	/**
	 * Renders a plain `<a>` tag instead of an Inertia `<Link>` when `href` is
	 * provided. Use for URLs that trigger a server redirect (e.g. OAuth).
	 */
	external?: boolean;
	/**
	 * Resolved URL to navigate to. The caller builds it (e.g. with a typed
	 * `urlFor()`) — the component never resolves routes itself. When set,
	 * the button renders as a link instead of a `<button>`.
	 */
	href?: string;
	/** Additional Tailwind classes. */
	className?: string;
}

/**
 * Polymorphic button component that renders as a `<button>`, an Inertia
 * `<Link>`, or a plain `<a>` depending on the supplied props.
 *
 * - **No `href`** → `<button>` with the given `type`.
 * - **`href` without `external`** → Inertia `<Link>` for client-side navigation.
 * - **`href` + `external`** → `<a href>` for server-driven redirects (e.g. OAuth flows).
 *
 * All three variants share the same visual variants, loading state, and
 * disabled state so call sites don't need to handle the distinction. The
 * destination URL is injected by the caller — the component never resolves
 * routes itself.
 *
 * Text-only labels carry the letter roll hover effect (letters slide down,
 * staggered); buttons with icon children are left untouched.
 *
 * @example
 * // Standard submit button
 * <Button type="submit" loading={processing}>Save</Button>
 *
 * // Link styled as a button
 * <Button href={urlFor('admin.identity.users.render')} variant="outline" fitContent>
 *   Back
 * </Button>
 *
 * // External link (full page navigation)
 * <Button href={urlFor('auth.social.redirect', { provider })} external variant="social">
 *   Continue with Google
 * </Button>
 */
export function Button(props: ButtonProps) {
	const {
		loading,
		type = 'submit',
		name,
		variant = 'primary',
		disabled = false,
		children,
		title,
		onClick,
		fitContent = false,
		external = false,
		href,
		className,
	} = props;

	const buttonRef = useRef<HTMLElement>(null);
	useButtonText(buttonRef, variant === 'secondary');

	const state = loading || disabled ? 'disabled' : 'active';
	const size = fitContent ? 'fit' : 'full';
	const classNames = cn(button({ variant, state, size }), className);

	const content = (
		<>
			{loading && (
				<svg className="mr-2 h-4 w-4 animation:spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
					<path
						className="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					/>
				</svg>
			)}
			<span data-roll className="inline-block overflow-hidden whitespace-nowrap">
				{children}
			</span>
		</>
	);

	if (href) {
		if (external) {
			return (
				<a
					ref={(el) => {
						buttonRef.current = el;
					}}
					href={href}
					className={classNames}
					title={title}
					onClick={onClick}
				>
					{content}
				</a>
			);
		}

		return (
			<Link ref={buttonRef} href={href} className={classNames} onClick={onClick} title={title}>
				{content}
			</Link>
		);
	}

	return (
		<button
			ref={(el) => {
				buttonRef.current = el;
			}}
			disabled={loading || disabled}
			type={type}
			onClick={onClick}
			className={classNames}
			title={title}
			name={name}
		>
			{content}
		</button>
	);
}
