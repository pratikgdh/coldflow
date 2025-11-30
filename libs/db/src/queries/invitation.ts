import { db } from "../client";
import { verification, user } from "../schema";
import { eq, like } from "drizzle-orm";

export interface CreateInvitationData {
  id: string;
  email: string;
  token: string;
  expiresAt: Date;
}

export const getUserByEmail = async (email: string) => {
  return db.query.user.findFirst({
    where: eq(user.email, email),
  });
};

export const createInvitation = async (data: CreateInvitationData) => {
  await db.insert(verification).values({
    id: data.id,
    identifier: `invite:${data.email}`,
    value: data.token,
    expiresAt: data.expiresAt,
  });
};

export const getPendingInvitations = async () => {
  return db.query.verification.findMany({
    where: like(verification.identifier, "invite:%"),
  });
};
