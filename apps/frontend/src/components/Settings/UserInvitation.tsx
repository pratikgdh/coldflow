'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SubAgency, InviteUserRequest, Invitation } from '@/types/settings'

export function UserInvitation() {
  const [agencies, setAgencies] = useState<SubAgency[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [invitationLink, setInvitationLink] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState<InviteUserRequest>({
    email: '',
    role: 'member',
    subAgencyId: '',
  })

  useEffect(() => {
    Promise.all([fetchAgencies(), fetchInvitations()]).finally(() =>
      setLoading(false)
    )
  }, [])

  const fetchAgencies = async () => {
    try {
      const response = await fetch('/api/sub-agencies')
      if (!response.ok) throw new Error('Failed to fetch sub-agencies')
      const result = await response.json()
      setAgencies(result.data || [])
    } catch (err) {
      console.error('Error fetching agencies:', err)
    }
  }

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/users/invite')
      if (!response.ok) throw new Error('Failed to fetch invitations')
      const result = await response.json()
      setInvitations(result.data || [])
    } catch (err) {
      console.error('Error fetching invitations:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    setInvitationLink(null)
    setCopySuccess(null)

    try {
      const response = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create invitation')
      }

      setSuccess(`Invitation created for ${formData.email}`)
      setInvitationLink(result.invitationLink)
      setFormData({ email: '', role: 'member', subAgencyId: '' })
      await fetchInvitations()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const copyToClipboard = async (text: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(id || 'main')
      setTimeout(() => setCopySuccess(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const deleteInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to delete this invitation?')) {
      return
    }

    try {
      const response = await fetch(`/api/users/invite/${invitationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete invitation')
      }

      await fetchInvitations()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="p-6 animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-40 bg-muted rounded"></div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Invitation Form */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Invite User</h2>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500 rounded">
            <p className="text-sm text-green-700 font-medium mb-2">{success}</p>
            {invitationLink && (
              <div className="mt-3">
                <Label className="text-xs text-green-700">Invitation Link</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={invitationLink}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    onClick={() => copyToClipboard(invitationLink, 'main')}
                    size="sm"
                    variant="outline"
                  >
                    {copySuccess === 'main' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Share this link with the invitee to accept the invitation
                </p>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="user@example.com"
              required
              disabled={submitting}
            />
          </div>

          <div>
            <Label htmlFor="subAgencyId">Sub-Agency *</Label>
            <select
              id="subAgencyId"
              value={formData.subAgencyId}
              onChange={(e) =>
                setFormData({ ...formData, subAgencyId: e.target.value })
              }
              className="w-full h-10 px-3 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
              required
              disabled={submitting}
            >
              <option value="">Select sub-agency...</option>
              {agencies.map((agency) => (
                <option key={agency.id} value={agency.id}>
                  {agency.name}
                </option>
              ))}
            </select>
            {agencies.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                No sub-agencies available. Create one first.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="role">Role *</Label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value as 'admin' | 'member' | 'viewer',
                })
              }
              className="w-full h-10 px-3 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
              required
              disabled={submitting}
            >
              <option value="viewer">Viewer - Read-only access</option>
              <option value="member">Member - Can edit and manage</option>
              <option value="admin">Admin - Full access</option>
            </select>
          </div>

          <Button type="submit" disabled={submitting || agencies.length === 0}>
            {submitting ? 'Creating...' : 'Create Invitation'}
          </Button>
        </form>
      </Card>

      {/* Pending Invitations */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Pending Invitations</h2>

        {invitations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pending invitations
          </p>
        ) : (
          <div className="space-y-3">
            {invitations.map((invitation) => {
              const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/accept-invite?token=${invitation.token}`
              return (
                <div
                  key={invitation.id}
                  className="flex justify-between items-start p-3 border border-border rounded gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{invitation.email}</p>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                      {invitation.role && <span className="capitalize">{invitation.role}</span>}
                      <span>
                        Created {new Date(invitation.createdAt).toLocaleDateString()}
                      </span>
                      <span
                        className={
                          invitation.status === 'pending'
                            ? 'text-yellow-600'
                            : invitation.status === 'accepted'
                              ? 'text-green-600'
                              : 'text-red-600'
                        }
                      >
                        {invitation.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      type="button"
                      onClick={() => copyToClipboard(inviteLink, invitation.id)}
                      size="sm"
                      variant="outline"
                    >
                      {copySuccess === invitation.id ? 'Copied!' : 'Copy Link'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => deleteInvitation(invitation.id)}
                      size="sm"
                      variant="destructive"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
