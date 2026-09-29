import { navLink } from '../../atoms/nav_link/nav_link';
import { Paragraph } from '../../atoms/paragraph/paragraph';
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
		appName: 'Foundry',
		homeHref: '/',
		description: (
			<Paragraph variant="ink-inverted" className="text-sm font-light leading-relaxed max-w-md flex items-center gap-2">
				A headless CMS and production-ready AdonisJS boilerplate.
			</Paragraph>
		),
		copyright: (
			<Paragraph variant="ink-inverted" className="text-sm font-light leading-relaxed max-w-md flex items-center gap-2">
				© 2026 Foundry — Tous droits réservés
			</Paragraph>
		),
		credit: (
			<Paragraph variant="ink-inverted" className="text-sm font-light leading-relaxed max-w-md flex items-center gap-2">
				Fait avec ♥ par{' '}
				<a href="https://www.netauratech.fr" className={navLink({ variant: 'external' })}>
					NetAuraTech
				</a>
			</Paragraph>
		),
	},
};
