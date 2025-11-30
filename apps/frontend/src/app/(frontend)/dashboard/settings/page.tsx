'use client'

import { authClient } from '@/access/authClient'
import { useState } from 'react'
import { SubAgencyManagement } from '@/components/Settings/SubAgencyManagement'
import { UserInvitation } from '@/components/Settings/UserInvitation'
import { UserAssignments } from '@/components/Settings/UserAssignments'
import type { SettingsTab } from '@/types/settings'

export default function SettingsPage() {
  const { data: session } = authClient.useSession()
  const [activeTab, setActiveTab] = useState<SettingsTab>('sub-agencies')

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'sub-agencies', label: 'Sub-Agencies' },
    { id: 'users', label: 'Users' },
    { id: 'invitations', label: 'Invitations' },
  ]

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Logged in as: {session?.user?.email}
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-border mb-6">
          <div className="flex gap-4 flex-wrap sm:flex-nowrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'text-primary border-primary'
                    : 'text-muted-foreground border-transparent hover:text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'sub-agencies' && <SubAgencyManagement />}
          {activeTab === 'users' && <UserAssignments />}
          {activeTab === 'invitations' && <UserInvitation />}
        </div>
      </div>
    </div>
  )
}
