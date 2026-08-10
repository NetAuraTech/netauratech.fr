import Layout from '~/layouts/default'
import { createInertiaApp } from '@inertiajs/react'
import ReactDOMServer from 'react-dom/server'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { ReactElement } from 'react'
import { Data } from '@generated/data'
import { TuyauProvider } from '@adonisjs/inertia/react'
import { client } from '~/client'

export default function render(page: any) {
  let appName = ''

  return createInertiaApp({
    page,
    render: ReactDOMServer.renderToString,
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => {
      return resolvePageComponent(
        `./pages/${name}.tsx`,
        import.meta.glob(['./pages/**/*.tsx', '!./pages/**/*.spec.tsx'], { eager: true }),
        (page: ReactElement<Data.SharedProps>) => <Layout children={page} />
      )
    },
    setup: ({ App, props }) => {
      appName = props.initialPage.props.app_name as string

      return (
        <TuyauProvider client={client}>
          <App {...props} />
        </TuyauProvider>
      )
    },
  })
}
