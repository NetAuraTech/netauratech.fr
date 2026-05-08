import { Head } from '@inertiajs/react'
import type { ResolvedPageContent } from '#types/page'
import PageRenderer from '~/components/molecules/renderer/page_renderer'
import { usePage } from '@inertiajs/react'
import { SharedProps } from '@adonisjs/inertia/types'

type PageProps = {
  id: number
  locale: string
  title: string
  metaTitle: string | null
  metaDescription: string | null
  metaImage: string | null
  content: ResolvedPageContent
}

interface LdJsonMeta {
  description: string
  telephone: string
  address: {
    locality: string
    postalCode: string
    country: string
  }
  openingHours: {
    days: string[]
    opens: string
    closes: string
  }
  offer: {
    name: string
    items: OfferItem[]
  }
}

interface OfferItem {
  type: string
  name: string
  description?: string
}

/**
 * Public-facing Inertia page for rendered pages.
 *
 * Handles SEO via Inertia's `<Head>` component and delegates the actual
 * block rendering to `PageRenderer`.
 */
export default function PageShowPage(props: PageProps) {
  const { id, locale, title, metaTitle, metaDescription, metaImage, content } = props
  const { email, app_url, app_name } = usePage<SharedProps>().props
  const seoTitle = metaTitle ?? title

  const seoOgImage = metaImage ?? `${app_url}/og-image.jpg`

  const ldJsonMeta: LdJsonMeta = {
    description: '',
    telephone: '+33',
    address: {
      locality: '',
      postalCode: '',
      country: '',
    },
    openingHours: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:00',
      closes: '18:00',
    },
    offer: {
      name: '',
      items: [],
    },
  }

  return (
    <>
      <Head title={seoTitle}>
        {metaDescription && <meta name="description" content={metaDescription} />}
        <meta property="og:title" content={seoTitle} />
        {metaDescription && <meta property="og:description" content={metaDescription} />}
        {metaDescription && <meta name="twitter:description" content={metaDescription} />}
        <meta property="og:image" content={seoOgImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />
        <meta name="twitter:image" content={seoOgImage} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            '@id': `${app_url}/#business`,
            'name': `${app_name}`,
            'url': `${app_url}`,
            'logo': `${app_url}/logo.png`,
            'image': seoOgImage,
            'description': `${ldJsonMeta.description}`,
            'telephone': `${ldJsonMeta.telephone}`,
            'email': email,
            'address': {
              '@type': 'PostalAddress',
              'addressLocality': `${ldJsonMeta.address.locality}`,
              'postalCode': `${ldJsonMeta.address.postalCode}`,
              'addressCountry': `${ldJsonMeta.address.country}`,
            },
            'openingHoursSpecification': [
              {
                '@type': 'OpeningHoursSpecification',
                'dayOfWeek': `${ldJsonMeta.openingHours.days}`,
                'opens': `${ldJsonMeta.openingHours.opens}`,
                'closes': `${ldJsonMeta.openingHours.closes}`,
              },
            ],
            'priceRange': '€€',
            'hasOfferCatalog': {
              '@type': 'OfferCatalog',
              'name': `${ldJsonMeta.offer.name}`,
              'itemListElement': ldJsonMeta.offer.items.map((item) => {
                return {
                  '@type': 'Offer',
                  'itemOffered': {
                    '@type': item.type,
                    'name': item.name,
                    'description': item.description,
                  },
                }
              }),
            },
          })}
        </script>
      </Head>
      <PageRenderer content={content} pageId={id} locale={locale} />
    </>
  )
}
