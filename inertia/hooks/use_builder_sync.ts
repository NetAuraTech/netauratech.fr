import { useEffect, useRef, useCallback, useState } from 'react'
import { Transmit } from '@adonisjs/transmit-client'
import { v4 as uuid } from 'uuid'
import { applyOperation } from '~/utils/builder_reducer'
import type { PageContent } from '#types/page'
import type {
  BuilderOperation,
  BroadcastPayload,
  ServerBroadcastEvent,
  UserSession,
} from '#types/builder'
import { usePage } from '@inertiajs/react'
import { type SharedProps } from '@adonisjs/inertia/types'

interface UseBuilderSyncOptions {
  pageId: number
  translationId: number
  content: PageContent
  onContentChange: (next: PageContent) => void
  initialDraft?: PageContent | null
}

export interface LockState {
  blockId: string
  fieldKey: string
  userId: number
  userName: string
  userColor: string
  expiresAt: string
}

interface UseBuilderSyncReturn {
  presence: UserSession[]
  locks: LockState[]
  connected: boolean
  currentUserId: number
  isEditingField: (blockId: string, fieldKey: string) => boolean
  emit: (op: BuilderOperation) => Promise<{ operationId?: string; error?: any } | void>
  acquireLock: (
    blockId: string,
    fieldKey: string
  ) => Promise<{ acquired: boolean; lock?: LockState }>
  releaseLock: (blockId: string, fieldKey: string) => Promise<void>
  getLock: (blockId: string, fieldKey: string) => LockState | null
  pushDraft: (draftContent: PageContent) => void
}

