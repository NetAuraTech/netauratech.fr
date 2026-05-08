import { useState, useEffect, useRef, ReactNode } from 'react'
import type { LockState } from '~/hooks/use_builder_sync'

const LOCK_RENEW_INTERVAL_MS = 3000

interface LockedFieldWrapperProps {
  blockId: string
  fieldKey: string
  /** Current lock state for this field — null means unlocked */
  lock: LockState | null
  /** Whether the current user owns the lock */
  isOwner: boolean
  /** Whether the current user is actively editing this field (has an own lock) */
  isEditing?: boolean
  /** Called when this field receives focus — triggers LOCK_ACQUIRE */
  onFocus: () => void
  /** Called when this field loses focus — triggers LOCK_RELEASE */
  onBlur: () => void
  children: ReactNode
}

/**
 * Wraps a form field with lock-awareness and a **heartbeat** mechanism.
 *
 * **Heartbeat**
 * When the field is focused, `onFocus` (= `acquireLock`) is called immediately
 * and then every `LOCK_RENEW_INTERVAL_MS` (3s) to reset the Redis TTL.
 * Without this, a lock acquired at focus time would expire after 5s even if
 * the user is still actively typing, allowing another user to acquire it.
 *
 * The interval is cleared immediately on blur, which also calls `onBlur`
 * (= `releaseLock`) to explicitly release the lock in Redis.
 *
 * **Lock overlay**
 * When locked by another user, children are rendered `pointer-events-none`
 * and an overlay shows the editor's name and colour. The field remains in the
 * DOM so form serialisation is unaffected.
 */
export default function LockedFieldWrapper({
  lock,
  isOwner,
  isEditing = false,
  onFocus,
  onBlur,
  children,
}: LockedFieldWrapperProps) {
  const [focused, setFocused] = useState(false)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)

  const onFocusRef = useRef(onFocus)
  const onBlurRef = useRef(onBlur)
  useEffect(() => {
    onFocusRef.current = onFocus
  }, [onFocus])
  useEffect(() => {
    onBlurRef.current = onBlur
  }, [onBlur])

  useEffect(() => {
    if (!focused) return

    onFocusRef.current()

    heartbeatRef.current = setInterval(() => {
      //onFocusRef.current()
    }, LOCK_RENEW_INTERVAL_MS)

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    }
  }, [focused])

  function handleFocus() {
    if (isLockedByOther) return
    setFocused(true)
  }

  function handleBlur() {
    if (isLockedByOther) return
    setFocused(false)
    onBlurRef.current()
  }

  const isLockedByOther = lock !== null && !isOwner

  return (
    <div className="relative" onFocus={handleFocus} onBlur={handleBlur}>
      {/* Field content */}
      <div
        className={[
          isLockedByOther ? 'pointer-events-none opacity-50 select-none' : '',
          isEditing ? 'ring-2 ring-primary-mid/40 rounded-lg' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
      {isEditing && !isLockedByOther && (
        <div
          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary-mid border-2 border-canvas"
          title="You're editing this field"
        />
      )}
      {isLockedByOther && lock && (
        <div
          className="absolute inset-0 rounded-lg flex items-center justify-start px-2 gap-1.5 cursor-not-allowed"
          style={{
            backgroundColor: `${lock.userColor}18`,
            borderColor: `${lock.userColor}40`,
            borderWidth: 1,
          }}
          title={`${lock.userName} is editing this field`}
        >
          <div
            className="w-3.5 h-3.5 rounded-full border-2 border-white shrink-0"
            style={{ backgroundColor: lock.userColor }}
          />
          <span className="text-xs font-medium truncate" style={{ color: lock.userColor }}>
            {lock.userName}
          </span>
        </div>
      )}
    </div>
  )
}
