import { SharedProps } from '@adonisjs/inertia/types';
import { usePage } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import { useRef } from 'react';
import { Button } from '~/components/atoms/button';
import { Container } from '~/components/atoms/container';
import { LoupeCursor } from '~/components/atoms/loupe_cursor';
import { Marquee } from '~/components/atoms/marquee';
import { Paragraph } from '~/components/atoms/paragraph';
import { Section } from '~/components/atoms/section';
import { ProjectPlate } from '~/components/molecules/project_plate';
import { SectionHeader } from '~/components/molecules/section_header';
import { ServiceCard } from '~/components/molecules/service_card';
import { ContactForm } from '~/components/organisms/contact_form';
import { Hero } from '~/components/organisms/hero';
import { useTextSweep } from '~/hooks/animations/use_text_sweep';
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
	const { app_name, app_url } = sharedProps;
	const workFirstTitleRef = useRef<HTMLHeadingElement>(null);
	const servicesTitleRef = useRef<HTMLHeadingElement>(null);
	const devTitleRef = useRef<HTMLHeadingElement>(null);

	useTextSweep(workFirstTitleRef);
	useTextSweep(servicesTitleRef);
	useTextSweep(devTitleRef);

	return (
		<>
			<LoupeCursor />
			<Head>
				<title>{`Créez un site web unique qui propulse votre activité — ${app_name}`}</title>
				<meta
					name="description"
					content="Développement web sur mesure : sites vitrines, boutiques en ligne et applications web entièrement personnalisés. Code 100 % sur mesure, performances exceptionnelles."
				/>
				<link rel="canonical" href={app_url} />
			</Head>
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
			<Section id="projets" className="overflow-x-hidden pt-20 md:pt-28">
				<Container>
					<SectionHeader kicker="Projets" index="01" titleRef={workFirstTitleRef}>
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
							route="core.projects.show.render"
							routeParams={{ slug: project.slug }}
						/>
					))}
				</div>
			</Section>
			<Section id="services" className="overflow-x-clip">
				<Container>
					<SectionHeader kicker="Services" index="02" titleRef={servicesTitleRef}>
						Trois façons de <em>travailler</em> ensemble.
					</SectionHeader>
					<div className="mt-14 will-change-transform grid gap-px bg-white/10 sm:grid-cols-3">
						{services.map((service, i) => (
							<ServiceCard key={service.rubrique} index={i} rubrique={service.rubrique} items={service.items} />
						))}
					</div>
					<div className="section__footer">
						<Paragraph fs="xs" spacing="xs" className="font-news tracking-[0.3em]" uppercase>
							Trois offres, une seule exigence.
						</Paragraph>
						<Button variant="secondary" route="core.services.render" fitContent>
							Voir tous les services
						</Button>
					</div>
				</Container>
			</Section>
			<Section id="studio" className="overflow-x-clip">
				<Container>
					<SectionHeader kicker="Le studio" index="03" titleRef={devTitleRef}>
						Un développeur, votre <em>exigence</em>.
					</SectionHeader>
					<div className="section__footer">
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
				title={
					<>
						Prêt à créer votre site web <em>sur mesure</em> ?
					</>
				}
			/>
		</>
	);
}
