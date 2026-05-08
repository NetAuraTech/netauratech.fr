import type { Block } from '#types/page'

/**
 * Updates the props of an existing block.
 * Only the fields present in `props` are changed — it is a partial patch,
 * not a full replacement.
 */
export interface UpdatePropsOp {
  op: 'UPDATE_PROPS'
  blockId: string
  props: Record<string, any>
}

/**
 * Moves a block to a new position within the same parent or a different one.
 * `newParentId = 'root'` means the top-level block array.
 * `newIndex` is the target 0-based position within the new parent's children.
 */
export interface MoveBlockOp {
  op: 'MOVE_BLOCK'
  blockId: string
  newParentId: string | 'root'
  newIndex: number
}

/**
 * Inserts a new block at a specific position.
 * The block must include a pre-generated `id` (produced by `generateBlockId()`
 * on the client) so all peers can reference it consistently.
 */
export interface AddBlockOp {
  op: 'ADD_BLOCK'
  block: Block
  parentId: string | 'root'
  index: number
}

/**
 * Permanently removes a block and all its children from the tree.
 */
export interface DeleteBlockOp {
  op: 'DELETE_BLOCK'
  blockId: string
}

/**
 * Signals that the user's cursor is on a specific block (or nowhere).
 * Pure presence signal — does not mutate content.
 * `blockId: null` means the user deselected or left the editor.
 */
export interface CursorOp {
  op: 'CURSOR'
  blockId: string | null
}

/**
 * Requests an optimistic lock on a specific field of a block.
 *
 * The server grants the lock if no other user holds it.
 * The lock expires automatically after `LOCK_TTL_MS` of inactivity.
 * Sending `LOCK_ACQUIRE` again on the same `(blockId, fieldKey)` resets the timer.
 *
 * If the lock is already held by another user, the server responds with 409
 * and the current lock info — the client should show the field as readonly.
 */
export interface LockAcquireOp {
  op: 'LOCK_ACQUIRE'
  blockId: string
  fieldKey: string
}

/**
 * Explicitly releases a lock before the TTL expires.
 * Called when the user blurs the field or navigates away.
 */
export interface LockReleaseOp {
  op: 'LOCK_RELEASE'
  blockId: string
  fieldKey: string
}

/**
 * Union of all client-emittable operations.
 */
export type BuilderOperation =
  | UpdatePropsOp
  | MoveBlockOp
  | AddBlockOp
  | DeleteBlockOp
  | CursorOp
  | LockAcquireOp
  | LockReleaseOp

/**
 * All possible `op` string values.
 */
export type BuilderOpType = BuilderOperation['op']

/**
 * Envelope added by the server before broadcasting an operation.
 * Clients use `operationId` for deduplication (the emitter skips its own ops).
 */
export type BroadcastPayload = (BuilderOperation & {
  operationId: string
  userId: number
  userName: string
  userColor: string
  timestamp: string
}) &
  Record<string, any>

/**
 * Broadcast-only events emitted by the server (not sent by clients).
 */
export type ServerBroadcastEvent =
  | {
      op: 'PRESENCE_JOINED'
      userId: number
      userName: string
      userColor: string
      timestamp: string
    }
  | { op: 'PRESENCE_LEFT'; userId: number; timestamp: string }
  | {
      op: 'LOCK_ACQUIRED'
      blockId: string
      fieldKey: string
      userId: number
      userName: string
      userColor: string
      expiresAt: string
      timestamp: string
    }
  | { op: 'LOCK_RELEASED'; blockId: string; fieldKey: string; userId: number; timestamp: string }
  | { op: 'LOCK_EXPIRED'; blockId: string; fieldKey: string; userId: number; timestamp: string }

/**
 * Represents a connected editor on a specific translation.
 */
export interface UserSession {
  userId: number
  userName: string
  userEmail: string
  /** Unique colour assigned to this user for the duration of their session. */
  color: string
  joinedAt: Date
}

/**
 * Represents an active optimistic lock on a block field.
 */
export interface Lock {
  blockId: string
  fieldKey: string
  userId: number
  userName: string
  userColor: string
  /** Absolute expiry time. Reset on each `LOCK_ACQUIRE` for the same key. */
  expiresAt: Date
  /** Internal Node.js timeout handle — not serialised. */
  timer: NodeJS.Timeout
}

/** Lock time-to-live in milliseconds. Reset on each new `LOCK_ACQUIRE`. */
export const LOCK_TTL_MS = 5_000

/**
 * Key used to store a lock in the session service's inner Map.
 * Format: `"blockId:fieldKey"`
 */
export type LockKey = `${string}:${string}`

/** Returns the canonical lock key for a given block field. */
export function makeLockKey(blockId: string, fieldKey: string): LockKey {
  return `${blockId}:${fieldKey}`
}
