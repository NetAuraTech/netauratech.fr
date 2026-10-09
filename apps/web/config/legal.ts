import env from '#start/env';
import type { LegalIdentity } from '#types/legal';

/**
 * Placeholder rendered on the legal pages when a value is not set in the
 * environment, so a missing value stays visible instead of rendering blank.
 */
export const CHANGE_ME = '<CHANGEME>';

/**
 * Configuration for the public legal pages (legal notices and privacy policy).
 *
 * Parsed once at boot from the `LEGAL_*` environment variables. The values are
 * kept out of the repository on purpose (publisher identity is personal
 * data); any unset or blank value falls back to the {@link CHANGE_ME}
 * placeholder so it remains visible on the rendered page.
 */
const legalConfig = {
	/** Publisher identity shown on both legal pages. */
	identity: {
		name: env.get('LEGAL_PUBLISHER_NAME') || CHANGE_ME,
		status: env.get('LEGAL_PUBLISHER_STATUS') || CHANGE_ME,
		address: env.get('LEGAL_PUBLISHER_ADDRESS') || CHANGE_ME,
		siret: env.get('LEGAL_PUBLISHER_SIRET') || CHANGE_ME,
		publicationDirector: env.get('LEGAL_PUBLICATION_DIRECTOR') || CHANGE_ME,
	} satisfies LegalIdentity,
	/**
	 * Last revision date of the privacy policy, as display copy
	 * (`LEGAL_PRIVACY_UPDATED_AT`), e.g. "1er octobre 2026".
	 */
	privacyUpdatedAt: env.get('LEGAL_PRIVACY_UPDATED_AT') || CHANGE_ME,
};

export default legalConfig;
