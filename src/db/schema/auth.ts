import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("user_role", ["owner", "saas-admin"]);
export const storeTypeEnum = pgEnum("store_type", ["clothing", "minimart"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: roleEnum("role").notNull().default("owner"),
  banned: boolean("banned").notNull().default(false),
  bannedReason: text("banned_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const subscriptionStatusEnum = pgEnum("subscription_status", ["trial", "active", "expired"]);

export const subscriptionPlans = pgTable("subscription_plans", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(), // e.g., "Pro Plan"
  description: text("description"),
  price: text("price").notNull().default("100000"), // Store as string to avoid floating point issues
  billingCycle: text("billing_cycle").notNull().default("monthly"), // monthly, yearly
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const tenants = pgTable("tenants", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: text("plan_id").references(() => subscriptionPlans.id), // Link to plan
  subscriptionStatus: subscriptionStatusEnum("subscription_status").notNull().default("trial"),
  trialEndsAt: timestamp("trial_ends_at").notNull().defaultNow(),
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const subscriptionTransactions = pgTable("subscription_transactions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  planId: text("plan_id").notNull().references(() => subscriptionPlans.id),
  amount: text("amount").notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, failed, expired
  mayarInvoiceId: text("mayar_invoice_id"),
  paymentMethod: text("payment_method"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const stores = pgTable("stores", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  type: storeTypeEnum("type").notNull(),
  address: text("address"),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  activeStoreId: text("active_store_id"), // Track active store per session
  activeEmployeeProfileId: text("active_employee_profile_id"), // Track active employee profile per session
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  tenants: many(tenants),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  tenants: many(tenants),
  transactions: many(subscriptionTransactions),
}));

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  owner: one(users, {
    fields: [tenants.ownerId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [tenants.planId],
    references: [subscriptionPlans.id],
  }),
  stores: many(stores),
  transactions: many(subscriptionTransactions),
}));

export const subscriptionTransactionsRelations = relations(subscriptionTransactions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [subscriptionTransactions.tenantId],
    references: [tenants.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptionTransactions.planId],
    references: [subscriptionPlans.id],
  }),
}));

export const storesRelations = relations(stores, ({ one }) => ({
  tenant: one(tenants, {
    fields: [stores.tenantId],
    references: [tenants.id],
  }),
}));

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

