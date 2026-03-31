"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { sessions, stores } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function selectStoreAction(storeId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify the store belongs to the user's tenant
    const store = await db.query.stores.findFirst({
      where: eq(stores.id, storeId),
      with: {
        tenant: true
      }
    });

    if (!store || store.tenant.ownerId !== session.user.id) {
      return { success: false, error: "Unauthorized access to store" };
    }

    // Update the session in the database
    // Better Auth uses session.session.token or session.session.id
    // We'll update the 'activeStoreId' column in 'sessions'
    await db.update(sessions)
      .set({ activeStoreId: storeId })
      .where(eq(sessions.id, session.session.id));

    revalidatePath("/");
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("Select store error:", error);
    return { success: false, error: "Internal server error" };
  }
}
