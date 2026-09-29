import { nestTranslation, type TranslationNodes } from '#transport/core/helpers/translation_tree';
import type { RoleEntry } from '#identity/domain/role';

/**
 * Builds the data-driven per-role translation nodes shared by the identity
 * users payload builders. Each role contributes a `roles.{slug}` node whose
 * leaves are i18n keys resolved through the shared `roles` lang namespace, so
 * the frontend renders role names without extra fetches.
 *
 * @param roles - The roles to build per-role entries for.
 * @returns A translation tree with one `roles.{slug}` node per role.
 */
export function buildRoleEntries(roles: ReadonlyArray<RoleEntry>): TranslationNodes {
	const entries: TranslationNodes = {};

	for (const role of roles) {
		nestTranslation(entries, role.slug, {
			value: `roles.${role.slug}.value`,
			description: `roles.${role.slug}.description`,
		});
	}

	return entries;
}
