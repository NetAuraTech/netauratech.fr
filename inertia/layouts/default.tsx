import { ReactElement, useEffect } from 'react'
import { Header } from '~/components/organisms/header'
import { Footer } from '~/components/organisms/footer'
import { toast, Toaster } from 'sonner'
import { SharedProps } from '@adonisjs/inertia/types'
import { Head, usePage } from '@inertiajs/react'

interface LayoutProps {
  children: ReactElement<SharedProps>
}

/**
 * Root layout for all public-facing pages.
 */
export default function Layout(props: LayoutProps) {
  const { children } = props
  const { props: pageProps, url } = usePage<SharedProps>()
  const { app_name, app_url } = pageProps

  useEffect(() => {
    toast.dismiss()

    if (children.props.flash?.error) toast.error(children.props.flash.error)
    if (children.props.flash?.success) toast.success(children.props.flash.success)
    if (children.props.flash?.info) toast.info(children.props.flash.info)
  }, [url, children.props.flash])

  const image_alt = ''
  const geo = {
    region: '',
    placename: '',
  }

  return (
    <>
      <Head>
        <link rel="canonical" href={`${app_url}${url}`} />
        <link rel="preconnect" href="https://api.iconify.design" />
        <link rel="dns-prefetch" href="https://api.iconify.design" />
        <meta
          name="robots"
          content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
        />
        <meta name="language" content="fr" />
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content={app_name} />
        <link rel="manifest" href="/site.webmanifest" />
        <meta property="og:url" content={`${app_url}${url}`} />
        <meta property="og:site_name" content={app_name} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:image:alt" content={`${app_name} - ${image_alt}`} />
        <meta name="geo.region" content={geo.region} />
        <meta name="geo.placename" content={geo.placename} />
        <meta name="author" content={app_name} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={app_name} />
        <meta name="twitter:image:alt" content={`${app_name} - ${image_alt}`} />
      </Head>
      <>
        <Header />
        <Toaster position="top-right" richColors />
        {children}
        <Footer />
      </>
    </>
  )
}
