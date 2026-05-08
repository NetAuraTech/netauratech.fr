import type { UserSession } from '#types/builder'

interface PresenceBarProps {
  presence: UserSession[]
  connected: boolean
}

/**
 * Shows avatars for all active co-editors and a connection status indicator.
 *
 * Displays up to 4 avatars, then "+N" for the rest.
 * Each avatar is a coloured circle with the user's initials.
 */
export default function PresenceBar({ presence, connected }: PresenceBarProps) {
  const MAX_VISIBLE = 4
  const visible = presence.slice(0, MAX_VISIBLE)
  const overflow = presence.length - MAX_VISIBLE

  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-2 h-2 rounded-full transition-colors ${connected ? 'bg-success' : 'bg-edge-strong'}`}
        title={connected ? 'Connected' : 'Disconnected'}
      />
      {presence.length > 0 && (
        <div className="flex items-center -space-x-1.5">
          {visible.map((user) => (
            <Avatar key={user.userId} user={user} />
          ))}
          {overflow > 0 && (
            <div
              className="w-6 h-6 rounded-full border-2 border-canvas bg-sunken flex items-center justify-center"
              title={`${overflow} more editor${overflow > 1 ? 's' : ''}`}
            >
              <span className="text-[9px] font-semibold text-ink-muted">+{overflow}</span>
            </div>
          )}
        </div>
      )}
      {presence.length === 0 && connected && (
        <span className="text-xs text-ink-subtle">Only you</span>
      )}
    </div>
  )
}

function Avatar({ user }: { user: UserSession }) {
  const initials = user.userName
    .split(/[\s._-]/)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')

  return (
    <div
      className="w-6 h-6 rounded-full border-2 border-canvas flex items-center justify-center shrink-0"
      style={{ backgroundColor: user.color }}
      title={user.userName}
    >
      <span className="text-[9px] font-bold text-white">{initials}</span>
    </div>
  )
}
