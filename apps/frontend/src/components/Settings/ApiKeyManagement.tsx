'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Copy, Check, AlertTriangle, Key } from 'lucide-react'
import type {
  ApiKey,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  SubAgency,
} from '@/types/settings'

export function ApiKeyManagement() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [subAgencies, setSubAgencies] = useState<SubAgency[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null)
  const [createdKey, setCreatedKey] = useState<CreateApiKeyResponse | null>(
    null
  )
  const [formData, setFormData] = useState<CreateApiKeyRequest>({
    name: '',
    subAgencyId: undefined,
    expiresInDays: undefined,
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchApiKeys()
    fetchSubAgencies()
  }, [])

  const fetchApiKeys = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/api-keys')
      if (!response.ok) throw new Error('Failed to fetch API keys')
      const result = await response.json()
      setApiKeys(result.data || [])
    } catch (err) {
      console.error('Error fetching API keys:', err)
      setError('Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  const fetchSubAgencies = async () => {
    try {
      const response = await fetch('/api/sub-agencies')
      if (!response.ok) throw new Error('Failed to fetch sub-agencies')
      const result = await response.json()
      setSubAgencies(result.data || [])
    } catch (err) {
      console.error('Error fetching sub-agencies:', err)
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
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create API key')
      }

      const newKey: CreateApiKeyResponse = await response.json()
      setCreatedKey(newKey)
      setIsCreateDialogOpen(false)
      setIsSuccessDialogOpen(true)
      setFormData({ name: '', subAgencyId: undefined, expiresInDays: undefined })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedKey) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/api-keys/${selectedKey.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete API key')
      }

      await fetchApiKeys()
      setIsDeleteDialogOpen(false)
      setSelectedKey(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      // Fallback: select text for manual copy
      const input = document.createElement('input')
      input.value = text
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const openDeleteDialog = (key: ApiKey) => {
    setSelectedKey(key)
    setIsDeleteDialogOpen(true)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString()
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
        <div>
          <h2 className="text-lg font-semibold">API Keys</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage API keys for programmatic access to your account
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Key className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      </div>

      {error && !isCreateDialogOpen && !isDeleteDialogOpen && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">{error}</span>
        </div>
      )}

      {apiKeys.length === 0 ? (
        <Card className="p-8 text-center">
          <Key className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No API keys yet</p>
          <p className="text-sm text-muted-foreground mb-6">
            Create an API key to access the platform programmatically
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            Create Your First API Key
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((key) => (
            <Card key={key.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{key.name}</h3>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-mono">
                      {key.prefix}...
                    </p>
                    {key.subAgencyName && (
                      <p className="text-sm text-muted-foreground">
                        Scoped to: <strong>{key.subAgencyName}</strong>
                      </p>
                    )}
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Last used: {formatDate(key.lastUsedAt)}</span>
                      <span>Created: {formatDate(key.createdAt)}</span>
                      {key.expiresAt && (
                        <span>Expires: {formatDate(key.expiresAt)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openDeleteDialog(key)}
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
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for programmatic access. You&apos;ll only see the
              full key once.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive rounded flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive">{error}</span>
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
                  placeholder="My API Key"
                  required
                  minLength={3}
                  maxLength={50}
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  A descriptive name for this API key
                </p>
              </div>
              <div>
                <Label htmlFor="subAgencyId">Sub-Agency (Optional)</Label>
                <Select
                  value={formData.subAgencyId}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      subAgencyId: value === 'none' ? undefined : value,
                    })
                  }
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All sub-agencies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">All sub-agencies</SelectItem>
                    {subAgencies.map((agency) => (
                      <SelectItem key={agency.id} value={agency.id}>
                        {agency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Limit this key to a specific sub-agency
                </p>
              </div>
              <div>
                <Label htmlFor="expiresInDays">Expiration (Optional)</Label>
                <Select
                  value={formData.expiresInDays?.toString()}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      expiresInDays:
                        value === 'never' ? undefined : parseInt(value),
                    })
                  }
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Never expires" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never expires</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  When this key should automatically expire
                </p>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false)
                  setFormData({ name: '', subAgencyId: undefined, expiresInDays: undefined })
                  setError(null)
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create API Key'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Dialog - Show API Key Once */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={(open) => {
        setIsSuccessDialogOpen(open)
        if (!open) {
          setCreatedKey(null)
          fetchApiKeys()
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created Successfully</DialogTitle>
            <DialogDescription>
              Save this API key now. You won&apos;t be able to see it again!
            </DialogDescription>
          </DialogHeader>
          {createdKey && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-800">
                  This is the only time you&apos;ll see this key. Store it securely.
                </span>
              </div>
              <div>
                <Label>API Key</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={createdKey.apiKey}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(createdKey.apiKey)}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>Name:</strong> {createdKey.name}
                </p>
                <p>
                  <strong>Prefix:</strong> {createdKey.prefix}...
                </p>
                <p>
                  <strong>Created:</strong> {formatDate(createdKey.createdAt)}
                </p>
                {createdKey.expiresAt && (
                  <p>
                    <strong>Expires:</strong> {formatDate(createdKey.expiresAt)}
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => {
                setIsSuccessDialogOpen(false)
                setCreatedKey(null)
                fetchApiKeys()
              }}
            >
              I&apos;ve Saved the Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedKey?.name}&quot;? This
              action cannot be undone and will immediately invalidate the key.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedKey(null)
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
