import { Label } from '../label/label';
import { Input } from './input';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
	title: 'Atoms/Input',
	component: Input,
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof Input>;

export const Base: Story = {
	args: {
		name: 'email',
		type: 'email',
		placeholder: 'you@example.com',
	},
};

export const WithLabel: Story = {
	render: (args) => (
		<div className="flex flex-col gap-2">
			<Label htmlFor={args.name} label="Email address" required />
			<Input {...args} />
		</div>
	),
	args: {
		name: 'email',
		type: 'email',
		required: true,
	},
};

export const Disabled: Story = {
	args: {
		name: 'disabled_input',
		type: 'text',
		defaultValue: 'Read only',
		disabled: true,
	},
};
