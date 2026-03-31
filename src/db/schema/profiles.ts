import { pgTable, text, timestamp, boolean, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { stores } from "./auth";

export const employeeProfiles = pgTable("employee_profiles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  image: text("image"),
  storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("cashier"), // cashier, manager, admin, owner
  pinHash: varchar("pin_hash", { length: 255 }).notNull(), // Exactly 6 digits hashed
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const employeeProfilesRelations = relations(employeeProfiles, ({ one }) => ({
  store: one(stores, {
    fields: [employeeProfiles.storeId],
    references: [stores.id],
  }),
}));

// For owner-defined permissions per employee or per role
export const permissions = pgTable("permissions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(), // e.g., "pos:access", "inventory:manage", "reports:view"
  description: text("description"),
});

export const employeePermissions = pgTable("employee_permissions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  employeeId: text("employee_id").notNull().references(() => employeeProfiles.id, { onDelete: "cascade" }),
  permissionId: text("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
});
