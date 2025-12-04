import { db } from "../client";
import { verification, user, CreateInvitationData } from "../schema";
import { eq, like } from "drizzle-orm";


export const getUserByEmail = async (email: string) => {
  return db.query.user.findFirst({
    where: eq(user.email, email),
  });
};

export const createInvitation = async (data: CreateInvitationData) => {
  await db.insert(verification).values({
    id: data.id,
    email: data.email,
    token: data.token,
    role: data.role,
    subAgencyId: data.subAgencyId,
    expiresAt: data.expiresAt,
    createdBy: data.createdBy,
  });
};

export const getPendingInvitations = async (createdByUserId: string) => {
  return await db.select().from(verification).where(eq(verification.createdBy, createdByUserId));
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
  return db.query.verification.findFirst({
    where: eq(verification.token, token),
  });
};
