import { ReactNode } from 'react'

interface TableRowProps {
  children: ReactNode
  onClick?: () => void
}

/**
 * Atom — `TableRow`
 *
 * A semantic wrapper around the native HTML `<tr>` element.
 * Represents a single row in a table and should be used inside
 * both `TableHeader` (with `TableHeaderCell` children) and
 * `TableBody` (with `TableCell` children).
 *
 * @example
 * // Inside a header
 * <TableRow>
 *   <TableHeaderCell>Name</TableHeaderCell>
 * </TableRow>
 *
 * // Inside a body
 * <TableRow>
 *   <TableCell>John Doe</TableCell>
 * </TableRow>
 */
export const TableRow = (props: TableRowProps) => {
  const { children, ...rowProps } = props

  return <tr {...rowProps}>{children}</tr>
}
