"use server";

import { db } from "@/db";
import { shifts } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function openShift(cashierId: string, openingBalance: number) {
  // Check if there's already an active shift for this cashier
  const activeShift = await db
    .select()
    .from(shifts)
    .where(and(eq(shifts.cashierId, cashierId), eq(shifts.status, "active")))
    .limit(1);

  if (activeShift.length > 0) {
    return { error: "Sudah ada shift aktif", shiftId: activeShift[0].id };
  }

  const id = crypto.randomUUID();
  await db.insert(shifts).values({
    id,
    cashierId,
    openingBalance,
  });

  revalidatePath("/shift");
  return { shiftId: id };
}

export async function closeShift(
  id: string,
  actualClosing: number,
  notes?: string
) {
  const shift = await db
    .select()
    .from(shifts)
    .where(eq(shifts.id, id))
    .limit(1);

  if (!shift[0]) return;

  const expectedClosing = shift[0].openingBalance + (shift[0].totalSales || 0);
  const difference = actualClosing - expectedClosing;

  await db
    .update(shifts)
    .set({
      closedAt: new Date(),
      actualClosing,
      expectedClosing,
      difference,
      status: "closed",
      notes: notes || null,
    })
    .where(eq(shifts.id, id));

  revalidatePath("/shift");
}

export async function getCurrentShift(cashierId: string) {
  const activeShift = await db
    .select()
    .from(shifts)
    .where(and(eq(shifts.cashierId, cashierId), eq(shifts.status, "active")))
    .limit(1);

  return activeShift[0] || null;
}

export async function getShiftHistory(limit?: number) {
  return db
    .select()
    .from(shifts)
    .orderBy(desc(shifts.openedAt))
    .limit(limit || 50);
}
