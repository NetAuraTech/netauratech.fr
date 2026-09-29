/**
 * A free-form translation tree whose keys are arbitrary (data-driven) slugs,
 * in contrast to the statically typed payloads derived from a builder mapping.
 * Leaves are resolved translation strings; branches nest arbitrarily deep.
 */
export type TranslationNodes = { [key: string]: string | TranslationNodes };

/**
 * Sets a leaf value inside a nested translation tree, creating intermediate
 * levels from a dotted key (e.g. slug `content.editor` → two levels) so the
 * frontend `t()` path navigation never meets a key containing a dot.
 *
 * @example
 * const tree: TranslationNodes = {}
 * nestTranslation(tree, 'users.create', { value: 'permissions.users.create.value' })
 * // → { users: { create: { value: 'permissions.users.create.value' } } }
 */
export function nestTranslation(tree: TranslationNodes, dottedKey: string, leaf: string | TranslationNodes) {
	const parts = dottedKey.split('.');
	let node = tree;

	for (const part of parts.slice(0, -1)) {
		node[part] ??= {};
		node = node[part] as TranslationNodes;
	}

	node[parts[parts.length - 1]] = leaf;
}
