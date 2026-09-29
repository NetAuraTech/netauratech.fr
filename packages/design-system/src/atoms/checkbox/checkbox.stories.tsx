import { Label } from '../label/label';
import { Checkbox } from './checkbox';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
	title: 'Atoms/Checkbox',
	component: Checkbox,
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof Checkbox>;

function WithLabel(props: { name: string; label: string; checked?: boolean; disabled?: boolean }) {
	return (
		<div className="flex items-center gap-2">
			<Checkbox name={props.name} checked={props.checked} disabled={props.disabled} />
			<Label htmlFor={props.name} label={props.label} />
		</div>
	);
}

export const Base: Story = {
	render: (args) => <WithLabel {...args} label="Remember me" />,
	args: {
		name: 'remember_me',
	},
};

export const Checked: Story = {
	render: (args) => <WithLabel {...args} label="Checked" />,
	args: {
		name: 'checked_box',
		checked: true,
	},
};

export const Disabled: Story = {
	render: (args) => <WithLabel {...args} label="Disabled" />,
	args: {
		name: 'disabled_box',
		disabled: true,
	},
};
