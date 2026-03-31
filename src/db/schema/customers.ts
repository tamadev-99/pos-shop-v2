import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { stores } from "./auth";

export const customerTierEnum = pgEnum("customer_tier", ["Bronze", "Silver", "Gold", "Platinum"]);

export const customers = pgTable("customers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").default(""),
  address: text("address").default(""),
  birthDate: text("birth_date"),
  totalSpent: integer("total_spent").notNull().default(0),
  points: integer("points").notNull().default(0),
  tier: customerTierEnum("tier").notNull().default("Bronze"),
  joinDate: text("join_date").notNull(),
  lastPurchase: text("last_purchase"),
  storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
