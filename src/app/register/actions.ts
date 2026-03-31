"use server";

import { db } from "@/db";
import { tenants, users } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function registerOwner(name: string, email: string, password: string) {
  try {
    // Check email not already taken
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (existing) {
      return { success: false, error: "Email sudah digunakan." };
    }

    // Create user via Better Auth
    const result = await auth.api.signUpEmail({
      body: { name, email, password },
      headers: await headers(),
    });

    if (!result || !result.user) {
      return { success: false, error: "Gagal membuat akun. Silakan coba lagi." };
    }

    const userId = result.user.id;

    // Update user role to owner
    await db.update(users).set({ role: "owner" }).where(eq(users.id, userId));

    // Create tenant for this owner
    await db.insert(tenants).values({
      name: `${name}'s Tenant`,
      ownerId: userId,
    });

    return { success: true, userId };
  } catch (error) {
    console.error("Register owner error:", error);
    return { success: false, error: "Terjadi kesalahan server. Silakan coba lagi." };
  }
}
