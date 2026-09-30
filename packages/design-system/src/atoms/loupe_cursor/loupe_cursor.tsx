import { useEffect, useRef, useState } from 'react';

/**
 * Targeted cursor for the studio: a round difference-blend lens whose rim reads
 * along a circular path and whose center names the action. It appears while the
 * pointer is over a `data-loupe` target (the project plates) and is purely
 * decorative — interactive elements keep native focus and activation.
 * Reduced-motion renders the ring and rim static.
 */
export function LoupeCursor() {
	const [active, setActive] = useState(false);
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
	const elRef = useRef<HTMLDivElement>(null);
	const cursor = useRef({ x: 0, y: 0 });
	const target = useRef({ x: 0, y: 0 });
	const frame = useRef<number | undefined>(undefined);

	useEffect(() => {
		const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		setPrefersReducedMotion(reduceQuery.matches);
		const onReduce = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
		reduceQuery.addEventListener('change', onReduce);

		const onPointerMove = (e: PointerEvent) => {
			target.current.x = e.clientX;
			target.current.y = e.clientY;
			const hovered = e.target instanceof Element ? e.target.closest('[data-loupe]') : null;
			setActive(Boolean(hovered));
		};

		const loop = () => {
			const cur = cursor.current;
			cur.x += (target.current.x - cur.x) * 0.28;
			cur.y += (target.current.y - cur.y) * 0.28;
			if (elRef.current) {
				elRef.current.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0) translate(-50%, -50%) scale(${active ? 1 : 0.85})`;
			}
			frame.current = window.requestAnimationFrame(loop);
		};

		window.addEventListener('pointermove', onPointerMove, { passive: true });
		frame.current = window.requestAnimationFrame(loop);

		return () => {
			reduceQuery.removeEventListener('change', onReduce);
			window.removeEventListener('pointermove', onPointerMove);
			if (frame.current !== undefined) window.cancelAnimationFrame(frame.current);
		};
	}, [active]);

	return (
		<div
			ref={elRef}
			aria-hidden="true"
			className={`pointer-events-none fixed left-0 top-0 z-[999] h-24 w-24 rounded-full mix-blend-difference transition-[opacity,filter] duration-200 ${
				active ? 'opacity-100' : 'opacity-0'
			}`}
			style={{ willChange: 'transform, opacity' }}
		>
			<div className="relative h-full w-full rounded-full border border-white/60 bg-primary-soft/30 backdrop-blur-[1px]">
				<svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
					<defs>
						<path id="revue-loupe-rim" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
					</defs>
					<g
						className={prefersReducedMotion ? '' : 'animate-[spin_13s_linear_infinite]'}
						style={{ transformOrigin: '50% 50%' }}
					>
						<text
							fontSize="9.5"
							letterSpacing="2.4"
							fill="white"
							fontFamily="Space Grotesk, sans-serif"
							fontWeight="bold"
						>
							<textPath href="#revue-loupe-rim">Découvrir · Découvrir · Découvrir ·</textPath>
						</text>
					</g>
				</svg>
			</div>
		</div>
	);
}
