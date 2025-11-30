'use client'
import { authClient } from '@/access/authClient'

export default function DashboardPage() {
  const { data: session } = authClient.useSession()
  console.log(session)

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Welcome to your Dashboard</h1>
        <p className="text-muted-foreground">Logged in as: {session?.user?.email}</p>
      </div>
    </div>
  )
}