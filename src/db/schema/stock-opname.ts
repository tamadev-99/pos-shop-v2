import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";
import { productVariants } from "./products";

export const opnameStatusEnum = pgEnum("opname_status", [
  "draft",
  "in_progress",
  "pending_review",
  "completed",
  "cancelled",
]);

export const stockOpnames = pgTable("stock_opnames", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text("code").notNull().unique(),
  note: text("note"),
  status: opnameStatusEnum("status").notNull().default("draft"),
  createdBy: text("created_by").references(() => users.id),
  createdByName: text("created_by_name").notNull(),
  reviewedBy: text("reviewed_by").references(() => users.id),
  reviewedByName: text("reviewed_by_name"),
  reviewNote: text("review_note"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const stockOpnameItems = pgTable("stock_opname_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  opnameId: text("opname_id").notNull().references(() => stockOpnames.id, { onDelete: "cascade" }),
  variantId: text("variant_id").notNull().references(() => productVariants.id),
  systemStock: integer("system_stock").notNull(),
  actualStock: integer("actual_stock"),
  difference: integer("difference"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const stockOpnamesRelations = relations(stockOpnames, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [stockOpnames.createdBy],
    references: [users.id],
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
}));
