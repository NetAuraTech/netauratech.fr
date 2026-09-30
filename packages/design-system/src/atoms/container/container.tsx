import { cn, tv } from 'tailwind-variants';
import type { ReactNode } from 'react';

const container = tv({
	base: 'mx-auto max-w-6xl',
});

interface ContainerProps {
	children: ReactNode;
	/** Additional Tailwind classes. */
	className?: string;
}

/**
 * Page-width content wrapper.
 *
 * Thin abstraction over `<div>` that centers its content on the `max-w-6xl`
 * measure used across the public front, while allowing extra layout classes
 * to be injected via `className`.
 *
 * @example
 * <Container>
 *   <p>Content</p>
 * </Container>
 *
 * <Container className="py-16 grid gap-8">...</Container>
 */
export function Container({ children, className }: ContainerProps) {
	return <div className={cn(container(), className)}>{children}</div>;
}
