import { ReactNode } from 'react'
import { TableHeader } from '~/components/atoms/table/table_header'
import { TableHeaderCell } from '~/components/atoms/table/table_header_cell'
import { TableRow } from '~/components/atoms/table/table_row'
import { TableCell } from '~/components/atoms/table/table_cell'
import { TableBody } from '~/components/atoms/table/table_body'

interface TableProps {
  children: ReactNode
}

/**
 * Atom — `Table`
 *
 * A semantic wrapper around the native HTML `<table>` element.
 * Applies the base `table` CSS class and acts as the root container
 * for all table-related atoms (`TableHeader`, `TableBody`, `TableRow`, etc.).
 *
 * @example
 * <Table>
 *   <TableHeader>...</TableHeader>
 *   <TableBody>...</TableBody>
 * </Table>
 */
const Table = (props: TableProps) => {
  const { children } = props

  return <table className="table">{children}</table>
}

Table.Header = TableHeader
Table.HeaderCell = TableHeaderCell
Table.Row = TableRow
Table.Cell = TableCell
Table.Body = TableBody

export default Table
