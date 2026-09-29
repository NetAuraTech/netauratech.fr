import { UserStatus } from './user_status';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
	title: 'Atoms/UserStatus',
	component: UserStatus,
} satisfies Meta<typeof UserStatus>;

export default meta;
type Story = StoryObj<typeof UserStatus>;

export const Verified: Story = {
	args: {
		status: 'verified',
		label: 'Verified',
	},
};

export const Unverified: Story = {
	args: {
		status: 'unverified',
		label: 'Unverified',
	},
};

export const PendingInvite: Story = {
	args: {
		status: 'pending_invite',
		label: 'Pending invite',
	},
};
