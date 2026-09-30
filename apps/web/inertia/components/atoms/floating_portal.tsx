import { useLayoutEffect, useState, ReactNode, RefObject, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface FloatingPortalProps {
	children: ReactNode;
	anchorRef: RefObject<HTMLElement | null> | null;
}

export function FloatingPortal(props: FloatingPortalProps) {
	const { children, anchorRef } = props;
	const [coords, setCoords] = useState({ top: 0, left: 0 });

	const updatePosition = useCallback(() => {
		if (anchorRef && anchorRef.current) {
			const rect = anchorRef.current.getBoundingClientRect();
			setCoords({
				top: rect.bottom + window.scrollY,
				left: rect.left + window.scrollX,
			});
		}
	}, [anchorRef]);

	useLayoutEffect(() => {
		updatePosition();

		window.addEventListener('scroll', updatePosition, true);
		window.addEventListener('resize', updatePosition);

		return () => {
			window.removeEventListener('scroll', updatePosition, true);
			window.removeEventListener('resize', updatePosition);
		};
	}, [updatePosition]);

	return createPortal(
		<div
			style={{
				position: 'absolute',
				top: `${coords.top}px`,
				left: `${coords.left}px`,
				zIndex: 9999,
				pointerEvents: 'auto', // Assure que le clic fonctionne
			}}
		>
			{children}
		</div>,
		document.body,
	);
}
