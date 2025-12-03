import { NextRequest, NextResponse } from 'next/server'
import { deleteApiKey } from '@coldflow/db'
import { requireAuth } from '@/lib/authorization'
import { logApiKeyEvent, getClientInfo } from '@/lib/auditLog'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// DELETE /api/api-keys/[id] - Delete an API key
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // deleteApiKey verifies ownership before deletion
    const deletedKey = await deleteApiKey(id, user.id)

    if (!deletedKey) {
      return NextResponse.json(
        { error: 'API key not found or access denied' },
        { status: 404 }
      )
    }

    // Audit log
    const clientInfo = getClientInfo(request)
    logApiKeyEvent({
      event: 'API_KEY_DELETED',
      userId: user.id,
      keyId: deletedKey.id,
      keyName: deletedKey.name,
      subAgencyId: deletedKey.subAgencyId,
      timestamp: new Date().toISOString(),
      ...clientInfo,
    })

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully',
    })
  } catch (error: any) {
    if (error.statusCode === 401) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error deleting API key:', error)
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    )
  }
}
