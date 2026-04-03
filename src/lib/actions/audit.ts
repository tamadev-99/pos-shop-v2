"use server";

import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { desc, and, eq, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getActiveStoreId } from "@/lib/actions/store-context";

export async function getAuditLogs(filters?: {
  action?: string;
  employeeProfileId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  storeId?: string;
}) {
  const activeStoreId = await getActiveStoreId();
  const targetStoreId = activeStoreId || filters?.storeId;
  const conditions = targetStoreId ? [eq(auditLogs.storeId, targetStoreId)] : [];


  if (filters?.action) {
    conditions.push(
      eq(
        auditLogs.action,
        filters.action as
          | "login"
          | "logout"
          | "transaksi"
          | "stok"
          | "produk"
          | "keuangan"
          | "sistem"
          | "pelanggan"
          | "supplier"
          | "retur"
      )
    );
  }
  if (filters?.employeeProfileId) {
    conditions.push(eq(auditLogs.employeeProfileId, filters.employeeProfileId));
  }
  if (filters?.startDate) {
    conditions.push(gte(auditLogs.createdAt, new Date(filters.startDate)));
  }
  if (filters?.endDate) {
    conditions.push(lte(auditLogs.createdAt, new Date(filters.endDate)));
  }

  return db.query.auditLogs.findMany({
    where: and(...conditions),
    with: {
      employee: true,
    },
    orderBy: desc(auditLogs.createdAt),
    limit: filters?.limit || 100,
  });
}

export async function createAuditLog(data: {
  userName: string;
  action:
    | "login"
    | "logout"
    | "transaksi"
    | "stok"
    | "produk"
    | "keuangan"
    | "sistem"
    | "pelanggan"
    | "supplier"
    | "retur";
  detail: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  storeId?: string; // Optional for login/logout (before store is selected)
  employeeProfileId?: string | null;
}) {
  // For login/logout events, storeId may not be available yet
  const resolvedStoreId = data.storeId || "system";

  await db.insert(auditLogs).values({
    userName: data.userName,
    action: data.action,
    detail: data.detail,
    metadata: (data.metadata as any) || null,
    ipAddress: data.ipAddress || null,
    storeId: resolvedStoreId,
    employeeProfileId: data.employeeProfileId || null,
  });

  revalidatePath("/audit");
}

