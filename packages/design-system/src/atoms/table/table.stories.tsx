import Table, { TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from './table';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
	title: 'Atoms/Table',
	component: Table,
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof Table>;

export const Base: Story = {
	render: () => (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHeaderCell>Name</TableHeaderCell>
					<TableHeaderCell>Email</TableHeaderCell>
					<TableHeaderCell>Actions</TableHeaderCell>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell>John Doe</TableCell>
					<TableCell>john@example.com</TableCell>
					<TableCell>—</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>Jane Doe</TableCell>
					<TableCell>jane@example.com</TableCell>
					<TableCell>—</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	),
};

export const StaticMembers: Story = {
	render: () => (
		<Table>
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell>Name</Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				<Table.Row>
					<Table.Cell>John Doe</Table.Cell>
				</Table.Row>
			</Table.Body>
		</Table>
	),
};
