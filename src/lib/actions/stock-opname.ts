"use server";

import { db } from "@/db";
import {
  stockOpnames,
  stockOpnameItems,
  productVariants,
  products,
  categories,
} from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth, requireRole, getCurrentUser } from "@/lib/actions/auth-helpers";
import { createAuditLog } from "@/lib/actions/audit";

function generateOpnameCode() {
  const now = new Date();
  const date = now.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SO-${date}-${rand}`;
}

export async function getStockOpnames() {
  const opnames = await db
    .select()
    .from(stockOpnames)
    .orderBy(desc(stockOpnames.createdAt))
    .limit(50);

  const withCounts = await Promise.all(
    opnames.map(async (opname) => {
      const items = await db
        .select({ count: sql<number>`count(*)` })
        .from(stockOpnameItems)
        .where(eq(stockOpnameItems.opnameId, opname.id));

      const diffItems = await db
        .select({ count: sql<number>`count(*)` })
        .from(stockOpnameItems)
        .where(
          sql`${stockOpnameItems.opnameId} = ${opname.id} AND ${stockOpnameItems.difference} != 0 AND ${stockOpnameItems.difference} IS NOT NULL`
        );

      return {
        ...opname,
        totalItems: Number(items[0]?.count || 0),
        diffCount: Number(diffItems[0]?.count || 0),
      };
    })
  );

  return withCounts;
}

export async function getStockOpnameById(id: string) {
  const opname = await db
    .select()
    .from(stockOpnames)
    .where(eq(stockOpnames.id, id))
    .limit(1);

  if (!opname[0]) return null;

  const items = await db
    .select({
      id: stockOpnameItems.id,
      opnameId: stockOpnameItems.opnameId,
      variantId: stockOpnameItems.variantId,
      systemStock: stockOpnameItems.systemStock,
      actualStock: stockOpnameItems.actualStock,
      difference: stockOpnameItems.difference,
      note: stockOpnameItems.note,
      createdAt: stockOpnameItems.createdAt,
      variantSku: productVariants.sku,
      variantBarcode: productVariants.barcode,
      variantColor: productVariants.color,
      variantSize: productVariants.size,
      variantCurrentStock: productVariants.stock,
      productName: products.name,
      productBrand: products.brand,
      categoryName: categories.name,
    })
    .from(stockOpnameItems)
    .innerJoin(productVariants, eq(stockOpnameItems.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(stockOpnameItems.opnameId, id))
    .orderBy(products.name, productVariants.color, productVariants.size);

  return { ...opname[0], items };
}

// Any authenticated user can create a stock opname
export async function createStockOpname(data: {
  note?: string;
  variantIds: string[];
}) {
  const user = await requireAuth();

  const opnameId = crypto.randomUUID();
  const code = generateOpnameCode();

  await db.insert(stockOpnames).values({
    id: opnameId,
    code,
    note: data.note || null,
    status: "in_progress",
    createdBy: user.id,
    createdByName: user.name,
  });

  const variants = await db
    .select({
      id: productVariants.id,
      stock: productVariants.stock,
    })
    .from(productVariants)
    .where(
      sql`${productVariants.id} IN ${data.variantIds}`
    );

  if (variants.length > 0) {
    await db.insert(stockOpnameItems).values(
      variants.map((v) => ({
        id: crypto.randomUUID(),
        opnameId,
        variantId: v.id,
        systemStock: v.stock,
        actualStock: null,
        difference: null,
        note: null,
      }))
    );
  }

  createAuditLog({
    userId: user.id,
    userName: user.name,
    action: "stok",
    detail: `Stok opname dibuat: ${code} (${variants.length} item)`,
    metadata: { opnameId, code },
  }).catch(() => {});

  revalidatePath("/audit");
  return { id: opnameId, code };
}

// Any authenticated user can input stock counts
export async function updateOpnameItem(
  itemId: string,
  actualStock: number,
  note?: string
) {
  await requireAuth();

  const item = await db
    .select()
    .from(stockOpnameItems)
    .where(eq(stockOpnameItems.id, itemId))
    .limit(1);

  if (!item[0]) throw new Error("Item tidak ditemukan");

  // Verify the opname is still in_progress
  const opname = await db
    .select()
    .from(stockOpnames)
    .where(eq(stockOpnames.id, item[0].opnameId))
    .limit(1);

  if (!opname[0] || opname[0].status !== "in_progress") {
    throw new Error("Stok opname tidak dalam status pengisian");
  }

  const difference = actualStock - item[0].systemStock;

  await db
    .update(stockOpnameItems)
    .set({
      actualStock,
      difference,
      note: note || null,
    })
    .where(eq(stockOpnameItems.id, itemId));

  revalidatePath("/audit");
}

// Any authenticated user can submit for review
export async function submitForReview(opnameId: string) {
  const user = await requireAuth();

  const opname = await db
    .select()
    .from(stockOpnames)
    .where(eq(stockOpnames.id, opnameId))
    .limit(1);

  if (!opname[0]) throw new Error("Stok opname tidak ditemukan");
  if (opname[0].status !== "in_progress") {
    throw new Error("Hanya opname yang sedang berlangsung yang dapat diajukan review");
  }

  // Ensure at least one item has been counted
  const counted = await db
    .select({ count: sql<number>`count(*)` })
    .from(stockOpnameItems)
    .where(
      sql`${stockOpnameItems.opnameId} = ${opnameId} AND ${stockOpnameItems.actualStock} IS NOT NULL`
    );

  if (Number(counted[0]?.count || 0) === 0) {
    throw new Error("Minimal 1 item harus sudah dihitung sebelum mengajukan review");
  }

  await db
    .update(stockOpnames)
    .set({
      status: "pending_review",
      updatedAt: new Date(),
    })
    .where(eq(stockOpnames.id, opnameId));

  createAuditLog({
    userId: user.id,
    userName: user.name,
    action: "stok",
    detail: `Stok opname diajukan review: ${opname[0].code}`,
    metadata: { opnameId, code: opname[0].code },
  }).catch(() => {});

  revalidatePath("/audit");
}

// Only manager/owner can approve and apply stock adjustments
export async function approveStockOpname(
  opnameId: string,
  applyAdjustments: boolean,
  reviewNote?: string
) {
  const user = await requireRole("manager", "owner");

  const opname = await db
    .select()
    .from(stockOpnames)
    .where(eq(stockOpnames.id, opnameId))
    .limit(1);

  if (!opname[0]) throw new Error("Stok opname tidak ditemukan");
  if (opname[0].status !== "pending_review") {
    throw new Error("Hanya opname dengan status 'Menunggu Review' yang dapat disetujui");
  }

  if (applyAdjustments) {
    const items = await db
      .select()
      .from(stockOpnameItems)
      .where(eq(stockOpnameItems.opnameId, opnameId));

    for (const item of items) {
      if (item.actualStock !== null && item.difference !== null && item.difference !== 0) {
        await db
          .update(productVariants)
          .set({ stock: item.actualStock })
          .where(eq(productVariants.id, item.variantId));
      }
    }
  }

  await db
    .update(stockOpnames)
    .set({
      status: "completed",
      reviewedBy: user.id,
      reviewedByName: user.name,
      reviewNote: reviewNote || null,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(stockOpnames.id, opnameId));

  createAuditLog({
    userId: user.id,
    userName: user.name,
    action: "stok",
    detail: `Stok opname disetujui: ${opname[0].code}${applyAdjustments ? " (stok disesuaikan)" : " (tanpa penyesuaian)"}`,
    metadata: { opnameId, code: opname[0].code, applyAdjustments },
  }).catch(() => {});

  revalidatePath("/audit");
  revalidatePath("/produk");
  revalidatePath("/pos");
}

// Only manager/owner can reject — sends back to in_progress
export async function rejectStockOpname(opnameId: string, reviewNote?: string) {
  const user = await requireRole("manager", "owner");

  const opname = await db
    .select()
    .from(stockOpnames)
    .where(eq(stockOpnames.id, opnameId))
    .limit(1);

  if (!opname[0]) throw new Error("Stok opname tidak ditemukan");
  if (opname[0].status !== "pending_review") {
    throw new Error("Hanya opname dengan status 'Menunggu Review' yang dapat ditolak");
  }

  await db
    .update(stockOpnames)
    .set({
      status: "in_progress",
      reviewedBy: user.id,
      reviewedByName: user.name,
      reviewNote: reviewNote || null,
      updatedAt: new Date(),
    })
    .where(eq(stockOpnames.id, opnameId));

  createAuditLog({
    userId: user.id,
    userName: user.name,
    action: "stok",
    detail: `Stok opname ditolak & dikembalikan: ${opname[0].code}`,
    metadata: { opnameId, code: opname[0].code, reviewNote },
  }).catch(() => {});

  revalidatePath("/audit");
}

// Only manager/owner can cancel
export async function cancelStockOpname(opnameId: string) {
  await requireRole("manager", "owner");
  const user = await getCurrentUser();

  const opname = await db
    .select()
    .from(stockOpnames)
    .where(eq(stockOpnames.id, opnameId))
    .limit(1);

  if (!opname[0]) throw new Error("Stok opname tidak ditemukan");

  await db
    .update(stockOpnames)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(eq(stockOpnames.id, opnameId));

  createAuditLog({
    userId: user?.id,
    userName: user?.name || "Unknown",
    action: "stok",
    detail: `Stok opname dibatalkan: ${opname[0].code}`,
    metadata: { opnameId, code: opname[0].code },
  }).catch(() => {});

  revalidatePath("/audit");
}
