import { pgTable, text, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { stores } from "./auth";
import { employeeProfiles } from "./profiles";

export const auditActionEnum = pgEnum("audit_action", [
  "login", "logout", "transaksi", "stok", "produk", "keuangan", "sistem", "pelanggan", "supplier", "retur",
]);

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  employeeProfileId: text("employee_profile_id").references(() => employeeProfiles.id),
  userName: text("user_name").notNull(),
  action: auditActionEnum("action").notNull(),
  detail: text("detail").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  ipAddress: text("ip_address"),
  storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  employee: one(employeeProfiles, {
    fields: [auditLogs.employeeProfileId],
    references: [employeeProfiles.id],
  }),
  store: one(stores, {
    fields: [auditLogs.storeId],
    references: [stores.id],
  }),
}));

