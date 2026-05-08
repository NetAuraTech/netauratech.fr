import { ReactNode } from 'react'

interface TableHeaderProps {
  children: ReactNode
}

/**
 * Atom — `TableHeader`
 *
 * A semantic wrapper around the native HTML `<thead>` element.
 * Represents the header section of a table and should contain
 * one or more `TableRow` components filled with `TableHeaderCell` atoms.
 *
 * @example
 * <TableHeader>
 *   <TableRow>
 *     <TableHeaderCell>Name</TableHeaderCell>
 *     <TableHeaderCell>Email</TableHeaderCell>
 *   </TableRow>
 * </TableHeader>
 */
export const TableHeader = (props: TableHeaderProps) => {
  const { children } = props

  return <thead>{children}</thead>
}
