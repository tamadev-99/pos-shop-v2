"use server";

import { db } from "@/db";
import { products, productVariants, categories, bundleItems, productWholesaleTiers } from "@/db/schema";
import { eq, like, and, sql, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/actions/audit";
import { requireRole } from "@/lib/actions/auth-helpers";
import { getActiveStoreId, getStoreContext, getRequiredStoreId, getRequiredStoreContext } from "@/lib/actions/store-context";

export async function getCategories() {
  const storeId = await getActiveStoreId();
  const conditions = storeId ? [eq(categories.storeId, storeId)] : [];
  
  return db
    .select()
    .from(categories)
    .where(and(...conditions))
    .orderBy(categories.name);
}

export async function getProducts(filters?: {
  search?: string;
  categoryId?: string;
  status?: string;
  offset?: number;
  limit?: number;
}) {
  const storeId = await getActiveStoreId();
  const conditions = storeId ? [eq(products.storeId, storeId)] : [];

  if (filters?.search) {
    conditions.push(like(products.name, `%${filters.search}%`));
  }
  if (filters?.categoryId) {
    conditions.push(eq(products.categoryId, filters.categoryId));
  }
  if (filters?.status) {
    conditions.push(eq(products.status, filters.status as "aktif" | "nonaktif"));
  }

  const whereCondition = and(...conditions);

  const [data, total] = await Promise.all([
    db.query.products.findMany({
      where: whereCondition,
      with: {
        variants: {
          with: { wholesaleTiers: true },
        },
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
  const storeId = await getActiveStoreId();
  return db.query.products.findFirst({
    where: and(eq(products.id, id), storeId ? eq(products.storeId, storeId) : undefined),
    with: {
      variants: {
        with: { wholesaleTiers: true },
      },
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
  const storeId = await getActiveStoreId();
  const variant = await db.query.productVariants.findFirst({
    where: and(eq(productVariants.barcode, barcode), storeId ? eq(productVariants.storeId, storeId) : undefined),
    with: {
      product: {
        with: { category: true },
      },
      wholesaleTiers: true,
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
    wholesaleTiers?: { minQty: number; price: number }[];
  }[];
  bundleComponents?: {
    componentVariantId: string;
    quantity: number;
  }[];
}) {
  await requireRole("manager", "owner");
  const { storeId, employeeProfileId, userName } = await getRequiredStoreContext();
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
    storeId,
  });

  if (data.variants && data.variants.length > 0) {
    const variantsToInsert = data.variants.map((v) => ({
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
      storeId,
    }));

    await db.insert(productVariants).values(variantsToInsert);

    // Insert wholesale tiers if specified
    const tiersToInsert: { id: string; variantId: string; minQty: number; price: number }[] = [];
    for (let i = 0; i < data.variants.length; i++) {
      const v = data.variants[i];
      const variantId = variantsToInsert[i].id;
      if (v.wholesaleTiers && v.wholesaleTiers.length > 0) {
        for (const tier of v.wholesaleTiers) {
          tiersToInsert.push({
            id: crypto.randomUUID(),
            variantId,
            minQty: tier.minQty,
            price: tier.price,
          });
        }
      }
    }

    if (tiersToInsert.length > 0) {
      // Must import productWholesaleTiers
      await db.insert(productWholesaleTiers).values(tiersToInsert);
    }
  }

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

  revalidatePath("/produk");
  revalidatePath("/pos");

  createAuditLog({
    userName,
    action: "produk",
    detail: `Produk baru ditambahkan: ${data.name}`,
    metadata: { productId, name: data.name },
    storeId,
    employeeProfileId,
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
  const { storeId, employeeProfileId, userName } = await getRequiredStoreContext();

  await db
    .update(products)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(products.id, id), eq(products.storeId, storeId)));

  if (newBundleComponents) {
    await db.delete(bundleItems).where(eq(bundleItems.bundleId, id));
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

  createAuditLog({
    userName,
    action: "produk",
    detail: `Produk ${id} diperbarui`,
    metadata: { productId: id },
    storeId,
    employeeProfileId,
  }).catch(() => { });
}

export async function adjustStock(
  variantId: string,
  quantity: number,
  _reason: string
) {
  await requireRole("manager", "owner");
  const { storeId, employeeProfileId, userName } = await getRequiredStoreContext();

  await db
    .update(productVariants)
    .set({
      stock: sql`${productVariants.stock} + ${quantity}`,
    })
    .where(and(eq(productVariants.id, variantId), eq(productVariants.storeId, storeId)));

  revalidatePath("/produk");
  revalidatePath("/pos");

  createAuditLog({
    userName,
    action: "stok",
    detail: `Stok diubah untuk varian ${variantId}: ${quantity > 0 ? "+" : ""}${quantity} `,
    metadata: { variantId, quantity, reason: _reason },
    storeId,
    employeeProfileId,
  }).catch(() => { });
}

export async function createCategory(data: { name: string; description?: string }) {
  await requireRole("manager", "owner");
  const storeId = await getRequiredStoreId();
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
    storeId,
  });
  revalidatePath("/produk");
  return id;
}

export async function updateCategory(id: string, data: Partial<{ name: string; description: string }>) {
  await requireRole("manager", "owner");
  const storeId = await getRequiredStoreId();
  const updateData: Record<string, unknown> = { ...data };
  if (data.name) {
    updateData.slug = data.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }
  await db
    .update(categories)
    .set(updateData)
    .where(and(eq(categories.id, id), eq(categories.storeId, storeId)));
  revalidatePath("/produk");
}

export async function deleteCategory(id: string) {
  await requireRole("manager", "owner");
  const storeId = await getRequiredStoreId();
  await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.storeId, storeId)));
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
  const { storeId, employeeProfileId, userName } = await getRequiredStoreContext();

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  const allCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.storeId, storeId));
  const categoryMap = new Map(allCategories.map((c) => [c.name.toLowerCase(), c.id]));

  for (const row of rows) {
    try {
      const existingVariant = await db.query.productVariants.findFirst({
        where: and(eq(productVariants.sku, row.sku), eq(productVariants.storeId, storeId)),
        with: { product: true },
      });

      if (existingVariant) {
        if (mode === "skip") {
          skipped++;
          continue;
        }

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
          storeId,
        });
        categoryId = newCatId;
        categoryMap.set(row.category.toLowerCase(), newCatId);
      }

      if (!categoryId) {
        if (allCategories.length > 0) {
          categoryId = allCategories[0].id;
        } else {
          const fallbackId = crypto.randomUUID();
          await db.insert(categories).values({
            id: fallbackId,
            name: "Umum",
            slug: "umum",
            description: "",
            storeId,
          });
          categoryId = fallbackId;
          categoryMap.set("umum", fallbackId);
        }
      }

      const productId = crypto.randomUUID();
      await db.insert(products).values({
        id: productId,
        name: row.productName,
        brand: row.brand || "-",
        categoryId,
        basePrice: row.sellPrice,
        baseCost: row.buyPrice,
        status: (row.status === "nonaktif" ? "nonaktif" : "aktif") as "aktif" | "nonaktif",
        storeId,
      });

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
        storeId,
      });

      created++;
    } catch {
      errors++;
    }
  }

  revalidatePath("/produk");
  revalidatePath("/pos");

  createAuditLog({
    userName,
    action: "produk",
    detail: `Impor produk CSV: ${created} dibuat, ${updated} diperbarui, ${skipped} dilewati, ${errors} error`,
    metadata: { created, updated, skipped, errors },
    storeId,
    employeeProfileId,
  }).catch(() => {});

  return { created, updated, skipped, errors };
}

export async function getAllVariantsFlat() {
  const storeId = await getActiveStoreId();
  const conditions = storeId ? [eq(productVariants.storeId, storeId)] : [];
  
  const variants = await db.query.productVariants.findMany({
    where: and(...conditions),
    with: {
      product: {
        with: { category: true }
      },
      wholesaleTiers: true,
    },
  });

  // Sort in JS instead of SQL to simplify the rewrite, 
  // or just return unsorted and let client handle it, but we can sort here:
  variants.sort((a, b) => {
    if (a.product.name !== b.product.name) return a.product.name.localeCompare(b.product.name);
    if (a.color !== b.color) return a.color.localeCompare(b.color);
    return a.size.localeCompare(b.size);
  });

  return variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    barcode: v.barcode,
    color: v.color,
    size: v.size,
    stock: v.stock,
    minStock: v.minStock,
    buyPrice: v.buyPrice,
    sellPrice: v.sellPrice,
    status: v.status,
    productId: v.productId,
    productName: v.product.name,
    brand: v.product.brand,
    categoryName: v.product.category?.name || "Umum",
    supplierId: v.product.supplierId,
    wholesaleTiers: v.wholesaleTiers,
  }));
}
