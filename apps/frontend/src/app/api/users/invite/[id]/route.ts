import { NextRequest, NextResponse } from 'next/server'
import {
  getInvitationById,
  deleteInvitation,
} from '@coldflow/db'
import { requireAuth } from '@/lib/authorization'

// DELETE /api/users/invite/[id] - Delete a pending invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth()
    const { id } = await params

    // Check if invitation exists
    const invitation = await getInvitationById(id)

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Delete the invitation
    await deleteInvitation(id)

    return NextResponse.json({ message: 'Invitation deleted successfully' })
  } catch (error: any) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }
    console.error('Error deleting invitation:', error)
    return NextResponse.json(
      { error: 'Failed to delete invitation' },
      { status: 500 }
    )
  }
}
