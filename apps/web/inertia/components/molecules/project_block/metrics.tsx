import type { ProjectBlock } from '#types/site_content';

/**
 * Key figures of a project story.
 *
 * One tracked index per figure, in a hairline-tiled row — the factual pulse
 * (stack, counts, tonality) without a single block of prose.
 *
 * @example
 * <ProjectMetrics block={{ type: 'metrics', items: ['AdonisJS · React · TypeScript', '3 piliers'] }} />
 */
export function ProjectMetrics({ block }: { block: Extract<ProjectBlock, { type: 'metrics' }> }) {
	return (
		<ul className="mt-20 grid gap-px bg-white/10 md:mt-24 md:grid-cols-2 lg:grid-cols-3">
			{block.items.map((item, i) => (
				<li key={item} className="bg-[#050505] px-6 py-8 md:px-10 md:py-10">
					<span className="font-news text-[11px] tracking-[0.3em] text-primary-soft">
						{String(i + 1).padStart(2, '0')}
					</span>
					<p className="mt-4 font-news text-lg font-light leading-relaxed text-ink-inverted/80">{item}</p>
				</li>
			))}
		</ul>
	);
}
