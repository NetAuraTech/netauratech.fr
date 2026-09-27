import { ProjectLede } from './lede'
import { ProjectChapter } from './chapter'
import { ProjectFeatures } from './features'
import { ProjectQuote } from './quote'
import { ProjectGallery } from './gallery'
import { ProjectMetrics } from './metrics'
import type { ProjectBlock } from '#types/site_content'

interface ProjectBlocksProps {
  /** The ordered story blocks of one project. */
  blocks: ProjectBlock[]
}

/**
 * Dispatcher over the project story blocks.
 *
 * Renders each block with its dedicated layout so the single-project page can
 * alternate text, pull quotes, feature grids, metrics, and galleries freely —
 * the content model is typed blocks, not a single block of text. Extend here
 * when a new block type is added to `ProjectBlock` (parse it in
 * `parseProjectBlocks` on the backend).
 */
export function ProjectBlocks(props: ProjectBlocksProps) {
  const { blocks } = props

  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'lede':
            return <ProjectLede key={`${i}-lede`} block={block} />
          case 'chapter':
            return <ProjectChapter key={`${i}-chapter`} block={block} />
          case 'features':
            return <ProjectFeatures key={`${i}-features`} block={block} />
          case 'quote':
            return <ProjectQuote key={`${i}-quote`} block={block} />
          case 'gallery':
            return <ProjectGallery key={`${i}-gallery`} block={block} />
          case 'metrics':
            return <ProjectMetrics key={`${i}-metrics`} block={block} />
        }
      })}
    </>
  )
}
