import { ReactNode } from 'react';

interface KickerProps {
	/** Kicker label content, rendered after the decorative accent dot. */
	children: ReactNode;
	/**
	 * Tailwind classes applied to the `<p>` element.
	 * Combined with the base `kicker` class.
	 */
	className?: string;
}

/**
 * Editorial kicker label.
 *
 * Thin abstraction over `<p>` that renders the uppercase micro-label with the
 * leading accent dot used above section titles. Can be dropped outside the
 * section header context by passing layout classes via `className`.
 *
 * @example
 * <Kicker>Projets</Kicker>
 *
 * // Custom layout
 * <Kicker className="mb-10">Services</Kicker>
 */
export function Kicker(props: KickerProps) {
	const { children, className = '' } = props;

	return (
		<p className={`kicker ${className}`}>
			<span aria-hidden="true" />
			{children}
		</p>
	);
}
