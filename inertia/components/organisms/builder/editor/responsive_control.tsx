import { ReactNode, useState } from 'react'

interface ResponsiveControl {
  label: string
  value: any
  onChange: (newValue: any) => void
  children: (currentVal: any, activeBp: string, updateFn: (val: any) => void) => ReactNode
}

export function ResponsiveControl(props: ResponsiveControl) {
  const { label, value, onChange, children } = props
  const [activeBp, setActiveBp] = useState<'default' | 'md' | 'lg'>('default')

  const handleValueChange = (newVal: any) => {
    onChange({
      ...(value || {}),
      [activeBp]: newVal,
    })
  }

  return (
    <div className="space-y-2 border-l-2 border-sunken pl-3 py-1">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
          {label}
        </label>
        <div className="flex gap-1 bg-sunken p-0.5 rounded border border-edge">
          {(['default', 'md', 'lg'] as const).map((bp) => (
            <button
              key={bp}
              type="button"
              className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition-all ${
                activeBp === bp
                  ? 'bg-white shadow-sm text-primary-mid'
                  : 'text-ink-subtle hover:text-ink'
              }`}
              onClick={() => setActiveBp(bp)}
            >
              {bp === 'default' ? 'MOB' : bp.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {children(value?.[activeBp] ?? value?.default, activeBp, handleValueChange)}
    </div>
  )
}
