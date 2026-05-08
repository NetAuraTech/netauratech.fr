import { Section } from '~/components/atoms/section'
import { Heading } from '~/components/atoms/heading'
import { ReactElement } from 'react'
import Layout from '~/layouts/admin'
import { SharedProps } from '@adonisjs/inertia/types'

export default function DashboardPage() {
  return (
    <>
      <Section>
        <div className="container">
          <Heading level={1}>Hello, admin !</Heading>
        </div>
      </Section>
    </>
  )
}

DashboardPage.layout = (page: ReactElement<SharedProps>) => <Layout>{page}</Layout>
