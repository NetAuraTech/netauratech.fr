import { Avatar } from './avatar';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
	title: 'Atoms/Avatar',
	component: Avatar,
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Base: Story = {
	args: {
		username: 'Alice Martin',
	},
};

export const WithUsername: Story = {
	args: {
		username: 'Alice Martin',
		showUsername: true,
	},
};
