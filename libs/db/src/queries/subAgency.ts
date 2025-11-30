import { db } from "../client";
import { subAgency, agencyUser } from "../schema";
import { eq, sql } from "drizzle-orm";

export interface CreateSubAgencyData {
  id: string;
  name: string;
  description?: string | null;
  parentAgencyId?: string | null;
  ownerId: string;
}

export interface UpdateSubAgencyData {
  name?: string;
  description?: string;
}

export const getSubAgenciesByOwner = async (
  ownerId: string,
  page: number = 1,
  limit: number = 20
) => {
  const offset = (page - 1) * limit;

  const agencies = await db
    .select({
      id: subAgency.id,
      name: subAgency.name,
      description: subAgency.description,
      parentAgencyId: subAgency.parentAgencyId,
      ownerId: subAgency.ownerId,
      createdAt: subAgency.createdAt,
      updatedAt: subAgency.updatedAt,
      memberCount: sql<number>`count(${agencyUser.id})`,
    })
    .from(subAgency)
    .leftJoin(agencyUser, eq(subAgency.id, agencyUser.subAgencyId))
    .where(eq(subAgency.ownerId, ownerId))
    .groupBy(subAgency.id)
    .limit(limit)
    .offset(offset);

  return {
    data: agencies,
    pagination: {
      page,
      limit,
      hasMore: agencies.length === limit,
    },
  };
};

export const getSubAgencyById = async (id: string) => {
  return db.query.subAgency.findFirst({
    where: eq(subAgency.id, id),
    with: {
      agencyUsers: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
};

export const createSubAgency = async (data: CreateSubAgencyData) => {
  const result = await db.insert(subAgency).values(data).returning();
  return result[0];
};

export const updateSubAgency = async (
  id: string,
  data: UpdateSubAgencyData
) => {
  const result = await db
    .update(subAgency)
    .set({
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && {
        description: data.description,
      }),
      updatedAt: new Date(),
    })
    .where(eq(subAgency.id, id))
    .returning();

  return result[0];
};

export const deleteSubAgency = async (id: string) => {
  await db.delete(subAgency).where(eq(subAgency.id, id));
};

export const isSubAgencyOwner = async (userId: string, subAgencyId: string) => {
  const agency = await db.query.subAgency.findFirst({
    where: eq(subAgency.id, subAgencyId),
  });

  return agency?.ownerId === userId;
};
