import { cn, tv, type VariantProps } from 'tailwind-variants';
import { Heading } from '../heading/heading';
import { Paragraph } from '../paragraph/paragraph';
import type { ReactNode } from 'react';

const card = tv({
	base: 'card',
	variants: {
		border: {
			none: '',
			muted: 'border border-edge',
			danger: 'border border-danger',
		},
	},
	defaultVariants: {
		border: 'muted',
	},
});

export type CardBorder = NonNullable<VariantProps<typeof card>['border']>;

interface CardProps {
	/** Optional title rendered in the card header using `<Heading level={3}>`. */
	title?: string;
	/** Optional subtitle rendered below the title as a muted paragraph. */
	subtitle?: string;
	/** Main card content, rendered in the padded body area. */
	children: ReactNode;
	/**
	 * Custom header content. When provided, `title` and `subtitle` are ignored
	 * and this node is rendered directly inside the header slot.
	 */
	header?: ReactNode;
	/**
	 * Footer content rendered below the body with a top border and a sunken
	 * background to visually separate it from the main content.
	 */
	footer?: ReactNode;
	/**
	 * Border style applied to the card container.
	 *
	 * - `'none'` — no border.
	 * - `'muted'` — subtle `edge` border, default.
	 * - `'danger'` — danger-colored border for destructive sections.
	 *
	 * Defaults to `'muted'`.
	 */
	border?: CardBorder;
	/** Body padding classes. Defaults to `'p-8'`. */
	padding?: string;
	/** Additional Tailwind classes. */
	className?: string;
}

/**
 * General-purpose content container.
 *
 * Composed of three optional slots — header, body, and footer — separated by
 * horizontal dividers. The header slot accepts either a custom `header` node
 * or a `title` / `subtitle` pair. The footer gets a sunken background to
 * visually anchor secondary actions (e.g. pagination, submit buttons).
 *
 * @example
 * // Simple titled card
 * <Card title="User details" subtitle="Read-only information">
 *   <p>...</p>
 * </Card>
 *
 * // Custom header with actions
 * <Card header={<div className="flex justify-between"><h2>Users</h2><Button>Invite</Button></div>}>
 *   <Table>...</Table>
 * </Card>
 *
 * // Danger card for destructive zones
 * <Card title="Delete account" border="danger">
 *   <Button variant="danger">Delete</Button>
 * </Card>
 */
export function Card(props: CardProps) {
	const { children, title, subtitle, header, footer, border = 'muted', padding = 'p-8', className } = props;

	return (
		<div className={cn(card({ border }), className)}>
			{(header || title) && (
				<div className="p-8 border-b border-solid border-edge">
					{header ? (
						header
					) : (
						<div>
							{title && <Heading level={3}>{title}</Heading>}
							{subtitle && (
								<Paragraph variant="muted" spacing="sm">
									{subtitle}
								</Paragraph>
							)}
						</div>
					)}
				</div>
			)}
			<div className={`flex-1 ${padding}`}>{children}</div>
			{footer && <div className="p-8 border-t border-solid border-edge bg-sunken">{footer}</div>}
		</div>
	);
}
