import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useEffect } from 'react';
import type { RefObject } from 'react';

gsap.registerPlugin(ScrollTrigger, SplitText);

export function useTextSweep<T extends HTMLElement>(ref: RefObject<T | null>, scrub = 1.5, stagger = 0.05) {
	useEffect(() => {
		const root = ref.current;
		if (!root) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const ctx = gsap.context(() => {
			const split = new SplitText(root, { type: 'words', deepSlice: true });
			if (!split.words.length) return;

			gsap.set(split.words, { autoAlpha: 0, xPercent: 130 });

			const timeline = gsap.timeline({
				scrollTrigger: {
					trigger: root,
					start: 'top bottom+=130%',
					end: 'bottom top',
					scrub,
				},
			});

			timeline.to(split.words, {
				autoAlpha: 1,
				xPercent: 0,
				stagger,
				ease: 'power4.inOut',
			});
		}, root);

		return () => ctx.revert();
	}, [ref, scrub, stagger]);
}
