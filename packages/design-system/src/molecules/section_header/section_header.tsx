import { useRef } from 'react';
import { Heading } from '../../atoms/heading/heading';
import { Kicker } from '../../atoms/kicker/kicker';
import { useTextSweep } from '../../shared/use_text_sweep';
import type { ReactNode } from 'react';

interface SectionHeaderProps {
	/** Uppercase label rendered next to the accent dot on the left of the header row. */
	kicker: string;
	/** Zero-padded section index rendered on the right of the header row, e.g. `'01'`. */
	index: string;
	/**
	 * Section title. An emphasized word may be wrapped in `<em>` — it is
	 * automatically italicized and colored with the accent.
	 */
	children: ReactNode;
}

/**
 * Editorial section header used on the front pages.
 *
 * Renders the uniform section heading: a kicker row with the accent dot and
 * label on the left and the section index on the right, followed by the section
 * title, which sweeps in as it scrolls into view.
 *
 * @example
 * <SectionHeader kicker="Projets" index="01">
 *   Le travail d'abord.
 * </SectionHeader>
 */
export function SectionHeader({ kicker, index, children }: SectionHeaderProps) {
	const titleRef = useRef<HTMLHeadingElement>(null);
	useTextSweep(titleRef);

	return (
		<>
			<div className="mb-8 flex items-center justify-between">
				<Kicker>{kicker}</Kicker>
				<span className="font-news text-[11px] tracking-[0.3em] text-primary-soft" aria-hidden="true">
					{index}
				</span>
			</div>
			<Heading level={2} ref={titleRef}>
				{children}
			</Heading>
		</>
	);
}
