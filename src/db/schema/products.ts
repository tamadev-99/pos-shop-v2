import { pgTable, text, integer, timestamp, pgEnum, varchar, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { stores } from "./auth";


export const productStatusEnum = pgEnum("product_status", ["aktif", "nonaktif"]);

export const categories = pgTable("categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description").default(""),
  storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  categoryId: text("category_id").notNull().references(() => categories.id),
  supplierId: text("supplier_id"), // Optional supplier relation
  description: text("description").default(""),
  imageUrl: text("image_url"),
  basePrice: integer("base_price").notNull(),
  baseCost: integer("base_cost").notNull(),
  isBundle: boolean("is_bundle").notNull().default(false),
  status: productStatusEnum("status").notNull().default("aktif"),
  storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const productVariants = pgTable("product_variants", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  sku: varchar("sku", { length: 50 }).notNull().unique(),
  barcode: varchar("barcode", { length: 50 }).notNull().unique(),
  color: text("color").notNull(),
  size: text("size").notNull(),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(5),
  buyPrice: integer("buy_price").notNull(),
  sellPrice: integer("sell_price").notNull(),
  status: productStatusEnum("status").notNull().default("aktif"),
  storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bundleItems = pgTable("bundle_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  bundleId: text("bundle_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  componentVariantId: text("component_variant_id").notNull().references(() => productVariants.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const productWholesaleTiers = pgTable("product_wholesale_tiers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  variantId: text("variant_id").notNull().references(() => productVariants.id, { onDelete: "cascade" }),
  minQty: integer("min_qty").notNull(),
  price: integer("price").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariants),
  bundleItems: many(bundleItems),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  bundleItems: many(bundleItems),
  wholesaleTiers: many(productWholesaleTiers),
}));

export const productWholesaleTiersRelations = relations(productWholesaleTiers, ({ one }) => ({
  variant: one(productVariants, {
    fields: [productWholesaleTiers.variantId],
    references: [productVariants.id],
  }),
}));

export const bundleItemsRelations = relations(bundleItems, ({ one }) => ({
  bundle: one(products, {
    fields: [bundleItems.bundleId],
    references: [products.id],
  }),
  componentVariant: one(productVariants, {
    fields: [bundleItems.componentVariantId],
    references: [productVariants.id],
  }),
}));
