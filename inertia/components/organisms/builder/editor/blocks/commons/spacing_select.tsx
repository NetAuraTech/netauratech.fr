import { LockProps } from '~/types/builder'
import { LFW } from '~/components/organisms/builder/editor/locked_file_wrapper'
import { SelectOption } from '~/components/atoms/select_option'

type SpacingSelectProps = {
  fieldKey: string
  label: string
  value: string
  onChange: (v: string | boolean) => void
} & LockProps

export function SpacingSelect(props: SpacingSelectProps) {
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
      {['none', 'sm', 'md', 'lg', 'xl'].map((v) => (
        <SelectOption key={v} label={v} value={v} />
      ))}
    </LFW>
  )
}
