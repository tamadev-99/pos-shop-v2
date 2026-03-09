"use server";

import { db } from "@/db";
import { products, productVariants, categories, bundleItems } from "@/db/schema";
import { eq, like, and, sql, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/actions/audit";
import { requireRole, getCurrentUser } from "@/lib/actions/auth-helpers";

export async function getCategories() {
  return db.select().from(categories).orderBy(categories.name);
}

export async function getProducts(filters?: {
  search?: string;
  categoryId?: string;
  status?: string;
  offset?: number;
  limit?: number;
}) {
  const conditions = [];
  if (filters?.search) {
    conditions.push(like(products.name, `%${filters.search}%`));
  }
  if (filters?.categoryId) {
    conditions.push(eq(products.categoryId, filters.categoryId));
  }
  if (filters?.status) {
    conditions.push(eq(products.status, filters.status as "aktif" | "nonaktif"));
  }

  const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, total] = await Promise.all([
    db.query.products.findMany({
      where: whereCondition,
      with: {
        variants: true,
        category: true,
        bundleItems: {
          with: {
            componentVariant: {
              with: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: [desc(products.createdAt)],
      limit: filters?.limit || 10,
      offset: filters?.offset || 0,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereCondition)
      .then((res) => Number(res[0]?.count || 0)),
  ]);

  return {
    data,
    totalRecords: total,
  };
}

export async function getProductById(id: string) {
  return db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      variants: true,
      category: true,
      bundleItems: {
        with: {
          componentVariant: {
            with: {
              product: true,
            },
          },
        },
      },
    },
  });
}

export async function getVariantByBarcode(barcode: string) {
  const variant = await db.query.productVariants.findFirst({
    where: eq(productVariants.barcode, barcode),
    with: {
      product: {
        with: { category: true },
      },
    },
  });
  return variant;
}

export async function createProduct(data: {
  name: string;
  brand: string;
  categoryId: string;
  supplierId?: string;
  description?: string;
  imageUrl?: string;
  basePrice: number;
  baseCost: number;
  isBundle?: boolean;
  variants?: {
    sku: string;
    barcode: string;
    color: string;
    size: string;
    stock: number;
    minStock: number;
    buyPrice: number;
    sellPrice: number;
  }[];
  bundleComponents?: {
    componentVariantId: string;
    quantity: number;
  }[];
}) {
  await requireRole("manager", "owner");
  const productId = crypto.randomUUID();

  await db.insert(products).values({
    id: productId,
    name: data.name,
    brand: data.brand,
    categoryId: data.categoryId,
    supplierId: data.supplierId || null,
    description: data.description || "",
    imageUrl: data.imageUrl || null,
    basePrice: data.basePrice,
    baseCost: data.baseCost,
    isBundle: data.isBundle || false,
  });

  if (data.variants && data.variants.length > 0) {
    await db.insert(productVariants).values(
      data.variants.map((v) => ({
        id: crypto.randomUUID(),
        productId,
        sku: v.sku,
        barcode: v.barcode,
        color: v.color,
        size: v.size,
        stock: v.stock,
        minStock: v.minStock,
        buyPrice: v.buyPrice,
        sellPrice: v.sellPrice,
      }))
    );
  }

  revalidatePath("/produk");
  revalidatePath("/pos");

  // Insert bundle components if this is a bundle product
  if (data.isBundle && data.bundleComponents && data.bundleComponents.length > 0) {
    await db.insert(bundleItems).values(
      data.bundleComponents.map((comp) => ({
        id: crypto.randomUUID(),
        bundleId: productId,
        componentVariantId: comp.componentVariantId,
        quantity: comp.quantity,
      }))
    );
  }

  const currentUser = await getCurrentUser();
  createAuditLog({
    userId: currentUser?.id,
    userName: currentUser?.name || "Unknown",
    action: "produk",
    detail: `Produk baru ditambahkan: ${data.name}`,
    metadata: { productId, name: data.name },
  }).catch(() => { });

  return productId;
}

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string;
    brand: string;
    categoryId: string;
    supplierId: string;
    description: string;
    imageUrl: string;
    basePrice: number;
    baseCost: number;
    status: "aktif" | "nonaktif";
    isBundle: boolean;
  }>,
  newBundleComponents?: { componentVariantId: string; quantity: number }[]
) {
  await requireRole("manager", "owner");
  await db
    .update(products)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(products.id, id));

  // If bundle components are provided, replace them
  if (newBundleComponents) {
    // Delete old bundle items
    await db.delete(bundleItems).where(eq(bundleItems.bundleId, id));
    // Insert new ones
    if (newBundleComponents.length > 0) {
      await db.insert(bundleItems).values(
        newBundleComponents.map((comp) => ({
          id: crypto.randomUUID(),
          bundleId: id,
          componentVariantId: comp.componentVariantId,
          quantity: comp.quantity,
        }))
      );
    }
  }

  revalidatePath("/produk");
  revalidatePath("/pos");

  const currentUser2 = await getCurrentUser();
  createAuditLog({
    userId: currentUser2?.id,
    userName: currentUser2?.name || "Unknown",
    action: "produk",
    detail: `Produk ${id} diperbarui`,
    metadata: { productId: id },
  }).catch(() => { });
}

export async function adjustStock(
  variantId: string,
  quantity: number,
  _reason: string
) {
  await requireRole("manager", "owner");
  await db
    .update(productVariants)
    .set({
      stock: sql`${productVariants.stock} + ${quantity}`,
    })
    .where(eq(productVariants.id, variantId));

  revalidatePath("/inventaris");
  revalidatePath("/pos");
  revalidatePath("/produk");

  const currentUser3 = await getCurrentUser();
  createAuditLog({
    userId: currentUser3?.id,
    userName: currentUser3?.name || "Unknown",
    action: "stok",
    detail: `Stok diubah untuk varian ${variantId}: ${quantity > 0 ? "+" : ""}${quantity} `,
    metadata: { variantId, quantity, reason: _reason },
  }).catch(() => { });
}

