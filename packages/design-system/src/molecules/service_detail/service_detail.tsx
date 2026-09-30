import Markdown from 'react-markdown';
import { Heading } from '../../atoms/heading/heading';
import { Paragraph } from '../../atoms/paragraph/paragraph';
import type { ServiceOffer } from '../../tokens';

interface ServiceDetailProps {
	/** Zero-based position in the listing. Drives the `N°` marker. */
	index: number;
	/** The parsed service offer. */
	service: ServiceOffer;
}

/**
 * Full service offer block of the public services page.
 *
 * One numbered editorial section per offer: the rubrique, the discrete items as
 * outlined tags, the markdown description, and the trailing `Inclus` / `Tarif`
 * facts lifted out of the source file. The description is rendered with
 * `react-markdown` so bold accents keep their semantic meaning.
 *
 * @example
 * <ServiceDetail index={0} service={service} />
 */
export function ServiceDetail({ index, service }: ServiceDetailProps) {
	return (
		<article className="border-t border-white/10 py-16 md:py-24">
			<div className="flex items-baseline justify-between gap-6">
				<span className="font-news text-[11px] tracking-[0.2em] text-primary-soft" aria-hidden="true">
					{String(index + 1).padStart(2, '0')}
				</span>
				<Heading level={3}>{service.rubrique}</Heading>
			</div>

			<ul className="mt-8 flex flex-wrap gap-2.5">
				{service.items.map((item) => (
					<li
						key={item}
						className="flex items-center gap-2 border border-ink-inverted/20 px-4 py-2 font-news text-[11px] uppercase tracking-[0.2em] text-ink-inverted/60"
					>
						<span className="h-1 w-1 bg-primary-soft" aria-hidden="true" />
						{item}
					</li>
				))}
			</ul>

			<div className="mt-10">
				<Markdown
					components={{
						p: ({ children }) => (
							<Paragraph
								fs={['base', 'md:lg']}
								spacing="base"
								className="max-w-3xl font-news font-light leading-relaxed"
							>
								{children}
							</Paragraph>
						),
						strong: ({ children }) => <strong className="font-semibold text-primary-soft">{children}</strong>,
					}}
				>
					{service.description}
				</Markdown>
			</div>

			{(service.inclus || service.tarif) && (
				<dl className="mt-10 grid gap-4 md:grid-cols-2">
					{service.inclus && (
						<div className="border-l-2 border-primary-soft bg-white/5 p-6 md:p-8">
							<dt className="font-news text-[11px] uppercase tracking-[0.3em] text-primary-soft">Inclus</dt>
							<dd className="mt-3 font-news text-base font-light leading-relaxed text-ink-inverted/80">
								{service.inclus}
							</dd>
						</div>
					)}
					{service.tarif && (
						<div className="border-l-2 border-primary-soft bg-white/5 p-6 md:p-8">
							<dt className="font-news text-[11px] uppercase tracking-[0.3em] text-primary-soft">Tarif</dt>
							<dd className="mt-3 font-news text-base font-light leading-relaxed text-ink-inverted/80">
								{service.tarif}
							</dd>
						</div>
					)}
				</dl>
			)}
		</article>
	);
}
