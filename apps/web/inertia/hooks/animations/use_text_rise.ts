import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { useEffect } from 'react';
import type { RefObject } from 'react';

gsap.registerPlugin(SplitText);

interface UseTextRiseOptions {
	delay?: number;
	duration?: number;
	stagger?: number;
	from?: 'start' | 'center' | 'end' | 'edges' | 'random';
	ease?: string;
}

export function useTextRise<T extends HTMLElement>(
	ref: RefObject<T | null>,
	{ delay = 0, duration = 0.75, stagger = 0.3, from = 'random', ease = 'circ.out' }: UseTextRiseOptions = {},
) {
	useEffect(() => {
		const root = ref.current;
		if (!root) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const split = new SplitText(root, {
			type: 'lines, chars',
			linesClass: 'lineIn',
			deepSlice: true,
		});
		gsap.set(split.chars, { opacity: 0, yPercent: 100 });

		const timeline = gsap.timeline({ delay });
		timeline.to(split.chars, {
			opacity: 1,
			yPercent: 0,
			stagger: { amount: stagger, from },
			duration,
			ease,
		});

		return () => {
			timeline.kill();
			split.revert();
		};
	}, [ref, delay, duration, stagger, from, ease]);
}
