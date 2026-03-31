import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { stores } from "./auth";
import { suppliers } from "./suppliers";
import { productVariants } from "./products";
import { employeeProfiles } from "./profiles";

export const poStatusEnum = pgEnum("po_status", ["diproses", "dikirim", "diterima", "dibatalkan"]);
export const poPaymentStatusEnum = pgEnum("po_payment_status", ["belum_dibayar", "sebagian", "lunas"]);

export const purchaseOrders = pgTable("purchase_orders", {
  id: text("id").primaryKey(),
  supplierId: text("supplier_id").notNull().references(() => suppliers.id),
  date: text("date").notNull(),
  expectedDate: text("expected_date"),
  dueDate: text("due_date"),
  receivedDate: text("received_date"),
  status: poStatusEnum("status").notNull().default("diproses"),
  total: integer("total").notNull(),
  paidAmount: integer("paid_amount").notNull().default(0),
  paymentStatus: poPaymentStatusEnum("payment_status").notNull().default("belum_dibayar"),
  notes: text("notes"),
  employeeProfileId: text("employee_profile_id").references(() => employeeProfiles.id),
  storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  purchaseOrderId: text("purchase_order_id").notNull().references(() => purchaseOrders.id, { onDelete: "cascade" }),
  storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
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
  storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
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
  employee: one(employeeProfiles, {
    fields: [purchaseOrders.employeeProfileId],
    references: [employeeProfiles.id],
  }),
  store: one(stores, {
    fields: [purchaseOrders.storeId],
    references: [stores.id],
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
  store: one(stores, {
    fields: [purchaseOrderItems.storeId],
    references: [stores.id],
  }),
}));

export const purchaseOrderTimelineRelations = relations(purchaseOrderTimeline, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderTimeline.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  store: one(stores, {
    fields: [purchaseOrderTimeline.storeId],
    references: [stores.id],
  }),
}));
