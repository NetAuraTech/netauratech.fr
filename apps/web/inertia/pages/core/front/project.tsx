import { SharedProps } from '@adonisjs/inertia/types';
import { Button } from '@foundry/design-system/button';
import { ContactForm } from '@foundry/design-system/contact-form';
import { Container } from '@foundry/design-system/container';
import { Heading } from '@foundry/design-system/heading';
import { Kicker } from '@foundry/design-system/kicker';
import { LoupeCursor } from '@foundry/design-system/loupe-cursor';
import { Marquee } from '@foundry/design-system/marquee';
import { Paragraph } from '@foundry/design-system/paragraph';
import { ProjectBlocks } from '@foundry/design-system/project-blocks';
import { ProjectCover } from '@foundry/design-system/project-cover';
import { Section } from '@foundry/design-system/section';
import { SectionHeader } from '@foundry/design-system/section-header';
import { Link, usePage } from '@inertiajs/react';
import { urlFor } from '~/client';
import { SeoHead } from '~/components/atoms/seo_head';
import { breadcrumbJsonLd, businessJsonLd } from '~/helpers/structured_data';
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
 * The page opens on the project's typographic title page (the `ProjectCover`
 * organism, which owns its gallery lightbox) — the numbered rubrique, the
 * display headline, the editorial note and the project gallery — then flows
 * into the editorial story rendered by the `ProjectBlocks` organism, a closing
 * CTA back to the portfolio, a lead to the next project, and the shared contact
 * form. This page only resolves content, hrefs and the document head.
 */
export default function ProjectPage(props: ProjectPageProps) {
	const { project, projects } = props;
	const { props: sharedProps } = usePage<SharedProps>();
	const { app_name, app_url, legal_identity } = sharedProps;

	const index = projects.findIndex((entry) => entry.slug === project.slug);
	const next = projects.length > 0 ? projects[(index + 1) % projects.length] : null;
	const coverImages = project.blocks.flatMap((block) => (block.type === 'gallery' ? block.images : []));
	const storyBlocks = project.blocks.filter((block) => block.type !== 'gallery');
	const nextHref = next ? urlFor('core.projects.show.render', { slug: next.slug }) : undefined;

	const seoTitle = project.metaTitle
		? `${project.metaTitle} — ${app_name}`
		: `${project.title} — ${project.rubrique} — ${app_name}`;
	const seoDescription = project.metaDescription ?? project.note;

	return (
		<>
			<LoupeCursor />
			<SeoHead
				title={seoTitle}
				description={seoDescription}
				image={project.coverFile?.url}
				imageWidth={project.coverFile?.width}
				imageHeight={project.coverFile?.height}
				jsonLd={[
					businessJsonLd({ appUrl: app_url, appName: app_name, identity: legal_identity }),
					breadcrumbJsonLd([
						{ name: 'Accueil', url: `${app_url}/` },
						{ name: 'Projets', url: `${app_url}/projets` },
						{ name: project.title },
					]),
				]}
			/>
			<ProjectCover
				index={index}
				rubrique={project.rubrique}
				title={project.title}
				note={project.note}
				appName={app_name}
				images={coverImages}
			/>
			<Marquee />
			<Section id="projet" variant="front" className="overflow-x-clip">
				<Container>
					<SectionHeader kicker="Le projet" index="01">
						Un projet écrit à la <em>main</em>.
					</SectionHeader>
					<div className="mt-6">
						<ProjectBlocks blocks={storyBlocks} />
					</div>
					<div className="mt-12 flex flex-wrap items-start justify-between gap-8 border-t border-ink-inverted/12 pt-6">
						<Paragraph fs="xs" spacing="xs" className="font-news tracking-[0.3em]" uppercase>
							{project.rubrique} — {app_name}
						</Paragraph>
						<Button variant="secondary" href={urlFor('core.projects.render')} fitContent>
							Voir tous les projets
						</Button>
					</div>
				</Container>
			</Section>
			{next && nextHref && (
				<Section variant="front" className="overflow-x-clip border-t border-white/10">
					<Container>
						<div className="flex items-start justify-between gap-6">
							<div>
								<Kicker>Projet suivant</Kicker>
								<Link href={nextHref} className="mt-8 block">
									<Heading level={2} className="max-w-3xl text-balance">
										{next.title}
									</Heading>
								</Link>
								<Paragraph className="mt-4 max-w-3xl font-news font-light leading-relaxed text-ink-inverted/70">
									{next.note}
								</Paragraph>
							</div>
							<Link href={nextHref} className="mt-12 text-primary-soft" aria-label={`Voir le projet ${next.title}`}>
								<span className="block text-3xl leading-none md:text-5xl" aria-hidden="true">
									→
								</span>
							</Link>
						</div>
					</Container>
				</Section>
			)}
			<ContactForm
				email={sharedProps.email}
				title={
					<>
						Un projet <em>similaire</em> en tête ?
					</>
				}
			/>
		</>
	);
}
