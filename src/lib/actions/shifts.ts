"use server";

import { db } from "@/db";
import { shifts } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/actions/audit";
import { getCurrentUser } from "@/lib/actions/auth-helpers";
import { processRecurringExpenses } from "@/lib/actions/expense-tracker";

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

  const user = await getCurrentUser();
  if (user) {
    createAuditLog({
      userId: user.id,
      userName: user.name || "Unknown",
      action: "keuangan",
      detail: `Shift dibuka dengan saldo awal Rp ${openingBalance.toLocaleString("id-ID")}`,
      metadata: { shiftId: id, openingBalance },
    }).catch(() => {});
  }

  // Process recurring expenses on shift open to ensure they run at least once per business day
  processRecurringExpenses().catch(() => {});

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

  const expectedClosing = shift[0].openingBalance + (shift[0].totalCashSales || 0);
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

  const user = await getCurrentUser();
  if (user) {
    createAuditLog({
      userId: user.id,
      userName: user.name || "Unknown",
      action: "keuangan",
      detail: `Shift ditutup. Selisih: Rp ${difference.toLocaleString("id-ID")}`,
      metadata: { shiftId: id, actualClosing, expectedClosing, difference },
    }).catch(() => {});
  }

  revalidatePath("/shift");
}

export async function getActiveShifts() {
  return db.query.shifts.findMany({
    where: eq(shifts.status, "active"),
    with: { cashier: true },
    orderBy: [desc(shifts.openedAt)],
  });
}

export async function getCurrentShift(cashierId: string) {
  const activeShift = await db.query.shifts.findFirst({
    where: and(eq(shifts.cashierId, cashierId), eq(shifts.status, "active")),
    with: { cashier: true },
  });

  return activeShift || null;
}

export async function checkCashierShift(cashierId: string) {
  const activeShift = await getCurrentShift(cashierId);

  if (!activeShift) {
    return {
      hasActiveShift: false,
      isPreviousDay: false,
      shiftId: null,
      openedAt: null,
    };
  }

  // Check if it's from a previous day based on local midnight timing
  // We'll compare the start of today with the openedAt timestamp
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const openedAtDate = new Date(activeShift.openedAt);
  const isPreviousDay = openedAtDate < startOfToday;

  return {
    hasActiveShift: true,
    isPreviousDay,
    shiftId: activeShift.id,
    openedAt: activeShift.openedAt.toISOString(),
  };
}

export async function getShiftHistory(page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;

  const [data, countResult] = await Promise.all([
    db.query.shifts.findMany({
      orderBy: [desc(shifts.openedAt)],
      limit: pageSize,
      offset,
      with: { cashier: true },
    }),
    db.select({ count: sql<number>`count(*)::int` }).from(shifts),
  ]);

  return {
    data,
    total: countResult[0]?.count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((countResult[0]?.count ?? 0) / pageSize),
  };
}
