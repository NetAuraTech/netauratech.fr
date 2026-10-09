import { SharedProps } from '@adonisjs/inertia/types';
import { Button } from '@foundry/design-system/button';
import { Container } from '@foundry/design-system/container';
import { Hero } from '@foundry/design-system/hero';
import { Marquee } from '@foundry/design-system/marquee';
import { Paragraph } from '@foundry/design-system/paragraph';
import { Section } from '@foundry/design-system/section';
import { SectionHeader } from '@foundry/design-system/section-header';
import { usePage } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import { urlFor } from '~/client';
import { LegalDetails } from '~/components/molecules/legal_details';
import { LegalSection } from '~/components/molecules/legal_section';
import type { PrivacyTranslations } from '#transport/core/helpers/i18n_payloads/privacy';
import type { LegalIdentity } from '#types/legal';

interface PrivacyPageProps {
	translations: PrivacyTranslations;
	/** Data-controller identity resolved from the `LEGAL_*` env on the server. */
	identity: LegalIdentity;
	/** Last revision date of the policy, resolved from the env on the server. */
	privacyUpdatedAt: string;
}

/**
 * Privacy policy page of the public front, in the 375 vocabulary.
 *
 * The page opens on the shared hero (kicker, title and RGPD lead), then flows
 * into the numbered policy sections — controller, data collected, purposes,
 * legal basis, retention, sharing, security, rights, cookies — closed by a
 * return-to-home row. The contact form being a client-side mailto, the site
 * collects no form data at all; only technical, security and error-supervision
 * data are described. The controller identity and the revision date are
 * resolved from the `LEGAL_*` environment variables and fall back to the
 * `<CHANGEME>` placeholder when a value is unset.
 */
