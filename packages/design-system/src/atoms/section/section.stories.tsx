import { Section } from './section';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
	title: 'Atoms/Section',
	component: Section,
} satisfies Meta<typeof Section>;

export default meta;
type Story = StoryObj<typeof Section>;

export const Base: Story = {
	args: {
		children: 'Section content.',
	},
};

export const WithId: Story = {
	args: {
		id: 'features',
		className: 'py-16',
		children: 'Anchor target section.',
	},
};
