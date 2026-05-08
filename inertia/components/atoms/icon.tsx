import { Icon as IconifyIcon } from '@iconify/react'

interface IconProps {
  name: string
  /** Icon size in pixels. */
  size?: number
  /** Additional Tailwind classes. */
  className?: string
}

/**
 * Converts PascalCase to kebab-case for Iconify compatibility.
 */
function toKebabCase(str: string) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * Icon component using Iconify for dynamic loading.
 *
 * - Usage: Pass a string (e.g. `<Icon name="ArrowLeft" />`).
 *
 * Icons are fetched on-demand from Iconify's API without any local map/dictionary.
 */
export function Icon(props: IconProps) {
  const { name, size, className, ...iconProps } = props

  const iconName = name.includes(':') ? name : `lucide:${toKebabCase(name)}`

  return (
    <IconifyIcon
      icon={iconName}
      width={size}
      height={size}
      className={className}
      {...(iconProps as any)}
    />
  )
}
