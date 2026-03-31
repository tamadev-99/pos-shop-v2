import { pgTable, text, integer, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { stores } from "./auth";
import { customers } from "./customers";
import { productVariants } from "./products";
import { employeeProfiles } from "./profiles";

export const orderStatusEnum = pgEnum("order_status", ["pending", "selesai", "dibatalkan"]);
export const paymentMethodEnum = pgEnum("payment_method", ["tunai", "debit", "kredit", "transfer", "qris", "ewallet"]);

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull().default("Pelanggan Umum"),
  date: timestamp("date").notNull().defaultNow(),
  subtotal: integer("subtotal").notNull(),
  discountAmount: integer("discount_amount").notNull().default(0),
  taxAmount: integer("tax_amount").notNull().default(0),
  shippingFee: integer("shipping_fee").notNull().default(0),
  total: integer("total").notNull(),
  cashPaid: integer("cash_paid"),
  changeAmount: integer("change_amount"),
  status: orderStatusEnum("status").notNull().default("selesai"),
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("tunai"),
  employeeProfileId: text("employee_profile_id").references(() => employeeProfiles.id),
  storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  shiftId: text("shift_id"),
  notes: text("notes"),
  bankName: text("bank_name"),
  referenceNumber: text("reference_number"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  variantId: text("variant_id").references(() => productVariants.id),
  productName: text("product_name").notNull(),
  variantInfo: text("variant_info").notNull(),
  qty: integer("qty").notNull(),
  unitPrice: integer("unit_price").notNull(),
  costPrice: integer("cost_price").notNull().default(0),
  subtotal: integer("subtotal").notNull(),
  storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
});

export const heldTransactions = pgTable("held_transactions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  employeeProfileId: text("employee_profile_id").references(() => employeeProfiles.id),
  customerName: text("customer_name"),
  customerId: text("customer_id"),
  items: jsonb("items").notNull(),
  shippingFee: integer("shipping_fee").default(0),
  notes: text("notes"),
  storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  employee: one(employeeProfiles, {
    fields: [orders.employeeProfileId],
    references: [employeeProfiles.id],
  }),
  store: one(stores, {
    fields: [orders.storeId],
    references: [stores.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
  store: one(stores, {
    fields: [orderItems.storeId],
    references: [stores.id],
  }),
}));

export const heldTransactionsRelations = relations(heldTransactions, ({ one }) => ({
  employee: one(employeeProfiles, {
    fields: [heldTransactions.employeeProfileId],
    references: [employeeProfiles.id],
  }),
  store: one(stores, {
    fields: [heldTransactions.storeId],
    references: [stores.id],
  }),
}));

