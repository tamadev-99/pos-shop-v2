"use server";

import { db } from "@/db";
import { storeSettings } from "@/db/schema/settings";
import { eq, and } from "drizzle-orm";
import { getSessionContext } from "./store-context";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "./audit";

const PERMISSIONS_SETTING_KEY = "role_permissions";

/**
 * Gets role permissions for the active store from settings table.
 */
export async function getRolePermissions(): Promise<Record<string, string[]> | undefined> {
  const { activeStoreId } = await getSessionContext();
  if (!activeStoreId) return undefined;

  try {
    const setting = await db.query.storeSettings.findFirst({
      where: and(
        eq(storeSettings.storeId, activeStoreId),
        eq(storeSettings.key, PERMISSIONS_SETTING_KEY)
      ),
    });

    if (setting && setting.value) {
      return setting.value as Record<string, string[]>;
    }
  } catch (error) {
    console.error("Error fetching role permissions:", error);
  }

  return undefined;
}

/**
 * Enforces route access based on role permissions. Use this at the top of Server Components.
 */
export async function enforceRouteAccess(route: string) {
  const { userRole } = await getSessionContext();
  if (userRole === "owner") return true;

  const perms = await getRolePermissions();
  const { hasAccess } = await import("@/lib/rbac");
  
  if (!hasAccess(userRole as any, route, perms)) {
    // We throw to generic home if unauthorized
    console.warn(`[Permission Denied] User with role ${userRole} missing ${route}`);
    const { redirect } = await import("next/navigation");
    redirect("/dashboard");
  }
}

/**
 * Saves or updates custom role permissions for the active store.
 */
export async function saveRolePermissions(permissions: Record<string, string[]>) {
  const { activeStoreId, activeEmployeeProfileId, userRole, userName } = await getSessionContext();
  
  if (!activeStoreId) {
    return { success: false, error: "Store context missing" };
  }

  // Determine active role dynamically based on employee or user fallback
  // The userRole from session represents the owner role if they are owner.
  // Wait, if an employee is active, we should technically check if their role is owner.
  // Actually, we can just strictly check if userRole is owner, but that depends if they are logged in as employee.
  // A safer approach right now is assuming only owners can even hit this Server Action
  if (userRole !== "owner") {
    return { success: false, error: "Hanya Owner yang dapat mengubah hak akses" };
  }

  try {
    const existing = await db.query.storeSettings.findFirst({
      where: and(
        eq(storeSettings.storeId, activeStoreId),
        eq(storeSettings.key, PERMISSIONS_SETTING_KEY)
      ),
    });

    if (existing) {
      await db
        .update(storeSettings)
        .set({ value: permissions, updatedAt: new Date() })
        .where(eq(storeSettings.id, existing.id));
    } else {
      await db.insert(storeSettings).values({
        storeId: activeStoreId,
        key: PERMISSIONS_SETTING_KEY,
        value: permissions,
      });
    }

    await createAuditLog({
      userName,
      action: "sistem",
      detail: "Memperbarui pengaturan hak akses karyawan",
      metadata: { permissions },
      storeId: activeStoreId,
      employeeProfileId: activeEmployeeProfileId,
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Error saving role permissions:", error);
    return { success: false, error: error.message || "Gagal menyimpan hak akses" };
  }
}
