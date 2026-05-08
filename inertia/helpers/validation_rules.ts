/**
 * The result returned by every {@link ValidationRule}.
 *
 * When `valid` is `false`, `message` contains a translated, human-readable
 * error string ready to be displayed in the UI.
 */
export interface ValidationResult {
  /** Whether the value passed the rule. */
  valid: boolean
  /** Translated error message, present only when `valid` is `false`. */
  message?: string
}

/**
 * A function that validates a single value and returns a {@link ValidationResult}.
 *
 * @param value - The value to validate.
 * @param fieldName - Optional i18n key used to produce a translated field label
 *    in the error message (e.g. `'email'`, `'username'`).
 */
export type ValidationRule = (value: any, fieldName?: string) => ValidationResult

/**
 * Type representing a rule that needs the translation function to be instantiated.
 */
export type LazyValidationRule = (t: any) => ValidationRule

/**
 * Factory that produces a {@link ValidationRule} from a predicate, an i18n key,
 * and an optional parameter builder.
 *
 * The resulting rule translates the field label via
 * `validation.fields.<fieldName>` and the error message via
 * `validation.<messageKey>`, injecting any extra params returned by
 * `messageParams`.
 *
 * @param validator - Pure predicate that returns `true` when the value is valid.
 * @param messageKey - Key suffix used to look up the error in the
 *    `validation` i18n namespace (e.g. `'required'`, `'min_length'`).
 * @param messageParams - Optional function that returns extra interpolation
 *    params merged into the i18n translation call.
 * @returns A function that accepts `t` and returns a {@link ValidationRule}.
 */
function createRule(
  validator: (value: any) => boolean,
  messageKey: string,
  messageParams?: (value: any, fieldName?: string, t?: any) => Record<string, any>
): LazyValidationRule {
  return (t: any) => (value: any, fieldName?: string) => {
    const valid = validator(value)
    if (valid) {
      return { valid: true }
    }
    const translatedField = fieldName
      ? t(`validation.fields.${fieldName}`, { defaultValue: fieldName })
      : t('validation.required', { field: '' })

    const params = messageParams ? messageParams(value, fieldName, t) : {}

    return {
      valid: false,
      message: t(`validation.${messageKey}`, {
        field: translatedField,
        ...params,
      }),
    }
  }
}

/**
 * Collection of built-in, composable validation rules.
 *
 * Every rule is a factory function that returns a {@link ValidationRule} so
 * that parameters (min length, allowed values, etc.) are captured at
 * definition time and the rule itself remains a pure, stateless function.
 */
export const rules = {
  /**
   * Ensures the value is not `undefined`, `null`, or an empty string.
   *
   * @param fieldNameKey - i18n key for the field label used in the error message.
   * @returns A {@link ValidationRule} that fails on empty values.
   */
  required: (fieldNameKey?: string): LazyValidationRule =>
    createRule(
      (value) => value !== undefined && value !== null && value !== '',
      'required',
      () => ({ field: fieldNameKey })
    ),

  /**
   * Validates that the value is a well-formed email address.
   */
  email: (): LazyValidationRule =>
    createRule((value) => {
      if (!value) return true
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value)
    }, 'email'),

  /**
   * Ensures the value's string length is at least `min` characters.
   */
  minLength: (min: number, fieldNameKey?: string): LazyValidationRule =>
    createRule(
      (value) => !value || String(value).length >= min,
      'min_length',
      (value) => ({
        min,
        current: value ? String(value).length : 0,
        field: fieldNameKey,
      })
    ),

  /**
   * Ensures the value's string length does not exceed `max` characters.
   */
  maxLength: (max: number, fieldNameKey?: string): LazyValidationRule =>
    createRule(
      (value) => !value || String(value).length <= max,
      'max_length',
      (value) => ({
        max,
        current: value ? String(value).length : 0,
        field: fieldNameKey,
      })
    ),

  /**
   * Ensures the value matches another field's value.
   *
   * @param otherValue - The value to compare against.
   * @param otherFieldNameKey - i18n key for the other field's label.
   */
  matches: (otherValue: any, otherFieldNameKey?: string): LazyValidationRule =>
    createRule(
      (value) => (!value && !otherValue) || value === otherValue,
      'matches',
      (_value, _fieldName, t) => ({
        other: t(`validation.fields.${otherFieldNameKey}`, {
          defaultValue: otherFieldNameKey,
        }),
      })
    ),

  /**
   * Validates the value against a regular expression.
   */
  pattern: (regex: RegExp, customI18nKey: string): LazyValidationRule =>
    createRule((value) => !value || regex.test(String(value)), customI18nKey),

  /**
   * Wraps an arbitrary predicate into a {@link ValidationRule}.
   */
  custom: (validator: (value: any) => boolean, i18nKey: string): LazyValidationRule =>
    createRule(validator, i18nKey),

  /**
   * Ensures the value belongs to a predefined list of allowed values.
   */
  oneOf: (allowedValues: (string | number)[], fieldNameKey?: string): LazyValidationRule =>
    createRule(
      (value) => {
        if (!value || value === '' || value === '0') return true
        const normalizedAllowed = allowedValues.map((v) => String(v))
        return normalizedAllowed.includes(String(value))
      },
      'one_of',
      (value) => ({
        field: fieldNameKey,
        value: value,
      })
    ),
}

/**
 * Runs a value through an ordered list of {@link ValidationRule}s.
 *
 * @param value - The value to validate.
 * @param validationRules - Ordered list of lazy rules.
 * @param t - The translation function from the hook.
 * @param fieldNameKey - Optional i18n key for the field label.
 */
export function validate(
  value: any,
  validationRules: LazyValidationRule[],
  t: any,
  fieldNameKey?: string
): ValidationResult {
  for (const lazyRule of validationRules) {
    const rule = lazyRule(t)
    const result = rule(value, fieldNameKey)
    if (!result.valid) return result
  }
  return { valid: true }
}

/**
 * Ready-made rule arrays for common form fields.
 */
export const presets = {
  email: (fieldNameKey?: string) => [rules.required(fieldNameKey), rules.email()],
  password: (fieldNameKey?: string) => [
    rules.required(fieldNameKey),
    rules.minLength(8, fieldNameKey),
  ],
  passwordConfirmation: (
    passwordToMatch: string,
    fieldNameKeyRequired?: string,
    fieldNameKeyMatch?: string
  ) => [rules.required(fieldNameKeyRequired), rules.matches(passwordToMatch, fieldNameKeyMatch)],
  username: (fieldNameKey?: string) => [
    rules.required(fieldNameKey),
    rules.minLength(2, fieldNameKey),
    rules.maxLength(255, fieldNameKey),
  ],
  search: (fieldNameKey?: string) => [rules.maxLength(255, fieldNameKey)],
  select: (fieldNameKey?: string) => [rules.maxLength(255, fieldNameKey)],
  selectWithOptions: (allowedValues: (string | number)[], fieldNameKey?: string) => [
    rules.maxLength(255, fieldNameKey),
    rules.oneOf(allowedValues, fieldNameKey),
  ],
  title: (fieldNameKey?: string) => [
    rules.required(fieldNameKey),
    rules.minLength(3, fieldNameKey),
    rules.maxLength(150, fieldNameKey),
  ],
  slug: (fieldNameKey?: string) => [
    rules.required(fieldNameKey),
    rules.minLength(3, fieldNameKey),
    rules.maxLength(255, fieldNameKey),
  ],
}
