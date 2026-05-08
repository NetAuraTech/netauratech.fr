import transmit from '@adonisjs/transmit/services/main'
import { BuilderSessionService } from '#services/page/builder_session_service'
import app from '@adonisjs/core/services/app'

transmit.registerRoutes()

/**
 * Transmit channel authorisation and lifecycle hooks.
 *
 * This file is auto-loaded by AdonisJS at boot time via `adonisrc.ts`.
 * Add it to the `preloads` array if not already present:
 *
 * @example
 * // adonisrc.ts
 * preloads: [
 *   () => import('#start/transmit'),
 * ]
 */

/**
 * Authorises a subscription to the builder channel for a specific translation.
 *
 * Channel pattern: `admin/pages/:pageId/translations/:translationId`
 *
 * Requirements:
 * - User must be authenticated
 * - User must have the `pages.update` permission
 *
 * On successful subscription the user is registered in `BuilderSessionService`
 * and a `PRESENCE_JOINED` event is broadcast to all other subscribers.
 */
transmit.authorize<{ pageId: string; translationId: string }>(
  'admin/pages/:pageId/translations/:translationId',
  async (ctx, params) => {
    try {
      await ctx.auth.authenticate()
    } catch {
      return false
    }

    const user = ctx.auth.user!

    const canEdit = await user.can('pages.update')
    if (!canEdit) return false

    const translationId = Number(params.translationId)
    const pageId = Number(params.pageId)

    if (Number.isNaN(translationId) || Number.isNaN(pageId)) return false

    const sessionService = await app.container.make(BuilderSessionService)
    const session = await sessionService.join(translationId, {
      userId: user.id,
      userName: user.username,
      userEmail: user.email,
    })

    transmit.broadcast(`admin/pages/${pageId}/translations/${translationId}`, {
      op: 'PRESENCE_JOINED',
      userId: user.id,
      userName: user.username,
      userColor: session.color,
      timestamp: new Date().toISOString(),
    })

    return true
  }
)

/**
 * Cleans up all locks and presence data when a client disconnects.
 *
 * Fires for any disconnection — deliberate close, network error, or browser tab close.
 * All locks held by the disconnected user are released and broadcast to remaining
 * subscribers so their UIs can unlock the affected fields immediately.
 */
transmit.on('unsubscribe', async ({ channel, context }) => {
  const channelPattern = /^admin\/pages\/(\d+)\/translations\/(\d+)$/

  const match = channel.match(channelPattern)
  if (!match) return

  const pageId = Number(match[1])
  const translationId = Number(match[2])

  const userId = context.auth.user?.id
  if (!userId) return

  const sessionService = await app.container.make(BuilderSessionService)

  const releasedLocks = await sessionService.releaseAllLocks(translationId, userId)

  for (const lock of releasedLocks) {
    transmit.broadcast(`admin/pages/${pageId}/translations/${translationId}`, {
      op: 'LOCK_RELEASED',
      blockId: lock.blockId,
      fieldKey: lock.fieldKey,
      userId,
      timestamp: new Date().toISOString(),
    })
  }

  await sessionService.leave(translationId, userId)

  transmit.broadcast(`admin/pages/${pageId}/translations/${translationId}`, {
    op: 'PRESENCE_LEFT',
    userId,
    timestamp: new Date().toISOString(),
  })
})

/**
 * Subscribes to Redis key expiry events.
 *
 * When a lock key expires (TTL = 5s), Redis fires an event on the
 * `__keyevent@0__:expired` channel. We parse the key, resolve the SSE
 * channel via the stored meta, and broadcast LOCK_EXPIRED.
 *
 * The lock value is already gone when this fires — we reconstruct blockId
 * and fieldKey from the key name, which is sufficient for the client to
 * remove the overlay.
 *
 * Lock key format: `builder:lock:{translationId}:{blockId}:{fieldKey}`
 */
/*
async function startKeyspaceSubscriber() {
  const ioClient = redis.connection().ioConnection

  try {
    await ioClient.config('SET', 'notify-keyspace-events', 'Ex')
    logger.info('[Builder] Redis keyspace notifications enabled')
  } catch (err: any) {
    logger.warn('[Builder] Could not auto-enable keyspace events: %s', err.message)
    logger.warn('[Builder] Add "notify-keyspace-events Ex" to your redis.conf manually')
  }

  const sub = ioClient.duplicate()
  await sub.subscribe('__keyevent@0__:expired')

  sub.on('message', async (_channel: string, key: string) => {
    if (!key.startsWith('builder:lock:')) return

    const tail = key.slice('builder:lock:'.length)
    const colon = tail.indexOf(':')
    if (colon === -1) return

    const translationId = Number(tail.slice(0, colon))
    const rest = tail.slice(colon + 1)

    const lastColon = rest.lastIndexOf(':')
    if (lastColon === -1) return

    const blockId = rest.slice(0, lastColon)
    const fieldKey = rest.slice(lastColon + 1)

    if (Number.isNaN(translationId) || !blockId || !fieldKey) return

    const svc = await app.container.make(BuilderSessionService)
    const meta = await svc.getMeta(translationId)
    if (!meta) return

    transmit.broadcast(`admin/pages/${meta.pageId}/translations/${translationId}`, {
      op: 'LOCK_EXPIRED',
      blockId,
      fieldKey,
      timestamp: new Date().toISOString(),
    })
  })

  sub.on('error', (err: Error) => {
    logger.error('[Builder] Keyspace subscriber error: %s', err.message)
  })
}

startKeyspaceSubscriber().catch((err: Error) => {
  logger.error('[Builder] Failed to start keyspace subscriber: %s', err.message)
})
*/
