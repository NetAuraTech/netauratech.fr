import { navLink } from '../../atoms/nav_link/nav_link';
import { Footer } from './footer';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
	title: 'Organisms/Footer',
	component: Footer,
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof Footer>;

export const Default: Story = {
	args: {
		appName: 'NetAuraTech',
		credit: (
			<p>
				Propulsé par{' '}
				<a href="https://github.com/NetAuraTech/adonisjs-foundry" className={navLink({ variant: 'front' })}>
					AdonisJsFoundry
				</a>{' '}
				· Hauts-de-France
			</p>
		),
	},
};
