import { Icon } from './icon';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
	title: 'Atoms/Icon',
	component: Icon,
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof Icon>;

export const Base: Story = {
	args: {
		name: 'ArrowLeft',
		size: 24,
	},
};

export const Sized: Story = {
	args: {
		name: 'Check',
		size: 48,
		className: 'text-success',
	},
};

export const FullIconifyName: Story = {
	args: {
		name: 'mdi:github',
		size: 24,
	},
};
