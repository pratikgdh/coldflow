// API Request Types
export interface CreateSubAgencyRequest {
  name: string
  description?: string
  parentAgencyId?: string
}

export interface UpdateSubAgencyRequest {
  name?: string
  description?: string
}

export interface InviteUserRequest {
  email: string
  role: 'admin' | 'member' | 'viewer'
  subAgencyId: string
}

export interface AssignUserRequest {
  userId: string
  subAgencyId: string
  role: 'admin' | 'member' | 'viewer'
}

export interface UpdateUserRoleRequest {
  role: 'admin' | 'member' | 'viewer'
}

// API Response Types
export interface SubAgency {
  id: string
  name: string
  description?: string | null
  parentAgencyId?: string | null
  ownerId: string
  createdAt: string
  updatedAt: string
  memberCount?: number
}

export interface AgencyUser {
  id: string
  userId: string
  subAgencyId: string
  role: 'admin' | 'member' | 'viewer'
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name: string
    email: string
  }
  subAgency?: {
    id: string
    name: string
  }
}

export interface Invitation {
  id: string
  email: string
  role: 'admin' | 'member' | 'viewer'
  subAgencyId: string
  subAgencyName?: string
  status: 'pending' | 'accepted' | 'expired'
  createdAt: string
  expiresAt: string
}

// UI State Types
export type SettingsTab = 'sub-agencies' | 'users' | 'invitations'

export interface ApiError {
  message: string
  code?: string
}
