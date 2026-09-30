import { tv } from 'tailwind-variants';

const separator = tv({
	base: 'border-b border-ink-inverted/10',
});

/**
 * Horizontal separator.
 *
 * Renders a full-width bottom hairline border on the near-black canvas.
 * Use to visually divide adjacent blocks of content.
 *
 * @example
 * <Section>
 *   <Card>First block</Card>
 *   <Separator />
 *   <Card>Second block</Card>
 * </Section>
 */
export function Separator() {
	return <div className={separator()} />;
}
