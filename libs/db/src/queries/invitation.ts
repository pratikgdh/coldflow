import { db } from "../client";
import { verification, user } from "../schema";
import { eq, like } from "drizzle-orm";

export interface CreateInvitationData {
  id: string;
  email: string;
  token: string;
  role: 'admin' | 'member' | 'viewer';
  subAgencyId: string;
  expiresAt: Date;
}

export const getUserByEmail = async (email: string) => {
  return db.query.user.findFirst({
    where: eq(user.email, email),
  });
};

export const createInvitation = async (data: CreateInvitationData) => {
  // Store invitation data as JSON in value field
  const invitationData = {
    token: data.token,
    role: data.role,
    subAgencyId: data.subAgencyId,
  };

  await db.insert(verification).values({
    id: data.id,
    identifier: `invite:${data.email}`,
    value: JSON.stringify(invitationData),
    expiresAt: data.expiresAt,
  });
};

export const getPendingInvitations = async () => {
  return db.query.verification.findMany({
    where: like(verification.identifier, "invite:%"),
  });
};

export const getInvitationById = async (id: string) => {
  return db.query.verification.findFirst({
    where: eq(verification.id, id),
  });
};

export const deleteInvitation = async (id: string) => {
  await db.delete(verification).where(eq(verification.id, id));
};

export const getInvitationByToken = async (token: string) => {
  const invitations = await db.query.verification.findMany({
    where: eq(verification.value, token),
  });

  // Find invitation that matches the token
  for (const inv of invitations) {
    try {
      if (inv.value === token) {
        const email = inv.identifier.replace('invite:', '');
        return {
          id: inv.id,
          email,
          token: inv.value,
          expiresAt: inv.expiresAt,
          createdAt: inv.createdAt,
        };
      }
    } catch (e) {
      // Skip invalid JSON entries
      continue;
    }
  }

  return null;
};
