import { Heading } from '../../atoms/heading/heading';

interface ServiceCardProps {
	/** Zero-based position in the listing. Drives the `N°` marker. */
	index: number;
	/** Service name, e.g. `'Sites vitrines'`. */
	rubrique: string;
	/** Discrete items describing the service, e.g. `['Design sur mesure', 'SEO & performance']`. */
	items: string[];
	/** Brand label rendered on the right of the card header. */
	label?: string;
}

/**
 * Service offer card.
 *
 * One cell of the public services grid: a numbered header, the service name,
 * and a list of the discrete items it covers. Intended to be rendered inside a
 * `grid gap-px bg-white/10 sm:grid-cols-3` wrapper.
 *
 * @example
 * <ServiceCard index={0} rubrique="Sites vitrines" items={['Design sur mesure', 'SEO & performance']} />
 */
export function ServiceCard({ index, rubrique, items, label }: ServiceCardProps) {
	return (
		<article className="group bg-noir p-8 transition-colors md:p-10">
			<div className="mb-8 flex items-baseline justify-between border-b border-white/10 pb-4 font-news text-[11px] tracking-[0.2em] text-ink-inverted/40">
				<span className="inline-block text-primary-soft transition-[transform,color,scale] duration-250 ease-in-out group-hover:scale-125 motion-reduce:transform-none motion-reduce:transition-none">
					{String(index + 1).padStart(2, '0')}
				</span>
				{label && <span className="uppercase">{label}</span>}
			</div>
			<Heading level={3}>{rubrique}</Heading>
			<ul className="mt-6 space-y-3">
				{items.map((item, k) => (
					<li key={item} className="flex items-center gap-3 font-news text-sm font-light text-ink-inverted/60">
						<span
							aria-hidden="true"
							className="h-1 w-1 bg-primary-soft transition-transform duration-250 ease-in-out group-hover:scale-[1.8] motion-reduce:transform-none motion-reduce:transition-none"
							style={{ transitionDelay: `${0.02 + k * 0.04}s` }}
						/>
						{item}
					</li>
				))}
			</ul>
		</article>
	);
}
