"use server";

import { db } from "@/db";
import { users, sessions, accounts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/actions/auth-helpers";
import { createAuditLog } from "@/lib/actions/audit";
import { getStoreContext } from "@/lib/actions/store-context";

/**
 * NOTE: This file manages auth-level users (Better-Auth `users` table).
 * In the SaaS multi-tenant model, employee profiles per store will be
 * managed separately. This file will be refactored in Phase 3.
 */

export async function getEmployees() {
    await requireRole("cashier", "manager", "owner");
    return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateEmployeeRole(id: string, role: "owner" | "manager" | "cashier") {
    await requireRole("owner");
    const { storeId, employeeProfileId, userName } = await getStoreContext();
    await db.update(users).set({ role }).where(eq(users.id, id));

    await createAuditLog({
      userName,
        action: "sistem",
        detail: `Role karyawan diubah ke ${role}`,
        metadata: { employeeId: id, newRole: role },
        storeId,
        employeeProfileId,
    }).catch(() => {});

    revalidatePath("/karyawan");
}

export async function createEmployeeFromOwner(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;

    if (!name || !email || !password || !role) {
        return { error: "Semua kolom wajib diisi" };
    }

    try {
        const { auth } = await import("@/lib/auth");
        const { headers } = await import("next/headers");
        const ctx = await auth.api.getSession({
            headers: await headers()
        });
        if (!ctx?.session || (ctx.user as unknown as { role?: string }).role !== "owner") {
            return { error: "Hanya pemilik (Owner) yang diizinkan untuk menambah karyawan" };
        }

        const newUser = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name,
            }
        });

        if (newUser && newUser.user) {
            const castedRole = role as "owner" | "manager" | "cashier";
            await db.update(users).set({ role: castedRole }).where(eq(users.id, newUser.user.id));

            await createAuditLog({
                userName: ctx.user.name || "Unknown",
                action: "sistem",
                detail: `Karyawan baru ditambahkan: ${name} (${castedRole})`,
                metadata: { employeeId: newUser.user.id, name, email, role: castedRole },
                storeId: (ctx.session as unknown as { activeStoreId?: string }).activeStoreId || "",
                employeeProfileId: (ctx.session as unknown as { activeEmployeeProfileId?: string }).activeEmployeeProfileId || null,
            }).catch(() => {});

            revalidatePath("/karyawan");
            return { success: true, user: { ...newUser.user, role: castedRole } };
        }
        return { error: "Gagal membuat akun" };

    } catch (e: any) {
        console.error("Gagal menambah karyawan:", e);
        return { error: e.message || "Gagal membuat karyawan baru" };
    }
}

export async function toggleEmployeeBan(id: string, banned: boolean, reason?: string) {
    await requireRole("owner");
    const { storeId, employeeProfileId, userName } = await getStoreContext();

    await db.update(users).set({
        banned,
        bannedReason: banned ? (reason || "Dinonaktifkan oleh Owner") : null,
    }).where(eq(users.id, id));

    if (banned) {
        await db.delete(sessions).where(eq(sessions.userId, id));
    }

    await createAuditLog({
      userName,
        action: "sistem",
        detail: banned ? `Karyawan dinonaktifkan` : `Karyawan diaktifkan kembali`,
        metadata: { employeeId: id, banned, reason },
        storeId,
        employeeProfileId,
    }).catch(() => {});

    revalidatePath("/karyawan");
    return { success: true };
}

export async function resetEmployeePassword(id: string, newPassword: string) {
    await requireRole("owner");
    const { storeId, employeeProfileId, userName } = await getStoreContext();

    if (!newPassword || newPassword.length < 8) {
        return { error: "Password minimal 8 karakter" };
    }

    try {
        const { hashPassword } = await import("better-auth/crypto");
        const hashedPassword = await hashPassword(newPassword);

        await db.update(accounts).set({
            password: hashedPassword,
        }).where(eq(accounts.userId, id));

        await db.delete(sessions).where(eq(sessions.userId, id));

        await createAuditLog({
            userName,
            action: "sistem",
            detail: `Password karyawan direset`,
            metadata: { employeeId: id },
            storeId,
            employeeProfileId,
        }).catch(() => {});

        revalidatePath("/karyawan");
        return { success: true };
    } catch (e: any) {
        console.error("Gagal reset password:", e);
        return { error: e.message || "Gagal mereset password karyawan" };
    }
}
