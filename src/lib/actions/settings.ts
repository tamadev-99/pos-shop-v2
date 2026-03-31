"use server";

import { db } from "@/db";
import { storeSettings, users, stores } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/actions/auth-helpers";
import { createAuditLog } from "@/lib/actions/audit";
import { getActiveStoreId, getStoreContext } from "@/lib/actions/store-context";

export async function getSettings() {
  const storeId = await getActiveStoreId();
  const settingsRecords = await db
    .select()
    .from(storeSettings)
    .where(eq(storeSettings.storeId, storeId));

  const storeRecord = await db.query.stores.findFirst({
    where: eq(stores.id, storeId),
  });

  const settingsMap: Record<string, unknown> = {};
  for (const s of settingsRecords) {
    settingsMap[s.key] = s.value;
  }

  // Sync baseline multi-tenant store profile details if settings map is empty
  if (!settingsMap["storeName"] && storeRecord) {
    settingsMap["storeName"] = storeRecord.name;
  }
  if (!settingsMap["storeAddress"] && storeRecord?.address) {
    settingsMap["storeAddress"] = storeRecord.address;
  }

  return settingsMap;
}

export async function getSetting(key: string) {
  const storeId = await getActiveStoreId();
  const setting = await db
    .select()
    .from(storeSettings)
    .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, key)))
    .limit(1);
  return setting[0]?.value || null;
}

export async function updateSetting(key: string, value: unknown) {
  const user = await requireRole("owner");
  const { storeId, employeeProfileId } = await getStoreContext();

  const existing = await db
    .select()
    .from(storeSettings)
    .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, key)))
    .limit(1);

  const oldValue = existing[0]?.value || null;

  if (existing.length > 0) {
    await db
      .update(storeSettings)
      .set({ value: value as Record<string, unknown>, updatedAt: new Date() })
      .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, key)));
  } else {
    await db.insert(storeSettings).values({
      key,
      value: value as Record<string, unknown>,
      storeId,
    });
  }

  // Sync back to main store record if it's name or address
  if (key === "storeName" && typeof value === "string") {
    await db.update(stores).set({ name: value }).where(eq(stores.id, storeId));
  }
  if (key === "storeAddress" && typeof value === "string") {
    await db.update(stores).set({ address: value }).where(eq(stores.id, storeId));
  }

  createAuditLog({
    userName: user.name || "Unknown",
    action: "sistem",
    detail: `Pengaturan diperbarui: ${key}`,
    metadata: { key, oldValue, newValue: value },
    storeId,
    employeeProfileId,
  }).catch(() => {});

  revalidatePath("/", "layout");
}

export async function getUsers() {
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
  }).from(users);
}

export async function updateUserRole(userId: string, role: "cashier" | "manager" | "owner") {
  const user = await requireRole("owner");
  const { storeId, employeeProfileId } = await getStoreContext();
  await db.update(users).set({ role }).where(eq(users.id, userId));

  createAuditLog({
    userName: user.name || "Unknown",
    action: "sistem",
    detail: `Role pengguna diubah ke ${role}`,
    metadata: { targetUserId: userId, newRole: role },
    storeId,
    employeeProfileId,
  }).catch(() => {});

  revalidatePath("/pengaturan");
}
