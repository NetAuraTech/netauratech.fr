import { useRef } from 'react';
import { Heading } from '~/components/atoms/heading';
import { useTextSweep } from '~/hooks/animations/use_text_sweep';
import { ProjectBlockBody } from './body';
import type { ProjectBlock } from '#types/site_content';

/**
 * One `##` chapter of a project story.
 *
 * A hairline-separated block: an oversize heading above its markdown body, the
 * rhythm of the 375 editorial vocabulary. Chapters carry the long-form prose of
 * the project.
 *
 * @example
 * <ProjectChapter block={{ type: 'chapter', title: 'Les trois piliers', body: '…' }} />
 */
export function ProjectChapter({ block }: { block: Extract<ProjectBlock, { type: 'chapter' }> }) {
	const titleRef = useRef<HTMLHeadingElement>(null);

	useTextSweep(titleRef);

	return (
		<article className="mt-20 border-t border-white/10 pt-12 md:mt-28 md:pt-14">
			<Heading ref={titleRef} level={2} className="max-w-3xl text-[clamp(1.75rem,3.5vw,2.75rem)] text-balance">
				{block.title}
			</Heading>
			<div className="mt-8">
				<ProjectBlockBody md={block.body} />
			</div>
		</article>
	);
}
