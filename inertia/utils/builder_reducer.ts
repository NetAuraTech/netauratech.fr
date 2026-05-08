import type { Block, PageContent } from '#types/page'
import type { BuilderOperation } from '#types/builder'

/**
 * Pure reducer that applies a `BuilderOperation` to a `PageContent` tree.
 *
 * **Invariants**
 * - Never mutates the input — always returns a new object.
 * - `CURSOR` and lock ops carry no content change — returns `content` unchanged.
 * - Unknown ops are silently ignored (forward-compatibility).
 *
 * This function is shared between the editor window and the preview iframe.
 * Both receive the same SSE events and apply them via this reducer so their
 * states stay in sync without any additional communication.
 */
export function applyOperation(content: PageContent, op: BuilderOperation): PageContent {
  switch (op.op) {
    case 'UPDATE_PROPS':
      return { ...content, blocks: updateProps(content.blocks, op.blockId, op.props) }

    case 'MOVE_BLOCK':
      return {
        ...content,
        blocks: moveBlock(content.blocks, op.blockId, op.newParentId, op.newIndex),
      }

    case 'ADD_BLOCK':
      return { ...content, blocks: addBlock(content.blocks, op.block, op.parentId, op.index) }

    case 'DELETE_BLOCK':
      return { ...content, blocks: removeBlock(content.blocks, op.blockId) }

    case 'CURSOR':
    case 'LOCK_ACQUIRE':
    case 'LOCK_RELEASE':
      return content

    default:
      return content
  }
}

/**
 * Recursively updates the `props` of the block matching `blockId`.
 * The patch is **shallow-merged** into the existing props so callers only
 * need to send the fields that changed.
 */
function updateProps(blocks: Block[], blockId: string, patch: Record<string, any>): Block[] {
  return blocks.map((b) => {
    if (b.id === blockId) {
      return { ...b, props: { ...b.props, ...patch } as Block['props'] }
    }
    if (b.children?.length) {
      return { ...b, children: updateProps(b.children, blockId, patch) }
    }
    return b
  })
}

/**
 * Moves a block to a new parent and index.
 * The block is first removed from its current position, then inserted at the
 * target. If the target parent is `'root'`, the block is placed at the
 * top-level array.
 */
function moveBlock(
  blocks: Block[],
  blockId: string,
  newParentId: string | 'root',
  newIndex: number
): Block[] {
  let target: Block | null = null
  const withoutTarget = removeAndCapture(blocks, blockId, (b) => {
    target = b
  })

  if (!target) return blocks

  if (newParentId === 'root') {
    const result = [...withoutTarget]
    result.splice(Math.min(newIndex, result.length), 0, target)
    return result
  }

  return insertInto(withoutTarget, newParentId, target, newIndex)
}

/**
 * Inserts a new block at the given parent and index.
 */
function addBlock(
  blocks: Block[],
  block: Block,
  parentId: string | 'root',
  index: number
): Block[] {
  if (parentId === 'root') {
    const result = [...blocks]
    result.splice(Math.min(index, result.length), 0, block)
    return result
  }
  return insertInto(blocks, parentId, block, index)
}

/**
 * Removes a block (and all its children) from the tree.
 */
function removeBlock(blocks: Block[], blockId: string): Block[] {
  return blocks
    .filter((b) => b.id !== blockId)
    .map((b) => (b.children?.length ? { ...b, children: removeBlock(b.children, blockId) } : b))
}

/**
 * Walks the tree, removes the block with `blockId`, calls `onFound` with it,
 * and returns the modified tree.
 */
function removeAndCapture(blocks: Block[], blockId: string, onFound: (b: Block) => void): Block[] {
  return blocks.reduce<Block[]>((acc, b) => {
    if (b.id === blockId) {
      onFound(b)
      return acc
    }
    if (b.children?.length) {
      const children = removeAndCapture(b.children, blockId, onFound)
      acc.push({ ...b, children })
    } else {
      acc.push(b)
    }
    return acc
  }, [])
}

/**
 * Inserts `block` at `index` inside the children of the block with `parentId`.
 */
function insertInto(blocks: Block[], parentId: string, block: Block, index: number): Block[] {
  return blocks.map((b) => {
    if (b.id === parentId) {
      const children = [...(b.children ?? [])]
      children.splice(Math.min(index, children.length), 0, block)
      return { ...b, children }
    }
    if (b.children?.length) {
      return { ...b, children: insertInto(b.children, parentId, block, index) }
    }
    return b
  })
}
