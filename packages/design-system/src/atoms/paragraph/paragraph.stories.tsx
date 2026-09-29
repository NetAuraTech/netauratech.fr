import { Paragraph } from './paragraph';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
	title: 'Atoms/Paragraph',
	component: Paragraph,
} satisfies Meta<typeof Paragraph>;

export default meta;
type Story = StoryObj<typeof Paragraph>;

export const Base: Story = {
	args: {
		children: 'Standard body text.',
	},
};

export const Muted: Story = {
	args: {
		variant: 'muted',
		spacing: 'sm',
		children: 'Secondary description.',
	},
};

export const Error: Story = {
	args: {
		variant: 'error',
		children: 'Validation failed.',
	},
};
