"use server";

import { db } from "@/db";
import { shifts } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/actions/audit";
import { getStoreContext, getActiveStoreId, getRequiredStoreContext, getRequiredStoreId } from "@/lib/actions/store-context";
import { processRecurringExpenses } from "@/lib/actions/expense-tracker";

export async function openShift(openingBalance: number) {
  const { storeId, employeeProfileId, userName } = await getRequiredStoreContext();

  // Check if there's already an active shift for this store
  const activeShift = await db
    .select()
    .from(shifts)
    .where(and(eq(shifts.storeId, storeId), eq(shifts.status, "active")))
    .limit(1);

  if (activeShift.length > 0) {
    return { error: "Sudah ada shift aktif", shiftId: activeShift[0].id };
  }

  const id = crypto.randomUUID();
  await db.insert(shifts).values({
    id,
    employeeProfileId: employeeProfileId || "",
    openingBalance,
    storeId,
  });

  createAuditLog({
    userName,
    action: "keuangan",
    detail: `Shift dibuka dengan saldo awal Rp ${openingBalance.toLocaleString("id-ID")}`,
    metadata: { shiftId: id, openingBalance },
    storeId,
    employeeProfileId,
  }).catch(() => {});


  processRecurringExpenses().catch(() => {});

  revalidatePath("/shift");
  return { shiftId: id };
}

export async function closeShift(
  id: string,
  actualClosing: number,
  notes?: string
) {
  const { storeId, employeeProfileId, userName } = await getRequiredStoreContext();

  const shift = await db
    .select()
    .from(shifts)
    .where(and(eq(shifts.id, id), eq(shifts.storeId, storeId)))
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

  createAuditLog({
    userName,
    action: "keuangan",
    detail: `Shift ditutup. Selisih: Rp ${difference.toLocaleString("id-ID")}`,
    metadata: { shiftId: id, actualClosing, expectedClosing, difference },
    storeId,
    employeeProfileId,
  }).catch(() => {});

  revalidatePath("/shift");
}

export async function getActiveShifts() {
  const storeId = await getActiveStoreId();
  const conditions = storeId ? [eq(shifts.storeId, storeId)] : [];
  
  return db.query.shifts.findMany({
    where: and(...conditions, eq(shifts.status, "active")),
    with: { employee: true },
    orderBy: [desc(shifts.openedAt)],
  });
}

export async function getCurrentShift() {
  const { storeId, employeeProfileId } = await getRequiredStoreContext();
  const activeShift = await db.query.shifts.findFirst({
    where: and(
        eq(shifts.storeId, storeId), 
        eq(shifts.status, "active"),
        eq(shifts.employeeProfileId, employeeProfileId || "")
    ),
    with: { employee: true },
  });

  return activeShift || null;
}

export async function checkCashierShift() {
  const activeShift = await getCurrentShift();

  if (!activeShift) {
    return {
      hasActiveShift: false,
      isPreviousDay: false,
      shiftId: null,
      openedAt: null,
    };
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const openedAtDate = new Date(activeShift.openedAt);
  const isPreviousDay = openedAtDate < startOfToday;

  return {
    hasActiveShift: true,
    isPreviousDay,
    shiftId: activeShift.id,
    openedAt: activeShift.openedAt.toISOString(),
    employeeName: activeShift.employee?.name || "Kasir",
  };
}

export async function getShiftHistory(page = 1, pageSize = 20) {
  const storeId = await getActiveStoreId();
  const offset = (page - 1) * pageSize;
  const conditions = storeId ? [eq(shifts.storeId, storeId)] : [];

  const [data, countResult] = await Promise.all([
    db.query.shifts.findMany({
      where: and(...conditions),
      orderBy: [desc(shifts.openedAt)],
      limit: pageSize,
      offset,
      with: { employee: true },
    }),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(shifts)
      .where(and(...conditions)),
  ]);

  return {
    data,
    total: countResult[0]?.count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((countResult[0]?.count ?? 0) / pageSize),
  };
}

