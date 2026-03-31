"use server";

import { db } from "@/db";
import { sessions } from "@/db/schema/auth";
import { employeeProfiles } from "@/db/schema/profiles";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

/**
 * Verify an employee's 6-digit PIN and set them as the active profile in the session.
 */
export async function verifyEmployeePIN(employeeId: string, pin: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return { success: false, error: "Sesi tidak valid. Silakan login ulang." };
    }

    const activeStoreId = (session.session as unknown as { activeStoreId?: string }).activeStoreId;
    if (!activeStoreId) {
      return { success: false, error: "Silakan pilih toko terlebih dahulu." };
    }

    // Find the employee profile in the active store
    const employee = await db.query.employeeProfiles.findFirst({
      where: and(
        eq(employeeProfiles.id, employeeId),
        eq(employeeProfiles.storeId, activeStoreId),
        eq(employeeProfiles.isActive, true)
      ),
    });

    if (!employee) {
      return { success: false, error: "Profil karyawan tidak ditemukan." };
    }

    // Verify PIN via bcrypt
    const isValid = await bcrypt.compare(pin, employee.pinHash);
    if (!isValid) {
      return { success: false, error: "PIN salah. Silakan coba lagi." };
    }

    // Set employee profile as active in session
    await db
      .update(sessions)
      .set({ activeEmployeeProfileId: employeeId })
      .where(eq(sessions.id, session.session.id));

    revalidatePath("/");
    return { success: true, employeeName: employee.name, employeeRole: employee.role };
  } catch (error) {
    console.error("Verify PIN error:", error);
    return { success: false, error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}

/**
 * Clear the active employee profile from the session (switch employee).
 */
export async function clearEmployeeSession() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { success: false };

    await db
      .update(sessions)
      .set({ activeEmployeeProfileId: null })
      .where(eq(sessions.id, session.session.id));

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Clear employee session error:", error);
    return { success: false };
  }
}

/**
 * Switch store: clear both activeStoreId and activeEmployeeProfileId.
 */
export async function switchStore() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { success: false };

    await db
      .update(sessions)
      .set({ activeStoreId: null, activeEmployeeProfileId: null })
      .where(eq(sessions.id, session.session.id));

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Switch store error:", error);
    return { success: false };
  }
}
