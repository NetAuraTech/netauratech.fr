import { EditorProps } from '~/types/builder'
import { LFW } from '~/components/organisms/builder/editor/locked_file_wrapper'

export function HtmlTextEditor(props: EditorProps) {
  const { block, onChange, lockProps } = props

  const p = block.props as any
  const u = (k: string, v: any) => onChange({ ...p, [k]: v })
  return (
    <div className="space-y-3">
      <LFW
        {...lockProps}
        fieldKey="content"
        type="textarea"
        label="Text"
        defaultValue={p.content ?? ''}
        onChange={(v) => u('content', v)}
      />
    </div>
  )
}
