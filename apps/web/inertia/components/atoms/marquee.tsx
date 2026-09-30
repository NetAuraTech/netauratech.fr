/**
 * Workshop signature scrolling strip.
 *
 * Renders the trade rubrics — Vitrine, E-commerce, Application web, Sur
 * mesure — as a horizontally scrolling marquee, duplicated twice and
 * separated by accent dots to loop seamlessly. It is decorative only and
 * never exposed to assistive technology (`aria-hidden`).
 *
 * @example
 * <Marquee />
 */
export function Marquee() {
	return (
		<div className="marquee__wrapper" aria-hidden="true">
			<div className="marquee">
				{[0, 1].map((k) => (
					<span key={k} className="marquee__item-wrapper">
						{Array.from({ length: 4 }).map((_, i) => (
							<span key={i} className="marquee__item">
								<span>Vitrine</span>
								<span className="marquee__item-separator" />
								<span>E-commerce</span>
								<span className="marquee__item-separator" />
								<span>Application web</span>
								<span className="marquee__item-separator" />
								<span>Sur mesure</span>
								<span className="marquee__item-separator" />
							</span>
						))}
					</span>
				))}
			</div>
		</div>
	);
}
