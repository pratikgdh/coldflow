'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import type { AgencyUser, SubAgency, AssignUserRequest } from '@/types/settings'

interface User {
  id: string
  name: string
  email: string
}

export function UserAssignments() {
  const [assignments, setAssignments] = useState<AgencyUser[]>([])
  const [agencies, setAgencies] = useState<SubAgency[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<AgencyUser | null>(null)
  const [filterAgencyId, setFilterAgencyId] = useState<string>('')
  const [formData, setFormData] = useState<AssignUserRequest>({
    userId: '',
    subAgencyId: '',
    role: 'member',
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([fetchAssignments(), fetchAgencies(), fetchUsers()]).finally(
      () => setLoading(false)
    )
  }, [filterAgencyId])

  const fetchAssignments = async () => {
    try {
      const url = filterAgencyId
        ? `/api/agency-users?subAgencyId=${filterAgencyId}`
        : '/api/agency-users'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch assignments')
      const result = await response.json()
      setAssignments(result.data || [])
    } catch (err) {
      console.error('Error fetching assignments:', err)
      setError('Failed to load user assignments')
    }
  }

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

  const fetchUsers = async () => {
    // In a real app, you would have a /api/users endpoint
    // For now, we'll extract users from assignments
    setUsers([])
  }

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/agency-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to assign user')
      }

      await fetchAssignments()
      setIsAssignDialogOpen(false)
      setFormData({ userId: '', subAgencyId: '', role: 'member' })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateRole = async (assignmentId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/agency-users/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update role')
      }

      await fetchAssignments()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleRemove = async () => {
    if (!selectedAssignment) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/agency-users/${selectedAssignment.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove user')
      }

      await fetchAssignments()
      setIsDeleteDialogOpen(false)
      setSelectedAssignment(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
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
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-lg font-semibold">User Assignments</h2>
        <div className="flex gap-4 items-center flex-wrap">
          <div>
            <select
              value={filterAgencyId}
              onChange={(e) => setFilterAgencyId(e.target.value)}
              className="h-10 px-3 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">All sub-agencies</option>
              {agencies.map((agency) => (
                <option key={agency.id} value={agency.id}>
                  {agency.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && !isAssignDialogOpen && !isDeleteDialogOpen && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
          {error}
        </div>
      )}

      {assignments.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">
            No users assigned yet. Invite users to get started.
          </p>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Sub-Agency
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="border-b border-border">
                    <td className="py-3 px-4 text-sm">
                      {assignment.user?.name || 'Unknown'}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {assignment.user?.email || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {assignment.subAgency?.name || 'Unknown'}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={assignment.role}
                        onChange={(e) =>
                          handleUpdateRole(assignment.id, e.target.value)
                        }
                        className="h-8 px-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedAssignment(assignment)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove User Assignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedAssignment?.user?.name} from{' '}
              {selectedAssignment?.subAgency?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
              {error}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedAssignment(null)
                setError(null)
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={submitting}
            >
              {submitting ? 'Removing...' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
