import { Label } from './label';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
	title: 'Atoms/Label',
	component: Label,
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof Label>;

export const Base: Story = {
	args: {
		htmlFor: 'email',
		label: 'Email address',
	},
};

export const Required: Story = {
	args: {
		htmlFor: 'email',
		label: 'Email address',
		required: true,
	},
};
