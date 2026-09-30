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
import { SectionHeader } from '~/components/molecules/section_header';
import { ServiceDetail } from '~/components/molecules/service_detail';
import { ContactForm } from '~/components/organisms/contact_form';
import { Hero } from '~/components/organisms/hero';
import { useTextSweep } from '~/hooks/animations/use_text_sweep';
import type { SiteService } from '#types/site_content';

interface ServicesPageProps {
	translations: Record<string, string>;
	services: SiteService[];
}

export default function ServicesPage(props: ServicesPageProps) {
	const { services } = props;
	const { props: sharedProps } = usePage<SharedProps>();
	const { app_name } = sharedProps;
	const servicesTitleRef = useRef<HTMLHeadingElement>(null);

	useTextSweep(servicesTitleRef);

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
			<Section id="services" className="overflow-x-clip">
				<Container>
					<SectionHeader kicker="Services" index="01" titleRef={servicesTitleRef}>
						Le détail, <em>sans</em> surprise.
					</SectionHeader>
					<div className="mt-6">
						{services.map((service, i) => (
							<ServiceDetail key={service.rubrique} index={i} service={service} />
						))}
					</div>
					<div className="section__footer">
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
				title={
					<>
						Prêt à lancer votre projet <em>sur mesure</em> ?
					</>
				}
			/>
		</>
	);
}
