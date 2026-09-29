import { Button } from '@foundry/design-system/button';
import { urlFor } from '~/client';
import { getIcon } from '~/helpers/oauth';
import { useTranslation } from '~/hooks/use_translation';
import { capitalize } from '~/lib/string';
import type { OAuthProvider } from '#auth/types/auth';
import type { TranslationNodes } from '#transport/core/helpers/translation_tree';

interface AuthProviderProps {
	/**
	 * List of OAuth providers to display. Each entry maps to a `<Button
	 * variant="social">` that initiates the provider's redirect flow.
	 * Pass an empty array to render nothing (the divider is still shown).
	 */
	providers: OAuthProvider[];
	translations: TranslationNodes;
}

/**
 * OAuth provider selector shown on login and registration pages.
 *
 * Renders a horizontal divider with an "or continue with" label followed by
 * a responsive grid of social `<Button>` components, one per provider. Each
 * button triggers an external redirect to the server-side OAuth entry point
 * (`auth.social.redirect`) so the browser performs a full navigation rather
 * than an Inertia visit.
 *
 * The divider label is read from the `auth` i18n namespace
 * (`login.or_continue_with`) and adapts to the current locale.
 * Provider icons are resolved by `getIcon(provider)`.
 *
 * @example
 * // Typically rendered at the bottom of a login or register card
 * <Card>
 *   <Form>...</Form>
 *   <AuthProviders providers={['google', 'github']} />
 * </Card>
 */
export function AuthProviders(props: AuthProviderProps) {
	const { providers, translations } = props;
	const { t } = useTranslation(translations);

	return providers && providers.length > 0 ? (
		<>
			<div className="relative my-8">
				<div className="absolute inset-0 flex items-center">
					<div className="w-full border-t border-solid border-edge" />
				</div>
				<div className="relative flex justify-center text-lg">
					<span className="px-4 bg-surface text-ink-muted">{t('or_continue_with')}</span>
				</div>
			</div>
			<div className="grid grid-auto-fit-[250px] gap-3">
				{providers.map((provider) => (
					<Button
						variant="social"
						href={urlFor('auth.social.redirect', { provider })}
						key={`provider-${provider}`}
						title={capitalize(provider)}
						external
					>
						{getIcon(provider)}
						{capitalize(provider)}
					</Button>
				))}
			</div>
		</>
	) : (
		<></>
	);
}
