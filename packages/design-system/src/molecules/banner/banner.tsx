import { cn, tv } from 'tailwind-variants';
import { Paragraph } from '../../atoms/paragraph/paragraph';
import type { ReactNode } from 'react';

/**
 * Semantic types of the banner.
 *
 * - `'success'` — green tones, for confirmations and completed actions.
 * - `'danger'` — red tones, for errors and destructive warnings.
 * - `'warning'` — amber tones, for non-blocking cautions.
 * - `'info'` — blue tones, for neutral informational messages.
 */
export type BannerType = 'success' | 'danger' | 'info' | 'warning';

const bannerText = {
	success: 'text-success',
	danger: 'text-danger',
	warning: 'text-warning',
	info: 'text-info',
} satisfies Record<BannerType, string>;

const banner = tv({
	base: 'p-4 rounded border',
	variants: {
		type: {
			success: `bg-success-soft border-success ${bannerText.success}`,
			danger: `bg-danger-soft border-danger ${bannerText.danger}`,
			warning: `bg-warning-soft border-warning ${bannerText.warning}`,
			info: `bg-info-soft border-info ${bannerText.info}`,
		},
	},
});

interface BannerProps {
	/** Semantic type of the banner. Controls background, text, and border colors using the design system's feedback tokens. */
	type: BannerType;
	/** Bold title line rendered at the top of the banner. Accepts a string or a custom node. */
	title: string | ReactNode;
	/** Body message rendered below the title. Accepts a string or a custom node. */
	message: string | ReactNode;
	/** Optional content rendered after the message (e.g. action buttons or a link). */
	children?: ReactNode;
	/** Additional Tailwind classes. */
	className?: string;
}

/**
 * Full-width feedback banner.
 *
 * Displays a titled message block with a semantic color scheme driven by the
 * `type` prop. All four variants use `-soft` background tokens paired with
 * their matching border and text tokens so the banner remains readable in
 * both light and dark mode without manual overrides.
 *
 * For inline single-line feedback prefer a colored `<Paragraph>`. Use
 * `Banner` when the message is prominent enough to warrant its own block —
 * confirmations, form-level errors, onboarding hints, etc.
 *
 * @example
 * <Banner
 *   type="info"
 *   title="Check your inbox"
 *   message="We sent a confirmation link to your email address."
 * />
 *
 * // With an action
 * <Banner type="danger" title="Account deletion" message="This action is permanent.">
 *   <Button variant="danger" className="mt-3">Confirm deletion</Button>
 * </Banner>
 */
export function Banner(props: BannerProps) {
	const { type, title, message, children, className } = props;

	return (
		<div className={cn(banner({ type }), className)}>
			<Paragraph className={`font-bold ${bannerText[type]} text-balance leading-7`}>{title}</Paragraph>
			<Paragraph className={`${bannerText[type]} text-balance leading-7`}>{message}</Paragraph>
			{children}
		</div>
	);
}
