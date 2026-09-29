import { tv } from 'tailwind-variants';

const separator = tv({
	base: 'border-b border-edge',
});

/**
 * Horizontal separator.
 *
 * Renders a full-width bottom border using the `border-edge` color token.
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
