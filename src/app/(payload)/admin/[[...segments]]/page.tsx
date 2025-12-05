/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import type { Metadata } from 'next'

import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap'
import AdminUserManagement from '@/components/AdminUserManagement'
import { getMeUser } from '@/utilities/getMeUser'
import { redirect } from 'next/navigation'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

const Page = async ({ params, searchParams }: Args) => {
  const segments = await params
  console.log(segments)
  // check if user is logged in as admin in payload
  const { user } = await getMeUser()
  if(segments?.segments?.[0] !== 'login' && !user) {
    return redirect('/admin/login')
  }
  if(segments?.segments?.[0] === 'collections' && segments?.segments?.[1] === 'users') {
    return <AdminUserManagement />
  }
  return RootPage({ config, params, searchParams, importMap })
}

export default Page
