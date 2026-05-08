import vine from '@vinejs/vine'

/**
 * All valid operation types — mirrors `BuilderOpType` from `#types/builder`.
 * Kept as a plain array here to avoid a circular import with the types file.
 */
const OP_TYPES = [
  'UPDATE_PROPS',
  'MOVE_BLOCK',
  'ADD_BLOCK',
  'DELETE_BLOCK',
  'CURSOR',
  'LOCK_ACQUIRE',
  'LOCK_RELEASE',
] as const

/**
 * Validates the envelope sent by the client to
 * `POST /api/cms/builder/operations`.
 *
 * Only the common fields (`pageId`, `translationId`, `op`) are validated
 * strictly. Op-specific fields are accepted as `vine.any()` and validated
 * at the service layer, where discriminated-union logic is easier to express
 * in plain TypeScript than in VineJS schema declarations.
 *
 * Fields by op:
 * | op             | required extra fields                        |
 * |----------------|----------------------------------------------|
 * | UPDATE_PROPS   | blockId: string, props: object               |
 * | MOVE_BLOCK     | blockId, newParentId: string, newIndex: int  |
 * | ADD_BLOCK      | block: Block, parentId: string, index: int   |
 * | DELETE_BLOCK   | blockId: string                              |
 * | CURSOR         | blockId: string | null                       |
 * | LOCK_ACQUIRE   | blockId: string, fieldKey: string            |
 * | LOCK_RELEASE   | blockId: string, fieldKey: string            |
 */
export const builderOperationValidator = vine.create({
  /** Page the translation belongs to — used to build the channel name. */
  pageId: vine.number().positive(),

  /** The translation being edited. */
  translationId: vine.number().positive(),

  /** Discriminant. */
  op: vine.enum(OP_TYPES),

  // ── Op-specific fields (all optional at schema level) ─────────────────────

  /** Block targeted by the operation. Required for all ops except CURSOR. */
  blockId: vine.string().trim().optional(),

  /** Partial props patch (UPDATE_PROPS). */
  props: vine.any().optional(),

  /**
   * Target parent for the moved block (MOVE_BLOCK, ADD_BLOCK).
   * `'root'` or a block ID.
   */
  newParentId: vine.string().trim().optional(),
  parentId: vine.string().trim().optional(),

  /** 0-based target index (MOVE_BLOCK, ADD_BLOCK). */
  newIndex: vine.number().min(0).optional(),
  index: vine.number().min(0).optional(),

  /**
   * Full block definition for insertion (ADD_BLOCK).
   * Must include a pre-generated `id` produced by `generateBlockId()`.
   */
  block: vine.any().optional(),

  /** Field being locked or unlocked (LOCK_ACQUIRE, LOCK_RELEASE). */
  fieldKey: vine.string().trim().maxLength(100).optional(),
})

/**
 * Validates the presence endpoint query params.
 * `GET /api/cms/builder/presence/:translationId`
 */
export const builderPresenceValidator = vine.create({
  translationId: vine.number().positive(),
})
