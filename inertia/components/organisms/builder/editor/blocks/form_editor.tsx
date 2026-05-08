import { LFW } from '~/components/organisms/builder/editor/locked_file_wrapper'
import { EditorProps } from '~/types/builder'
import { usePage } from '@inertiajs/react'

export function FormEditor(props: EditorProps) {
  const { block, onChange, lockProps } = props

  const { availablePostRoutes } = usePage<{
    availablePostRoutes: any[]
  }>().props

  const p = block.props as any
  const u = (k: string, v: any) => onChange({ ...p, [k]: v })

  const updateNavigation = (updates: Partial<any>) => {
    const nextProps = { ...p, ...updates }

    onChange(nextProps)
  }

  return (
    <div className="space-y-4">
      <LFW
        {...lockProps}
        fieldKey="route"
        label="Route Adonis"
        type="select"
        defaultValue={p.route}
        onChange={(v) => updateNavigation({ route: v, routeParams: {} })}
      >
        <option value="">-- Sélectionner --</option>
        {availablePostRoutes?.map((r) => (
          <option key={r.name} value={r.name}>
            {r.name}
          </option>
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