export function useBuilderSync({
  pageId,
  translationId,
  content,
  onContentChange,
}: UseBuilderSyncOptions): UseBuilderSyncReturn {
  const pageProps = usePage<SharedProps>().props
  const currentUserId = pageProps?.currentUser?.id ?? 0

  const [presence, setPresence] = useState<UserSession[]>([])
  const [locks, setLocks] = useState<LockState[]>([])
  const [ownLocks, setOwnLocks] = useState<Set<string>>(new Set())
  const [connected, setConnected] = useState(false)

  function apiHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-Token': pageProps.csrfToken,
    }
  }

  const contentRef = useRef(content)
  useEffect(() => {
    contentRef.current = content
  }, [content])

  const emittedIds = useRef<Set<string>>(new Set())
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const channel = `admin/pages/${pageId}/translations/${translationId}`

  // ─── Client-side lock expiry sweep ─────────────────────────────────────────
  // Safety net: removes locks whose expiresAt has passed even if the
  // LOCK_EXPIRED SSE event was missed (reconnection, Redis misconfiguration…).
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setLocks((prev) => {
        const next = prev.filter((l) => new Date(l.expiresAt).getTime() > now)
        return next.length === prev.length ? prev : next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // ─── SSE subscription ───────────────────────────────────────────────────────
  useEffect(() => {
    const client = new Transmit({
      baseUrl: window.location.origin,
      uidGenerator: () => uuid(),
    })

    const subscription = client.subscription(channel)

    subscription.onMessage<BroadcastPayload | ServerBroadcastEvent>((event) => {
      handleSseEvent(event as any)
    })

    subscription.create().then(() => setConnected(true))

    fetch(`/api/admin/builder/presence/${translationId}`, {
      headers: apiHeaders(),
    })
      .then((r) => r.json())
      .then(({ sessions, locks: initialLocks }) => {
        setPresence(sessions ?? [])
        setLocks(initialLocks ?? [])
      })
      .catch(() => {})

    function handleSseEvent(ev: any) {
      if (ev.op === 'PRESENCE_JOINED') {
        setPresence((prev) => {
          if (prev.some((s) => s.userId === ev.userId)) return prev
          return [
            ...prev,
            {
              userId: ev.userId,
              userName: ev.userName,
              userEmail: '',
              color: ev.userColor,
              joinedAt: new Date(),
            },
          ]
        })
        return
      }

      if (ev.op === 'PRESENCE_LEFT') {
        setPresence((prev) => prev.filter((s) => s.userId !== ev.userId))
        return
      }

      if (ev.op === 'LOCK_ACQUIRED') {
        // Skip own locks — would block own fields
        if (ev.userId === currentUserId) return
        // Upsert: always use server-provided expiresAt so the sweep above
        // doesn't evict a lock that was renewed (TTL reset by re-acquire).
        setLocks((prev) => {
          const without = prev.filter(
            (l) => !(l.blockId === ev.blockId && l.fieldKey === ev.fieldKey)
          )
          return [
            ...without,
            {
              blockId: ev.blockId,
              fieldKey: ev.fieldKey,
              userId: ev.userId,
              userName: ev.userName,
              userColor: ev.userColor,
              expiresAt: ev.expiresAt,
            },
          ]
        })
        return
      }

      if (ev.op === 'LOCK_RELEASED' || ev.op === 'LOCK_EXPIRED') {
        setLocks((prev) =>
          prev.filter((l) => !(l.blockId === ev.blockId && l.fieldKey === ev.fieldKey))
        )
        return
      }

      // Deduplicate own ops
      if (ev.operationId && emittedIds.current.has(ev.operationId)) {
        emittedIds.current.delete(ev.operationId)
        return
      }

      if (ev.op === 'CURSOR') return

      const updated = applyOperation(contentRef.current, ev as BuilderOperation)
      onContentChange(updated)
    }

    return () => {
      subscription.delete().then(() => setConnected(false))
    }
  }, [pageId, translationId])

  // ─── Emit ───────────────────────────────────────────────────────────────────
  const emit = useCallback(
    async (op: BuilderOperation) => {
      const send = async () => {
        // Generate operationId client-side and register BEFORE the fetch.
        // SSE broadcast can arrive before the HTTP response returns.
        const operationId = uuid()
        emittedIds.current.add(operationId)
        try {
          const res = await fetch('/api/admin/builder/operations', {
            method: 'POST',
            headers: apiHeaders(),
            body: JSON.stringify({ pageId, translationId, operationId, ...op }),
          })
          const data = await res.json()
          return data
        } catch (err) {
          // On error, remove the pre-registered ID so it doesn't block future ops
          emittedIds.current.delete(operationId)
          console.error('[BuilderSync] emit error', err)
        }
      }

      if (op.op === 'UPDATE_PROPS') {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(send, 150)
        return
      }

      return send()
    },
    [pageId, translationId]
  )

  // ─── Lock helpers ────────────────────────────────────────────────────────────
  const acquireLock = useCallback(
    async (blockId: string, fieldKey: string) => {
      try {
        const res = await fetch('/api/admin/builder/operations', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({ pageId, translationId, op: 'LOCK_ACQUIRE', blockId, fieldKey }),
        })
        const data = await res.json()

        if (res.ok) {
          setOwnLocks((prev) => new Set(prev).add(`${blockId}:${fieldKey}`))
          return { acquired: true }
        }

        if (res.status === 409) {
          console.debug('[BuilderSync] lock conflict:', data.error?.lock)
          return { acquired: false, lock: data.error?.lock }
        }

        console.warn('[BuilderSync] acquireLock failed:', res.status, data)
        return { acquired: false }
      } catch (err) {
        console.error('[BuilderSync] acquireLock error:', err)
        return { acquired: false }
      }
    },
    [pageId, translationId]
  )

  const releaseLock = useCallback(
    async (blockId: string, fieldKey: string) => {
      setOwnLocks((prev) => {
        const next = new Set(prev)
        next.delete(`${blockId}:${fieldKey}`)
        return next
      })
      await fetch('/api/admin/builder/operations', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ pageId, translationId, op: 'LOCK_RELEASE', blockId, fieldKey }),
      }).catch(() => {})
    },
    [pageId, translationId]
  )

  const getLock = useCallback(
    (blockId: string, fieldKey: string): LockState | null => {
      return locks.find((l) => l.blockId === blockId && l.fieldKey === fieldKey) ?? null
    },
    [locks]
  )

  const isEditingField = useCallback(
    (blockId: string, fieldKey: string): boolean => {
      return ownLocks.has(`${blockId}:${fieldKey}`)
    },
    [ownLocks]
  )

  // ─── Draft sync ──────────────────────────────────────────────────────────────
  const draftDebounceRef = useRef<NodeJS.Timeout | null>(null)

  const pushDraft = useCallback(
    (draftContent: PageContent) => {
      if (draftDebounceRef.current) clearTimeout(draftDebounceRef.current)
      draftDebounceRef.current = setTimeout(async () => {
        try {
          await fetch(`/api/admin/builder/draft/${translationId}`, {
            method: 'POST',
            headers: apiHeaders(),
            body: JSON.stringify({ content: draftContent }),
          })
        } catch {
          // Non-critical
        }
      }, 1000)
    },
    [translationId]
  )

  return {
    presence,
    locks,
    connected,
    currentUserId,
    isEditingField,
    emit,
    acquireLock,
    releaseLock,
    getLock,
    pushDraft,
  }
}
