import Markdown from 'react-markdown'
import { Heading } from '~/components/atoms/heading'
import { Paragraph } from '~/components/atoms/paragraph'
import type { SiteService } from '#types/site_content'

interface ServiceDetailProps {
  /** Zero-based position in the listing. Drives the `N°` marker. */
  index: number
  /** The parsed service offer, from `content/services/`. */
  service: SiteService
}

/**
 * Full service offer block of the public services page.
 *
 * One numbered editorial section per offer: the rubrique, the discrete items
 * as outlined tags, the markdown description, and the trailing `Inclus` /
 * `Tarif` facts lifted out of the source file. The description is rendered
 * with `react-markdown` so bold accents keep their semantic meaning.
 *
 * @example
 * <ServiceDetail index={0} service={service} />
 */
export function ServiceDetail(props: ServiceDetailProps) {
  const { index, service } = props

  return (
    <article className="service__detail">
      <div className="service__detail-header">
        <span className="service__detail-index" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>
        <Heading level={3}>{service.rubrique}</Heading>
      </div>

      <ul className="service__detail-items">
        {service.items.map((item) => (
          <li key={item}>
            <span className="service__detail-item-dot" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>

      <div className="service__detail-body">
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
            strong: ({ children }) => (
              <strong className="font-semibold text-primary-soft">{children}</strong>
            ),
          }}
        >
          {service.description}
        </Markdown>
      </div>

      {(service.inclus || service.tarif) && (
        <dl className="service__detail-facts">
          {service.inclus && (
            <div className="service__detail-fact">
              <dt>Inclus</dt>
              <dd>{service.inclus}</dd>
            </div>
          )}
          {service.tarif && (
            <div className="service__detail-fact">
              <dt>Tarif</dt>
              <dd>{service.tarif}</dd>
            </div>
          )}
        </dl>
      )}
    </article>
  )
}
