import { Heading } from '@foundry/design-system/heading';
import type { ReactNode } from 'react';

interface LegalSectionProps {
	/** Zero-padded section index rendered on the right of the title row, e.g. `'01'`. */
	index: string;
	/** Section title, rendered on the left of the title row. */
	title: string;
	/** Section body — paragraphs, lists and detail rows. */
	children: ReactNode;
}

/**
 * Numbered legal content section shared by the legal notices and privacy pages.
 *
 * Reuses the `ServiceDetail` title row of the services page as-is: the section
 * title on the left, the accent index on the right, above a hairline border —
 * followed by the section body.
 *
 * @example
 * <LegalSection index="01" title="Éditeur du site">
 *   …
 * </LegalSection>
 */
export function LegalSection(props: LegalSectionProps) {
	const { index, title, children } = props;

	return (
		<article className="border-t border-white/10 py-10">
			<div className="flex items-baseline justify-between gap-6">
				<Heading level={3}>{title}</Heading>
				<span className="font-news text-[11px] tracking-[0.2em] text-primary-soft" aria-hidden="true">
					{index}
				</span>
			</div>
			<div className="mt-8 max-w-3xl space-y-4">{children}</div>
		</article>
	);
}
