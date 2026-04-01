"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { type Role } from "@/lib/rbac";

/**
 * Get the current authenticated user from the session.
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) return null;

    return {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: (session.user as unknown as { role?: string }).role as Role || "owner",
    };
}

/**
 * Require authentication. Throws if not authenticated.
 */
export async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error("Unauthorized: Anda harus login terlebih dahulu");
    }
    return user;
}

/**
 * Require specific role(s). Throws if user doesn't have the required role.
 */
export async function requireRole(...allowedRoles: Role[]) {
    const user = await requireAuth();

    if (!allowedRoles.includes(user.role)) {
        throw new Error(
            `Forbidden: Role '${user.role}' tidak memiliki akses untuk fitur ini`
        );
    }
    return user;
}
