'use client'

import { authClient } from '@/access/authClient'
import { ApiKeyManagement } from '@/components/Settings/ApiKeyManagement'

export default function ApiKeysPage() {
  const { data: session } = authClient.useSession()

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <ApiKeyManagement />
      </div>
    </div>
  )
}
