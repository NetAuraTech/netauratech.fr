import { AdminSidebar } from './admin_sidebar';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
	title: 'Organisms/Admin Sidebar',
	component: AdminSidebar,
} satisfies Meta<typeof AdminSidebar>;

export default meta;
type Story = StoryObj<typeof AdminSidebar>;

const menu = [
	{
		category: 'no_category',
		label: null,
		entries: [{ label: 'Dashboard', href: '/admin/dashboard', icon: 'LayoutDashboard', isActive: true }],
	},
	{
		category: 'content',
		label: 'Content',
		entries: [
			{ label: 'Pages', href: '/admin/pages', icon: 'FileText' },
			{ label: 'Templates', href: '/admin/templates', icon: 'LayoutTemplate' },
		],
	},
	{
		category: 'access_control',
		label: 'Access control',
		entries: [
			{ label: 'Users', href: '/admin/users', icon: 'Users' },
			{ label: 'Roles', href: '/admin/roles', icon: 'Shield' },
		],
	},
];

export const Default: Story = {
	args: {
		sidebarOpen: true,
		user: { username: 'Alice Martin' },
		dateLabel: 'Friday, 28 August 2026',
		menu,
	},
};

export const WithUserActions: Story = {
	args: {
		sidebarOpen: true,
		user: { username: 'Alice Martin' },
		dateLabel: 'Friday, 28 August 2026',
		menu,
		userActions: <button type="button" aria-label="Toggle theme" />,
	},
};
