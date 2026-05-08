interface DivProps {
  label: string
}

export function Div(props: DivProps) {
  const { label } = props

  return (
    <div className="pt-2 pb-1">
      <p className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">{label}</p>
    </div>
  )
}
