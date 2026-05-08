import { getAvatarInitials } from '~/helpers/avatar'
import { useAuth } from '~/hooks/use_auth'

interface AvatarProps {
  /** Whether to display the username next to the avatar. Defaults to `false`. */
  showUsername?: boolean
}

/**
 * Displays the authenticated user's avatar.
 *
 * Renders a circular placeholder with the user's initials until a proper
 * avatar image is available (see the TODO below). When `showUsername` is
 * enabled the username is shown to the right of the circle.
 *
 * Hover states (secondary background, secondary text) are driven by a CSS `group`
 * — wrap this component in a `group` element to activate them.
 *
 * Returns an empty fragment when no authenticated user is found.
 *
 * @example
 * // Initials only
 * <Avatar />
 *
 * // With username, inside a group for hover effects
 * <div className="group">
 *   <Avatar showUsername />
 * </div>
 */
export function Avatar(props: AvatarProps) {
  const { showUsername = false } = props

  const { user } = useAuth()

  if (!user) {
    return <></>
  }

  //TODO: Return user avatar is available

  const Icon = (
    <div className="w-12 h-12 rounded-full bg-sunken flex items-center justify-center text-sm font-semibold text-ink-muted group-hover:bg-secondary group-hover:text-ink-inverted transition">
      {getAvatarInitials(user.username)}
    </div>
  )

  return (
    <div className="group flex gap-4 items-center">
      {Icon}
      {showUsername && (
        <span className="text-ink group-hover:text-secondary transition">{user.username}</span>
      )}
    </div>
  )
}
