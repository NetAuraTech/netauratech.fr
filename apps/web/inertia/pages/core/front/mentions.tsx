import { SharedProps } from '@adonisjs/inertia/types';
import { Button } from '@foundry/design-system/button';
import { Container } from '@foundry/design-system/container';
import { Hero } from '@foundry/design-system/hero';
import { Marquee } from '@foundry/design-system/marquee';
import { Paragraph } from '@foundry/design-system/paragraph';
import { Section } from '@foundry/design-system/section';
import { SectionHeader } from '@foundry/design-system/section-header';
import { Link, usePage } from '@inertiajs/react';
import { urlFor } from '~/client';
import { SeoHead } from '~/components/atoms/seo_head';
import { LegalDetails } from '~/components/molecules/legal_details';
import { LegalSection } from '~/components/molecules/legal_section';
import type { MentionsTranslations } from '#transport/core/helpers/i18n_payloads/mentions';
import type { LegalIdentity } from '#types/legal';

interface MentionsPageProps {
	translations: MentionsTranslations;
	/** Publisher identity resolved from the `LEGAL_*` env on the server. */
	identity: LegalIdentity;
}

/**
 * Legal notices page of the public front, in the 375 vocabulary.
 *
 * The page opens on the shared hero (kicker, title and LCEN lead), then flows
 * into the numbered legal sections — editor, hosting, intellectual property,
 * data protection, cookies, liability — closed by a return-to-home row. The
 * editor identity is resolved from the `LEGAL_*` environment variables and
 * falls back to the `<CHANGEME>` placeholder when a value is unset; every
 * other block mirrors the site's existing infrastructure.
 */
export default function MentionsPage(props: MentionsPageProps) {
	const { translations, identity } = props;
	const { props: sharedProps } = usePage<SharedProps>();
	const { app_name, email } = sharedProps;

	return (
		<>
			<SeoHead
				title={`Mentions légales — ${app_name}`}
				description="Éditeur, hébergement, propriété intellectuelle, cookies et responsabilité : les mentions légales du site."
			/>
			<Hero
				kicker={`${app_name} — Informations légales`}
				title={translations.title}
				titleDelay={0.955}
				lede={translations.lede}
				actions={
					<Button variant="secondary" href={urlFor('core.privacy.render')} fitContent>
						Politique de confidentialité
					</Button>
				}
			/>
			<Marquee />
			<Section id="mentions-legales" variant="front" className="overflow-x-clip">
				<Container>
					<SectionHeader kicker="Mentions légales" index="01">
						L'essentiel, <em>en</em> clair.
					</SectionHeader>
					<div className="mt-12">
						<LegalSection index="01" title="Éditeur du site">
							<LegalDetails
								rows={[
									{ label: 'Nom', value: identity.name },
									{ label: 'Statut', value: identity.status },
									{ label: 'Adresse', value: identity.address },
									{ label: 'Numéro SIRET', value: identity.siret },
									{
										label: 'Adresse e-mail',
										value: (
											<a href={`mailto:${email}`} className="text-primary-soft hover:text-primary-light">
												{email}
											</a>
										),
									},
									{ label: 'Directeur de la publication', value: identity.publicationDirector },
								]}
							/>
						</LegalSection>
						<LegalSection index="02" title="Hébergeur du site">
							<LegalDetails
								rows={[
									{ label: 'Nom de l’hébergeur', value: 'Infomaniak Network SA' },
									{ label: 'Adresse', value: 'Rue Eugène-Marziano 25, 1227 Les Acacias, Genève, Suisse' },
									{ label: 'Téléphone', value: '+41 22 820 35 44' },
									{
										label: 'Site web',
										value: (
											<a
												href="https://www.infomaniak.com"
												target="_blank"
												rel="noreferrer"
												className="text-primary-soft hover:text-primary-light"
											>
												https://www.infomaniak.com
											</a>
										),
									},
								]}
							/>
							<Paragraph fs="xs" spacing="xs" className="font-news tracking-[0.3em]" uppercase>
								Hébergeur de la base de données
							</Paragraph>
							<LegalDetails
								rows={[
									{ label: 'Nom', value: 'Supabase' },
									{ label: 'Lieu de stockage des données', value: 'Irlande (Union européenne)' },
									{
										label: 'Site web',
										value: (
											<a
												href="https://supabase.com"
												target="_blank"
												rel="noreferrer"
												className="text-primary-soft hover:text-primary-light"
											>
												https://supabase.com
											</a>
										),
									},
								]}
							/>
						</LegalSection>
						<LegalSection index="03" title="Propriété intellectuelle">
							<Paragraph>
								Le contenu du site (textes, images, graphismes, logo, icônes, etc.) est la propriété exclusive de{' '}
								{app_name}, sauf mention contraire. Toute reproduction, distribution, modification, adaptation,
								retransmission ou publication, même partielle, est strictement interdite sans l’accord écrit préalable.
							</Paragraph>
						</LegalSection>
						<LegalSection index="04" title="Données personnelles">
							<Paragraph>
								Pour plus d’informations sur la collecte et le traitement de vos données personnelles, veuillez
								consulter notre{' '}
								<Link href={urlFor('core.privacy.render')} className="text-primary-soft hover:text-primary-light">
									politique de confidentialité
								</Link>
								.
							</Paragraph>
						</LegalSection>
						<LegalSection index="05" title="Cookies">
							<Paragraph>
								Le site peut utiliser des cookies à des fins de fonctionnement (sessions). En poursuivant la navigation,
								l’utilisateur accepte l’utilisation des cookies. Il est possible de modifier les préférences via les
								paramètres du navigateur.
							</Paragraph>
						</LegalSection>
						<LegalSection index="06" title="Responsabilité">
							<Paragraph>
								L’éditeur s’efforce de fournir sur le site des informations aussi précises que possible. Toutefois, il
								ne pourra être tenu responsable des omissions, inexactitudes ou carences dans la mise à jour, même
								partielles, des informations publiées sur le site.
							</Paragraph>
							<Paragraph>
								Le présent site est soumis au droit français. En cas de litige, et après tentative de recherche d’une
								solution amiable, les tribunaux français seront seuls compétents.
							</Paragraph>
						</LegalSection>
					</div>
					<div className="mt-12 flex flex-wrap items-start justify-between gap-8 border-t border-ink-inverted/12 pt-6">
						<Paragraph fs="xs" spacing="xs" className="font-news tracking-[0.3em]" uppercase>
							Informations légales — {app_name}
						</Paragraph>
						<Button variant="secondary" href={urlFor('core.home.render')} fitContent>
							Retour à l’accueil
						</Button>
					</div>
				</Container>
			</Section>
		</>
	);
}
