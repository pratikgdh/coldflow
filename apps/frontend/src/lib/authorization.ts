import { headers } from 'next/headers'
import { auth } from '@coldflow/auth'
import { db } from '@coldflow/db'
import { agencyUser, subAgency } from '@coldflow/db'
import { eq, and } from 'drizzle-orm'

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
}

export class AuthorizationError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number = 403) {
    super(message)
    this.name = 'AuthorizationError'
    this.statusCode = statusCode
  }
}

/**
 * Verify user session and return authenticated user
 * Throws 401 if not authenticated
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    throw new AuthorizationError('Unauthorized - Please sign in', 401)
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  }
}

/**
 * Check if user has minimum required role in a sub-agency
 * Role hierarchy: admin > member > viewer
 */
export async function requireRole(
  userId: string,
  subAgencyId: string,
  requiredRole: 'admin' | 'member' | 'viewer'
): Promise<boolean> {
  const assignment = await db.query.agencyUser.findFirst({
    where: and(
      eq(agencyUser.userId, userId),
      eq(agencyUser.subAgencyId, subAgencyId)
    ),
  })

  if (!assignment) {
    throw new AuthorizationError('User is not a member of this agency', 403)
  }

  const roleHierarchy = { admin: 3, member: 2, viewer: 1 }
  const userRoleLevel = roleHierarchy[assignment.role]
  const requiredRoleLevel = roleHierarchy[requiredRole]

  if (userRoleLevel < requiredRoleLevel) {
    throw new AuthorizationError(
      `Insufficient permissions. Required: ${requiredRole}, Current: ${assignment.role}`,
      403
    )
  }

  return true
}

/**
 * Check if user is admin of a sub-agency
 */
export async function isAgencyAdmin(
  userId: string,
  subAgencyId: string
): Promise<boolean> {
  const assignment = await db.query.agencyUser.findFirst({
    where: and(
      eq(agencyUser.userId, userId),
      eq(agencyUser.subAgencyId, subAgencyId)
    ),
  })

  return assignment?.role === 'admin'
}

/**
 * Check if user owns a sub-agency
 */
export async function isAgencyOwner(
  userId: string,
  subAgencyId: string
): Promise<boolean> {
  const agency = await db.query.subAgency.findFirst({
    where: eq(subAgency.id, subAgencyId),
  })

  return agency?.ownerId === userId
}

/**
 * Get user's role in a sub-agency
 */
export async function getUserRole(
  userId: string,
  subAgencyId: string
): Promise<'admin' | 'member' | 'viewer' | null> {
  const assignment = await db.query.agencyUser.findFirst({
    where: and(
      eq(agencyUser.userId, userId),
      eq(agencyUser.subAgencyId, subAgencyId)
    ),
  })

  return assignment?.role || null
}
