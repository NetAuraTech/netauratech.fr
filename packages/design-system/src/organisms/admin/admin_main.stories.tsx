import { Card } from '../../atoms/card/card';
import { AdminMain } from './admin_main';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
	title: 'Organisms/Admin Main',
	component: AdminMain,
} satisfies Meta<typeof AdminMain>;

export default meta;
type Story = StoryObj<typeof AdminMain>;

export const Default: Story = {
	args: {
		title: 'Manage users',
		icon: 'Users',
		children: <Card>Users go here.</Card>,
	},
};

export const WithAction: Story = {
	args: {
		title: 'Manage users',
		icon: 'Users',
		action: <button type="button">Invite a user</button>,
		children: <Card>Users go here.</Card>,
	},
};
