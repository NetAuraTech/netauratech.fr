import { cn, tv } from 'tailwind-variants';
import type { ReactNode } from 'react';

const kicker = tv({
	base: 'inline-flex items-center gap-3 font-news text-[11px] uppercase tracking-[0.3em] text-ink-inverted/50',
});

interface KickerProps {
	/** Kicker label content, rendered after the decorative accent dot. */
	children: ReactNode;
	/** Additional Tailwind classes. */
	className?: string;
}

/**
 * Editorial kicker label.
 *
 * Renders the uppercase micro-label with the leading accent dot used above
 * section titles. Can be dropped outside the section header context by passing
 * layout classes via `className`.
 *
 * @example
 * <Kicker>Projets</Kicker>
 *
 * <Kicker className="mb-10">Services</Kicker>
 */
export function Kicker({ children, className }: KickerProps) {
	return (
		<p className={cn(kicker(), className)}>
			<span aria-hidden="true" className="h-2 w-2 bg-primary-soft" />
			{children}
		</p>
	);
}
