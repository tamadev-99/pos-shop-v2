import { pgTable, text, integer, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

export const transactionTypeEnum = pgEnum("transaction_type", ["masuk", "keluar"]);
export const shiftStatusEnum = pgEnum("shift_status", ["active", "closed"]);
export const recurringFrequencyEnum = pgEnum("recurring_frequency", ["harian", "mingguan", "bulanan", "tahunan"]);

export const financialTransactions = pgTable("financial_transactions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  date: text("date").notNull(),
  type: transactionTypeEnum("type").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  orderId: text("order_id"),
  attachmentUrl: text("attachment_url"),
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
  totalCashSales: integer("total_cash_sales").default(0),
  totalNonCashSales: integer("total_non_cash_sales").default(0),
  totalTransactions: integer("total_transactions").default(0),
  status: shiftStatusEnum("status").notNull().default("active"),
  notes: text("notes"),
});

// Custom expense categories
export const expenseCategories = pgTable("expense_categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  type: transactionTypeEnum("type").notNull().default("keluar"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Recurring expenses
export const recurringExpenses = pgTable("recurring_expenses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  description: text("description").notNull(),
  category: text("category").notNull(),
  amount: integer("amount").notNull(),
  frequency: recurringFrequencyEnum("frequency").notNull(),
  nextDueDate: text("next_due_date").notNull(),
  isActive: boolean("is_active").default(true),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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

export const recurringExpensesRelations = relations(recurringExpenses, ({ one }) => ({
  createdByUser: one(users, {
    fields: [recurringExpenses.createdBy],
    references: [users.id],
  }),
}));

export const reconciliationStatusEnum = pgEnum("reconciliation_status", ["draft", "completed"]);

export const dailyReconciliations = pgTable("daily_reconciliations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  date: text("date").notNull(),
  calculatedIncome: integer("calculated_income").notNull(),
  calculatedExpense: integer("calculated_expense").notNull(),
  actualCashInHand: integer("actual_cash_in_hand").notNull(),
  difference: integer("difference").notNull(),
  notes: text("notes"),
  status: reconciliationStatusEnum("status").notNull().default("draft"),
  reconciledBy: text("reconciled_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const dailyReconciliationsRelations = relations(dailyReconciliations, ({ one }) => ({
  reconciledByUser: one(users, {
    fields: [dailyReconciliations.reconciledBy],
    references: [users.id],
  }),
}));
