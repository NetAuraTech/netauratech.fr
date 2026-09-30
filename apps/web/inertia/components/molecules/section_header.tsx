import { ReactNode, Ref } from 'react';
import { Heading } from '~/components/atoms/heading';
import { Kicker } from '~/components/atoms/kicker';

interface SectionHeaderProps {
	/**
	 * Uppercase label rendered next to the accent dot on the left of the header row.
	 */
	kicker: string;
	/**
	 * Zero-padded section index rendered on the right of the header row, e.g. `'01'`.
	 */
	index: string;
	/**
	 * Optional ref forwarded to the title, used by the text-sweep scroll hooks.
	 */
	titleRef?: Ref<HTMLHeadingElement> | undefined;
	/**
	 * Section title. An emphasized word may be wrapped in `<em>` — it is
	 * automatically italicized and colored with the accent, per the
	 * Italic-Accent rule.
	 */
	children: ReactNode;
}

/**
 * Editorial section header used on the front pages.
 *
 * Renders the uniform section heading: a kicker row with the accent dot and
 * label on the left and the section index on the right, followed by the
 * section title. The title is always left-aligned and sized with the headline
 * clamp regardless of the surrounding section wrapper.
 *
 * @example
 * <SectionHeader kicker="Projets" index="01" titleRef={titleRef}>
 *   Le travail d'abord.
 * </SectionHeader>
 */
export function SectionHeader(props: SectionHeaderProps) {
	const { kicker, index, titleRef, children } = props;

	return (
		<>
			<div className="section__header">
				<Kicker>{kicker}</Kicker>
				<span className="section__header-index" aria-hidden="true">
					{index}
				</span>
			</div>
			<Heading level={2} ref={titleRef}>
				{children}
			</Heading>
		</>
	);
}
