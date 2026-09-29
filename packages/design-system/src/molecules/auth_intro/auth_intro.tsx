import { cn, tv } from 'tailwind-variants';
import { Heading } from '../../atoms/heading/heading';
import { Paragraph } from '../../atoms/paragraph/paragraph';
import type { ReactNode } from 'react';

const authIntro = tv({
	base: 'text-center mb-8',
});

interface AuthIntroProps {
	/** Main heading displayed below the icon. */
	title: string;
	/** Muted subtitle displayed below the title. */
	text: string;
	/**
	 * SVG path element(s) rendered inside a 24×24 viewBox icon container.
	 * Pass a `<path>` or a group of `<path>` elements — the wrapping `<svg>`
	 * is provided by the component.
	 */
	icon: ReactNode;
	/** Additional Tailwind classes merged onto the wrapper. */
	className?: string;
}

/**
 * Centered introductory block for authentication and onboarding pages.
 *
 * Renders a square icon badge (primary-soft background), a page-level
 * heading, and a muted subtitle. Designed to sit above a `<Card>` containing
 * the relevant form, giving each auth page a consistent visual header without
 * repeating layout code.
 *
 * The `icon` prop expects raw SVG path element(s). The wrapping `<svg>` with
 * `viewBox="0 0 24 24"`, `fill="none"`, and `stroke="currentColor"` is
 * already provided internally.
 *
 * @example
 * <AuthIntro
 *   title="Sign in"
 *   text="Welcome back — enter your credentials below."
 *   icon={
 *     <path
 *       strokeLinecap="round"
 *       strokeLinejoin="round"
 *       strokeWidth={2}
 *       d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
 *     />
 *   }
 * />
 */
export function AuthIntro(props: AuthIntroProps) {
	const { title, text, icon, className } = props;

	return (
		<div className={cn(authIntro(), className)}>
			<div className="inline-flex items-center justify-center bg-primary-soft text-ink-inverted rounded-2xl p-4 mb-4">
				<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					{icon}
				</svg>
			</div>
			<Heading level={1}>{title}</Heading>
			<Paragraph variant="muted">{text}</Paragraph>
		</div>
	);
}
