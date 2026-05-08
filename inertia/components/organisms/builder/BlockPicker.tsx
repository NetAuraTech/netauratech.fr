import React from 'react'
import { BLOCK_CATALOG } from './block_types'
import type { BlockType } from '#types/page'
import { Button } from '~/components/atoms/button'
import { Icon } from '~/components/atoms/icon'

// Feather-style icon paths (inline SVG)
const ICONS: Record<string, React.ReactNode> = {
  'layout': (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M4 5a1 1 0 011-1h14a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
    />
  ),
  'star': (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
    />
  ),
  'type': (
    <>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 6h16M4 12h8m-8 6h16"
      />
    </>
  ),
  'align-left': (
    <>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 6h16M4 10h12M4 14h16M4 18h12"
      />
    </>
  ),
  'image': (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth={1.5} />
      <circle cx="8.5" cy="8.5" r="1.5" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15l-5-5L5 21" />
    </>
  ),
  'grid': (
    <>
      <rect x="3" y="3" width="7" height="7" strokeWidth={1.5} />
      <rect x="14" y="3" width="7" height="7" strokeWidth={1.5} />
      <rect x="14" y="14" width="7" height="7" strokeWidth={1.5} />
      <rect x="3" y="14" width="7" height="7" strokeWidth={1.5} />
    </>
  ),
  'mouse-pointer': (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M4 4l7 18 2-7 7-2L4 4z"
    />
  ),
  'minus': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14" />,
  'mail': (
    <>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </>
  ),
}

interface BlockPickerProps {
  /** Called when the user selects a block type to insert */
  onSelect: (type: BlockType) => void
  /** Called when the user click to close button */
  handleClose: () => void
  /** If true, only shows container blocks (section, grid) */
  containersOnly?: boolean
  className?: string
}

/**
 * Panel showing all available block types.
 * Displayed when the user clicks "Add block" inside the page builder.
 */
export default function BlockPicker(props: BlockPickerProps) {
  const { onSelect, handleClose, containersOnly = false, className = '' } = props
  const blocks = containersOnly ? BLOCK_CATALOG.filter((b) => b.isContainer) : BLOCK_CATALOG

  return (
    <div className={`rounded-xl border border-edge bg-canvas shadow-lg ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-edge">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
          {containersOnly ? 'Choose container' : 'Add a block'}
        </p>
        <Button
          type="button"
          variant="icon"
          title="Close to translate"
          fitContent
          onClick={handleClose}
        >
          <Icon name="X" size={18} />
        </Button>
      </div>
      <div className="p-2 grid grid-cols-2 gap-1 max-h-80 overflow-y-auto">
        {blocks.map((block) => (
          <button
            key={block.type}
            type="button"
            onClick={() => onSelect(block.type)}
            className="flex items-start gap-3 rounded-lg p-3 text-left hover:bg-sunken transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-sunken border border-edge flex items-center justify-center shrink-0 group-hover:border-primary-soft transition-colors">
              <svg
                className="w-4 h-4 text-ink-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {ICONS[block.icon]}
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink leading-tight">{block.label}</p>
              <p className="text-xs text-ink-subtle mt-0.5 leading-tight line-clamp-2">
                {block.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
