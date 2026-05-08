import { Data } from '@generated/data'
import type { TranslationNodes } from '#types/translations'
import { useTranslation } from '~/hooks/use_translation'

export enum StatusEnum {
  VERIFIED = 'VERIFIED',
  UNVERIFIED = 'UNVERIFIED',
  PENDING_INVITE = 'PENDING_INVITE',
}

interface UserStatusProps {
  /** The user's current account status. */
  status: StatusEnum
  user: Data.User['id']
  translations: TranslationNodes
}

/**
 * Displays a color-coded status badge for a user account.
 *
 * Maps each {@link StatusEnum} value to a distinct visual style using the
 * design system's semantic color tokens:
 *
 * - `VERIFIED` — success colors (green tones).
 * - `UNVERIFIED` — danger colors (red tones).
 * - `PENDING_INVITE` — secondary colors (invitation not yet accepted).
 *
 * The label text is pulled from the `admin` i18n namespace
 * (`users.status.*`) so it adapts to the current locale automatically.
 *
 * @example
 * <UserStatus status={StatusEnum.VERIFIED} user={user.id} />
 */
export function UserStatus(props: UserStatusProps) {
  const { status, translations } = props
  const { t } = useTranslation(translations)

  const statuses = {
    VERIFIED: (
      <span className="px-4 py-1 border rounded text-success border-success bg-success-soft">
        {t('status.verified')}
      </span>
    ),
    UNVERIFIED: (
      <span className="px-4 py-1 border rounded text-danger border-danger bg-danger-soft">
        {t('status.unverified')}
      </span>
    ),
    PENDING_INVITE: (
      <span className="px-4 py-1 border rounded text-secondary border-secondary bg-secondary-light/20">
        {t('status.pending_invite')}
      </span>
    ),
  }

  return <>{statuses[status]}</>
}
