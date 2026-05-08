import { SelectOption } from '~/components/atoms/select_option'
import { LFW } from '~/components/organisms/builder/editor/locked_file_wrapper'
import { LockProps } from '~/types/builder'

type TextSelectProps = {
  fieldKey: string
  label: string
  value: string
  onChange: (v: string | boolean) => void
} & LockProps

export function TextSelect(props: TextSelectProps) {
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
        'default',
        'ink-inverted',
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
      ].map((v) => (
        <SelectOption key={v} label={v} value={v} />
      ))}
    </LFW>
  )
}
