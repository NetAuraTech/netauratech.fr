import { Heading } from './heading';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
	title: 'Atoms/Heading',
	component: Heading,
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof Heading>;

export const Level1: Story = {
	args: {
		level: 1,
		children: 'Page title',
	},
};

export const Level2: Story = {
	args: {
		level: 2,
		children: 'Section title',
	},
};

export const Level3: Story = {
	args: {
		level: 3,
		children: 'Subsection title',
	},
};

export const Muted: Story = {
	args: {
		level: 3,
		color: 'text-ink-muted',
		children: 'Muted heading',
	},
};
