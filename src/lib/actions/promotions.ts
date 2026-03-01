"use server";

import { db } from "@/db";
import { promotions } from "@/db/schema";
import { eq, and, lte, gte, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getPromotions(filters?: { active?: boolean }) {
  if (filters?.active !== undefined) {
    return db
      .select()
      .from(promotions)
      .where(eq(promotions.isActive, filters.active))
      .orderBy(desc(promotions.createdAt));
  }

  return db.select().from(promotions).orderBy(desc(promotions.createdAt));
}

export async function getActivePromotions() {
  const today = new Date().toISOString().split("T")[0];

  return db
    .select()
    .from(promotions)
    .where(
      and(
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
  startDate: string;
  endDate: string;
  appliesTo?: "all" | "category" | "product";
  targetIds?: string[];
}) {
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
    startDate: data.startDate,
    endDate: data.endDate,
    appliesTo: data.appliesTo || "all",
    targetIds: data.targetIds || [],
  });

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
    startDate: string;
    endDate: string;
  }>
) {
  await db.update(promotions).set(data).where(eq(promotions.id, id));
  revalidatePath("/promosi");
}

export async function deletePromotion(id: string) {
  await db.delete(promotions).where(eq(promotions.id, id));
  revalidatePath("/promosi");
}
