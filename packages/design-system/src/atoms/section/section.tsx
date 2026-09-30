import { cn, tv, type VariantProps } from 'tailwind-variants';
import type { ReactNode } from 'react';

const section = tv({
	variants: {
		variant: {
			/** Neutral semantic wrapper, used by the back-office and auth screens. */
			default: 'py-8',
			/** Full-bleed editorial section on the near-black canvas, used by the public front. */
			front: 'bg-noir px-6 py-24 md:px-10 md:py-32',
		},
	},
	defaultVariants: {
		variant: 'default',
	},
});

export { section };

export type SectionVariant = NonNullable<VariantProps<typeof section>['variant']>;

interface SectionProps {
	children: ReactNode;
	/** Optional `id` attribute for anchor linking. */
	id?: string;
	/**
	 * Section tone.
	 *
	 * - `'default'` — neutral vertical padding (`py-8`), for the back-office and
	 *   auth screens.
	 * - `'front'` — the full-bleed editorial section (`bg-noir`, generous
	 *   responsive padding) used across the public front.
	 *
	 * Defaults to `'default'`.
	 */
	variant?: SectionVariant;
	/**
	 * Additional Tailwind classes. Merged after the variant defaults, so a
	 * passed utility (e.g. `py-16`) overrides the variant's padding.
	 */
	className?: string;
}

/**
 * Semantic page section wrapper.
 *
 * Thin abstraction over `<section>` that enforces the use of a semantic HTML
 * landmark while allowing the tone and extra layout classes to be injected.
 *
 * @example
 * // Neutral wrapper
 * <Section>
 *   <p>Content</p>
 * </Section>
 *
 * // Public-front editorial section
 * <Section id="projets" variant="front" className="overflow-x-hidden">
 *   ...
 * </Section>
 */
export function Section(props: SectionProps) {
	const { children, id, variant = 'default', className } = props;

	return (
		<section id={id} className={cn(section({ variant }), className)}>
			{children}
		</section>
	);
}
