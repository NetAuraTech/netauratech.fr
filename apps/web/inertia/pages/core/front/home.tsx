import { SharedProps } from '@adonisjs/inertia/types';
import { Button } from '@foundry/design-system/button';
import { ContactForm } from '@foundry/design-system/contact-form';
import { Container } from '@foundry/design-system/container';
import { Hero } from '@foundry/design-system/hero';
import { LoupeCursor } from '@foundry/design-system/loupe-cursor';
import { Marquee } from '@foundry/design-system/marquee';
import { Paragraph } from '@foundry/design-system/paragraph';
import { ProjectPlate } from '@foundry/design-system/project-plate';
import { Section } from '@foundry/design-system/section';
import { SectionHeader } from '@foundry/design-system/section-header';
import { ServiceCard } from '@foundry/design-system/service-card';
import { usePage } from '@inertiajs/react';
import { urlFor } from '~/client';
import { SeoHead } from '~/components/atoms/seo_head';
import { businessJsonLd } from '~/helpers/structured_data';
import type { HomeTranslations } from '#transport/core/helpers/i18n_payloads/home';
import type { SiteProject, SiteService } from '#types/site_content';

interface HomePageProps {
	translations: HomeTranslations;
	services: SiteService[];
	projects: SiteProject[];
}

export default function HomePage(props: HomePageProps) {
	const { services, projects } = props;
	const { props: sharedProps } = usePage<SharedProps>();
	const { app_name, app_url, email, legal_identity } = sharedProps;

	return (
		<>
			<LoupeCursor />
			<SeoHead
				title={`Créez un site web unique qui propulse votre activité — ${app_name}`}
				description="Développement web sur mesure : sites vitrines, boutiques en ligne et applications web entièrement personnalisés. Code 100 % sur mesure, performances exceptionnelles."
				jsonLd={[
					businessJsonLd({
						appUrl: app_url,
						appName: app_name,
						email,
						identity: legal_identity,
						services,
					}),
				]}
			/>
			<Hero
				kicker={`${app_name} — Développement web sur mesure`}
				title={
					<>
						Créez un site web <em className="italic text-primary-soft">unique</em> qui{' '}
						<em className="italic text-primary-soft">propulse</em> votre activité.
					</>
				}
				titleDelay={0.955}
				lede={
					<>
						Sites vitrines, boutiques en ligne et applications web entièrement personnalisés. Code 100 % sur mesure,
						performances exceptionnelles et accompagnement continu.
					</>
				}
				actions={
					<>
						<Button variant="primary" href="#contact" fitContent>
							Démarrer un projet
						</Button>
						<Button variant="secondary" href="#projets" fitContent>
							Voir les projets
						</Button>
					</>
				}
			/>
			<Marquee />
			<Section id="projets" variant="front" className="overflow-x-hidden">
				<Container>
					<SectionHeader kicker="Projets" index="01">
						Le travail d'abord.
					</SectionHeader>
				</Container>
				<div className="mt-14">
					{projects.map((project, i) => (
						<ProjectPlate
							key={project.title}
							index={i}
							title={project.title}
							note={project.note}
							rubrique={project.rubrique}
							coverFile={project.coverFile}
							href={urlFor('core.projects.show.render', { slug: project.slug })}
						/>
					))}
				</div>
			</Section>
			<Section id="services" variant="front" className="overflow-x-clip">
				<Container>
					<SectionHeader kicker="Services" index="02">
						Trois façons de <em>travailler</em> ensemble.
					</SectionHeader>
					<div className="mt-14 will-change-transform grid gap-px bg-white/10 sm:grid-cols-3">
						{services.map((service, i) => (
							<ServiceCard key={service.rubrique} index={i} rubrique={service.rubrique} items={service.items} />
						))}
					</div>
					<div className="mt-12 flex flex-wrap items-start justify-between gap-8 border-t border-ink-inverted/12 pt-6">
						<Paragraph fs="xs" spacing="xs" className="font-news tracking-[0.3em]" uppercase>
							Trois offres, une seule exigence.
						</Paragraph>
						<Button variant="secondary" href={urlFor('core.services.render')} fitContent>
							Voir tous les services
						</Button>
					</div>
				</Container>
			</Section>
			<Section id="studio" variant="front" className="overflow-x-clip">
				<Container>
					<SectionHeader kicker="Le studio" index="03">
						Un développeur, votre <em>exigence</em>.
					</SectionHeader>
					<div className="mt-12 flex flex-wrap items-start justify-between gap-8 border-t border-ink-inverted/12 pt-6">
						<Paragraph className="max-w-160">
							Chez NetAuraTech, chaque site est écrit à la main. Pas de template, pas de plateforme à abonnement : un
							code 100 % sur mesure, pensé pour votre métier, votre audience et votre croissance.
						</Paragraph>
						<Button variant="secondary" href={`#`} fitContent>
							En savoir plus
						</Button>
					</div>
				</Container>
			</Section>
			<ContactForm
				index="04"
				email={sharedProps.email}
				title={
					<>
						Prêt à créer votre site web <em>sur mesure</em> ?
					</>
				}
			/>
		</>
	);
}
