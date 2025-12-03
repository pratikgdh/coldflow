import { db } from "../client";
import { apiKey, subAgency } from "../schema";
import { eq, and, lt } from "drizzle-orm";

export interface CreateApiKeyData {
  id: string;
  name: string;
  hashedKey: string;
  prefix: string;
  userId: string;
  subAgencyId?: string | null;
  expiresAt?: Date | null;
}

export interface ApiKeyWithSubAgency {
  id: string;
  name: string;
  prefix: string;
  userId: string;
  subAgencyId: string | null;
  subAgencyName: string | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
}

/**
 * Get all API keys for a user, optionally filtered by sub-agency
 * Returns keys without hashedKey for security
 */
export const getApiKeysByUserId = async (
  userId: string,
  subAgencyId?: string
): Promise<ApiKeyWithSubAgency[]> => {
  const conditions = [eq(apiKey.userId, userId)];

  if (subAgencyId) {
    conditions.push(eq(apiKey.subAgencyId, subAgencyId));
  }

  const keys = await db
    .select({
      id: apiKey.id,
      name: apiKey.name,
      prefix: apiKey.prefix,
      userId: apiKey.userId,
      subAgencyId: apiKey.subAgencyId,
      subAgencyName: subAgency.name,
      lastUsedAt: apiKey.lastUsedAt,
      createdAt: apiKey.createdAt,
      expiresAt: apiKey.expiresAt,
    })
    .from(apiKey)
    .leftJoin(subAgency, eq(apiKey.subAgencyId, subAgency.id))
    .where(and(...conditions))
    .orderBy(apiKey.createdAt);

  return keys;
};

/**
 * Get an API key by its hashed value
 * Used for authentication - includes user and subAgency relations
 * Checks expiration and returns null if expired
 */
export const getApiKeyByHash = async (hashedKey: string) => {
  const result = await db.query.apiKey.findFirst({
    where: eq(apiKey.hashedKey, hashedKey),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      subAgency: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Check if key is expired
  if (result?.expiresAt && new Date(result.expiresAt) < new Date()) {
    return null;
  }

  return result;
};

/**
 * Create a new API key
 */
export const createApiKey = async (data: CreateApiKeyData) => {
  const result = await db.insert(apiKey).values(data).returning();
  return result[0];
};

/**
 * Delete an API key
 * Verifies ownership before deletion
 */
export const deleteApiKey = async (id: string, userId: string) => {
  const result = await db
    .delete(apiKey)
    .where(and(eq(apiKey.id, id), eq(apiKey.userId, userId)))
    .returning();

  return result[0];
};

/**
 * Update the lastUsedAt timestamp for an API key
 * Called on each successful API request
 */
export const updateLastUsedAt = async (id: string) => {
  await db
    .update(apiKey)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKey.id, id));
};

/**
 * Delete expired API keys (for cleanup jobs)
 * Returns the number of keys deleted
 */
export const cleanupExpiredApiKeys = async (): Promise<number> => {
  const result = await db
    .delete(apiKey)
    .where(lt(apiKey.expiresAt, new Date()))
    .returning();

  return result.length;
};
