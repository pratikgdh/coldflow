import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, index, pgEnum } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

// Role enum for user permissions
export const roleEnum = pgEnum("role", ["admin", "member", "viewer"]);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    subAgencyId: text("sub_agency_id"),
    role: roleEnum("role").notNull().default("member"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  }
);

export type CreateInvitationData = typeof verification.$inferInsert;
export type Verification = typeof verification.$inferSelect;

// Sub-Agency table
export const subAgency = pgTable(
  "sub_agency",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    parentAgencyId: text("parent_agency_id"),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("sub_agency_ownerId_idx").on(table.ownerId),
    index("sub_agency_parentAgencyId_idx").on(table.parentAgencyId),
  ]
);

// Agency-User join table with roles
export const agencyUser = pgTable(
  "agency_user",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    subAgencyId: text("sub_agency_id")
      .references(() => subAgency.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull().default("member"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("agency_user_userId_idx").on(table.userId),
    index("agency_user_subAgencyId_idx").on(table.subAgencyId),
  ]
);

// Relations for sub-agencies
export const subAgencyRelations = relations(subAgency, ({ one, many }) => ({
  owner: one(user, {
    fields: [subAgency.ownerId],
    references: [user.id],
  }),
  parentAgency: one(subAgency, {
    fields: [subAgency.parentAgencyId],
    references: [subAgency.id],
    relationName: "subAgencies",
  }),
  childAgencies: many(subAgency, {
    relationName: "subAgencies",
  }),
  agencyUsers: many(agencyUser),
}));

// Relations for agency users
export const agencyUserRelations = relations(agencyUser, ({ one }) => ({
  user: one(user, {
    fields: [agencyUser.userId],
    references: [user.id],
  }),
  subAgency: one(subAgency, {
    fields: [agencyUser.subAgencyId],
    references: [subAgency.id],
  }),
}));

// API Key table
export const apiKey = pgTable(
  "api_key",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    hashedKey: text("hashed_key").notNull().unique(),
    prefix: text("prefix").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    subAgencyId: text("sub_agency_id").references(() => subAgency.id, {
      onDelete: "cascade",
    }),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at"),
  },
  (table) => [
    index("api_key_userId_idx").on(table.userId),
    index("api_key_hashedKey_idx").on(table.hashedKey),
    index("api_key_subAgencyId_idx").on(table.subAgencyId),
    index("api_key_userId_subAgencyId_idx").on(table.userId, table.subAgencyId),
  ]
);

// All Relations (defined after all tables)
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  ownedAgencies: many(subAgency),
  agencyMemberships: many(agencyUser),
  apiKeys: many(apiKey),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const apiKeyRelations = relations(apiKey, ({ one }) => ({
  user: one(user, {
    fields: [apiKey.userId],
    references: [user.id],
  }),
  subAgency: one(subAgency, {
    fields: [apiKey.subAgencyId],
    references: [subAgency.id],
  }),
}));

