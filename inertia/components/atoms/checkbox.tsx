import { ChangeEvent, ReactNode } from 'react'

interface CheckboxProps {
  /** The `name` and `id` attribute of the underlying `<input>`. */
  name: string
  /** Sets the initial checked state via `defaultChecked`. */
  checked?: boolean
  disabled?: boolean
  required?: boolean
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
  onBlur?: (event?: ChangeEvent<HTMLInputElement>) => void
  children?: ReactNode
}

/**
 * Styled checkbox input.
 *
 * Applies the `checkbox` utility class from the design system, which sets
 * the secondary color to `accent` and handles focus styles. The `name` prop is
 * used for both the `name` and `id` attributes so that a sibling `<Label>`
 * with the matching `htmlFor` associates correctly.
 *
 * @example
 * <div className="flex items-center gap-2">
 *   <Checkbox name="remember_me" />
 *   <Label htmlFor="remember_me" label="Remember me" />
 * </div>
 */
export function Checkbox(props: CheckboxProps) {
  const { name, checked, disabled, required, onChange, onBlur, children, ...inputProps } = props

  return (
    <input
      type="checkbox"
      name={name}
      id={name}
      defaultChecked={checked}
      disabled={disabled}
      required={required}
      onChange={onChange as (e: ChangeEvent<HTMLInputElement>) => void}
      onBlur={onBlur}
      className="checkbox accent-secondary focus:border-secondary"
      {...inputProps}
    />
  )
}
