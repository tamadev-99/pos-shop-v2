"use server";

import { db } from "@/db";
import { promotions } from "@/db/schema";
import { eq, and, lte, gte, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/actions/auth-helpers";
import { createAuditLog } from "@/lib/actions/audit";
import { getActiveStoreId, getStoreContext } from "@/lib/actions/store-context";

export async function getPromotions(filters?: { active?: boolean }) {
  const storeId = await getActiveStoreId();
  const conditions = [eq(promotions.storeId, storeId)];

  if (filters?.active !== undefined) {
    conditions.push(eq(promotions.isActive, filters.active));
  }

  return db
    .select()
    .from(promotions)
    .where(and(...conditions))
    .orderBy(desc(promotions.createdAt));
}

export async function getActivePromotions() {
  const storeId = await getActiveStoreId();
  const today = new Date().toISOString().split("T")[0];

  return db
    .select()
    .from(promotions)
    .where(
      and(
        eq(promotions.storeId, storeId),
        eq(promotions.isActive, true),
        lte(promotions.startDate, today),
        gte(promotions.endDate, today)
      )
    );
}

export async function createPromotion(data: {
  name: string;
  description?: string;
  type: "percentage" | "fixed" | "buy_x_get_y" | "bundle";
  value: number;
  minPurchase?: number;
  buyQty?: number;
  getQty?: number;
  freeProductId?: string;
  startDate: string;
  endDate: string;
  appliesTo?: "all" | "category" | "product";
  targetIds?: string[];
}) {
  await requireRole("manager", "owner");
  const { storeId, employeeProfileId, userName } = await getStoreContext();
  const id = crypto.randomUUID();

  await db.insert(promotions).values({
    id,
    name: data.name,
    description: data.description || "",
    type: data.type,
    value: data.value,
    minPurchase: data.minPurchase || 0,
    buyQty: data.buyQty || null,
    getQty: data.getQty || null,
    freeProductId: data.freeProductId || null,
    startDate: data.startDate,
    endDate: data.endDate,
    appliesTo: data.appliesTo || "all",
    targetIds: data.targetIds || [],
    storeId,
  });

  createAuditLog({
    userName,
    action: "sistem",
    detail: `Promosi baru dibuat: ${data.name}`,
    metadata: { promotionId: id, name: data.name, type: data.type, value: data.value },
    storeId,
    employeeProfileId,
  }).catch(() => {});

  revalidatePath("/promosi");
  return id;
}

export async function updatePromotion(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    isActive: boolean;
    value: number;
    minPurchase: number;
    buyQty: number | null;
    getQty: number | null;
    freeProductId: string | null;
    startDate: string;
    endDate: string;
    appliesTo: "all" | "category" | "product";
    targetIds: string[];
  }>
) {
  await requireRole("manager", "owner");
  const { storeId, employeeProfileId, userName } = await getStoreContext();
  await db
    .update(promotions)
    .set(data)
    .where(and(eq(promotions.id, id), eq(promotions.storeId, storeId)));

  createAuditLog({
    userName,
    action: "sistem",
    detail: `Promosi diperbarui`,
    metadata: { promotionId: id, changes: data },
    storeId,
    employeeProfileId,
  }).catch(() => {});

  revalidatePath("/promosi");
}

export async function deletePromotion(id: string) {
  await requireRole("manager", "owner");
  const { storeId, employeeProfileId, userName } = await getStoreContext();
  await db
    .delete(promotions)
    .where(and(eq(promotions.id, id), eq(promotions.storeId, storeId)));

  createAuditLog({
    userName,
    action: "sistem",
    detail: `Promosi dihapus`,
    metadata: { promotionId: id },
    storeId,
    employeeProfileId,
  }).catch(() => {});

  revalidatePath("/promosi");
}
