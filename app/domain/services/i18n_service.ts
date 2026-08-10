import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'

/**
 * Centralized i18n service wrapping the request-scoped AdonisJS I18n instance.
 *
 * The underlying `I18n` is bound per-request by `DetectUserLocaleMiddleware`:
 * ```ts
 * ctx.containerResolver.bindValue(I18n, ctx.i18n)
 * ```
 * Because controllers are instantiated per-request, injecting `I18nService`
 * via `@inject()` always resolves the correct locale-bound instance.
 *
 * **Do NOT register this as a singleton** — doing so would freeze the locale
 * to whatever was active on the first request.
 *
 * @example Flash message (simplest case)
 * ```ts
 * session.flash('success', this.i18n.translate('auth.session.login.success'))
 * ```
 *
 * @example With ICU replacements
 * ```ts
 * session.flash('success', this.i18n.translate('admin.users.deleted', { username }))
 * ```
 *
 * @example Build a nested Inertia translation payload from flat keys
 * ```ts
 * const translations = this.i18n.buildPayload({
 *   title: 'auth.session.login.title',
 *   sub_title: 'auth.session.login.sub_title',
 * })
 * // → { title: "Welcome back!", sub_title: "Please log in to continue." }
 * ```
 *
 * @example Mix plain keys and entry() markers (replacements resolved inside buildPayload)
 * ```ts
 * const translations = this.i18n.buildPayload({
 *   email: 'admin.users.form.email.value',
 *   title: this.i18n.entry('admin.users.edit.title', { username }),
 * })
 */
@inject()
export class I18nService {
  constructor(private readonly i18n: I18n) {}

  /**
   * Returns the current locale string for this request.
   */
  getLocale(): string {
    return this.i18n.locale ?? 'en'
  }

  /**
   * Translate a single key using the request-scoped locale.
   *
   * @param key       - Dot-notation translation key (e.g. `'auth.session.login.success'`)
   * @param replacements - ICU-formatted replacement map passed to `i18n.t()`
   */
  translate(key: string, replacements?: Record<string, any>): string {
    return this.i18n.t(key, replacements ?? {})
  }

  /**
   * Create a translation entry marker for use inside `buildPayload`.
   *
   * Unlike plain string keys, entries carry their replacements so that
   * `_build` resolves them in a single pass — no need to call `translate()`
   * outside of `buildPayload`.
   *
   * @example
   * ```ts
   * this.i18n.buildPayload({
   *   email: 'admin.users.form.email.value',
   *   title: this.i18n.entry('admin.users.edit.title', { username }),
   * })
   * ```
   */
  entry(key: string, replacements?: Record<string, any>): I18nEntry {
    return { __i18n_key: key, __replacements: replacements ?? {} }
  }

  /**
   * Build a nested translation payload from a flat key mapping.
   *
   * Each property of `mapping` is a dot-notation i18n key. The returned object
   * mirrors the shape of `mapping`, with every leaf replaced by its translated string.
   *
   * @example
   * ```ts
   * this.i18n.buildPayload({
   *   title: 'auth.session.login.title',
   *   account: { has: 'auth.register.account.has' },
   * })
   * // → { title: "Welcome back!", account: { has: "Do you already have an account?" } }
   * ```
   */
  buildPayload<T extends Record<string, string | I18nEntry | object>>(
    mapping: T
  ): BuildPayloadResult<T> {
    return this._build(mapping) as BuildPayloadResult<T>
  }

  private _build(obj: Record<string, string | I18nEntry | object>): any {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = this.translate(value)
      } else if (isI18nEntry(value)) {
        result[key] = this.translate(value.__i18n_key, value.__replacements)
      } else {
        result[key] = this._build(value as Record<string, string | I18nEntry | object>)
      }
    }
    return result
  }
}

// ─── Type helpers for buildPayload ──────────────────────────────────────────

/**
 * Marker type returned by `entry()`. Recognized by `_build()` which calls
 * `translate(key, replacements)` in a single pass.
 */
export type I18nEntry = { __i18n_key: string; __replacements: Record<string, any> }

function isI18nEntry(value: unknown): value is I18nEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__i18n_key' in value &&
    '__replacements' in value
  )
}

/**
 * Recursively replaces leaf `string` and `I18nEntry` values with their translated `string`.
 * Since `translate()` returns `string`, the shape is preserved.
 */
type BuildPayloadResult<T> = T extends string
  ? string
  : T extends I18nEntry
    ? string
    : T extends object
      ? { [K in keyof T]: BuildPayloadResult<T[K]> }
      : T
