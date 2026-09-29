import { useState } from 'react';
import { SelectOption } from '../../atoms/select/select';
import { ImagePicker } from '../image_picker/image_picker';
import { Field } from './field';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
	title: 'Molecules/Field',
	component: Field,
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof Field>;

export const Text: Story = {
	args: {
		label: 'Email',
		name: 'email',
		type: 'email',
		placeholder: 'you@example.com',
		required: true,
		sanitizeValue: (value) => value.trim().toLowerCase(),
	},
};

export const WithError: Story = {
	args: {
		label: 'Email',
		name: 'email',
		type: 'email',
		errorMessage: 'This field is required.',
	},
};

export const WithHelpText: Story = {
	args: {
		label: 'New password',
		name: 'password',
		type: 'password',
		helpText: 'Minimum 8 characters.',
	},
};

export const ValidationSeam: Story = {
	render: (args) => <ValidationSeamStory {...args} />,
};

function ValidationSeamStory(props: Story['args']) {
	const [value, setValue] = useState('');
	const [touched, setTouched] = useState(false);

	const clientInvalid = touched && value !== '' && !value.includes('@');

	// A stand-in for the app's useFormValidation bundle. All members are
	// optional; here we provide the full set to exercise the seam.
	const validation = {
		handleChange: (name: string, next: string | boolean) => {
			if (name === 'email') setValue(String(next));
		},
		handleBlur: (name: string, next: string | boolean) => {
			if (name === 'email') {
				setValue(String(next));
				setTouched(true);
			}
		},
		getValidationMessage: (name: string) => (name === 'email' && clientInvalid ? 'Invalid email address.' : undefined),
		getHelpClassName: (name: string) =>
			name === 'email' && touched ? (clientInvalid ? 'text-danger' : 'text-success') : '',
	};

	// Server errors take precedence over the client validation message.
	const errors: Record<string, string | undefined> =
		value === 'taken@example.com' ? { email: 'This email is already taken.' } : {};

	return (
		<Field
			{...props}
			name="email"
			type="email"
			label="Email"
			validation={validation}
			errors={errors}
			helpText="Server errors win; the help text color follows the bundle."
			required
		/>
	);
}

export const Textarea: Story = {
	args: {
		label: 'Description',
		name: 'description',
		type: 'textarea',
		rows: 4,
		sanitizeValue: (value) => value.trim(),
	},
};

export const Select: Story = {
	args: {
		label: 'Role',
		name: 'role_id',
		type: 'select',
		required: true,
		children: (
			<>
				<SelectOption value="admin" label="Administrator" />
				<SelectOption value="user" label="User" />
			</>
		),
	},
};

export const Checkbox: Story = {
	args: {
		label: 'Remember me',
		name: 'remember_me',
		type: 'checkbox',
	},
};

export const ImageExtension: Story = {
	args: {
		label: 'Thumbnail',
		name: 'thumbnailId',
		type: 'image',
		renderImage: (inputProps) => (
			<ImagePicker
				{...inputProps}
				loadFile={async (id) => ([1].includes(id) ? { id, url: 'https://placehold.co/600x600' } : null)}
			/>
		),
	},
};

export const ImageFallback: Story = {
	args: {
		label: 'File ID',
		name: 'thumbnailId',
		type: 'image',
	},
};
