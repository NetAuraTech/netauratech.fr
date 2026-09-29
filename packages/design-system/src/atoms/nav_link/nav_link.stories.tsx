import { NavLink } from './nav_link';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
	title: 'Atoms/NavLink',
	component: NavLink,
} satisfies Meta<typeof NavLink>;

export default meta;
type Story = StoryObj<typeof NavLink>;

export const Base: Story = {
	args: {
		href: '#',
		label: 'Home',
	},
};

export const Nav: Story = {
	args: {
		href: '#',
		label: 'Home',
		variant: 'nav',
		isActive: true,
	},
};

export const SettingNav: Story = {
	args: {
		href: '#',
		label: 'Profile',
		variant: 'setting_nav',
	},
};

export const Pagination: Story = {
	args: {
		href: '#',
		label: '2',
		variant: 'pagination',
	},
};

export const Footer: Story = {
	args: {
		href: '#',
		label: 'Documentation',
		variant: 'footer',
	},
};

export const Disabled: Story = {
	args: {
		href: '#',
		label: 'Disabled',
		disabled: true,
	},
};
