import { SharedProps } from '@adonisjs/inertia/types';
import { Button } from '@foundry/design-system/button';
import { ContactForm } from '@foundry/design-system/contact-form';
import { Container } from '@foundry/design-system/container';
import { Hero } from '@foundry/design-system/hero';
import { LoupeCursor } from '@foundry/design-system/loupe-cursor';
import { Marquee } from '@foundry/design-system/marquee';
import { Paragraph } from '@foundry/design-system/paragraph';
import { Section } from '@foundry/design-system/section';
import { SectionHeader } from '@foundry/design-system/section-header';
import { ServiceDetail } from '@foundry/design-system/service-detail';
import { usePage } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import type { SiteService } from '#types/site_content';

interface ServicesPageProps {
	translations: Record<string, string>;
	services: SiteService[];
}

export default function ServicesPage(props: ServicesPageProps) {
	const { services } = props;
	const { props: sharedProps } = usePage<SharedProps>();
	const { app_name } = sharedProps;

	return (
		<>
			<LoupeCursor />
			<Head>
				<title>{`Services — Sites vitrines, e-commerce et applications web — ${app_name}`}</title>
				<meta
					name="description"
					content="Sites vitrines, boutiques en ligne et applications web entièrement sur mesure. Inclus, tarifs et accompagnement : découvrez chaque offre NetAuraTech."
				/>
			</Head>
			<Hero
				kicker={`${app_name} — Services`}
				title={
					<>
						Des prestations <em className="italic text-primary-soft">sur mesure</em>, de la vitrine à l'application.
					</>
				}
				titleDelay={0.955}
				lede={
					<>
						Sites vitrines, boutiques en ligne et applications web. Chaque offre est écrite à la main, sans template,
						pour épouser votre métier et vos objectifs.
					</>
				}
				actions={
					<>
						<Button variant="primary" href="#contact" fitContent>
							Démarrer un projet
						</Button>
						<Button variant="secondary" href="/projets" fitContent>
							Voir les projets
						</Button>
					</>
				}
			/>
			<Marquee />
			<Section id="services" variant="front" className="overflow-x-clip">
				<Container>
					<SectionHeader kicker="Services" index="01">
						Le détail, <em>sans</em> surprise.
					</SectionHeader>
					<div className="mt-6">
						{services.map((service, i) => (
							<ServiceDetail key={service.rubrique} index={i} service={service} />
						))}
					</div>
					<div className="mt-12 flex flex-wrap items-start justify-between gap-8 border-t border-ink-inverted/12 pt-6">
						<Paragraph fs="xs" spacing="xs" className="font-news tracking-[0.3em]" uppercase>
							Chaque devis est établi sur étude de votre projet.
						</Paragraph>
						<Button variant="secondary" href="#contact" fitContent>
							Discuter de votre projet
						</Button>
					</div>
				</Container>
			</Section>
			<ContactForm
				email={sharedProps.email}
				title={
					<>
						Prêt à lancer votre projet <em>sur mesure</em> ?
					</>
				}
			/>
		</>
	);
}
