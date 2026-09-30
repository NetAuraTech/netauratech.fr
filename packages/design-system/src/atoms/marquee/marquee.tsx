import { cn, tv } from 'tailwind-variants';

const marqueeWrapper = tv({
	base: 'overflow-hidden border-y border-white/10 bg-noir py-4',
});

const DEFAULT_RUBRICS = ['Vitrine', 'E-commerce', 'Application web', 'Sur mesure'];

interface MarqueeProps {
	/** Rubrics to scroll, separated by accent dots. Defaults to the studio's trade list. */
	items?: string[];
	/** Additional Tailwind classes. */
	className?: string;
}

/**
 * Studio signature scrolling strip.
 *
 * Renders the trade rubrics as a horizontally scrolling marquee, duplicated
 * twice and separated by accent dots to loop seamlessly. Decorative only — it is
 * never exposed to assistive technology (`aria-hidden`).
 *
 * @example
 * <Marquee />
 *
 * <Marquee items={['Vitrine', 'E-commerce']} />
 */
export function Marquee({ items = DEFAULT_RUBRICS, className }: MarqueeProps) {
	return (
		<div className={cn(marqueeWrapper(), className)} aria-hidden="true">
			<div className="flex w-max items-center gap-10 whitespace-nowrap font-news text-[11px] uppercase tracking-[0.3em] text-ink-inverted/50 animate-marquee">
				{[0, 1].map((half) => (
					<span key={half} className="flex items-center gap-10">
						{Array.from({ length: 4 }).map((_, i) => (
							<span key={i} className="flex items-center gap-10">
								{items.map((item, j) => (
									<span key={j} className="flex items-center gap-10">
										<span>{item}</span>
										<span className="h-1.5 w-1.5 bg-primary-soft" />
									</span>
								))}
							</span>
						))}
					</span>
				))}
			</div>
		</div>
	);
}
