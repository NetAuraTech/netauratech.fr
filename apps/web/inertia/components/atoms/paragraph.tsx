import { ReactNode } from 'react';
import { getFontSizeClass } from '~/utils/font';
import type { FontSize } from '#types/font';
import type { ParagraphSpacing } from '#types/paragraph';

interface ParagraphProps {
	children: ReactNode;
	/** Font size token. Defaults to `'base'`. */
	fs?: FontSize;
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
	uppercase?: boolean;
	className?: string;
}

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
 * <Paragraph variant="custom" color="text-secondary font-medium">Custom style.</Paragraph>
 */
export function Paragraph(props: ParagraphProps) {
	const { children, fs = 'base', spacing = 'base', uppercase, className = '' } = props;

	const fontSizeClass = getFontSizeClass(fs);

	const spacings = {
		xs: '',
		sm: 'paragraph__spacing-sm',
		base: 'paragraph__spacing',
		xl: 'paragraph__spacing-xl',
	};

	return (
		<p
			className={['paragraph', fontSizeClass, spacings[spacing], uppercase ? 'uppercase' : '', className]
				.filter(Boolean)
				.join(' ')}
		>
			{children}
		</p>
	);
}
