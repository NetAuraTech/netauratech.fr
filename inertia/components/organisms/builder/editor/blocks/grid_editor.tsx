import { EditorProps } from '~/types/builder'
import { LFW } from '~/components/organisms/builder/editor/locked_file_wrapper'
import { SelectOption } from '~/components/atoms/select_option'
import { ResponsiveControl } from '~/components/organisms/builder/editor/responsive_control'
import { Div } from '~/components/organisms/builder/editor/blocks/div'

export function GridEditor({ block, onChange, lockProps }: EditorProps) {
  const p = block.props as any
  const u = (k: string, v: any) => onChange({ ...p, [k]: v })

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Div label="Structure des colonnes to translate" />
        <LFW
          {...lockProps}
          fieldKey="cols.default"
          type="select"
          label="Mobile"
          defaultValue={p.cols?.default ?? 1}
          onChange={(v) => u('cols', { ...p.cols, default: Number(v) })}
        >
          {[1, 2, 3, 4].map((n) => (
            <SelectOption key={n} value={n} label={`${n} Colonne${n > 1 ? 's' : ''}`} />
          ))}
        </LFW>
        <LFW
          {...lockProps}
          fieldKey="cols.md"
          type="select"
          label="Tablette (MD)"
          defaultValue={p.cols?.md ?? ''}
          onChange={(v) => u('cols', { ...p.cols, md: v ? Number(v) : undefined })}
        >
          <SelectOption value="" label="Identique mobile" />
          {[1, 2, 3, 4, 6].map((n) => (
            <SelectOption key={n} value={n} label={`${n} Colonnes`} />
          ))}
        </LFW>

        <LFW
          {...lockProps}
          fieldKey="cols.lg"
          type="select"
          label="Desktop (LG)"
          defaultValue={p.cols?.lg ?? ''}
          onChange={(v) => u('cols', { ...p.cols, lg: v ? Number(v) : undefined })}
        >
          <SelectOption value="" label="Identique tablette" />
          {[1, 2, 3, 4, 6].map((n) => (
            <SelectOption key={n} value={n} label={`${n} Colonnes`} />
          ))}
        </LFW>
      </div>
      <ResponsiveControl label="Espacement (Gap)" value={p.gap} onChange={(val) => u('gap', val)}>
        {(currentVal, activeBp, updateFn) => (
          <LFW
            {...lockProps}
            fieldKey={`gap.${activeBp}`}
            label=""
            type="select"
            defaultValue={currentVal ?? 'none'}
            onChange={updateFn}
          >
            <SelectOption value="none" label="Aucun (0)" />
            <SelectOption value="xs" label="Ultra-serré" />
            <SelectOption value="sm" label="Petit" />
            <SelectOption value="md" label="Moyen" />
            <SelectOption value="lg" label="Large" />
            <SelectOption value="xl" label="Très Large" />
            <SelectOption value="2xl" label="Énorme" />
          </LFW>
        )}
      </ResponsiveControl>
      <LFW
        {...lockProps}
        fieldKey="alignItems"
        type="select"
        label="Alignement vertical"
        defaultValue={p.alignItems ?? 'start'}
        onChange={(v) => u('alignItems', v)}
      >
        <SelectOption value="start" label="Haut" />
        <SelectOption value="center" label="Centré" />
        <SelectOption value="end" label="Bas" />
        <SelectOption value="stretch" label="Étiré" />
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
