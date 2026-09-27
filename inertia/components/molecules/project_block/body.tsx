import { ReactNode } from 'react'
import Markdown from 'react-markdown'
import { Paragraph } from '~/components/atoms/paragraph'

/**
 * Markdown body shared by the text-bearing project blocks.
 *
 * Renders a project's inline markdown in the atelier vocabulary: paper body
 * text at a 65–75ch measure, mauve-bold accents, and lists as dotted editorial
 * bullets. Used by the `chapter` block and the `features` cells.
 *
 * @example
 * <ProjectBlockBody md="Une architecture **domain-driven** stricte." />
 */
export function ProjectBlockBody({ md }: { md: string }) {
  const accent = ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold text-primary-soft">{children}</strong>
  )

  return (
    <Markdown
      components={{
        p: ({ children }) => (
          <Paragraph
            fs={['base', 'md:lg']}
            spacing="base"
            className="max-w-3xl font-news font-light leading-relaxed"
          >
            {children}
          </Paragraph>
        ),
        strong: accent,
        ul: ({ children }) => <ul className="mt-4 grid gap-3">{children}</ul>,
        li: ({ children }) => (
          <li className="flex items-start gap-3">
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-primary-soft" aria-hidden="true" />
            <span className="max-w-3xl font-news text-base font-light leading-relaxed text-ink-inverted/70">
              {children}
            </span>
          </li>
        ),
      }}
    >
      {md}
    </Markdown>
  )
}
