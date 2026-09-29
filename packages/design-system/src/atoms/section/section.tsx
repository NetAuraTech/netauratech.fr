import { cn, tv } from 'tailwind-variants';
import type { ReactNode } from 'react';

const section = tv({
	base: 'py-8',
});

interface SectionProps {
	children: ReactNode;
	/** Optional `id` attribute for anchor linking. */
	id?: string;
	/**
	 * Tailwind classes applied to the `<section>` element.
	 * Merged with the default padding (`py-8`), so passing e.g. `py-16`
	 * overrides it.
	 */
	className?: string;
}

/**
 * Semantic page section wrapper.
 *
 * Thin abstraction over `<section>` that enforces the use of a semantic HTML
 * landmark while allowing layout classes to be injected via `className`.
 * The default padding (`py-8`) can be overridden by passing a different value.
 *
 * @example
 * // Default vertical padding
 * <Section>
 *   <p>Content</p>
 * </Section>
 *
 * // Custom layout classes
 * <Section className="py-8 grid gap-4">
 *   <Card>...</Card>
 * </Section>
 *
 * // Anchor target
 * <Section id="features" className="py-16">
 *   ...
 * </Section>
 */
export function Section(props: SectionProps) {
	const { children, className, ...sectionProps } = props;

	return (
		<section {...sectionProps} className={cn(section(), className)}>
			{children}
		</section>
	);
}
