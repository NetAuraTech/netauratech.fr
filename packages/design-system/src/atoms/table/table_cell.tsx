import type { ReactNode } from 'react';

export interface TableCellProps {
	colSpan?: number;
	className?: string;
	children: ReactNode;
}

/**
 * A semantic wrapper around the native HTML `<td>` element.
 * Represents a single data cell within a `TableRow` inside a `TableBody`.
 * Supports `colSpan` for spanning multiple columns and `className`
 * for style customisation.
 *
 * @example
 * // Basic usage
 * <TableCell>John Doe</TableCell>
 *
 * // With colSpan and custom class
 * <TableCell colSpan={3} className="text-center text-muted">
 *   No results found.
 * </TableCell>
 */
export const TableCell = (props: TableCellProps) => {
	const { children, colSpan, className, ...cellProps } = props;

	return (
		<td colSpan={colSpan} className={className} {...cellProps}>
			{children}
		</td>
	);
};
