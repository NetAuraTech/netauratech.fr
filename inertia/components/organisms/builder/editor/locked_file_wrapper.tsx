import { ReactNode } from 'react'
import LockedFieldWrapper from '~/components/organisms/builder/LockedFieldWrapper'
import { Field } from '~/components/molecules/field'
import { LockProps } from '~/types/builder'

type LFWProps = {
  fieldKey: string
  type: string
  label: string
  placeholder?: string
  defaultValue?: any
  checked?: any
  rows?: number
  helpText?: string
  onChange: (value: string | boolean) => void
  onBlur?: () => void
  children?: ReactNode
} & LockProps

export function LFW(props: LFWProps) {
  const {
    blockId,
    fieldKey,
    type,
    label,
    placeholder,
    getLock,
    acquireLock,
    releaseLock,
    currentUserId = 0,
    defaultValue,
    checked,
    rows,
    helpText,
    onChange,
    onBlur,
    children,
  } = props
  const activeLock = getLock?.(blockId, fieldKey) ?? null
  const isOwner = activeLock?.userId === currentUserId

  const syncKey = !activeLock ? `${blockId}-${fieldKey}` : `${blockId}-${fieldKey}-${defaultValue}`

  return (
    <LockedFieldWrapper
      blockId={blockId}
      fieldKey={fieldKey}
      lock={activeLock}
      isOwner={isOwner}
      onFocus={() => acquireLock?.(blockId, fieldKey)}
      onBlur={() => releaseLock?.(blockId, fieldKey)}
    >
      <Field
        key={syncKey}
        type={type}
        label={label}
        name={fieldKey}
        placeholder={placeholder}
        defaultValue={defaultValue}
        checked={checked}
        rows={rows}
        helpText={helpText}
        onChange={(e) =>
          onChange(type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value)
        }
        onBlur={onBlur}
      >
        {children}
      </Field>
    </LockedFieldWrapper>
  )
}
