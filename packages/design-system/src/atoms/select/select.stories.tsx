import { Label } from '../label/label';
import { Select, SelectOption } from './select';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
	title: 'Atoms/Select',
	component: Select,
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof Select>;

export const Base: Story = {
	args: {
		name: 'role',
		type: 'select',
		placeholder: 'Choose a role…',
		children: (
			<>
				<SelectOption value="admin" label="Administrator" />
				<SelectOption value="user" label="User" />
			</>
		),
	},
};

export const WithLabel: Story = {
	render: (args) => (
		<div className="flex flex-col gap-2">
			<Label htmlFor={args.name} label="Role" required />
			<Select {...args} />
		</div>
	),
	args: {
		name: 'role',
		type: 'select',
		required: true,
		children: (
			<>
				<SelectOption value="admin" label="Administrator" />
				<SelectOption value="user" label="User" />
			</>
		),
	},
};
