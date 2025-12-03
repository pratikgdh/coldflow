import { NextRequest } from 'next/server'
import { getApiKeyByHash, updateLastUsedAt } from '@coldflow/db'
import { hashApiKey, isValidApiKeyFormat } from './apiKeyUtils'
import { AuthorizationError } from './authorization'
import { logApiKeyEvent, getClientInfo } from './auditLog'

export interface ApiKeyAuthenticatedUser {
  id: string
  email: string
  name: string
  subAgencyId?: string | null // Scope restriction
  keyId: string
  isApiKeyAuth: true // Flag to distinguish from session auth
}

/**
 * Authenticate a request using an API key from the Authorization header
 * Format: "Authorization: Bearer cfk_..."
 *
 * @throws AuthorizationError with statusCode 401 if authentication fails
 */
export async function authenticateApiKey(
  request: NextRequest
): Promise<ApiKeyAuthenticatedUser> {
  // Extract Authorization header
  const authHeader = request.headers.get('authorization')

  if (!authHeader) {
    throw new AuthorizationError('Missing Authorization header', 401)
  }

  // Verify Bearer token format
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new AuthorizationError(
      'Invalid Authorization header format. Expected: Bearer <api_key>',
      401
    )
  }

  const plainApiKey = parts[1]

  // Validate API key format
  if (!isValidApiKeyFormat(plainApiKey)) {
    throw new AuthorizationError('Invalid API key format', 401)
  }

  try {
    // Hash the provided key to look it up in database
    const hashedKey = await hashApiKey(plainApiKey)

    // Look up the key in database
    const keyRecord = await getApiKeyByHash(hashedKey)

    if (!keyRecord) {
      throw new AuthorizationError('Invalid API key', 401)
    }

    // Check if key is expired
    if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
      throw new AuthorizationError('API key has expired', 401)
    }

    // Update last used timestamp (fire and forget - don't wait)
    updateLastUsedAt(keyRecord.id).catch((err) =>
      console.error('Failed to update API key last used timestamp:', err)
    )

    // Audit log - successful authentication
    const clientInfo = getClientInfo(request)
    logApiKeyEvent({
      event: 'API_KEY_USED',
      userId: keyRecord.user.id,
      keyId: keyRecord.id,
      keyName: keyRecord.name,
      subAgencyId: keyRecord.subAgencyId,
      timestamp: new Date().toISOString(),
      ...clientInfo,
    })

    // Return authenticated user with scope information
    return {
      id: keyRecord.user.id,
      email: keyRecord.user.email,
      name: keyRecord.user.name,
      subAgencyId: keyRecord.subAgencyId,
      keyId: keyRecord.id,
      isApiKeyAuth: true,
    }
  } catch (error) {
    // Audit log - failed authentication
    const clientInfo = getClientInfo(request)
    logApiKeyEvent({
      event: 'API_KEY_AUTH_FAILED',
      userId: 'unknown',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      ...clientInfo,
    })

    if (error instanceof AuthorizationError) {
      throw error
    }
    console.error('API key authentication error:', error)
    throw new AuthorizationError('Authentication failed', 401)
  }
}

/**
 * Verify that an API key has access to a specific sub-agency
 * If the key is scoped to a sub-agency, it can only access that sub-agency
 * If the key is not scoped, it has access to all user's sub-agencies
 */
export function verifyApiKeyScope(
  authenticatedUser: ApiKeyAuthenticatedUser,
  requestedSubAgencyId: string
): boolean {
  // If key has no scope restriction, allow access
  if (!authenticatedUser.subAgencyId) {
    return true
  }

  // If key is scoped, only allow access to that specific sub-agency
  return authenticatedUser.subAgencyId === requestedSubAgencyId
}
