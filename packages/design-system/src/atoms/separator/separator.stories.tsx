import { Separator } from './separator';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
	title: 'Atoms/Separator',
	component: Separator,
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof Separator>;

export const Base: Story = {
	render: () => (
		<div className="flex flex-col gap-4">
			<p>Content above.</p>
			<Separator />
			<p>Content below.</p>
		</div>
	),
};
