import { Paragraph } from '~/components/atoms/paragraph'
import { variants } from '~/components/atoms/nav_link'
import { Link } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import { SharedProps } from '@adonisjs/inertia/types'

export function Footer() {
  const pageProps = usePage<SharedProps>().props

  return (
    <footer className="bg-primary-deep px-6 md:px-16 pt-14 pb-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 pb-10 mb-8 border-b border-primary">
        <div className="col-span-2 md:col-span-1">
          <Link
            route="page.home"
            className="text-ink-inverted font-semibold tracking-wide text-xl font-cormorant"
          >
            {pageProps.app_name}
          </Link>
          <Paragraph
            variant="ink-inverted"
            className="text-sm font-light leading-relaxed max-w-md flex items-center gap-2"
          >
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquam aut culpa cupiditate
            dignissimos distinctio, doloribus et harum id impedit ipsa laboriosam laudantium modi
            numquam obcaecati omnis, quisquam quod sint ullam!
          </Paragraph>
        </div>
        <div className="grid gap-1.5"></div>
        <div className="grid gap-1.5"></div>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <Paragraph
          variant="ink-inverted"
          className="text-sm font-light leading-relaxed max-w-md flex items-center gap-2"
        >
          {`© 2026 ${pageProps.app_name} — Tous droits réservés`}
        </Paragraph>
        <Paragraph
          variant="ink-inverted"
          className="text-sm font-light leading-relaxed max-w-md flex items-center gap-2"
        >
          Fait avec ♥ par{' '}
          <a href="https://www.netauratech.fr" className={`${variants['external']}`}>
            NetAuraTech
          </a>
        </Paragraph>
      </div>
    </footer>
  )
}
