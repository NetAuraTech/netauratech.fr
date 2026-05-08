import type { LockState } from '~/hooks/use_builder_sync'
import type { Block } from '#types/page'

export interface LockProps {
  blockId: string
  getLock?: (blockId: string, fieldKey: string) => LockState | null
  acquireLock?: (blockId: string, fieldKey: string) => Promise<{ acquired: boolean; lock?: any }>
  releaseLock?: (blockId: string, fieldKey: string) => Promise<void>
  currentUserId?: number
}

export interface EditorProps {
  block: Block
  onChange: (p: Block['props']) => void
  lockProps: LockProps
}
