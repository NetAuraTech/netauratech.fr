import { useEffect, useRef, useState } from 'react'
import BlockPicker from './BlockPicker'
import BlockPropsEditor from './editor/BlockPropsEditor'
import { createBlock, getBlockDescriptor } from './block_types'
import type { Block, BlockType, PageContent } from '#types/page'
import type { BuilderOperation } from '#types/builder'
import type { LockState } from '~/hooks/use_builder_sync'
import { Button } from '~/components/atoms/button'
import { Icon } from '~/components/atoms/icon'
import { FloatingPortal } from '~/components/atoms/floating_portal'

interface LockHelpers {
  getLock: (blockId: string, fieldKey: string) => LockState | null
  acquireLock: (blockId: string, fieldKey: string) => Promise<{ acquired: boolean; lock?: any }>
  releaseLock: (blockId: string, fieldKey: string) => Promise<void>
  currentUserId: number
}

interface BlockTreeProps {
  content: PageContent
  onChange: (content: PageContent) => void
  onOperation?: (op: BuilderOperation) => void
  getLock?: LockHelpers['getLock']
  acquireLock?: LockHelpers['acquireLock']
  releaseLock?: LockHelpers['releaseLock']
  currentUserId?: number
}

export default function BlockTree({
  content,
  onChange,
  onOperation,
  getLock,
  acquireLock,
  releaseLock,
  currentUserId = 0,
}: BlockTreeProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pickerParentId, setPickerParentId] = useState<string | 'root' | null>(null)

  function applyBlocks(updater: (b: Block[]) => Block[]) {
    onChange({ ...content, blocks: updater(content.blocks) })
  }

  function addBlock(type: BlockType, parentId: 'root' | string) {
    const newBlock = createBlock(type)
    setPickerParentId(null)
    setSelectedId(newBlock.id)
    if (parentId === 'root') {
      const next = [...content.blocks, newBlock]
      applyBlocks(() => next)
      onOperation?.({ op: 'ADD_BLOCK', block: newBlock, parentId: 'root', index: next.length - 1 })
    } else {
      applyBlocks((b) => insertChild(b, parentId, newBlock))
      const parent = findById(content.blocks, parentId)
      onOperation?.({
        op: 'ADD_BLOCK',
        block: newBlock,
        parentId,
        index: parent?.children?.length ?? 0,
      })
    }
  }

  function deleteBlock(id: string) {
    if (selectedId === id) setSelectedId(null)
    applyBlocks((b) => removeById(b, id))
    onOperation?.({ op: 'DELETE_BLOCK', blockId: id })
  }

  function moveBlock(id: string, direction: 'up' | 'down') {
    const { parentId, index } = findParentInfo(content.blocks, id)
    const newIndex = direction === 'up' ? index - 1 : index + 1
    applyBlocks((b) => moveInTree(b, id, direction))
    onOperation?.({
      op: 'MOVE_BLOCK',
      blockId: id,
      newParentId: parentId,
      newIndex: Math.max(0, newIndex),
    })
  }

  function updateBlockProps(id: string, props: Block['props']) {
    applyBlocks((b) => updateProps(b, id, props))
    onOperation?.({ op: 'UPDATE_PROPS', blockId: id, props })
  }

  const selectedBlock = selectedId ? findById(content.blocks, selectedId) : null

  const handleCloseBlockPicker = () => {
    setPickerParentId(null)
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-canvas border-r border-edge">
      {/* ── SECTION TREE (HAUT) ── */}
      <div className="flex-1 flex flex-col min-h-0 border-b border-edge">
        <div className="px-4 py-3 flex items-center justify-between shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-ink-subtle">
            Structure
          </span>
          <div className="relative">
            <Button
              type="button"
              variant="icon"
              onClick={() => setPickerParentId(pickerParentId === 'root' ? null : 'root')}
              fitContent
              title="Add block"
            >
              <Icon name="Plus" size={16} />
            </Button>
            {pickerParentId === 'root' && (
              <BlockPicker
                onSelect={(t) => addBlock(t, 'root')}
                handleClose={handleCloseBlockPicker}
                className="absolute top-8 right-0 z-30 w-72 shadow-xl"
              />
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar">
          {content.blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl border-2 border-dashed border-edge text-center m-2">
              <p className="text-xs text-ink-muted">No blocks yet</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {content.blocks.map((block, i) => (
                <BlockNode
                  key={block.id}
                  block={block}
                  index={i}
                  total={content.blocks.length}
                  depth={0}
                  selectedId={selectedId}
                  pickerParentId={pickerParentId}
                  onSelect={setSelectedId}
                  onDelete={deleteBlock}
                  onMove={moveBlock}
                  onAddChild={(pid) => setPickerParentId(pickerParentId === pid ? null : pid)}
                  onPickBlock={addBlock}
                  handleCloseBlockPicker={handleCloseBlockPicker}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION EDITEUR (BAS) ── */}
      <div className="h-1/2 flex flex-col min-h-0 bg-sunken/10">
        {selectedBlock ? (
          <div className="flex flex-col h-full">
            <div className="h-10 px-4 flex items-center justify-between border-b border-edge shrink-0 bg-canvas">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-mid shrink-0" />
                <span className="text-[11px] font-semibold text-ink uppercase tracking-tight truncate">
                  {getBlockDescriptor(selectedBlock.type)?.label ?? selectedBlock.type}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="text-ink-subtle hover:text-ink transition-colors"
              >
                <Icon name="X" size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <BlockPropsEditor
                block={selectedBlock}
                onChange={(props) => updateBlockProps(selectedBlock.id, props)}
                getLock={getLock}
                acquireLock={acquireLock}
                releaseLock={releaseLock}
                currentUserId={currentUserId}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center opacity-50">
            <Icon name="MousePointer2" size={20} className="text-ink-subtle mb-2" />
            <p className="text-[11px] text-ink-subtle uppercase tracking-wider">
              Select a block to configure
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function BlockNode(props: {
  block: Block
  index: number
  total: number
  depth: number
  selectedId: string | null
  pickerParentId: string | 'root' | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onMove: (id: string, d: 'up' | 'down') => void
  onAddChild: (pid: string) => void
  onPickBlock: (type: BlockType, pid: string) => void
  handleCloseBlockPicker: () => void
}) {
  const {
    block,
    index,
    total,
    depth,
    selectedId,
    pickerParentId,
    onSelect,
    onDelete,
    onMove,
    onAddChild,
    onPickBlock,
    handleCloseBlockPicker,
  } = props

  const [expanded, setExpanded] = useState(true)
  const anchorRef = useRef<HTMLButtonElement>(null)

  const descriptor = getBlockDescriptor(block.type)
  const isContainer = descriptor?.isContainer ?? false
  const isSelected = selectedId === block.id
  const showPicker = pickerParentId === block.id

  const preview = block.type === 'title' ? ` — ${(block.props as any).text ?? ''}` : ''

  // Ferme le picker s'il sort de l'écran lors du scroll
  useEffect(() => {
    if (!showPicker || !anchorRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) handleCloseBlockPicker()
      },
      { threshold: 0 }
    )
    observer.observe(anchorRef.current)
    return () => observer.disconnect()
  }, [showPicker, handleCloseBlockPicker])

  return (
    <div className={depth > 0 ? 'ml-4 pl-2 border-l border-edge/50' : ''}>
      <div
        className={`group flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer transition-all ${
          isSelected
            ? 'bg-primary-soft/30 text-primary-mid'
            : 'hover:bg-sunken text-ink-muted hover:text-ink'
        }`}
        onClick={() => onSelect(block.id)}
      >
        {isContainer ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="w-4 h-4 flex items-center justify-center shrink-0 hover:bg-edge rounded"
          >
            <svg
              className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        <span className="text-[12px] font-medium flex-1 min-w-0 truncate">
          {descriptor?.label ?? block.type}
          {preview && (
            <span className="text-ink-subtle font-normal opacity-60">
              {preview.slice(0, 20)}
              {preview.length > 20 ? '...' : ''}
            </span>
          )}
        </span>

        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onMove(block.id, 'up')
            }}
            disabled={index === 0}
            className="p-1 hover:text-ink disabled:opacity-0"
          >
            <Icon name="ChevronUp" size={12} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onMove(block.id, 'down')
            }}
            disabled={index === total - 1}
            className="p-1 hover:text-ink disabled:opacity-0"
          >
            <Icon name="ChevronDown" size={12} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(block.id)
            }}
            className="p-1 hover:text-danger"
          >
            <Icon name="Trash2" size={12} />
          </button>
        </div>
      </div>

      {isContainer && expanded && (
        <div className="mt-0.5 space-y-0.5">
          {(block.children ?? []).map((child, i) => (
            <BlockNode
              key={child.id}
              block={child}
              index={i}
              total={(block.children ?? []).length}
              depth={depth + 1}
              selectedId={selectedId}
              pickerParentId={pickerParentId}
              onSelect={onSelect}
              onDelete={onDelete}
              onMove={onMove}
              onAddChild={onAddChild}
              onPickBlock={onPickBlock}
              handleCloseBlockPicker={handleCloseBlockPicker}
            />
          ))}

          <div className="relative ml-4 mt-1">
            <button
              ref={anchorRef}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onAddChild(block.id)
              }}
              className="flex items-center gap-2 text-[11px] text-ink-subtle hover:text-primary-mid transition-colors py-1 px-2 rounded hover:bg-sunken w-full text-left"
            >
              <Icon name="Plus" size={12} />
              <span>Add child</span>
            </button>

            {showPicker && (
              <FloatingPortal anchorRef={anchorRef}>
                <BlockPicker
                  onSelect={(type) => onPickBlock(type, block.id)}
                  handleClose={handleCloseBlockPicker}
                  className="w-72 mt-1 shadow-2xl border border-edge rounded-xl overflow-hidden"
                />
              </FloatingPortal>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Pure helpers (Inchangés) ──────────────────────────────────────────────────
function findById(blocks: Block[], id: string): Block | null {
  for (const b of blocks) {
    if (b.id === id) return b
    if (b.children) {
      const f = findById(b.children, id)
      if (f) return f
    }
  }
  return null
}

function findParentInfo(
  blocks: Block[],
  id: string,
  parentId: string | 'root' = 'root'
): { parentId: string | 'root'; index: number } {
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].id === id) return { parentId, index: i }
    if (blocks[i].children) {
      const r = findParentInfo(blocks[i].children!, id, blocks[i].id)
      if (r.index !== -1) return r
    }
  }
  return { parentId, index: -1 }
}

function removeById(blocks: Block[], id: string): Block[] {
  return blocks
    .filter((b) => b.id !== id)
    .map((b) => (b.children ? { ...b, children: removeById(b.children, id) } : b))
}

function insertChild(blocks: Block[], parentId: string, child: Block): Block[] {
  return blocks.map((b) => {
    if (b.id === parentId) return { ...b, children: [...(b.children ?? []), child] }
    if (b.children) return { ...b, children: insertChild(b.children, parentId, child) }
    return b
  })
}

function updateProps(blocks: Block[], id: string, props: Block['props']): Block[] {
  return blocks.map((b) => {
    if (b.id === id) return { ...b, props }
    if (b.children) return { ...b, children: updateProps(b.children, id, props) }
    return b
  })
}

function moveInTree(blocks: Block[], id: string, dir: 'up' | 'down'): Block[] {
  const idx = blocks.findIndex((b) => b.id === id)
  if (idx !== -1) {
    const next = [...blocks]
    const t = dir === 'up' ? idx - 1 : idx + 1
    if (t < 0 || t >= next.length) return blocks
    ;[next[idx], next[t]] = [next[t], next[idx]]
    return next
  }
  return blocks.map((b) => (b.children ? { ...b, children: moveInTree(b.children, id, dir) } : b))
}
