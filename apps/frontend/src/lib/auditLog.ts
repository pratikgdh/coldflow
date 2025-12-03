/**
 * Audit logging for API key operations
 * Currently logs to console - can be extended to log to database or external service
 */

export type ApiKeyEvent =
  | 'API_KEY_CREATED'
  | 'API_KEY_DELETED'
  | 'API_KEY_USED'
  | 'API_KEY_AUTH_FAILED'

export interface ApiKeyAuditLog {
  event: ApiKeyEvent
  userId: string
  keyId?: string
  keyName?: string
  subAgencyId?: string | null
  timestamp: string
  ipAddress?: string
  userAgent?: string
  error?: string
}

/**
 * Log an API key event
 * For production, consider:
 * - Writing to a database audit table
 * - Sending to an external logging service (e.g., DataDog, CloudWatch)
 * - Implementing log rotation
 */
export function logApiKeyEvent(log: ApiKeyAuditLog) {
  const logLevel = log.event === 'API_KEY_AUTH_FAILED' ? 'warn' : 'info'

  const logData = {
    ...log,
    timestamp: log.timestamp || new Date().toISOString(),
  }

  // Structured logging
  if (logLevel === 'warn') {
    console.warn('[API_KEY_AUDIT]', JSON.stringify(logData))
  } else {
    console.info('[API_KEY_AUDIT]', JSON.stringify(logData))
  }

  // In production, you might also:
  // - await db.insert(auditLog).values(logData)
  // - await sendToLoggingService(logData)
}

/**
 * Extract client information from request
 */
export function getClientInfo(request: Request): {
  ipAddress?: string
  userAgent?: string
} {
  return {
    ipAddress:
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  }
}
