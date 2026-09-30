import { cn, tv } from 'tailwind-variants';
import type { ElementType, ReactNode, Ref } from 'react';

const heading = tv({
	base: 'font-news leading-[1.02] font-normal tracking-[-0.03em] text-ink-inverted [&_em]:italic [&_em]:text-primary-soft',
	variants: {
		level: {
			1: 'text-[clamp(2.7rem,8vw,6.5rem)] max-w-5xl text-balance',
			2: 'text-[clamp(2rem,5vw,4rem)] max-w-3xl',
			3: 'text-2xl',
			4: 'text-base',
		},
		flex: {
			true: 'flex gap-2 items-center',
			false: '',
		},
	},
	defaultVariants: {
		level: 2,
		flex: false,
	},
});

interface HeadingProps {
	/**
	 * The heading level. Maps to `<h1>`–`<h4>` and controls the font size:
	 * - `1` → `text-[clamp(2.7rem,8vw,6.5rem)]`
	 * - `2` → `text-[clamp(2rem,5vw,4rem)]`
	 * - `3` → `text-2xl`
	 * - `4` → `text-base`
	 */
	level: 1 | 2 | 3 | 4;
	/**
	 * Tailwind text-color class applied to the heading.
	 * Defaults to `'text-ink-inverted'`.
	 */
	color?: string;
	/** Renders the heading as a flex row (e.g. to align an icon next to the text). */
	flex?: boolean;
	/**
	 * Extra Tailwind classes appended after the size and color classes. Utility
	 * classes win over the level defaults, so e.g. a custom `text-[...]`
	 * overrides the level's font size.
	 */
	className?: string;
	/** Ref forwarded to the heading element (e.g. for scroll-sweep animations). */
	ref?: Ref<HTMLHeadingElement> | undefined;
	children: ReactNode;
}

/**
 * Semantic heading component that renders the appropriate `<h1>`–`<h4>` tag.
 *
 * The `level` prop controls both the HTML tag and the font size. Emphasized
 * words wrapped in `<em>` are automatically italicized and colored with the
 * accent. Pass a custom `color` class to override the default
 * `text-ink-inverted` when the heading is placed on a colored background.
 *
 * @example
 * <Heading level={1}>Page title</Heading>
 * <Heading level={3} color="text-ink-inverted-muted">Section subtitle</Heading>
 */
export function Heading(props: HeadingProps) {
	const { level, color = 'text-ink-inverted', flex, className = '', ref, children } = props;

	// Fallback to h2 if level is somehow undefined
	const safeLevel = level ?? 2;
	const Tag = `h${safeLevel}` as ElementType;

	return (
		<Tag className={cn(heading({ level: safeLevel, flex }), color, className)} ref={ref}>
			{children}
		</Tag>
	);
}
