"use server";

import { db } from "@/db";
import { notifications, productVariants, products } from "@/db/schema";
import { eq, desc, and, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getActiveStoreId } from "@/lib/actions/store-context";

export async function getNotifications() {
  const storeId = await getActiveStoreId();
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.storeId, storeId))
    .orderBy(desc(notifications.createdAt))
    .limit(100);
}

export async function getUnreadNotificationsForPolling() {
  const storeId = await getActiveStoreId();
  return db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.isRead, false),
        eq(notifications.storeId, storeId)
      )
    )
    .orderBy(desc(notifications.createdAt));
}

export async function markAsRead(id: string) {
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  revalidatePath("/notifikasi");
}

export async function markAllAsRead() {
  const storeId = await getActiveStoreId();
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.storeId, storeId), eq(notifications.isRead, false)));
  revalidatePath("/notifikasi");
}

export async function createNotification(data: {
  type: "stok_rendah" | "pesanan_baru" | "pembayaran" | "sistem" | "promo";
  title: string;
  message: string;
  priority?: "low" | "normal" | "high" | "urgent";
  userId?: string;
  storeId: string;
}) {
  await db.insert(notifications).values({
    type: data.type,
    title: data.title,
    message: data.message,
    priority: data.priority || "normal",
    userId: data.userId || null,
    storeId: data.storeId,
  });

  revalidatePath("/notifikasi");
}

export async function checkLowStock() {
  const storeId = await getActiveStoreId();

  const lowStockVariants = await db
    .select({
      variantId: productVariants.id,
      sku: productVariants.sku,
      color: productVariants.color,
      size: productVariants.size,
      stock: productVariants.stock,
      minStock: productVariants.minStock,
      productName: products.name,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(
      and(
        eq(productVariants.storeId, storeId),
        lt(productVariants.stock, productVariants.minStock)
      )
    );

  for (const variant of lowStockVariants) {
    await createNotification({
      type: "stok_rendah",
      title: "Stok Rendah",
      message: `${variant.productName} (${variant.color}, ${variant.size}) - Sisa stok: ${variant.stock}, Minimum: ${variant.minStock}`,
      priority: variant.stock === 0 ? "urgent" : "high",
      storeId,
    });
  }

  return lowStockVariants;
}