export async function createCategory(data: { name: string; description?: string }) {
  await requireRole("manager", "owner");
  const id = crypto.randomUUID();
  const slug = data.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  await db.insert(categories).values({
    id,
    name: data.name,
    slug,
    description: data.description || "",
  });
  revalidatePath("/kategori");
  revalidatePath("/produk");
  return id;
}

export async function updateCategory(id: string, data: Partial<{ name: string; description: string }>) {
  await requireRole("manager", "owner");
  const updateData: Record<string, unknown> = { ...data };
  if (data.name) {
    updateData.slug = data.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }
  await db.update(categories).set(updateData).where(eq(categories.id, id));
  revalidatePath("/kategori");
  revalidatePath("/produk");
}

export async function deleteCategory(id: string) {
  await requireRole("manager", "owner");
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/kategori");
  revalidatePath("/produk");
}

export async function importProducts(
  rows: {
    productName: string;
    sku: string;
    barcode: string;
    category: string;
    brand: string;
    sellPrice: number;
    buyPrice: number;
    stock: number;
    minStock: number;
    status: string;
  }[],
  mode: "skip" | "update"
): Promise<{ created: number; updated: number; skipped: number; errors: number }> {
  await requireRole("manager", "owner");

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  // Preload categories for matching by name
  const allCategories = await db.select().from(categories);
  const categoryMap = new Map(allCategories.map((c) => [c.name.toLowerCase(), c.id]));

  for (const row of rows) {
    try {
      // Check if SKU already exists
      const existingVariant = await db.query.productVariants.findFirst({
        where: eq(productVariants.sku, row.sku),
        with: { product: true },
      });

      if (existingVariant) {
        if (mode === "skip") {
          skipped++;
          continue;
        }

        // Update mode: update price and stock
        await db
          .update(productVariants)
          .set({
            sellPrice: row.sellPrice,
            buyPrice: row.buyPrice,
            stock: row.stock,
            minStock: row.minStock,
            status: (row.status === "nonaktif" ? "nonaktif" : "aktif") as "aktif" | "nonaktif",
          })
          .where(eq(productVariants.id, existingVariant.id));

        // Also update product base prices
        await db
          .update(products)
          .set({
            basePrice: row.sellPrice,
            baseCost: row.buyPrice,
            updatedAt: new Date(),
          })
          .where(eq(products.id, existingVariant.productId));

        updated++;
        continue;
      }

      // New product — resolve or create category
      let categoryId = categoryMap.get(row.category.toLowerCase());
      if (!categoryId && row.category) {
        const newCatId = crypto.randomUUID();
        const slug = row.category
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
        await db.insert(categories).values({
          id: newCatId,
          name: row.category,
          slug,
          description: "",
        });
        categoryId = newCatId;
        categoryMap.set(row.category.toLowerCase(), newCatId);
      }

      if (!categoryId) {
        // Fallback: use first available category or create "Umum"
        if (allCategories.length > 0) {
          categoryId = allCategories[0].id;
        } else {
          const fallbackId = crypto.randomUUID();
          await db.insert(categories).values({
            id: fallbackId,
            name: "Umum",
            slug: "umum",
            description: "",
          });
          categoryId = fallbackId;
          categoryMap.set("umum", fallbackId);
        }
      }

      // Create product
      const productId = crypto.randomUUID();
      await db.insert(products).values({
        id: productId,
        name: row.productName,
        brand: row.brand || "-",
        categoryId,
        basePrice: row.sellPrice,
        baseCost: row.buyPrice,
        status: (row.status === "nonaktif" ? "nonaktif" : "aktif") as "aktif" | "nonaktif",
      });

      // Create variant
      await db.insert(productVariants).values({
        id: crypto.randomUUID(),
        productId,
        sku: row.sku,
        barcode: row.barcode || row.sku,
        color: "-",
        size: "-",
        stock: row.stock,
        minStock: row.minStock,
        buyPrice: row.buyPrice,
        sellPrice: row.sellPrice,
        status: (row.status === "nonaktif" ? "nonaktif" : "aktif") as "aktif" | "nonaktif",
      });

      created++;
    } catch {
      errors++;
    }
  }

  revalidatePath("/produk");
  revalidatePath("/pos");

  const currentUser = await getCurrentUser();
  createAuditLog({
    userId: currentUser?.id,
    userName: currentUser?.name || "Unknown",
    action: "produk",
    detail: `Impor produk CSV: ${created} dibuat, ${updated} diperbarui, ${skipped} dilewati, ${errors} error`,
    metadata: { created, updated, skipped, errors },
  }).catch(() => {});

  return { created, updated, skipped, errors };
}

export async function getAllVariantsFlat() {
  const result = await db
    .select({
      id: productVariants.id,
      sku: productVariants.sku,
      barcode: productVariants.barcode,
      color: productVariants.color,
      size: productVariants.size,
      stock: productVariants.stock,
      minStock: productVariants.minStock,
      buyPrice: productVariants.buyPrice,
      sellPrice: productVariants.sellPrice,
      status: productVariants.status,
      productId: productVariants.productId,
      productName: products.name,
      brand: products.brand,
      categoryName: categories.name,
      supplierId: products.supplierId,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(products.name, productVariants.color, productVariants.size);

  return result;
}
