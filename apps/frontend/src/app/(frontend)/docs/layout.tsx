import type { ReactNode } from 'react'
import { Layout } from 'nextra-theme-docs'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style-prefixed.css'

export const metadata = {
  title: 'ColdFlow Docs',
  description: 'Documentation for ColdFlow — open-source cold email and outreach automation.',
}


export default async function DocsLayout({
  children,
}: {
  children: ReactNode
}) {
  const pageMap = await getPageMap('/docs')

  return (
    <Layout
      pageMap={pageMap}
      docsRepositoryBase="https://github.com/pypes-dev/coldflow/tree/main/apps/frontend/"
    >
      {children}
    </Layout>
  )
}
