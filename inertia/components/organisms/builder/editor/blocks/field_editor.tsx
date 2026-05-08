import { EditorProps } from '~/types/builder'
import { LFW } from '~/components/organisms/builder/editor/locked_file_wrapper'
import { SelectOption } from '~/components/atoms/select_option'
export function FieldEditor(props: EditorProps) {
  const { block, onChange, lockProps } = props
  const p = block.props as any
  const u = (k: string, v: any) => onChange({ ...p, [k]: v })

  return (
    <div className="space-y-4">
      <LFW
        {...lockProps}
        fieldKey="label"
        type="text"
        label="Label du champ"
        defaultValue={p.label ?? 'Nouveau champ'}
        onChange={(v) => u('label', v)}
      />
      <LFW
        {...lockProps}
        fieldKey="name"
        type="text"
        label="Identifiant technique (name)"
        helpText="Utilisé pour la base de données (ex: 'email', 'user_name')"
        defaultValue={p.name ?? ''}
        onChange={(v) => u('name', v)}
      />
      <LFW
        {...lockProps}
        fieldKey="type"
        label="Type de champ"
        type="select"
        defaultValue={p.type ?? 'text'}
        onChange={(v) => u('type', v)}
      >
        <SelectOption value="text" label="Texte court" />
        <SelectOption value="email" label="Email" />
        <SelectOption value="number" label="Nombre" />
        <SelectOption value="textarea" label="Texte long (Textarea)" />
        <SelectOption value="select" label="Liste déroulante (Select)" />
        <SelectOption value="checkbox" label="Case à cocher" />
      </LFW>
      <hr className="border-edge-soft" />
      {p.type !== 'checkbox' && (
        <LFW
          {...lockProps}
          fieldKey="placeholder"
          type="text"
          label="Placeholder"
          defaultValue={p.placeholder ?? ''}
          onChange={(v) => u('placeholder', v)}
        />
      )}
      {p.type === 'select' && (
        <div className="p-3 bg-sunken rounded border border-edge space-y-2">
          <p className="text-[10px] font-bold uppercase text-ink-muted">Options du Select</p>
          <LFW
            {...lockProps}
            fieldKey="options"
            type="textarea"
            label="Options (une par ligne)"
            helpText="Format: valeur:Label"
            defaultValue={p.optionsRaw ?? ''}
            onChange={(v) => {
              const lines = v
                .toString()
                .split('\n')
                .filter((l: string) => l.includes(':'))
              const options = lines.map((l: string) => {
                const [value, label] = l.split(':')
                return { value: value.trim(), label: label.trim() }
              })
              onChange({ ...p, optionsRaw: v, options })
            }}
          />
        </div>
      )}
      <LFW
        {...lockProps}
        fieldKey="helpText"
        type="text"
        label="Texte d'aide"
        defaultValue={p.helpText ?? ''}
        onChange={(v) => u('helpText', v)}
      />
      <div className="flex items-center gap-4">
        <LFW
          {...lockProps}
          fieldKey="required"
          label="Obligatoire"
          type="checkbox"
          defaultValue={p.required ?? false}
          onChange={(v) => u('required', v)}
        />
      </div>
    </div>
  )
}
