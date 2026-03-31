import { pgTable, text, integer, timestamp, pgEnum, boolean, foreignKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { stores } from "./auth";
import { employeeProfiles } from "./profiles";

export const transactionTypeEnum = pgEnum("transaction_type", ["masuk", "keluar"]);
export const shiftStatusEnum = pgEnum("shift_status", ["active", "closed"]);
export const recurringFrequencyEnum = pgEnum("recurring_frequency", ["harian", "mingguan", "bulanan", "tahunan"]);
export const reconciliationStatusEnum = pgEnum("reconciliation_status", ["draft", "completed"]);

export const financialTransactions = pgTable("financial_transactions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  date: text("date").notNull(),
  type: transactionTypeEnum("type").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  orderId: text("order_id"),
  attachmentUrl: text("attachment_url"),
  employeeProfileId: text("employee_profile_id"),
  storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  employeeFk: foreignKey({
    columns: [table.employeeProfileId],
    foreignColumns: [employeeProfiles.id],
    name: "fin_trans_emp_fk",
  }),
}));

export const shifts = pgTable("shifts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  employeeProfileId: text("employee_profile_id").notNull().references(() => employeeProfiles.id),
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
  storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
});

export const expenseCategories = pgTable("expense_categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  type: transactionTypeEnum("type").notNull().default("keluar"),
  isDefault: boolean("is_default").default(false),
  storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const recurringExpenses = pgTable("recurring_expenses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  description: text("description").notNull(),
  category: text("category").notNull(),
  amount: integer("amount").notNull(),
  frequency: recurringFrequencyEnum("frequency").notNull(),
  nextDueDate: text("next_due_date").notNull(),
  isActive: boolean("is_active").default(true),
  employeeProfileId: text("employee_profile_id"),
  storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  employeeFk: foreignKey({
    columns: [table.employeeProfileId],
    foreignColumns: [employeeProfiles.id],
    name: "rec_exp_emp_fk",
  }),
}));

export const dailyReconciliations = pgTable("daily_reconciliations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  date: text("date").notNull(),
  calculatedIncome: integer("calculated_income").notNull(),
  calculatedExpense: integer("calculated_expense").notNull(),
  actualCashInHand: integer("actual_cash_in_hand").notNull(),
  difference: integer("difference").notNull(),
  notes: text("notes"),
  status: reconciliationStatusEnum("status").notNull().default("draft"),
  employeeProfileId: text("employee_profile_id"),
  storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  employeeFk: foreignKey({
    columns: [table.employeeProfileId],
    foreignColumns: [employeeProfiles.id],
    name: "day_rec_emp_fk",
  }),
}));

// Relations
export const shiftsRelations = relations(shifts, ({ one }) => ({
  employee: one(employeeProfiles, {
    fields: [shifts.employeeProfileId],
    references: [employeeProfiles.id],
  }),
  store: one(stores, {
    fields: [shifts.storeId],
    references: [stores.id],
  }),
}));

export const financialTransactionsRelations = relations(financialTransactions, ({ one }) => ({
  employee: one(employeeProfiles, {
    fields: [financialTransactions.employeeProfileId],
    references: [employeeProfiles.id],
  }),
  store: one(stores, {
    fields: [financialTransactions.storeId],
    references: [stores.id],
  }),
}));

export const recurringExpensesRelations = relations(recurringExpenses, ({ one }) => ({
  employee: one(employeeProfiles, {
    fields: [recurringExpenses.employeeProfileId],
    references: [employeeProfiles.id],
  }),
  store: one(stores, {
    fields: [recurringExpenses.storeId],
    references: [stores.id],
  }),
}));

export const dailyReconciliationsRelations = relations(dailyReconciliations, ({ one }) => ({
  employee: one(employeeProfiles, {
    fields: [dailyReconciliations.employeeProfileId],
    references: [employeeProfiles.id],
  }),
  store: one(stores, {
    fields: [dailyReconciliations.storeId],
    references: [stores.id],
  }),
}));

