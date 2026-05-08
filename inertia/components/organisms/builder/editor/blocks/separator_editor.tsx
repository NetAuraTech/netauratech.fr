import { EditorProps } from '~/types/builder'
import { SpacingSelect } from '~/components/organisms/builder/editor/blocks/commons/spacing_select'
import { LFW } from '~/components/organisms/builder/editor/locked_file_wrapper'
import { BGSelect } from '~/components/organisms/builder/editor/blocks/commons/bg_select'

export function SeparatorEditor(props: EditorProps) {
  const { block, onChange, lockProps } = props

  const p = block.props as any
  const u = (k: string, v: any) => onChange({ ...p, [k]: v })
  return (
    <div className="space-y-3">
      <BGSelect
        {...lockProps}
        fieldKey="color"
        label="Color"
        value={p.color ?? ''}
        onChange={(v) => u('color', v)}
      />
      <SpacingSelect
        {...lockProps}
        fieldKey="spacing"
        label="Spacing"
        value={p.spacing}
        onChange={(v) => u('spacing', v)}
      />
      <LFW
        {...lockProps}
        fieldKey="className"
        type="text"
        label="ClassName"
        defaultValue={p.className}
        onChange={(value) => u('className', value)}
      />
    </div>
  )
}
