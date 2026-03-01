import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { categories } from "./products";

export const supplierStatusEnum = pgEnum("supplier_status", ["aktif", "nonaktif"]);

export const suppliers = pgTable("suppliers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  contactPerson: text("contact_person").notNull(),
  phone: text("phone").notNull(),
  email: text("email").default(""),
  address: text("address").default(""),
  totalOrders: integer("total_orders").notNull().default(0),
  totalSpent: integer("total_spent").notNull().default(0),
  status: supplierStatusEnum("status").notNull().default("aktif"),
  joinDate: text("join_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const supplierCategories = pgTable("supplier_categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  supplierId: text("supplier_id").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
});

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  supplierCategories: many(supplierCategories),
}));

export const supplierCategoriesRelations = relations(supplierCategories, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierCategories.supplierId],
    references: [suppliers.id],
  }),
  category: one(categories, {
    fields: [supplierCategories.categoryId],
    references: [categories.id],
  }),
}));
