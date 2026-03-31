import { pgTable, text, jsonb, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { stores } from "./auth";

export const storeSettings = pgTable("store_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    storeKeyIdx: uniqueIndex("store_key_idx").on(table.storeId, table.key),
  };
});
