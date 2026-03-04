"use server";

import { db } from "@/db";
import { notifications, productVariants, products } from "@/db/schema";
import { eq, desc, and, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getNotifications(userId?: string) {
  if (userId) {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  return db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(100);
}

export async function getUnreadNotificationsForPolling(userId: string) {
  const userNotifs = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.isRead, false),
        eq(notifications.userId, userId)
      )
    )
    .orderBy(desc(notifications.createdAt));

  // Also get global unread if userId is null (sistem, promo usually)
  const globalNotifs = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.isRead, false)
      )
    );

  // Filter global ones that have userId null
  const nullIdNotifs = globalNotifs.filter(n => n.userId === null);

  return [...userNotifs, ...nullIdNotifs].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function markAsRead(id: string) {
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  revalidatePath("/notifikasi");
}

export async function markAllAsRead(userId?: string) {
  if (userId) {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  } else {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.isRead, false));
  }
  revalidatePath("/notifikasi");
}

export async function createNotification(data: {
  type: "stok_rendah" | "pesanan_baru" | "pembayaran" | "sistem" | "promo";
  title: string;
  message: string;
  priority?: "low" | "normal" | "high" | "urgent";
  userId?: string;
}) {
  await db.insert(notifications).values({
    type: data.type,
    title: data.title,
    message: data.message,
    priority: data.priority || "normal",
    userId: data.userId || null,
  });

  revalidatePath("/notifikasi");
}

export async function checkLowStock() {
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
    .where(lt(productVariants.stock, productVariants.minStock));

  for (const variant of lowStockVariants) {
    await createNotification({
      type: "stok_rendah",
      title: "Stok Rendah",
      message: `${variant.productName} (${variant.color}, ${variant.size}) - Sisa stok: ${variant.stock}, Minimum: ${variant.minStock}`,
      priority: variant.stock === 0 ? "urgent" : "high",
    });
  }

  return lowStockVariants;
}
