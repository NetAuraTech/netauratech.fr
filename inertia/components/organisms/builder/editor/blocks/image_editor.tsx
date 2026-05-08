import { EditorProps } from '~/types/builder'
import { LFW } from '~/components/organisms/builder/editor/locked_file_wrapper'

export function ImageEditor({ block, onChange, lockProps }: EditorProps) {
  const p = block.props as any
  const u = (k: string, v: any) => onChange({ ...p, [k]: v })
  return (
    <div className="space-y-3">
      <LFW
        {...lockProps}
        fieldKey="file.fileId"
        type="image"
        label="File ID"
        defaultValue={p.file?.fileId ?? ''}
        onChange={(v) => u('file', v ? { ...p.file, fileId: Number(v) } : null)}
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
