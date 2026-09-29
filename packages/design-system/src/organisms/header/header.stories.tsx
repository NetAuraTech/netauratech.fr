import { useState } from 'react';
import { Header, type HeaderLink } from './header';
import type { Meta } from '@storybook/react';

const meta = {
	title: 'Organisms/Header',
	component: Header,
} satisfies Meta<typeof Header>;

export default meta;

/**
 * Story-level wrapper that owns the menu open/close state the way an app
 * layout would — the `Header` itself is a controlled presentational component.
 */
function HeaderWithMenu(props: { links: HeaderLink[] }) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	return (
		<Header
			appName="Foundry"
			links={props.links}
			isMenuOpen={isMenuOpen}
			onToggleMenu={() => setIsMenuOpen(!isMenuOpen)}
			onMenuClose={() => setIsMenuOpen(false)}
		/>
	);
}

export const Default = () => <HeaderWithMenu links={[{ label: 'Home', href: '/', isActive: true }]} />;

export const MultipleLinks = () => (
	<HeaderWithMenu
		links={[
			{ label: 'Home', href: '/', isActive: true },
			{ label: 'About', href: '/about' },
			{ label: 'Contact', href: '/contact' },
		]}
	/>
);
