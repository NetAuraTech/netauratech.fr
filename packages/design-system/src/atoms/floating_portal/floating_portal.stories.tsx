import { useRef, useState, type ReactNode } from 'react';
import { Card } from '../card/card';
import { FloatingPortal } from './floating_portal';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
	title: 'Atoms/FloatingPortal',
	component: FloatingPortal,
} satisfies Meta<typeof FloatingPortal>;

export default meta;
type Story = StoryObj<typeof FloatingPortal>;

function FloatingExample(props: { children: ReactNode }) {
	const anchorRef = useRef<HTMLDivElement>(null);
	const [open, setOpen] = useState(false);

	return (
		<div>
			<div ref={anchorRef} className="w-40">
				<button
					type="button"
					className="button"
					onClick={() => {
						setOpen(!open);
					}}
				>
					Toggle portal
				</button>
			</div>
			{open && (
				<FloatingPortal anchorRef={anchorRef}>
					<Card>{props.children}</Card>
				</FloatingPortal>
			)}
		</div>
	);
}

export const Base: Story = {
	render: () => <FloatingExample>Floating content positioned below the anchor.</FloatingExample>,
};
