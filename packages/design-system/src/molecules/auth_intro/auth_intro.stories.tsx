import { AuthIntro } from './auth_intro';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
	title: 'Molecules/AuthIntro',
	component: AuthIntro,
} satisfies Meta<typeof AuthIntro>;

export default meta;
type Story = StoryObj<typeof AuthIntro>;

const userIcon = (
	<path
		strokeLinecap="round"
		strokeLinejoin="round"
		strokeWidth={2}
		d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
	/>
);

export const SignIn: Story = {
	args: {
		title: 'Sign in',
		text: 'Welcome back — enter your credentials below.',
		icon: userIcon,
	},
};

export const Onboarding: Story = {
	args: {
		title: 'Create your account',
		text: 'A few details and you are in.',
		icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />,
	},
};
