import { createPortal } from 'react-dom';
import { cn, tv } from 'tailwind-variants';
import type { ReactNode } from 'react';

const modal = tv({
	base: 'absolute flex inset-0 items-center justify-center',
});

interface ModalProps {
	children: ReactNode;
	/**
	 * Invoked when the user presses `Escape` or clicks the backdrop.
	 * When omitted, the modal cannot be dismissed by these interactions.
	 */
	handleClose?: () => void;
	/** Additional Tailwind classes merged onto the overlay root. */
	className?: string;
}

/**
 * Centered modal dialog rendered into a portal on `document.body`.
 *
 * Renders a full-viewport overlay with a dark backdrop; clicking the backdrop
 * or pressing `Escape` invokes `handleClose`. The `keydown` listener is
 * attached when the overlay mounts and removed when it unmounts, without any
 * React state.
 *
 * @example
 * {open && (
 *   <Modal handleClose={() => setOpen(false)}>
 *     <Card>Modal content</Card>
 *   </Modal>
 * )}
 */
export function Modal(props: ModalProps) {
	const { children, handleClose, className } = props;

	const onMount = (el: HTMLDivElement | null) => {
		if (!el) {
			return () => {};
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && handleClose) {
				handleClose();
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	};

	return createPortal(
		<div ref={onMount} className={cn(modal(), className)}>
			<div className="absolute inset-0 bg-black/80 z-1000" onClick={handleClose} />
			<div className="relative z-1001">{children}</div>
		</div>,
		document.body,
	);
}
