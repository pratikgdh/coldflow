import { NextRequest, NextResponse } from 'next/server'
import {
  getApiKeysByUserId,
  createApiKey as dbCreateApiKey,
  isSubAgencyOwner,
  isAgencyAdmin,
} from '@coldflow/db'
import { requireAuth } from '@/lib/authorization'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import {
  generateApiKey,
  hashApiKey,
  extractKeyPrefix,
} from '@/lib/apiKeyUtils'
import {
  rateLimiter,
  API_KEY_CREATION_LIMIT,
  API_KEY_CREATION_WINDOW,
} from '@/lib/rateLimiter'
import { logApiKeyEvent, getClientInfo } from '@/lib/auditLog'

const createApiKeySchema = z.object({
  name: z.string().min(3).max(50),
  subAgencyId: z.string().optional(),
  expiresInDays: z.number().min(1).max(365).optional(),
})

// GET /api/api-keys - List all API keys for authenticated user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const searchParams = request.nextUrl.searchParams
    const subAgencyId = searchParams.get('subAgencyId') || undefined

    // If filtering by sub-agency, verify user has access
    if (subAgencyId) {
      const isOwner = await isSubAgencyOwner(user.id, subAgencyId)
      const isAdmin = await isAgencyAdmin(user.id, subAgencyId)

      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: 'Access denied to this sub-agency' },
          { status: 403 }
        )
      }
    }

    const keys = await getApiKeysByUserId(user.id, subAgencyId)

    return NextResponse.json({ data: keys })
  } catch (error: any) {
    if (error.statusCode === 401) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

// POST /api/api-keys - Create new API key
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Rate limiting: 5 API keys per hour per user
    const rateLimitCheck = rateLimiter.check(
      `api-key-creation:${user.id}`,
      API_KEY_CREATION_LIMIT,
      API_KEY_CREATION_WINDOW
    )

    if (rateLimitCheck.isLimited) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many API key creation requests. Please try again in ${rateLimitCheck.retryAfter} seconds.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitCheck.retryAfter?.toString() || '3600',
          },
        }
      )
    }

    const body = await request.json()
    const validatedData = createApiKeySchema.parse(body)

    // If scoped to a sub-agency, verify user is owner or admin
    if (validatedData.subAgencyId) {
      const isOwner = await isSubAgencyOwner(
        user.id,
        validatedData.subAgencyId
      )
      const isAdmin = await isAgencyAdmin(user.id, validatedData.subAgencyId)

      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: 'Access denied to this sub-agency' },
          { status: 403 }
        )
      }
    }

    // Generate the plain API key (only time we'll have it)
    const plainApiKey = generateApiKey()

    // Hash the key for storage
    const hashedKey = await hashApiKey(plainApiKey)

    // Extract prefix for display
    const prefix = extractKeyPrefix(plainApiKey)

    // Calculate expiration date if provided
    let expiresAt: Date | null = null
    if (validatedData.expiresInDays) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + validatedData.expiresInDays)
    }

    // Create the API key in database
    const newKey = await dbCreateApiKey({
      id: nanoid(),
      name: validatedData.name,
      hashedKey,
      prefix,
      userId: user.id,
      subAgencyId: validatedData.subAgencyId || null,
      expiresAt,
    })

    // Audit log
    const clientInfo = getClientInfo(request)
    logApiKeyEvent({
      event: 'API_KEY_CREATED',
      userId: user.id,
      keyId: newKey.id,
      keyName: newKey.name,
      subAgencyId: newKey.subAgencyId,
      timestamp: new Date().toISOString(),
      ...clientInfo,
    })

    // Return the plain key (ONLY TIME THIS HAPPENS)
    // Also return metadata without the hashed key
    return NextResponse.json(
      {
        apiKey: plainApiKey, // Full plain key - show once!
        id: newKey.id,
        name: newKey.name,
        prefix: newKey.prefix,
        createdAt: newKey.createdAt,
        expiresAt: newKey.expiresAt,
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.statusCode === 401) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating API key:', error)
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    )
  }
}
