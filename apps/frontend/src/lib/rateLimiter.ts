/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000)
  }

  /**
   * Check if a request should be rate limited
   * @param key - Unique identifier (e.g., userId)
   * @param maxRequests - Maximum requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns Object with isLimited flag and retry time
   */
  check(
    key: string,
    maxRequests: number,
    windowMs: number
  ): { isLimited: boolean; retryAfter?: number } {
    const now = Date.now()
    const entry = this.limits.get(key)

    if (!entry || now > entry.resetAt) {
      // First request or window expired - create new entry
      this.limits.set(key, {
        count: 1,
        resetAt: now + windowMs,
      })
      return { isLimited: false }
    }

    if (entry.count >= maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
      return { isLimited: true, retryAfter }
    }

    // Increment counter
    entry.count++
    return { isLimited: false }
  }

  /**
   * Clean up expired entries
   */
  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetAt) {
        this.limits.delete(key)
      }
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string) {
    this.limits.delete(key)
  }

  /**
   * Clear all rate limits
   */
  clear() {
    this.limits.clear()
  }

  /**
   * Clean up the interval on shutdown
   */
  destroy() {
    clearInterval(this.cleanupInterval)
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter()

/**
 * Rate limit for API key creation: 5 keys per hour per user
 */
export const API_KEY_CREATION_LIMIT = 5
export const API_KEY_CREATION_WINDOW = 60 * 60 * 1000 // 1 hour
