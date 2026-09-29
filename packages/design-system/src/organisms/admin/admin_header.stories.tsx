import { AdminHeader } from './admin_header';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
	title: 'Organisms/Admin Header',
	component: AdminHeader,
} satisfies Meta<typeof AdminHeader>;

export default meta;
type Story = StoryObj<typeof AdminHeader>;

export const Default: Story = {
	args: {
		handleClick: () => {},
	},
};
