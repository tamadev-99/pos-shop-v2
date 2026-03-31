"use server";

import { db } from "@/db";
import { stores, tenants } from "@/db/schema/auth";
import { employeeProfiles } from "@/db/schema/profiles";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";

export async function createStoreAction(
  name: string,
  type: "clothing" | "minimart",
  address?: string,
  ownerName?: string,
  ownerPin?: string,
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return { success: false, error: "Sesi tidak valid. Silakan login ulang." };
    }

    const userId = session.user.id;

    // Find the tenant belonging to this owner
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.ownerId, userId),
    });

    if (!tenant) {
      return { success: false, error: "Tenant tidak ditemukan. Silakan daftar ulang." };
    }

    // Create the store
    const [newStore] = await db
      .insert(stores)
      .values({ name, type, address, tenantId: tenant.id })
      .returning();

    // Create the Owner's employee profile with PIN
    const pinToHash = ownerPin || "123456"; // fallback default
    const pinHash = await bcrypt.hash(pinToHash, 10);
    const profileName = ownerName || session.user.name || "Owner";

    await db.insert(employeeProfiles).values({
      name: profileName,
      storeId: newStore.id,
      role: "owner",
      pinHash,
      isActive: true,
    });

    return { success: true, storeId: newStore.id };
  } catch (error) {
    console.error("Create store error:", error);
    return { success: false, error: "Gagal membuat toko. Silakan coba lagi." };
  }
}
