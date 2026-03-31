"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { stores, employeeProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get the full session including store and employee context.
 */
export async function getSessionContext() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized: Anda harus login terlebih dahulu");
  }

  const activeStoreId = (session.session as unknown as { activeStoreId?: string }).activeStoreId || null;
  const activeEmployeeProfileId = (session.session as unknown as { activeEmployeeProfileId?: string }).activeEmployeeProfileId || null;

  let effectiveRole = (session.user as unknown as { role?: string }).role || "cashier";
  let effectiveName = session.user.name;

  if (activeEmployeeProfileId) {
    const employee = await db.query.employeeProfiles.findFirst({
      where: eq(employeeProfiles.id, activeEmployeeProfileId),
    });
    if (employee) {
      effectiveRole = employee.role;
      effectiveName = employee.name;
    }
  }

  return {
    userId: session.user.id,
    userName: effectiveName,
    userEmail: session.user.email,
    userRole: effectiveRole,
    activeStoreId,
    activeEmployeeProfileId,
    sessionId: session.session.id,
  };
}

/**
 * Get the active store ID. Throws if no store is selected.
 */
export async function getActiveStoreId(): Promise<string> {
  const ctx = await getSessionContext();
  if (!ctx.activeStoreId) {
    throw new Error("No active store selected. Please select a store first.");
  }
  return ctx.activeStoreId;
}

/**
 * Get the active employee profile ID. Returns null if not set.
 */
export async function getActiveEmployeeProfileId(): Promise<string | null> {
  const ctx = await getSessionContext();
  return ctx.activeEmployeeProfileId;
}

/**
 * Get both store ID and employee profile ID for transactional operations.
 */
export async function getStoreContext(): Promise<{
  storeId: string;
  employeeProfileId: string | null;
  userId: string;
  userName: string;
}> {
  const ctx = await getSessionContext();
  if (!ctx.activeStoreId) {
    throw new Error("No active store selected.");
  }
  return {
    storeId: ctx.activeStoreId,
    employeeProfileId: ctx.activeEmployeeProfileId,
    userId: ctx.userId,
    userName: ctx.userName,
  };
}

/**
 * Get the full details of the active store (name, type, etc).
 */
export async function getActiveStoreDetails() {
  const storeId = await getActiveStoreId();
  const storeRecord = await db.query.stores.findFirst({
    where: eq(stores.id, storeId),
  });
  
  if (!storeRecord) {
    throw new Error("Store record not found.");
  }

  return storeRecord;
}
