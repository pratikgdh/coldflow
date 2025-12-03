import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'

const API_KEY_PREFIX = 'cfk_'
const RANDOM_BYTES_LENGTH = 32 // 32 bytes = 64 hex characters
const BCRYPT_ROUNDS = 10

/**
 * Generate a secure API key with the format: cfk_<64 hex characters>
 * Total length: 68 characters
 * Example: cfk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
 */
export function generateApiKey(): string {
  try {
    const randomPortion = randomBytes(RANDOM_BYTES_LENGTH).toString('hex')
    return `${API_KEY_PREFIX}${randomPortion}`
  } catch (error) {
    throw new Error('Failed to generate secure API key')
  }
}

/**
 * Hash an API key using bcrypt
 * Cost factor of 10 provides good security/performance balance (~100ms)
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  try {
    const hash = await bcrypt.hash(apiKey, BCRYPT_ROUNDS)
    return hash
  } catch (error) {
    throw new Error('Failed to hash API key')
  }
}

/**
 * Verify an API key against its bcrypt hash
 * Uses bcrypt.compare which is timing-safe
 */
export async function verifyApiKey(
  plainKey: string,
  hashedKey: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(plainKey, hashedKey)
  } catch (error) {
    throw new Error('Failed to verify API key')
  }
}

/**
 * Extract the prefix (first 8 characters) for display purposes
 * Example: "cfk_a1b2c3d4..." -> "cfk_a1b2"
 */
export function extractKeyPrefix(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    throw new Error('Invalid API key format')
  }
  return apiKey.substring(0, 8)
}

/**
 * Validate API key format
 * Must start with "cfk_" and be exactly 68 characters
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  return (
    apiKey.startsWith(API_KEY_PREFIX) &&
    apiKey.length === API_KEY_PREFIX.length + RANDOM_BYTES_LENGTH * 2
  )
}
