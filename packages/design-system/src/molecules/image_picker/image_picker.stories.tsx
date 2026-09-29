import { useState } from 'react';
import { Button } from '../../atoms/button/button';
import { Card } from '../../atoms/card/card';
import { ImagePicker, type PickedFile } from './image_picker';
import type { Meta, StoryObj } from '@storybook/react';

const files: PickedFile[] = [
	{ id: 1, url: 'https://placehold.co/600x600/1f2937/ffffff?text=One' },
	{ id: 2, url: 'https://placehold.co/600x600/0ea5e9/ffffff?text=Two' },
	{ id: 3, url: 'https://placehold.co/600x600/22c55e/ffffff?text=Three' },
];

const loadFile = async (id: number): Promise<PickedFile | null> => {
	return files.find((file) => file.id === id) ?? null;
};

const StoryFileManager = (props: { onChoose: (file: PickedFile) => void; onClose: () => void }) => {
	const { onChoose, onClose } = props;

	return (
		<Card className="fixed inset-0 z-50 bg-surface" padding="p-4">
			<div className="mb-4 flex items-center justify-between">
				<span className="text-sm font-bold">Story file manager</span>
				<Button type="button" variant="icon" fitContent onClick={onClose}>
					✕
				</Button>
			</div>
			<div className="grid grid-cols-3 gap-3">
				{files.map((file) => (
					<button
						key={file.id}
						type="button"
						className="aspect-square overflow-hidden rounded-xl border border-edge"
						onClick={() => onChoose(file)}
					>
						<img src={file.url} alt={`File ${file.id}`} className="h-full w-full object-cover" />
					</button>
				))}
			</div>
		</Card>
	);
};

const meta = {
	title: 'Molecules/ImagePicker',
	component: ImagePicker,
} satisfies Meta<typeof ImagePicker>;

export default meta;
type Story = StoryObj<typeof ImagePicker>;

export const Empty: Story = {
	args: {
		name: 'thumbnailId',
	},
};

export const WithPreview: Story = {
	render: function WithPreviewPicker() {
		const [value, setValue] = useState<string>('1');

		return (
			<ImagePicker
				name="thumbnailId"
				defaultValue={value}
				loadFile={loadFile}
				onChange={(event) => setValue(event.target.value)}
				renderFileManager={(onChoose, onClose) => <StoryFileManager onChoose={onChoose} onClose={onClose} />}
			/>
		);
	},
};
