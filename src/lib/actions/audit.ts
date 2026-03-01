"use server";

import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { desc, and, eq, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getAuditLogs(filters?: {
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  const conditions = [];

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
  if (filters?.userId) {
    conditions.push(eq(auditLogs.userId, filters.userId));
  }
  if (filters?.startDate) {
    conditions.push(gte(auditLogs.createdAt, new Date(filters.startDate)));
  }
  if (filters?.endDate) {
    conditions.push(lte(auditLogs.createdAt, new Date(filters.endDate)));
  }

  return db
    .select()
    .from(auditLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(filters?.limit || 100);
}

export async function createAuditLog(data: {
  userId?: string;
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
}) {
  await db.insert(auditLogs).values({
    userId: data.userId || null,
    userName: data.userName,
    action: data.action,
    detail: data.detail,
    metadata: data.metadata || null,
    ipAddress: data.ipAddress || null,
  });

  revalidatePath("/audit-log");
}
