'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import type { SubAgency, CreateSubAgencyRequest } from '@/types/settings'

export function SubAgencyManagement() {
  const [agencies, setAgencies] = useState<SubAgency[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAgency, setSelectedAgency] = useState<SubAgency | null>(null)
  const [formData, setFormData] = useState<CreateSubAgencyRequest>({
    name: '',
    description: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchAgencies()
  }, [])

  const fetchAgencies = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sub-agencies')
      if (!response.ok) throw new Error('Failed to fetch sub-agencies')
      const result = await response.json()
      setAgencies(result.data || [])
    } catch (err) {
      console.error('Error fetching agencies:', err)
      setError('Failed to load sub-agencies')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name.length < 3 || formData.name.length > 50) {
      setError('Name must be between 3 and 50 characters')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/sub-agencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create sub-agency')
      }

      await fetchAgencies()
      setIsCreateDialogOpen(false)
      setFormData({ name: '', description: '' })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAgency) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/sub-agencies/${selectedAgency.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update sub-agency')
      }

      await fetchAgencies()
      setIsEditDialogOpen(false)
      setSelectedAgency(null)
      setFormData({ name: '', description: '' })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedAgency) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/sub-agencies/${selectedAgency.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete sub-agency')
      }

      await fetchAgencies()
      setIsDeleteDialogOpen(false)
      setSelectedAgency(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const openEditDialog = (agency: SubAgency) => {
    setSelectedAgency(agency)
    setFormData({
      name: agency.name,
      description: agency.description || '',
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (agency: SubAgency) => {
    setSelectedAgency(agency)
    setIsDeleteDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Sub-Agencies</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          Create Sub-Agency
        </Button>
      </div>

      {error && !isCreateDialogOpen && !isEditDialogOpen && !isDeleteDialogOpen && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
          {error}
        </div>
      )}

      {agencies.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No sub-agencies yet</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            Create Your First Sub-Agency
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {agencies.map((agency) => (
            <Card key={agency.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{agency.name}</h3>
                  {agency.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {agency.description}
                    </p>
                  )}
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{agency.memberCount || 0} members</span>
                    <span>
                      Created {new Date(agency.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(agency)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openDeleteDialog(agency)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Sub-Agency</DialogTitle>
            <DialogDescription>
              Create a new sub-agency to organize your team
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
                  {error}
                </div>
              )}
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter sub-agency name"
                  required
                  minLength={3}
                  maxLength={50}
                  disabled={submitting}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter description (optional)"
                  disabled={submitting}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false)
                  setFormData({ name: '', description: '' })
                  setError(null)
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sub-Agency</DialogTitle>
            <DialogDescription>
              Update sub-agency information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
                  {error}
                </div>
              )}
              <div>
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter sub-agency name"
                  required
                  minLength={3}
                  maxLength={50}
                  disabled={submitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter description (optional)"
                  disabled={submitting}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setSelectedAgency(null)
                  setFormData({ name: '', description: '' })
                  setError(null)
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Updating...' : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sub-Agency</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedAgency?.name}&quot;? This
              action cannot be undone and will remove all user assignments.
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
                setSelectedAgency(null)
                setError(null)
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
