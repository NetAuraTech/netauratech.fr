import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect } from 'react';
import type { RefObject } from 'react';

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll-driven "breathing" of the plate image, in the 375 vocabulary.
 * As the plate crosses the viewport the image's media layer widens
 * horizontally (up to 110%) and narrows back, peaking when the plate is
 * centered. Because it is the layout box — not a transform — that grows,
 * `object-cover` re-crops and reveals more of the picture without any
 * distortion, and the image is allowed to spill past the plate's frame.
 * Reduced-motion leaves the plate static.
 *
 * Assumes the plate is an `<article>` (no `overflow-hidden`) with an
 * absolute `[data-plate-media]` layer whose `<img>` fills it via
 * `inset-0 h-full w-full object-cover`.
 */
export function useProjectPlate<T extends HTMLElement>(ref: RefObject<T | null>) {
	useEffect(() => {
		const root = ref.current;
		if (!root) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const ctx = gsap.context(() => {
			const media = root.querySelector<HTMLElement>('[data-plate-media]');
			if (!media) return;

			const timeline = gsap.timeline({
				scrollTrigger: {
					trigger: root,
					start: 'top bottom',
					end: 'bottom top',
					scrub: 1.5,
				},
			});

			timeline.to(media, {
				keyframes: [
					{ left: '-5%', right: '-5%', duration: 0.5, ease: 'none' },
					{ left: '0%', right: '0%', duration: 0.5, ease: 'none' },
				],
			});
		}, root);

		return () => ctx.revert();
	}, [ref]);
}
