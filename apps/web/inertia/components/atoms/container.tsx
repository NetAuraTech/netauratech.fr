import { ReactNode } from 'react';

interface ContainerProps {
	children: ReactNode;
	/**
	 * Tailwind classes applied to the `<div>` element.
	 * Combined with the base `container` utility class.
	 */
	className?: string;
}

/**
 * Page-width content wrapper.
 *
 * Thin abstraction over `<div>` that enforces the `container` utility
 * (centered, max-width layout with responsive horizontal padding) while
 * allowing extra layout classes to be injected via `className`.
 *
 * @example
 * // Default centered container
 * <Container>
 *   <p>Content</p>
 * </Container>
 *
 * // Additional layout classes
 * <Container className="py-16 grid gap-8">
 *   <Card>...</Card>
 * </Container>
 */
export function Container(props: ContainerProps) {
	const { children, className = '' } = props;

	return <div className={`mx-auto max-w-6xl ${className}`}>{children}</div>;
}
