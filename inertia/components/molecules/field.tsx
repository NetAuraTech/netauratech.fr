import type { ChangeEvent, ReactNode } from 'react'
import { Label } from '~/components/atoms/label'
import { getSanitizer } from '~/helpers/sanitization'
import { Paragraph } from '~/components/atoms/paragraph'
import { Input } from '~/components/atoms/input'
import { Textarea } from '~/components/atoms/textarea'
import { Select } from '~/components/atoms/select'
import { Checkbox } from '~/components/atoms/checkbox'
import { ImagePicker } from '~/components/molecules/image_picker'

interface FieldProps {
  /** Visible label text associated with the input. */
  label: string
  /** The `name` and `id` forwarded to the underlying input element. */
  name: string
  /**
   * HTML input type or a compound type that maps to a different component:
   * - `'textarea'` → `<Textarea>`
   * - `'select'` → `<Select>` (pass options as `children`)
   * - `'checkbox'` / `'radio'` → `<Checkbox>` with inline label layout
   * - Anything else → `<Input>`
   */
  type: string
  placeholder?: string
  defaultValue?: string | number
  /** Initial checked state forwarded to `<Checkbox>`. */
  checked?: boolean
  options?: Array<{ value: string; label: string }>
  cols?: number
  rows?: number
  disabled?: boolean
  required?: boolean
  /**
   * Validation or server error message displayed below the input in danger
   * color. When present, `helpText` spacing is collapsed to `'xs'` to avoid
   * excessive vertical gap.
   */
  errorMessage?: string
  /**
   * Secondary hint displayed below the input in muted color. Typically used
   * for password-strength indicators or format hints. Accepts a class
   * override via `helpClassName` (e.g. to switch color on validation state).
   */
  helpText?: string
  /** Tailwind class(es) applied to the help text `<Paragraph>` wrapper. */
  helpClassName?: string
  onChange?: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  onBlur?: (event?: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  /**
   * When `true` (default), the field value is sanitized on blur using the
   * sanitizer resolved for the given `type`. Sanitization trims whitespace
   * and normalizes casing depending on the input type. Set to `false` for
   * sensitive fields like passwords.
   */
  sanitize?: boolean
  /** `<SelectOption>` elements passed through to a `'select'` type field. */
  children?: ReactNode
}

/**
 * Composite form field that combines a label, an input control, an optional
 * error message, and an optional help text into a single layout unit.
 *
 * The rendered input component is resolved from the `type` prop:
 * `'textarea'` → `<Textarea>`, `'select'` → `<Select>`,
 * `'checkbox'`/`'radio'` → `<Checkbox>` (with label placed after the
 * control), everything else → `<Input>`.
 *
 * **Sanitization** runs on blur, not on change, so the user's in-progress
 * input is never interrupted. When the sanitized value differs from the raw
 * value the `onChange` handler is called again with the sanitized result so
 * that controlled form state stays in sync.
 *
 * @example
 * // Text input with validation
 * <Field
 *   label="Email"
 *   name="email"
 *   type="email"
 *   placeholder="you@example.com"
 *   errorMessage={errors.email}
 *   required
 *   sanitize
 * />
 *
 * // Select with children
 * <Field label="Role" name="role_id" type="select" required>
 *   <SelectOption value="admin" label="Administrator" />
 *   <SelectOption value="user" label="User" />
 * </Field>
 *
 * // Checkbox with inline label
 * <Field label="Remember me" name="remember_me" type="checkbox" />
 *
 * // Password with help text
 * <Field
 *   label="New password"
 *   name="password"
 *   type="password"
 *   helpText="Minimum 8 characters."
 *   helpClassName={validation.getHelpClassName('password')}
 *   sanitize={false}
 *   required
 * />
 */
export function Field(props: FieldProps) {
  const {
    label,
    name,
    type,
    errorMessage,
    helpText,
    helpClassName,
    onChange,
    onBlur,
    sanitize = true,
    ...inputProps
  } = props

  const isInline = type === 'checkbox' || type === 'radio'
  const variant = isInline ? 'inline' : 'grid'
  const sanitizer = getSanitizer(type, sanitize)

  /** Handle change — no sanitization during typing. */
  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    onChange?.(event)
  }

  /** Handle blur — apply sanitization when the user leaves the field. */
  const handleBlur = (
    event?: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | null
  ) => {
    if (event && type !== 'checkbox' && type !== 'radio' && sanitize) {
      const sanitizedValue = sanitizer(event.target.value)

      if (sanitizedValue !== event.target.value) {
        event.target.value = sanitizedValue
        onChange?.(event)
      }
    }

    onBlur?.(event ?? undefined)
  }

  const getComponentFromType = (type: string) => {
    switch (type) {
      case 'textarea':
        return Textarea
      case 'select':
        return Select
      case 'checkbox':
        return Checkbox
      case 'image':
        return ImagePicker
      default:
        return Input
    }
  }

  const Component = getComponentFromType(type)

  const variants = {
    inline: 'flex items-center gap-2',
    grid: 'grid gap-2',
  }

  return (
    <div className={`grid`}>
      <div className={`${variants[variant]}`}>
        {!isInline && <Label label={label} htmlFor={name} required={props.required} />}
        <Component
          {...inputProps}
          name={name}
          type={type}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        {isInline && <Label label={label} htmlFor={name} required={props.required} />}
      </div>
      {errorMessage && (
        <Paragraph variant="error" spacing="sm">
          {errorMessage}
        </Paragraph>
      )}
      {helpText && (
        <Paragraph variant="muted" spacing={errorMessage ? 'xs' : 'sm'}>
          {helpText}
        </Paragraph>
      )}
    </div>
  )
}
