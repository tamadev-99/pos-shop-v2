import { pgTable, text, integer, timestamp, boolean, pgEnum, jsonb } from "drizzle-orm/pg-core";

export const promoTypeEnum = pgEnum("promo_type", ["percentage", "fixed", "buy_x_get_y", "bundle"]);
export const promoAppliesToEnum = pgEnum("promo_applies_to", ["all", "category", "product"]);

export const promotions = pgTable("promotions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description").default(""),
  type: promoTypeEnum("type").notNull(),
  value: integer("value").notNull(),
  minPurchase: integer("min_purchase").default(0),
  buyQty: integer("buy_qty"),
  getQty: integer("get_qty"),
  freeProductId: text("free_product_id"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  appliesTo: promoAppliesToEnum("applies_to").notNull().default("all"),
  targetIds: jsonb("target_ids").$type<string[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
