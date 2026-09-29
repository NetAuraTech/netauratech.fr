import { cn } from 'tailwind-variants';
import { TableBody } from './table_body';
import { TableCell } from './table_cell';
import { TableHeader } from './table_header';
import { TableHeaderCell } from './table_header_cell';
import { TableRow } from './table_row';
import type { ReactNode } from 'react';

export { TableBody, TableCell, TableHeader, TableHeaderCell, TableRow };

export interface TableProps {
	children: ReactNode;
	/** Additional Tailwind classes merged onto the `<table>`. */
	className?: string;
}

/**
 * A semantic wrapper around the native HTML `<table>` element.
 * Applies the base `table` CSS class and acts as the root container
 * for all table-related atoms (`TableHeader`, `TableBody`, `TableRow`, etc.),
 * also exposed as static members (`Table.Header`, `Table.Row`, …).
 *
 * Documented `tailwind-variants` exception: the table's styling lives in the
 * canonical CSS `@utility table` rather than a `tv()` base, because the
 * utility styles descendant rows/cells with responsive `@variant` rules
 * (`thead`, `th`, `td` at `lg:`) that a single `className` string cannot
 * express. The wrapper keeps a plain `className` merge point for callers.
 *
 * @example
 * <Table>
 *   <Table.Header>...</Table.Header>
 *   <Table.Body>...</Table.Body>
 * </Table>
 */
const Table = (props: TableProps) => {
	const { children, className } = props;

	return <table className={cn('table', className)}>{children}</table>;
};

Table.Header = TableHeader;
Table.HeaderCell = TableHeaderCell;
Table.Row = TableRow;
Table.Cell = TableCell;
Table.Body = TableBody;

export default Table;
