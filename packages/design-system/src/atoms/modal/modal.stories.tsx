import { Card } from '../card/card';
import { Modal } from './modal';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
	title: 'Atoms/Modal',
	component: Modal,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof Modal>;

export const Base: Story = {
	args: {
		handleClose: () => {},
	},
	render: (args) => (
		<Modal {...args}>
			<Card title="Modal title" subtitle="A centered dialog.">
				Modal body content.
			</Card>
		</Modal>
	),
};
