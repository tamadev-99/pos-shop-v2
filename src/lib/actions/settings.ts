"use server";

import { db } from "@/db";
import { storeSettings, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
  const existing = await db
    .select()
    .from(storeSettings)
    .where(eq(storeSettings.key, key))
    .limit(1);

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

  revalidatePath("/pengaturan");
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
  await db.update(users).set({ role }).where(eq(users.id, userId));
  revalidatePath("/pengaturan");
}
