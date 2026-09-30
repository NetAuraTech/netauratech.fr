import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { useEffect } from 'react';
import type { RefObject } from 'react';

gsap.registerPlugin(SplitText);

/**
 * Letter hover effect for buttons, in the studio vocabulary. The button's
 * `[data-roll]` label is split into masked letters: each char holds two
 * stacked copies and slides down on hover so the copy above rolls into place
 * (staggered, `power4.inOut`), snapping back on leave.
 *
 * With `shuffled` the letters roll in a random order — the loose, hand-made
 * feel — otherwise they roll from the first letter. Only text-only labels are
 * animated — buttons carrying icons are left untouched. Reduced-motion
 * renders the plain label.
 *
 * @example
 * const ref = useRef<HTMLButtonElement>(null);
 * useButtonText(ref);
 */
export function useButtonText<T extends HTMLElement>(ref: RefObject<T | null>, shuffled = false) {
	useEffect(() => {
		const root = ref.current;
		if (!root) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const label = root.querySelector<HTMLElement>('[data-roll]');
		if (!label) return;
		if (label.children.length > 0) return;

		const cleanups: (() => void)[] = [];

		const ctx = gsap.context(() => {
			const split = new SplitText(label, { type: 'chars', charsClass: 'roll-letter' });

			let timeline: gsap.core.Timeline;
			let onEnter: () => void;
			let onLeave: () => void;

			split.chars.forEach((char) => {
				const el = char as HTMLElement;
				el.style.display = 'inline-block';
				el.style.position = 'relative';

				const visible = document.createElement('span');
				const above = document.createElement('span');
				visible.textContent = char.textContent;
				above.textContent = char.textContent;
				above.style.position = 'absolute';
				above.style.bottom = '100%';
				above.style.left = '0';
				char.replaceChildren(visible, above);
			});

			timeline = gsap.timeline({ paused: true });
			timeline.to(split.chars, {
				yPercent: 100,
				ease: 'power4.inOut',
				stagger: { each: 0.04, from: shuffled ? 'random' : 'start' },
			});

			onEnter = () => timeline.play();
			onLeave = () => timeline.pause(0);
			root.addEventListener('mouseenter', onEnter);
			root.addEventListener('mouseleave', onLeave);

			cleanups.push(() => {
				root.removeEventListener('mouseenter', onEnter);
				root.removeEventListener('mouseleave', onLeave);
			});
		}, root);

		return () => {
			cleanups.forEach((cleanup) => cleanup());
			ctx.revert();
		};
	}, [ref, shuffled]);
}
