"use server";

import { db } from "@/db";
import { users, sessions, accounts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/actions/auth-helpers";

export async function getEmployees() {
    await requireRole("cashier", "manager", "owner");
    return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateEmployeeRole(id: string, role: "owner" | "manager" | "cashier") {
    await requireRole("owner");
    await db.update(users).set({ role }).where(eq(users.id, id));
    revalidatePath("/kontak");
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
        if (!ctx?.session || ctx.user.role !== "owner") {
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

            revalidatePath("/kontak");
            return { success: true, user: { ...newUser.user, role: castedRole } };
        }
        return { error: "Gagal membuat akun" };

    } catch (e: any) {
        console.error("Gagal menambah karyawan:", e);
        return { error: e.message || "Gagal membuat karyawan baru" };
    }
}

/**
 * Toggle employee banned status. When banning, all sessions are deleted to force logout.
 */
export async function toggleEmployeeBan(id: string, banned: boolean, reason?: string) {
    await requireRole("owner");

    await db.update(users).set({
        banned,
        bannedReason: banned ? (reason || "Dinonaktifkan oleh Owner") : null,
    }).where(eq(users.id, id));

    // If banning, delete all their sessions to force logout
    if (banned) {
        await db.delete(sessions).where(eq(sessions.userId, id));
    }

    revalidatePath("/kontak");
    revalidatePath("/pengaturan");
    return { success: true };
}

/**
 * Reset employee password. Uses better-auth's internal password hashing.
 */
export async function resetEmployeePassword(id: string, newPassword: string) {
    await requireRole("owner");

    if (!newPassword || newPassword.length < 8) {
        return { error: "Password minimal 8 karakter" };
    }

    try {
        // Hash the password using better-auth's built-in hashing
        const { hashPassword } = await import("better-auth/crypto");
        const hashedPassword = await hashPassword(newPassword);

        // Update in accounts table (where better-auth stores passwords)
        await db.update(accounts).set({
            password: hashedPassword,
        }).where(eq(accounts.userId, id));

        // Also delete all sessions to force re-login
        await db.delete(sessions).where(eq(sessions.userId, id));

        revalidatePath("/kontak");
        return { success: true };
    } catch (e: any) {
        console.error("Gagal reset password:", e);
        return { error: e.message || "Gagal mereset password karyawan" };
    }
}

