import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

export const transactionTypeEnum = pgEnum("transaction_type", ["masuk", "keluar"]);
export const shiftStatusEnum = pgEnum("shift_status", ["active", "closed"]);

export const financialTransactions = pgTable("financial_transactions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  date: text("date").notNull(),
  type: transactionTypeEnum("type").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  orderId: text("order_id"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const shifts = pgTable("shifts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  cashierId: text("cashier_id").notNull().references(() => users.id),
  openedAt: timestamp("opened_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
  openingBalance: integer("opening_balance").notNull(),
  expectedClosing: integer("expected_closing"),
  actualClosing: integer("actual_closing"),
  difference: integer("difference"),
  totalSales: integer("total_sales").default(0),
  totalTransactions: integer("total_transactions").default(0),
  status: shiftStatusEnum("status").notNull().default("active"),
  notes: text("notes"),
});

// Relations
export const shiftsRelations = relations(shifts, ({ one }) => ({
  cashier: one(users, {
    fields: [shifts.cashierId],
    references: [users.id],
  }),
}));

export const financialTransactionsRelations = relations(financialTransactions, ({ one }) => ({
  createdByUser: one(users, {
    fields: [financialTransactions.createdBy],
    references: [users.id],
  }),
}));
