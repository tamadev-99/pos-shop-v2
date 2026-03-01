import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";
import { suppliers } from "./suppliers";
import { productVariants } from "./products";

export const poStatusEnum = pgEnum("po_status", ["diproses", "dikirim", "diterima", "dibatalkan"]);

export const purchaseOrders = pgTable("purchase_orders", {
  id: text("id").primaryKey(),
  supplierId: text("supplier_id").notNull().references(() => suppliers.id),
  date: text("date").notNull(),
  expectedDate: text("expected_date"),
  receivedDate: text("received_date"),
  status: poStatusEnum("status").notNull().default("diproses"),
  total: integer("total").notNull(),
  notes: text("notes"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  purchaseOrderId: text("purchase_order_id").notNull().references(() => purchaseOrders.id, { onDelete: "cascade" }),
  variantId: text("variant_id").references(() => productVariants.id),
  productName: text("product_name").notNull(),
  variantInfo: text("variant_info").notNull(),
  qty: integer("qty").notNull(),
  unitCost: integer("unit_cost").notNull(),
  subtotal: integer("subtotal").notNull(),
});

export const purchaseOrderTimeline = pgTable("purchase_order_timeline", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  purchaseOrderId: text("purchase_order_id").notNull().references(() => purchaseOrders.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  note: text("note"),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id],
  }),
  createdByUser: one(users, {
    fields: [purchaseOrders.createdBy],
    references: [users.id],
  }),
  items: many(purchaseOrderItems),
  timeline: many(purchaseOrderTimeline),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  variant: one(productVariants, {
    fields: [purchaseOrderItems.variantId],
    references: [productVariants.id],
  }),
}));

export const purchaseOrderTimelineRelations = relations(purchaseOrderTimeline, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderTimeline.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
}));
