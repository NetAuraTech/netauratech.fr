import { Field } from '~/components/molecules/field'
import type { ResolvedBlock } from '#types/page'
import { SelectOption } from '~/components/atoms/select_option'

interface FieldBlockProps {
  block: ResolvedBlock<'field'>
}
export default function FieldBlock({ block }: FieldBlockProps) {
  const p = block.props

  return (
    <Field
      label={p.label}
      name={p.name}
      type={p.type}
      placeholder={p.placeholder}
      required={p.required}
      helpText={p.helpText}
    >
      {p.options &&
        p.options.map((option) => (
          <SelectOption key={option.value} value={option.value} label={option.label} />
        ))}
    </Field>
  )
}
