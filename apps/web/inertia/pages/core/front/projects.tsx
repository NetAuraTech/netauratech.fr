import { SharedProps } from '@adonisjs/inertia/types';
import { LoupeCursor } from '@foundry/design-system/loupe-cursor';
import { ProjectsShowcase, type ShowcaseEntry } from '@foundry/design-system/projects-showcase';
import { usePage } from '@inertiajs/react';
import { urlFor } from '~/client';
import { SeoHead } from '~/components/atoms/seo_head';
import { businessJsonLd, projectItemListJsonLd } from '~/helpers/structured_data';
import type { SiteProject } from '#types/site_content';

interface ProjectsPageProps {
	translations: Record<string, string>;
	projects: SiteProject[];
}

/**
 * Portfolio listing of the public front, in the 375 vocabulary.
 *
 * The sealed two-column frame (pinned hero on the left, the infinite
 * self-scrolling project list on the right), the category filter and the WebGL
 * image deformation are all owned by the `ProjectsShowcase` organism — this
 * page only resolves content, hrefs and the document head.
 */
export default function ProjectsPage(props: ProjectsPageProps) {
	const { projects } = props;
	const { props: sharedProps } = usePage<SharedProps>();
	const { app_name, app_url, legal_identity } = sharedProps;

	const entries: ShowcaseEntry[] = projects.map((project, i) => ({
		index: i,
		title: project.title,
		coverFile: project.coverFile,
		rubrique: project.rubrique,
		href: urlFor('core.projects.show.render', { slug: project.slug }),
	}));

	return (
		<>
			<LoupeCursor />
			<SeoHead
				title={`Projets — Sites vitrines, e-commerce et applications web — ${app_name}`}
				description="Le portfolio NetAuraTech : sites vitrines, boutiques en ligne et applications web entièrement sur mesure, conçus pour votre métier et votre croissance."
				jsonLd={[
					businessJsonLd({ appUrl: app_url, appName: app_name, identity: legal_identity }),
					projectItemListJsonLd(app_url, app_name, projects),
				]}
			/>
			<ProjectsShowcase
				kicker={`${app_name} — Projets`}
				title={
					<>
						Des projets pensés pour <em>tenir</em> leurs promesses.
					</>
				}
				lede="Du site vitrine au e-commerce, en passant par les applications web : un aperçu du travail écrit à la main, de la conception à la mise en service."
				projects={entries}
			/>
		</>
	);
}
