import { Button } from './button';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
	title: 'Atoms/Button',
	component: Button,
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof Button>;

export const Base: Story = {
	args: {
		children: 'Click me',
	},
};

export const Secondary: Story = {
	args: {
		variant: 'secondary',
		children: 'Secondary',
	},
};

export const Danger: Story = {
	args: {
		variant: 'danger',
		children: 'Delete',
	},
};

export const Outline: Story = {
	args: {
		variant: 'outline',
		fitContent: true,
		children: 'Outline',
	},
};

export const Loading: Story = {
	args: {
		loading: true,
		children: 'Saving…',
	},
};

export const Disabled: Story = {
	args: {
		disabled: true,
		children: 'Disabled',
	},
};

export const AsLink: Story = {
	args: {
		href: '#',
		variant: 'outline',
		fitContent: true,
		children: 'Back',
	},
};
