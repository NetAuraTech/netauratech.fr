import type { TranslationNodes } from '#types/translations'

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
export function nestTranslation(
  tree: TranslationNodes,
  dottedKey: string,
  leaf: string | TranslationNodes
) {
  const parts = dottedKey.split('.')
  let node = tree

  for (const part of parts.slice(0, -1)) {
    node[part] ??= {}
    node = node[part] as TranslationNodes
  }

  node[parts[parts.length - 1]] = leaf
}

/**
 * The stored category of a system permission is an i18n key
 * (`permissions.category.users`) while custom permissions store a plain
 * category name. Strips the system prefix so both forms share the same
 * grouping key on the frontend.
 */
export function permissionCategoryKey(raw: string): string {
  const prefix = 'permissions.category.'
  return raw.startsWith(prefix) ? raw.slice(prefix.length) : raw
}
