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

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  ownedAgencies: many(subAgency),
  agencyMemberships: many(agencyUser),
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

// Role enum for user permissions
export const roleEnum = pgEnum("role", ["admin", "member", "viewer"]);

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
      .notNull()
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

