import type { ProjectBlock } from '#types/site_content'

/**
 * Pull quote of a project story.
 *
 * An oversized, light line above a small tracked attribution — a pause in the
 * editorial flow, set off by a hairline like the chapters.
 *
 * @example
 * <ProjectQuote block={{ type: 'quote', quote: 'Le code se lit comme une intention métier.', attribution: 'AdonisJS Foundry' }} />
 */
export function ProjectQuote({ block }: { block: Extract<ProjectBlock, { type: 'quote' }> }) {
  return (
    <blockquote className="mt-20 border-t border-white/10 pt-12 md:mt-28 md:pt-14">
      <p className="max-w-4xl font-news text-[clamp(1.5rem,3vw,2.5rem)] font-light leading-tight tracking-[-0.02em] text-ink-inverted">
        {block.quote}
      </p>
      {block.attribution && (
        <footer className="mt-6 font-news text-[11px] uppercase tracking-[0.3em] text-primary-soft">
          {block.attribution}
        </footer>
      )}
    </blockquote>
  )
}
