"use server";

import { db } from "@/db";
import { storeSettings, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole, getCurrentUser } from "@/lib/actions/auth-helpers";
import { createAuditLog } from "@/lib/actions/audit";

export async function getSettings() {
  const settings = await db.select().from(storeSettings);
  const settingsMap: Record<string, unknown> = {};
  for (const s of settings) {
    settingsMap[s.key] = s.value;
  }
  return settingsMap;
}

export async function getSetting(key: string) {
  const setting = await db
    .select()
    .from(storeSettings)
    .where(eq(storeSettings.key, key))
    .limit(1);
  return setting[0]?.value || null;
}

export async function updateSetting(key: string, value: unknown) {
  const user = await requireRole("owner");
  const existing = await db
    .select()
    .from(storeSettings)
    .where(eq(storeSettings.key, key))
    .limit(1);

  const oldValue = existing[0]?.value || null;

  if (existing.length > 0) {
    await db
      .update(storeSettings)
      .set({ value: value as Record<string, unknown>, updatedAt: new Date() })
      .where(eq(storeSettings.key, key));
  } else {
    await db.insert(storeSettings).values({
      key,
      value: value as Record<string, unknown>,
    });
  }

  createAuditLog({
    userId: user.id,
    userName: user.name || "Unknown",
    action: "sistem",
    detail: `Pengaturan diperbarui: ${key}`,
    metadata: { key, oldValue, newValue: value },
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
  await db.update(users).set({ role }).where(eq(users.id, userId));

  createAuditLog({
    userId: user.id,
    userName: user.name || "Unknown",
    action: "sistem",
    detail: `Role pengguna diubah ke ${role}`,
    metadata: { targetUserId: userId, newRole: role },
  }).catch(() => {});

  revalidatePath("/pengaturan");
}
