import { Button } from '../../atoms/button/button';
import { Banner } from './banner';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
	title: 'Molecules/Banner',
	component: Banner,
} satisfies Meta<typeof Banner>;

export default meta;
type Story = StoryObj<typeof Banner>;

export const Success: Story = {
	args: {
		type: 'success',
		title: 'Saved',
		message: 'Your changes have been stored.',
	},
};

export const Danger: Story = {
	args: {
		type: 'danger',
		title: 'Something went wrong',
		message: 'The server rejected the request. Try again.',
	},
};

export const Warning: Story = {
	args: {
		type: 'warning',
		title: 'Unsaved changes',
		message: 'You have changes that are not saved yet.',
	},
};

export const Info: Story = {
	args: {
		type: 'info',
		title: 'Check your inbox',
		message: 'We sent a confirmation link to your email address.',
	},
};

export const WithAction: Story = {
	args: {
		type: 'danger',
		title: 'Account deletion',
		message: 'This action is permanent.',
		children: (
			<Button variant="danger" fitContent className="mt-3">
				Confirm deletion
			</Button>
		),
	},
};
