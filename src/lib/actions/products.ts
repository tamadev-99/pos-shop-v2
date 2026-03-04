"use server";

import { db } from "@/db";
import { products, productVariants, categories } from "@/db/schema";
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
  basePrice: number;
  baseCost: number;
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
    basePrice: data.basePrice,
    baseCost: data.baseCost,
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
    basePrice: number;
    baseCost: number;
    status: "aktif" | "nonaktif";
  }>
) {
  await requireRole("manager", "owner");
  await db
    .update(products)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(products.id, id));

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
