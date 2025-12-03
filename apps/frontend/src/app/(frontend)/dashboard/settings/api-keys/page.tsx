'use client'

import { authClient } from '@/access/authClient'
import { ApiKeyManagement } from '@/components/Settings/ApiKeyManagement'

export default function ApiKeysPage() {
  const { data: session } = authClient.useSession()

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">API Keys</h1>
          <p className="text-sm text-muted-foreground">
            Manage your API keys for programmatic access
          </p>
        </div>

        {/* API Key Management Component */}
        <ApiKeyManagement />
      </div>
    </div>
  )
}
