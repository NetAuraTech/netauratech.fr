import { Card } from './card';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
	title: 'Atoms/Card',
	component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof Card>;

export const Base: Story = {
	args: {
		children: 'Card body content.',
	},
};

export const WithTitle: Story = {
	args: {
		title: 'User details',
		subtitle: 'Read-only information',
		children: 'Card body content.',
	},
};

export const WithFooter: Story = {
	args: {
		title: 'Users',
		children: 'Card body content.',
		footer: 'Footer content.',
	},
};

export const Danger: Story = {
	args: {
		title: 'Delete account',
		border: 'danger',
		children: 'This action is irreversible.',
	},
};
