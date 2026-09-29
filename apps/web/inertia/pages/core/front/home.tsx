import { Heading } from '@foundry/design-system/heading';
import { Paragraph } from '@foundry/design-system/paragraph';
import { Section } from '@foundry/design-system/section';
import { useTranslation } from '~/hooks/use_translation';
import type { HomeTranslations } from '#transport/core/helpers/i18n_payloads/home';

interface Props {
	translations: HomeTranslations;
}

/**
 * Blank home page for the hand-written front.
 *
 * The `inertia` flavor ships this as the canonical starting point: a minimal
 * page wired through the public layout, so a developer cloning the flavor
 * sees the expected `core.home.render` pattern from the first file they open.
 * Replace this with your own content.
 */
export default function HomePage({ translations }: Props) {
	const { t } = useTranslation(translations);

	return (
		<Section className="min-h-screen flex items-center justify-center px-4 py-12">
			<div className="w-full max-w-md text-center">
				<Heading level={1}>{t('welcome')}</Heading>
				<Paragraph variant="muted" spacing="base">
					{t('tagline')}
				</Paragraph>
			</div>
		</Section>
	);
}
