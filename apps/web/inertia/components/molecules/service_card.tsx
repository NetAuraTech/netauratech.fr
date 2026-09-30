import { CSSProperties } from 'react';
import { Heading } from '~/components/atoms/heading';

interface ServiceCardProps {
	/** Zero-based position in the listing. Drives the `N°` marker. */
	index: number;
	/** Service name, e.g. `'Sites vitrines'`. */
	rubrique: string;
	/** Discrete items describing the service, e.g. `['Design sur mesure', 'SEO & performance']`. */
	items: string[];
}

/**
 * Service offer card.
 *
 * One cell of the public services grid: a numbered header, the service name,
 * and a list of the discrete items it covers. Intended to be rendered inside
 * a `grid gap-px bg-white/10 sm:grid-cols-3` wrapper.
 *
 * @example
 * <ServiceCard index={0} rubrique="Sites vitrines" items={['Design sur mesure', 'SEO & performance']} />
 */
export function ServiceCard(props: ServiceCardProps) {
	const { index, rubrique, items } = props;

	return (
		<article className="service__card group">
			<div className="service__card-header">
				<span className="service__card-header-index">{String(index + 1).padStart(2, '0')}</span>
				<span className="uppercase">NetAuraTech</span>
			</div>
			<Heading level={3}>{rubrique}</Heading>
			<ul className="service__card-footer">
				{items.map((item, k) => (
					<li key={item} className="service__card-footer-item">
						<span className="service__card-footer-dot" style={{ '--i': k } as CSSProperties} aria-hidden="true" />
						{item}
					</li>
				))}
			</ul>
		</article>
	);
}
