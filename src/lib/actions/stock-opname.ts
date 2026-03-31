"use server";

import { db } from "@/db";
import {
  stockOpnames,
  stockOpnameItems,
  productVariants,
  products,
  categories,
} from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/actions/auth-helpers";
import { createAuditLog } from "@/lib/actions/audit";
import { getActiveStoreId, getStoreContext } from "@/lib/actions/store-context";

function generateOpnameCode() {
  const now = new Date();
  const date = now.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SO-${date}-${rand}`;
}

export async function getStockOpnames() {
  const storeId = await getActiveStoreId();

  const opnames = await db.query.stockOpnames.findMany({
    where: eq(stockOpnames.storeId, storeId),
    with: { employee: true, reviewer: true },
    orderBy: [desc(stockOpnames.createdAt)],
    limit: 50,
  });

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
  const storeId = await getActiveStoreId();

  const opname = await db.query.stockOpnames.findFirst({
    where: and(eq(stockOpnames.id, id), eq(stockOpnames.storeId, storeId)),
    with: { employee: true, reviewer: true },
  });

  if (!opname) return null;

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

  return { ...opname, items };
}

export async function createStockOpname(data: {
  note?: string;
  variantIds: string[];
}) {
  const { storeId, employeeProfileId, userName } = await getStoreContext();

  const opnameId = crypto.randomUUID();
  const code = generateOpnameCode();

  await db.insert(stockOpnames).values({
    id: opnameId,
    code,
    note: data.note || null,
    status: "in_progress",
    employeeProfileId,
    createdByName: userName,
    storeId,
  });

  const variants = await db
    .select({
      id: productVariants.id,
      stock: productVariants.stock,
    })
    .from(productVariants)
    .where(
      and(
        eq(productVariants.storeId, storeId),
        sql`${productVariants.id} IN ${data.variantIds}`
      )
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
        storeId,
      }))
    );
  }

  createAuditLog({
    userName,
    action: "stok",
    detail: `Stok opname dibuat: ${code} (${variants.length} item)`,
    metadata: { opnameId, code },
    storeId,
    employeeProfileId,
  }).catch(() => {});

  revalidatePath("/audit");
  return { id: opnameId, code };
}

export async function updateOpnameItem(
  itemId: string,
  actualStock: number,
  note?: string
) {
  const item = await db
    .select()
    .from(stockOpnameItems)
    .where(eq(stockOpnameItems.id, itemId))
    .limit(1);

  if (!item[0]) throw new Error("Item tidak ditemukan");

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

export async function submitForReview(opnameId: string) {
  const { storeId, employeeProfileId, userName } = await getStoreContext();

  const opname = await db
    .select()
    .from(stockOpnames)
    .where(and(eq(stockOpnames.id, opnameId), eq(stockOpnames.storeId, storeId)))
    .limit(1);

  if (!opname[0]) throw new Error("Stok opname tidak ditemukan");
  if (opname[0].status !== "in_progress") {
    throw new Error("Hanya opname yang sedang berlangsung yang dapat diajukan review");
  }

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
    userName,
    action: "stok",
    detail: `Stok opname diajukan review: ${opname[0].code}`,
    metadata: { opnameId, code: opname[0].code },
    storeId,
    employeeProfileId,
  }).catch(() => {});

  revalidatePath("/audit");
}

export async function approveStockOpname(
  opnameId: string,
  applyAdjustments: boolean,
  reviewNote?: string
) {
  await requireRole("manager", "owner");
  const { storeId, employeeProfileId, userName } = await getStoreContext();

  const opname = await db
    .select()
    .from(stockOpnames)
    .where(and(eq(stockOpnames.id, opnameId), eq(stockOpnames.storeId, storeId)))
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
      reviewedByProfileId: employeeProfileId,
      reviewedByName: userName,
      reviewNote: reviewNote || null,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(stockOpnames.id, opnameId));

  createAuditLog({
    userName,
    action: "stok",
    detail: `Stok opname disetujui: ${opname[0].code}${applyAdjustments ? " (stok disesuaikan)" : " (tanpa penyesuaian)"}`,
    metadata: { opnameId, code: opname[0].code, applyAdjustments },
    storeId,
    employeeProfileId,
  }).catch(() => {});

  revalidatePath("/audit");
  revalidatePath("/produk");
  revalidatePath("/pos");
}

export async function rejectStockOpname(opnameId: string, reviewNote?: string) {
  await requireRole("manager", "owner");
  const { storeId, employeeProfileId, userName } = await getStoreContext();

  const opname = await db
    .select()
    .from(stockOpnames)
    .where(and(eq(stockOpnames.id, opnameId), eq(stockOpnames.storeId, storeId)))
    .limit(1);

  if (!opname[0]) throw new Error("Stok opname tidak ditemukan");
  if (opname[0].status !== "pending_review") {
    throw new Error("Hanya opname dengan status 'Menunggu Review' yang dapat ditolak");
  }

  await db
    .update(stockOpnames)
    .set({
      status: "in_progress",
      reviewedByProfileId: employeeProfileId,
      reviewedByName: userName,
      reviewNote: reviewNote || null,
      updatedAt: new Date(),
    })
    .where(eq(stockOpnames.id, opnameId));

  createAuditLog({
    userName,
    action: "stok",
    detail: `Stok opname ditolak & dikembalikan: ${opname[0].code}`,
    metadata: { opnameId, code: opname[0].code, reviewNote },
    storeId,
    employeeProfileId,
  }).catch(() => {});

  revalidatePath("/audit");
}

export async function cancelStockOpname(opnameId: string) {
  await requireRole("manager", "owner");
  const { storeId, employeeProfileId, userName } = await getStoreContext();

  const opname = await db
    .select()
    .from(stockOpnames)
    .where(and(eq(stockOpnames.id, opnameId), eq(stockOpnames.storeId, storeId)))
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
    userName,
    action: "stok",
    detail: `Stok opname dibatalkan: ${opname[0].code}`,
    metadata: { opnameId, code: opname[0].code },
    storeId,
    employeeProfileId,
  }).catch(() => {});

  revalidatePath("/audit");
}

