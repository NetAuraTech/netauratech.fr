import { cn, tv, type VariantProps } from 'tailwind-variants';
import { getFontSizeClass, type FontSize, type ParagraphSpacing, type ParagraphVariants } from '../../tokens';
import type { ReactNode } from 'react';

const paragraph = tv({
	base: '',
	variants: {
		variant: {
			ink: 'text-ink',
			'ink-inverted': 'text-ink-inverted',
			muted: 'text-ink-muted',
			subtle: 'text-ink-subtle',
			error: 'text-danger',
			'primary-light': 'text-primary-light',
			'primary-soft': 'text-primary-soft',
			primary: 'text-primary',
			'primary-deep': 'text-primary-deep',
			'secondary-light': 'text-secondary-light',
			'secondary-soft': 'text-secondary-soft',
			secondary: 'text-secondary',
			'secondary-deep': 'text-secondary-deep',
			'tertiary-light': 'text-tertiary-light',
			'tertiary-soft': 'text-tertiary-soft',
			tertiary: 'text-tertiary',
			'tertiary-deep': 'text-tertiary-deep',
		},
		spacing: {
			xs: '',
			sm: '[&:not(:first-child)]:mt-2',
			base: '[&:not(:first-child)]:mt-4',
			xl: '[&:not(:first-child)]:mt-6',
		},
	},
	defaultVariants: {
		variant: 'ink',
		spacing: 'base',
	},
});

interface ParagraphProps {
	children: ReactNode;
	/** Font size token. Defaults to `'base'`. */
	fs?: FontSize;
	/**
	 * Text color variant.
	 *
	 * - `'ink'` — primary text color (`text-ink`), default.
	 * - `'muted'` — secondary text color (`text-ink-muted`).
	 * - `'subtle'` — tertiary text color (`text-ink-subtle`).
	 * - `'error'` — danger text color (`text-danger`).
	 * - any other {@link ParagraphVariants} value for semantic brand colors.
	 */
	variant?: ParagraphVariants;
	/**
	 * Top margin applied when the paragraph is not the first child of its
	 * container.
	 *
	 * - `'xs'` — no margin.
	 * - `'sm'` — `mt-2`.
	 * - `'base'` — `mt-4`, default.
	 * - `'xl'` — `mt-6`.
	 */
	spacing?: ParagraphSpacing;
	/** Additional Tailwind classes. */
	className?: string;
}

export type ParagraphVariant = NonNullable<VariantProps<typeof paragraph>['variant']>;

/**
 * Styled paragraph component.
 *
 * Wraps text content in a `<p>` tag with consistent line height, balanced
 * text wrapping, and optional spacing between sibling paragraphs. Use the
 * `variant` prop for semantic color roles and `spacing` to control vertical
 * rhythm within a content block.
 *
 * @example
 * <Paragraph>Standard body text.</Paragraph>
 * <Paragraph variant="muted" spacing="sm">Secondary description.</Paragraph>
 * <Paragraph variant="error">Validation failed.</Paragraph>
 */
export function Paragraph(props: ParagraphProps) {
	const { children, variant = 'ink', fs = 'base', spacing = 'base', className = 'text-balance leading-7' } = props;

	const fontSizeClass = getFontSizeClass(fs);
	const classNames = cn(paragraph({ variant, spacing }), fontSizeClass, className);

	return <p className={classNames}>{children}</p>;
}
