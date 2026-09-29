import { createPortal } from 'react-dom';
import { tv } from 'tailwind-variants';
import type { ReactNode, RefObject } from 'react';

const floatingPortal = tv({
	base: 'absolute pointer-events-auto z-[9999] top-0 left-0',
});

interface FloatingPortalProps {
	children: ReactNode;
	/**
	 * Ref to the element the portal floats below. The portal is positioned
	 * directly under this anchor and repositioned on scroll and resize.
	 */
	anchorRef: RefObject<HTMLElement | null> | null;
}

/**
 * Portals its children into `document.body`, positioned directly below the
 * element referenced by `anchorRef` (absolute positioning, above the rest of
 * the page content).
 *
 * Positioning is maintained without React state: the mounted element's
 * `top`/`left` styles are written directly and refreshed on every
 * `scroll` (capture phase) and `resize` event until unmount.
 *
 * @example
 * <div ref={anchorRef}>
 *   <Button onClick={() => setOpen(!open)}>Menu</Button>
 * </div>
 * {open && (
 *   <FloatingPortal anchorRef={anchorRef}>
 *     <Card>Dropdown content</Card>
 *   </FloatingPortal>
 * )}
 */
export function FloatingPortal(props: FloatingPortalProps) {
	const { children, anchorRef } = props;

	const position = (el: HTMLDivElement | null) => {
		if (!el) {
			return () => {};
		}

		const update = () => {
			const anchor = anchorRef?.current;
			if (!anchor) {
				return;
			}

			const rect = anchor.getBoundingClientRect();
			el.style.top = `${rect.bottom + window.scrollY}px`;
			el.style.left = `${rect.left + window.scrollX}px`;
		};

		update();

		window.addEventListener('scroll', update, true);
		window.addEventListener('resize', update);

		return () => {
			window.removeEventListener('scroll', update, true);
			window.removeEventListener('resize', update);
		};
	};

	return createPortal(
		<div ref={position} className={floatingPortal()}>
			{children}
		</div>,
		document.body,
	);
}
