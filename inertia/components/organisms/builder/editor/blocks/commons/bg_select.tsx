import { SelectOption } from '~/components/atoms/select_option'
import { LFW } from '~/components/organisms/builder/editor/locked_file_wrapper'
import { LockProps } from '~/types/builder'

type BGSelectProps = {
  fieldKey: string
  label: string
  value: string
  onChange: (v: string | boolean) => void
} & LockProps

export function BGSelect(props: BGSelectProps) {
  const { fieldKey, label, value, onChange, ...lockProps } = props

  return (
    <LFW
      {...lockProps}
      fieldKey={fieldKey}
      label={label}
      type="select"
      defaultValue={value}
      onChange={onChange}
    >
      {[
        'none',
        'canvas',
        'surface',
        'sunken',
        'primary',
        'primary-deep',
        'primary-soft',
        'primary-light',
        'secondary',
        'secondary-deep',
        'secondary-soft',
        'secondary-light',
        'tertiary',
        'tertiary-deep',
        'tertiary-soft',
        'tertiary-light',
        'transparent',
      ].map((v) => (
        <SelectOption key={v} label={v} value={v === 'none' ? '' : v} />
      ))}
    </LFW>
  )
}
