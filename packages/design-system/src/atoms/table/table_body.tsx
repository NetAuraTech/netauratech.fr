import type { ReactNode } from 'react';

export interface TableBodyProps {
	children: ReactNode;
}

/**
 * A semantic wrapper around the native HTML `<tbody>` element.
 * Represents the main data section of a table and should contain
 * one or more `TableRow` components filled with `TableCell` atoms.
 *
 * @example
 * <TableBody>
 *   <TableRow>
 *     <TableCell>John Doe</TableCell>
 *     <TableCell>john@example.com</TableCell>
 *   </TableRow>
 * </TableBody>
 */
export const TableBody = (props: TableBodyProps) => {
	const { children } = props;

	return <tbody>{children}</tbody>;
};
