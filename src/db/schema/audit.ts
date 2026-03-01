import { pgTable, text, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

export const auditActionEnum = pgEnum("audit_action", [
  "login", "logout", "transaksi", "stok", "produk", "keuangan", "sistem", "pelanggan", "supplier", "retur",
]);

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id),
  userName: text("user_name").notNull(),
  action: auditActionEnum("action").notNull(),
  detail: text("detail").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
