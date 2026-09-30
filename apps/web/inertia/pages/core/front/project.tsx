import { Link } from '@adonisjs/inertia/react';
import { SharedProps } from '@adonisjs/inertia/types';
import { usePage } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import { useRef } from 'react';
import { Button } from '~/components/atoms/button';
import { Container } from '~/components/atoms/container';
import { Heading } from '~/components/atoms/heading';
import { Kicker } from '~/components/atoms/kicker';
import { LoupeCursor } from '~/components/atoms/loupe_cursor';
import { Marquee } from '~/components/atoms/marquee';
import { Paragraph } from '~/components/atoms/paragraph';
import { Section } from '~/components/atoms/section';
import { ProjectBlocks } from '~/components/molecules/project_block';
import { SectionHeader } from '~/components/molecules/section_header';
import { ContactForm } from '~/components/organisms/contact_form';
import { ProjectCover } from '~/components/organisms/project_cover';
import { useTextSweep } from '~/hooks/animations/use_text_sweep';
import type { SiteProject } from '#types/site_content';

interface ProjectPageProps {
	translations: Record<string, string>;
	project: SiteProject;
	/** The ordered project catalogue, used to lead to the next project. */
	projects: SiteProject[];
}

/**
 * Single project page of the public front, in the 375 vocabulary.
 *
 * The page opens on the project's typographic title page — the numbered
 * rubrique, the display headline, the editorial note and the project gallery
 * rendered as a framed figure cluster — then flows into the editorial story:
 * the markdown description of the committed source
 * (`content/projects/{slug}.md`) rendered as a lede and hairline-separated
 * chapters, a closing CTA back to the portfolio, a lead to the next project,
 * and the shared contact form.
 */
export default function ProjectPage(props: ProjectPageProps) {
	const { project, projects } = props;
	const { props: sharedProps } = usePage<SharedProps>();
	const { app_name } = sharedProps;
	const projectTitleRef = useRef<HTMLHeadingElement>(null);

	useTextSweep(projectTitleRef);

	const index = projects.findIndex((entry) => entry.slug === project.slug);
	const next = projects.length > 0 ? projects[(index + 1) % projects.length] : null;
	const coverImages = project.blocks.flatMap((block) => (block.type === 'gallery' ? block.images : []));
	const storyBlocks = project.blocks.filter((block) => block.type !== 'gallery');

	return (
		<>
			<LoupeCursor />
			<Head>
				<title>{`${project.title} — ${project.rubrique} — ${app_name}`}</title>
				<meta name="description" content={project.note} />
			</Head>
			<ProjectCover
				index={index}
				rubrique={project.rubrique}
				title={project.title}
				note={project.note}
				appName={app_name}
				images={coverImages}
			/>
			<Marquee />
			<Section id="projet" className="overflow-x-clip">
				<Container>
					<SectionHeader kicker="Le projet" index="01" titleRef={projectTitleRef}>
						Un projet écrit à la <em>main</em>.
					</SectionHeader>
					<div className="mt-6">
						<ProjectBlocks blocks={storyBlocks} />
					</div>
					<div className="section__footer">
						<Paragraph fs="xs" spacing="xs" className="font-news tracking-[0.3em]" uppercase>
							{project.rubrique} — {app_name}
						</Paragraph>
						<Button variant="secondary" route="core.projects.render" fitContent>
							Voir tous les projets
						</Button>
					</div>
				</Container>
			</Section>
			{next && (
				<Section className="overflow-x-clip border-t border-white/10">
					<Container>
						<div className="flex items-start justify-between gap-6">
							<div>
								<Kicker>Projet suivant</Kicker>
								<Link route="core.projects.show.render" routeParams={{ slug: next.slug }} className="mt-8 block">
									<Heading level={2} className="max-w-3xl text-balance">
										{next.title}
									</Heading>
								</Link>
								<Paragraph className="mt-4 max-w-3xl font-news font-light leading-relaxed text-ink-inverted/70">
									{next.note}
								</Paragraph>
							</div>
							<Link
								route="core.projects.show.render"
								routeParams={{ slug: next.slug }}
								className="mt-12 text-primary-soft"
								aria-label={`Voir le projet ${next.title}`}
							>
								<span className="block text-3xl leading-none md:text-5xl" aria-hidden="true">
									→
								</span>
							</Link>
						</div>
					</Container>
				</Section>
			)}
			<ContactForm
				title={
					<>
						Un projet <em>similaire</em> en tête ?
					</>
				}
			/>
		</>
	);
}
