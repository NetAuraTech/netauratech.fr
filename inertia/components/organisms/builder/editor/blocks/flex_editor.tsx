import { ResponsiveControl } from '~/components/organisms/builder/editor/responsive_control'
import { LFW } from '~/components/organisms/builder/editor/locked_file_wrapper'
import { SelectOption } from '~/components/atoms/select_option'
import { EditorProps } from '~/types/builder'
import { BGSelect } from '~/components/organisms/builder/editor/blocks/commons/bg_select'

export function FlexEditor({ block, onChange, lockProps }: EditorProps) {
  const p = block.props as any
  const u = (k: string, v: any) => onChange({ ...p, [k]: v })

  return (
    <div className="space-y-4">
      <LFW
        {...lockProps}
        fieldKey="as"
        label="As"
        type="select"
        defaultValue={p.as}
        onChange={(v) => u('as', v)}
      >
        <SelectOption value="div" label="Div" />
        <SelectOption value="article" label="Article" />
      </LFW>
      <ResponsiveControl label="Direction" value={p.direction} onChange={(v) => u('direction', v)}>
        {(val, bp, update) => (
          <LFW
            {...lockProps}
            fieldKey={`direction.${bp}`}
            label=""
            type="select"
            defaultValue={val}
            onChange={update}
          >
            <SelectOption value="col" label="Vertical (Col)" />
            <SelectOption value="row" label="Horizontal (Row)" />
          </LFW>
        )}
      </ResponsiveControl>
      <ResponsiveControl label="Espacement" value={p.gap} onChange={(v) => u('gap', v)}>
        {(val, bp, update) => (
          <LFW
            {...lockProps}
            fieldKey={`gap.${bp}`}
            label=""
            type="select"
            defaultValue={val}
            onChange={update}
          >
            <SelectOption value="none" label="Aucun" />
            <SelectOption value="xs" label="Très serré" />
            <SelectOption value="sm" label="Petit" />
            <SelectOption value="md" label="Moyen" />
          </LFW>
        )}
      </ResponsiveControl>
      <div className="grid grid-cols-2 gap-2">
        <LFW
          {...lockProps}
          fieldKey="align"
          label="Align (Items)"
          type="select"
          defaultValue={p.align}
          onChange={(v) => u('align', v)}
        >
          <SelectOption value="start" label="Début" />
          <SelectOption value="center" label="Centre" />
          <SelectOption value="end" label="Fin" />
          <SelectOption value="stretch" label="Étirer" />
        </LFW>
        <LFW
          {...lockProps}
          fieldKey="justify"
          label="Justify (Content)"
          type="select"
          defaultValue={p.justify}
          onChange={(v) => u('justify', v)}
        >
          <SelectOption value="start" label="Gauche" />
          <SelectOption value="end" label="Droite" />
          <SelectOption value="center" label="Centre" />
          <SelectOption value="between" label="Espace entre" />
        </LFW>
      </div>
      <BGSelect
        {...lockProps}
        fieldKey="background"
        label="Background"
        value={p.background ?? ''}
        onChange={(v) => u('background', v)}
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