export default function PrivacyPage(props: PrivacyPageProps) {
	const { translations, identity, privacyUpdatedAt } = props;
	const { props: sharedProps } = usePage<SharedProps>();
	const { app_name, email } = sharedProps;

	return (
		<>
			<Head>
				<title>{`Politique de confidentialité — ${app_name}`}</title>
				<meta
					name="description"
					content="Données collectées, finalités, durées de conservation, sous-traitants et droits des utilisateurs : la politique de confidentialité du site."
				/>
			</Head>
			<Hero
				kicker={`${app_name} — Confidentialité`}
				title={translations.title}
				titleDelay={0.955}
				lede={translations.lede}
				actions={
					<Button variant="secondary" href={urlFor('core.mentions.render')} fitContent>
						Mentions légales
					</Button>
				}
			/>
			<Marquee />
			<Section id="politique-de-confidentialite" variant="front" className="overflow-x-clip">
				<Container>
					<SectionHeader kicker="Confidentialité" index="01">
						Vos données, <em>nos</em> obligations.
					</SectionHeader>
					<Paragraph fs="xs" spacing="xs" className="mt-10 font-news tracking-[0.3em] text-ink-inverted/50" uppercase>
						{translations.updated} : {privacyUpdatedAt}
					</Paragraph>
					<div className="mt-12">
						<LegalSection index="01" title="Responsable du traitement">
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
						<LegalSection index="02" title="Données collectées">
							<Paragraph fs="xs" spacing="xs" className="font-news tracking-[0.3em]" uppercase>
								A. Via le formulaire de contact
							</Paragraph>
							<Paragraph>
								Le formulaire de contact du site n’envoie aucune donnée au serveur : il ouvre directement votre client
								de messagerie avec votre message déjà composé (nom, adresse e-mail, message). Le site ne collecte ni ne
								stocke ces informations.
							</Paragraph>
							<Paragraph fs="xs" spacing="xs" className="font-news tracking-[0.3em]" uppercase>
								B. Données techniques et de sécurité
							</Paragraph>
							<Paragraph>
								Lorsque vous naviguez sur le site, certaines données techniques sont collectées automatiquement :
							</Paragraph>
							<ul className="space-y-2">
								{['Adresse IP', 'Date et heure de la visite', 'Agent utilisateur (navigateur, appareil)'].map(
									(item) => (
										<li key={item} className="flex items-center gap-3 leading-7 text-ink-inverted/80">
											<span className="h-1.5 w-1.5 shrink-0 bg-primary-soft" aria-hidden="true" />
											{item}
										</li>
									),
								)}
							</ul>
							<Paragraph>
								Ces données sont traitées uniquement à des fins de sécurité (protection contre les accès malveillants,
								diagnostic technique) et d’exploitation du site.
							</Paragraph>
							<Paragraph fs="xs" spacing="xs" className="font-news tracking-[0.3em]" uppercase>
								C. Supervision des erreurs
							</Paragraph>
							<Paragraph>
								En cas d’erreur technique sur le site, un rapport de diagnostic (page concernée, type de navigateur)
								peut être transmis au service de supervision utilisé. Ces rapports ne contiennent aucune donnée
								personnelle (pas d’adresse IP, pas de cookies, pas de contenu saisi).
							</Paragraph>
						</LegalSection>
						<LegalSection index="03" title="Finalités du traitement">
							<Paragraph>Les données collectées sont utilisées pour :</Paragraph>
							<ul className="space-y-2">
								{[
									'Protéger le site contre les accès malveillants et en assurer le bon fonctionnement',
									'Identifier et corriger les erreurs techniques',
								].map((item) => (
									<li key={item} className="flex items-center gap-3 leading-7 text-ink-inverted/80">
										<span className="h-1.5 w-1.5 shrink-0 bg-primary-soft" aria-hidden="true" />
										{item}
									</li>
								))}
							</ul>
						</LegalSection>
						<LegalSection index="04" title="Base légale du traitement">
							<Paragraph>
								Les traitements sont réalisés sur le fondement de l’intérêt légitime du responsable du site à protéger
								celui-ci et à en assurer le bon fonctionnement (article 6.1.f du RGPD), pour les données techniques, de
								sécurité et de supervision.
							</Paragraph>
						</LegalSection>
						<LegalSection index="05" title="Durée de conservation">
							<ul className="space-y-2">
								{[
									"Journaux serveur (adresses IP, dates) : conservés quelques mois au maximum, selon la politique de sécurité de l'hébergeur",
									'Rapports de supervision des erreurs : conservés pendant une durée limitée fixée dans la configuration du service',
								].map((item) => (
									<li key={item} className="flex items-start gap-3 leading-7 text-ink-inverted/80">
										<span className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-primary-soft" aria-hidden="true" />
										{item}
									</li>
								))}
							</ul>
						</LegalSection>
						<LegalSection index="06" title="Partage des données">
							<Paragraph>
								Les données collectées ne sont en aucun cas revendues ni transmises à des tiers à des fins commerciales.
								Pour le fonctionnement du site, nous nous appuyons sur les prestataires suivants, agissant en qualité de
								sous-traitants :
							</Paragraph>
							<ul className="space-y-2">
								<li className="flex items-start gap-3 leading-7 text-ink-inverted/80">
									<span className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-primary-soft" aria-hidden="true" />
									<span>
										<span className="font-medium text-ink-inverted">Infomaniak</span> (Lausanne, Suisse) — hébergement
										du site et des e-mails
									</span>
								</li>
								<li className="flex items-start gap-3 leading-7 text-ink-inverted/80">
									<span className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-primary-soft" aria-hidden="true" />
									<span>
										<span className="font-medium text-ink-inverted">Supabase</span> (Irlande, Union européenne) —
										hébergement de la base de données du site. Cette base de données ne contient pas de données
										personnelles des visiteurs du site
									</span>
								</li>
								<li className="flex items-start gap-3 leading-7 text-ink-inverted/80">
									<span className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-primary-soft" aria-hidden="true" />
									<span>
										<span className="font-medium text-ink-inverted">Cloudflare</span> (centres de données dans l’Union
										européenne) — livraison du contenu et protection contre les trafics malveillants ; l’adresse IP du
										visiteur transite par son réseau
									</span>
								</li>
								<li className="flex items-start gap-3 leading-7 text-ink-inverted/80">
									<span className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-primary-soft" aria-hidden="true" />
									<span>
										<span className="font-medium text-ink-inverted">Sentry</span> (États-Unis) — supervision des erreurs
										techniques, sans transmission de données personnelles
									</span>
								</li>
							</ul>
							<Paragraph>
								Chacun de ces prestataires s’engage contractuellement à traiter les données uniquement sur nos
								instructions et à mettre en œuvre des mesures de sécurité appropriées (article 28 du RGPD).
							</Paragraph>
						</LegalSection>
						<LegalSection index="07" title="Sécurité">
							<Paragraph>
								Les données transitent chiffrées (HTTPS). Des mesures techniques et organisationnelles sont mises en
								place pour protéger les informations contre tout accès non autorisé, altération ou destruction, compte
								tenu de l’état de l’art et des risques présentés par les traitements.
							</Paragraph>
						</LegalSection>
						<LegalSection index="08" title="Droits des utilisateurs">
							<Paragraph>Conformément au RGPD, vous disposez des droits suivants :</Paragraph>
							<ul className="space-y-2">
								{[
									'Droit d’accès',
									'Droit de rectification',
									'Droit à l’effacement',
									'Droit à la limitation du traitement',
									'Droit d’opposition',
									'Droit à la portabilité',
								].map((item) => (
									<li key={item} className="flex items-center gap-3 leading-7 text-ink-inverted/80">
										<span className="h-1.5 w-1.5 shrink-0 bg-primary-soft" aria-hidden="true" />
										{item}
									</li>
								))}
							</ul>
							<Paragraph>
								Pour exercer vos droits, vous pouvez nous contacter par e-mail à l’adresse suivante :{' '}
								<a href={`mailto:${email}`} className="text-primary-soft hover:text-primary-light">
									{email}
								</a>
							</Paragraph>
							<Paragraph>
								Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous avez la
								possibilité d’introduire une réclamation auprès de la Commission Nationale de l’Informatique et des
								Libertés (CNIL) :{' '}
								<a
									href="https://www.cnil.fr"
									target="_blank"
									rel="noreferrer"
									className="text-primary-soft hover:text-primary-light"
								>
									https://www.cnil.fr
								</a>
							</Paragraph>
						</LegalSection>
						<LegalSection index="09" title="Cookies">
							<Paragraph>
								Ce site n’utilise aucun cookie de traçage ni cookie publicitaire, et aucun bandeau de consentement n’est
								affiché. Seuls des cookies strictement nécessaires sont posés, indispensables au bon fonctionnement du
								site et ne nécessitant pas de consentement préalable :
							</Paragraph>
							<ul className="space-y-2">
								<li className="flex items-start gap-3 leading-7 text-ink-inverted/80">
									<span className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-primary-soft" aria-hidden="true" />
									<span>
										<span className="font-medium text-ink-inverted">Cookies de session et de sécurité</span> : ils
										évitent toute usurpation lors de l’envoi des formulaires et gèrent votre session dans l’espace
										réservé du site. Leur durée de vie est courte (quelques heures).
									</span>
								</li>
							</ul>
							<Paragraph>
								Vous pouvez à tout moment gérer les cookies en ajustant les paramètres de votre navigateur :
							</Paragraph>
							<ul className="space-y-2">
								{[
									{ label: 'Chrome', href: 'https://support.google.com/chrome/answer/95647?hl=en' },
									{
										label: 'Firefox',
										href: 'https://support.mozilla.org/fr/kb/activer-desactiver-cookies-preferences',
									},
									{ label: 'Safari', href: 'https://support.apple.com/fr-fr/guide/safari/sfri11471/mac' },
									{
										label: 'Edge',
										href: 'https://support.microsoft.com/fr-fr/windows/supprimer-et-g%C3%A9rer-les-cookies-168dab11-0753-043d-7c16-ede5947fc64d',
									},
								].map((browser) => (
									<li key={browser.label} className="flex items-center gap-3 leading-7">
										<span className="h-1.5 w-1.5 shrink-0 bg-primary-soft" aria-hidden="true" />
										<a
											href={browser.href}
											target="_blank"
											rel="noreferrer"
											className="text-primary-soft hover:text-primary-light"
										>
											{browser.label}
										</a>
									</li>
								))}
							</ul>
							<Paragraph>
								Pour plus d’informations sur les cookies, vous pouvez consulter le site de la CNIL :{' '}
								<a
									href="https://www.cnil.fr/fr/cookies-les-outils-pour-les-maitriser"
									target="_blank"
									rel="noreferrer"
									className="text-primary-soft hover:text-primary-light"
								>
									https://www.cnil.fr/fr/cookies-les-outils-pour-les-maitriser
								</a>
							</Paragraph>
						</LegalSection>
					</div>
					<Paragraph className="mt-12 max-w-3xl">
						Pour toute question concernant cette politique de confidentialité ou vos données personnelles, vous pouvez
						nous contacter à :{' '}
						<a href={`mailto:${email}`} className="text-primary-soft hover:text-primary-light">
							{email}
						</a>
					</Paragraph>
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
