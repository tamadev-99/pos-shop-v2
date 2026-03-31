import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { stores } from "./auth";
import { productVariants } from "./products";
import { employeeProfiles } from "./profiles";

export const opnameStatusEnum = pgEnum("opname_status", [
  "draft",
  "in_progress",
  "pending_review",
  "completed",
  "cancelled",
]);

export const stockOpnames = pgTable("stock_opnames", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  note: text("note"),
  status: opnameStatusEnum("status").notNull().default("draft"),
  employeeProfileId: text("employee_profile_id").references(() => employeeProfiles.id),
  createdByName: text("created_by_name").notNull(),
  reviewedByProfileId: text("reviewed_by_profile_id").references(() => employeeProfiles.id),
  reviewedByName: text("reviewed_by_name"),
  reviewNote: text("review_note"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const stockOpnameItems = pgTable("stock_opname_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  opnameId: text("opname_id").notNull().references(() => stockOpnames.id, { onDelete: "cascade" }),
  storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  variantId: text("variant_id").notNull().references(() => productVariants.id),
  systemStock: integer("system_stock").notNull(),
  actualStock: integer("actual_stock"),
  difference: integer("difference"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const stockOpnamesRelations = relations(stockOpnames, ({ one, many }) => ({
  employee: one(employeeProfiles, {
    fields: [stockOpnames.employeeProfileId],
    references: [employeeProfiles.id],
  }),
  reviewer: one(employeeProfiles, {
    fields: [stockOpnames.reviewedByProfileId],
    references: [employeeProfiles.id],
  }),
  store: one(stores, {
    fields: [stockOpnames.storeId],
    references: [stores.id],
  }),
  items: many(stockOpnameItems),
}));

export const stockOpnameItemsRelations = relations(stockOpnameItems, ({ one }) => ({
  opname: one(stockOpnames, {
    fields: [stockOpnameItems.opnameId],
    references: [stockOpnames.id],
  }),
  variant: one(productVariants, {
    fields: [stockOpnameItems.variantId],
    references: [productVariants.id],
  }),
  store: one(stores, {
    fields: [stockOpnameItems.storeId],
    references: [stores.id],
  }),
}));

