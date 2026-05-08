import { EditorProps } from '~/types/builder'
import { LFW } from '~/components/organisms/builder/editor/locked_file_wrapper'
import { SelectOption } from '~/components/atoms/select_option'

export function ParagraphEditor(props: EditorProps) {
  const { block, onChange, lockProps } = props

  const p = block.props as any
  const u = (k: string, v: any) => onChange({ ...p, [k]: v })
  return (
    <div className="space-y-3">
      <LFW
        {...lockProps}
        fieldKey="text"
        type="textarea"
        label="Text"
        defaultValue={p.text ?? ''}
        onChange={(v) => u('text', v)}
      />
      <LFW
        {...lockProps}
        fieldKey="fs"
        type="select"
        label="Font Size"
        defaultValue={p.fs}
        onChange={(v) => u('fs', v)}
      >
        {[
          'xs',
          'sm',
          'base',
          'lg',
          'xl',
          '2xl',
          '3xl',
          '4xl',
          '5xl',
          '6xl',
          '7xl',
          '8xl',
          '9xl',
        ].map((s) => (
          <SelectOption key={s} value={s} label={s} />
        ))}
      </LFW>
      <LFW
        {...lockProps}
        fieldKey="variant"
        type="select"
        label="Variant"
        defaultValue={p.variant}
        onChange={(v) => u('variant', v)}
      >
        {[
          'ink',
          'ink-inverted',
          'muted',
          'subtle',
          'error',
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
          <SelectOption key={v} value={v} label={v} />
        ))}
      </LFW>
      <LFW
        {...lockProps}
        fieldKey="spacing"
        type="select"
        label="Spacing"
        defaultValue={p.spacing}
        onChange={(v) => u('spacing', v)}
      >
        {['xs', 'sm', 'base', 'xl'].map((s) => (
          <SelectOption key={s} value={s} label={s} />
        ))}
      </LFW>
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
