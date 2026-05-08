import { ReactNode } from 'react'
import { Paragraph } from '~/components/atoms/paragraph'

interface BannerProps {
  /**
   * Semantic type of the banner. Controls background, text, and border colors
   * using the design system's feedback tokens:
   * - `'success'` — green tones, for confirmations and completed actions.
   * - `'danger'` — red tones, for errors and destructive warnings.
   * - `'warning'` — amber tones, for non-blocking cautions.
   * - `'info'` — blue tones, for neutral informational messages.
   */
  type: 'success' | 'danger' | 'info' | 'warning'
  /** Bold title line rendered at the top of the banner. Accepts a string or a custom node. */
  title: string | ReactNode
  /** Body message rendered below the title. Accepts a string or a custom node. */
  message: string | ReactNode
  /** Optional content rendered after the message (e.g. action buttons or a link). */
  children?: ReactNode
}

/**
 * Full-width feedback banner.
 *
 * Displays a titled message block with a semantic color scheme driven by the
 * `type` prop. All four variants use `-soft` background tokens paired with
 * their matching border and text tokens so the banner remains readable in
 * both light and dark mode without manual overrides.
 *
 * For inline single-line feedback prefer a colored `<Paragraph>`. Use
 * `Banner` when the message is prominent enough to warrant its own block —
 * confirmations, form-level errors, onboarding hints, etc.
 *
 * @example
 * <Banner
 *   type="info"
 *   title="Check your inbox"
 *   message="We sent a confirmation link to your email address."
 * />
 *
 * // With an action
 * <Banner type="danger" title="Account deletion" message="This action is permanent.">
 *   <Button variant="danger" className="mt-3">Confirm deletion</Button>
 * </Banner>
 */
export function Banner(props: BannerProps) {
  const { type, title, message, children } = props

  const config = {
    success: { bg: 'bg-success-soft', text: 'text-success', border: 'border-success' },
    danger: { bg: 'bg-danger-soft', text: 'text-danger', border: 'border-danger' },
    warning: { bg: 'bg-warning-soft', text: 'text-warning', border: 'border-warning' },
    info: { bg: 'bg-info-soft', text: 'text-info', border: 'border-info' },
  }

  return (
    <div className={`p-4 rounded border ${config[type].bg} ${config[type].border}`}>
      <Paragraph className={`font-bold ${config[type].text} text-balance leading-7`}>
        {title}
      </Paragraph>
      <Paragraph className={`${config[type].text} text-balance leading-7`}>{message}</Paragraph>
      {children}
    </div>
  )
}
