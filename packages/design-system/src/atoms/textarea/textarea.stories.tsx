import { Label } from '../label/label';
import { Textarea } from './textarea';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
	title: 'Atoms/Textarea',
	component: Textarea,
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Base: Story = {
	args: {
		name: 'message',
		placeholder: 'Write your message…',
		rows: 6,
	},
};

export const WithLabel: Story = {
	render: (args) => (
		<div className="flex flex-col gap-2">
			<Label htmlFor={args.name} label="Message" />
			<Textarea {...args} />
		</div>
	),
	args: {
		name: 'message',
		placeholder: 'Write your message…',
	},
};
