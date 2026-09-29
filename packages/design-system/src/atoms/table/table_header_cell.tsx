import type { ReactNode } from 'react';

export interface TableHeaderCellProps {
	children: ReactNode;
}

/**
 * A semantic wrapper around the native HTML `<th>` element.
 * Represents a single header cell within a `TableRow` inside a `TableHeader`.
 * Inherits all native `<th>` accessibility semantics (e.g. `scope`).
 *
 * @example
 * <TableRow>
 *   <TableHeaderCell>Name</TableHeaderCell>
 *   <TableHeaderCell>Email</TableHeaderCell>
 *   <TableHeaderCell>Actions</TableHeaderCell>
 * </TableRow>
 */
export const TableHeaderCell = (props: TableHeaderCellProps) => {
	const { children } = props;

	return <th>{children}</th>;
};
