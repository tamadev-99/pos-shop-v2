import { pgTable, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const notifTypeEnum = pgEnum("notif_type", ["stok_rendah", "pesanan_baru", "pembayaran", "sistem", "promo"]);
export const notifPriorityEnum = pgEnum("notif_priority", ["low", "normal", "high", "urgent"]);

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: notifTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: notifPriorityEnum("priority").notNull().default("normal"),
  isRead: boolean("is_read").notNull().default(false),
  userId: text("user_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
