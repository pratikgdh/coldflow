'use client'
import React, { useState, useEffect, useRef } from 'react'
import { authClient } from '@/access/authClient'
import { useRouter } from 'next/navigation'

interface SubAgency {
  id: string
  name: string
}

export const SideNavbar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [subAgencies, setSubAgencies] = useState<SubAgency[]>([])
  const [selectedAgency, setSelectedAgency] = useState<string | null>('main')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  // Fetch sub-agencies from API
  const fetchSubAgencies = async (pageNum: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/sub-agencies?page=${pageNum}&limit=20`)

      if (!response.ok) {
        throw new Error('Failed to fetch sub-agencies')
      }

      const result = await response.json()
      const data: SubAgency[] = result.data || []

      if (pageNum === 1) {
        setSubAgencies(data)
      } else {
        setSubAgencies((prev) => [...prev, ...data])
      }

      // Set hasMore based on pagination response
      setHasMore(result.pagination?.hasMore || false)
    } catch (error) {
      console.error('Error fetching sub-agencies:', error)
      // On error, show empty state
      if (pageNum === 1) {
        setSubAgencies([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isExpanded) {
      fetchSubAgencies(1)
    }
  }, [isExpanded])

  // Infinite scroll handler
  const handleScroll = () => {
    if (!scrollRef.current || loading || !hasMore) return

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setPage((prev) => prev + 1)
      fetchSubAgencies(page + 1)
    }
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const selectAgency = (id: string) => {
    setSelectedAgency(id)
    // TODO: Add your logic for when an agency is selected
  }

  return (
    <aside className="w-64 bg-background border-r border-border h-full flex flex-col">
      {/* Navigation */}
      <nav className="flex-1 overflow-hidden flex flex-col min-h-0">
        {/* Main Agency */}
        <div className="flex-shrink-0">
          <button
            onClick={toggleExpanded}
            className={`w-full px-4 py-2 text-left flex items-center justify-between text-sm font-medium hover:text-primary transition-colors ${
              selectedAgency === 'main' ? 'text-primary' : ''
            }`}
          >
            <span>My Agency</span>
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Sub Agencies List */}
        {isExpanded && (
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="overflow-y-auto flex-1 min-h-0"
          >
            <div className="py-1">
              {subAgencies.map((agency) => (
                <button
                  key={agency.id}
                  onClick={() => selectAgency(agency.id)}
                  className={`w-full pl-8 pr-4 py-2 text-left text-sm font-medium hover:text-primary transition-colors ${
                    selectedAgency === agency.id
                      ? 'text-primary'
                      : ''
                  }`}
                >
                  {agency.name}
                </button>
              ))}
              {loading && (
                <div className="pl-8 pr-4 py-2 text-sm text-muted-foreground">
                  Loading more...
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
  {/* API Keys Section */}
  <div className="border-t border-border flex-shrink-0">
        <button
          onClick={() => {
            router.push('/dashboard/api-keys')
          }}
          className="w-full px-4 py-2 text-left flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
          <span>API</span>
        </button>
      </div>
      {/* Settings Section */}
      <div className="border-t border-border flex-shrink-0">
        <button
          onClick={() => {
            // TODO: Add navigation to settings page
            router.push('/dashboard/settings')
          }}
          className="w-full px-4 py-2 text-left flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>Settings</span>
        </button>
      </div>
    </aside>
  )
}
