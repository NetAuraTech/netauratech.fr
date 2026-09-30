import { Kicker } from '../../atoms/kicker/kicker';
import { Paragraph } from '../../atoms/paragraph/paragraph';
import type { ProjectBlock } from '../../tokens';

/**
 * Bold-led feature grid of a project story.
 *
 * Each `**Label.**` paragraph becomes a hairline-tiled cell: the label as a
 * mauve-dotted kicker above its body text. The tile grid mirrors the services
 * grid (`gap-px` on `white/10`).
 *
 * @example
 * <ProjectFeatures block={{ type: 'features', items: [{ label: 'Solidité', body: '…' }] }} />
 */
export function ProjectFeatures({ block }: { block: Extract<ProjectBlock, { type: 'features' }> }) {
	return (
		<ul className="mt-16 grid gap-px bg-white/10 md:mt-24 md:grid-cols-2 lg:grid-cols-3">
			{block.items.map((item, i) => (
				<li key={i} className="bg-noir p-8 md:p-10">
					{item.label && <Kicker className="text-primary-soft">{item.label}</Kicker>}
					{item.body && (
						<Paragraph
							fs="base"
							spacing="xs"
							className="mt-6 font-news font-light leading-relaxed text-ink-inverted/70"
						>
							{item.body}
						</Paragraph>
					)}
				</li>
			))}
		</ul>
	);
}
