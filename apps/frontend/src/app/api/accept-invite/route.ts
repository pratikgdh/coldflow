import { NextRequest, NextResponse } from 'next/server'
import {
  getInvitationByToken,
  deleteInvitation,
  createAgencyUser,
  getSubAgencyById,
} from '@coldflow/db'
import { requireAuth } from '@/lib/authorization'
import { nanoid } from 'nanoid'

// GET /api/accept-invite?token=xxx - Verify invitation token
export async function GET(request: NextRequest) {
  console.log('GET /api/accept-invite')
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Get invitation by token
    const invitation = await getInvitationByToken(token)

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      )
    }

    // Check if invitation is expired
    const now = new Date()
    if (invitation.expiresAt < now) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      )
    }


    // Return invitation details
    return NextResponse.json({
      email: invitation.email,
      expiresAt: invitation.expiresAt.toISOString(),
    })
  } catch (error: any) {
    console.error('Error verifying invitation:', error)
    return NextResponse.json(
      { error: 'Failed to verify invitation' },
      { status: 500 }
    )
  }
}

// POST /api/auth/accept-invite - Accept invitation after signup/signin
export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth()
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Get invitation by token
    const invitation = await getInvitationByToken(token)

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      )
    }

    // Check if invitation is expired
    const now = new Date()
    if (invitation.expiresAt < now) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      )
    }

    // Verify the email matches
    if (currentUser.email !== invitation.email) {
      return NextResponse.json(
        {
          error: `This invitation is for ${invitation.email}. Please sign in with that email address.`,
        },
        { status: 400 }
      )
    }

    // Check if user is already a member of this sub-agency
    const { getAgencyUserByUserAndAgency } = await import('@coldflow/db')
    const existingAssignment = await getAgencyUserByUserAndAgency(
      currentUser.id,
    )

    if (existingAssignment) {
      // User is already assigned, just delete the invitation
      await deleteInvitation(invitation.id)
      return NextResponse.json({
        message: 'You are already a member of this sub-agency',
        alreadyMember: true,
      })
    }

    // Create agency user assignment
    await createAgencyUser({
      id: nanoid(),
      userId: currentUser.id,
    })

    // Delete the invitation (mark as used)
    await deleteInvitation(invitation.id)

    
    return NextResponse.json({
      message: 'Invitation accepted successfully',
    })
  } catch (error: any) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}
