import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";
import { customers } from "./customers";
import { orders } from "./orders";
import { productVariants } from "./products";

export const returnStatusEnum = pgEnum("return_status", ["diproses", "disetujui", "ditolak", "selesai"]);
export const refundMethodEnum = pgEnum("refund_method", ["tunai", "transfer", "poin"]);

export const returns = pgTable("returns", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id),
  customerId: text("customer_id").references(() => customers.id),
  date: text("date").notNull(),
  reason: text("reason").notNull(),
  status: returnStatusEnum("status").notNull().default("diproses"),
  refundMethod: refundMethodEnum("refund_method"),
  refundAmount: integer("refund_amount").default(0),
  processedBy: text("processed_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const returnItems = pgTable("return_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  returnId: text("return_id").notNull().references(() => returns.id, { onDelete: "cascade" }),
  variantId: text("variant_id").references(() => productVariants.id),
  productName: text("product_name").notNull(),
  variantInfo: text("variant_info").default(""),
  qty: integer("qty").notNull(),
  unitPrice: integer("unit_price").notNull(),
});

// Relations
export const returnsRelations = relations(returns, ({ one, many }) => ({
  order: one(orders, {
    fields: [returns.orderId],
    references: [orders.id],
  }),
  customer: one(customers, {
    fields: [returns.customerId],
    references: [customers.id],
  }),
  processedByUser: one(users, {
    fields: [returns.processedBy],
    references: [users.id],
  }),
  items: many(returnItems),
}));

export const returnItemsRelations = relations(returnItems, ({ one }) => ({
  returnRecord: one(returns, {
    fields: [returnItems.returnId],
    references: [returns.id],
  }),
  variant: one(productVariants, {
    fields: [returnItems.variantId],
    references: [productVariants.id],
  }),
}));
