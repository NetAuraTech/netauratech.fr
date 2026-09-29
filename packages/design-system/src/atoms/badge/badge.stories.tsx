import { Badge } from './badge';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
	title: 'Atoms/Badge',
	component: Badge,
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof Badge>;

export const Base: Story = {
	args: {
		children: 'Default',
	},
};

export const Success: Story = {
	args: {
		variant: 'success',
		children: 'Active',
	},
};

export const Warning: Story = {
	args: {
		variant: 'warning',
		children: 'Pending',
	},
};

export const Danger: Story = {
	args: {
		variant: 'danger',
		children: 'Error',
	},
};

export const Info: Story = {
	args: {
		variant: 'info',
		children: 'Info',
	},
};

export const Outline: Story = {
	args: {
		variant: 'outline',
		children: 'Outline',
	},
};
