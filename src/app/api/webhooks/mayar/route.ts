import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // In a real Mayar integration, you'd verify the signature/secret here.
    // metadata might contain the tenantId
    const { status, payload } = body;
    const tenantId = payload?.metadata?.tenantId;

    if (status === "PAID" && tenantId) {
      // Find the current tenant to see when they expire
      const currentTenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, tenantId),
      });

      if (!currentTenant) {
        return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
      }

      // Calculate new expiry: 
      // If currently active and not expired, add 30 days to existing expiry.
      // If already expired, add 30 days from now.
      const now = new Date();
      let newExpiry = new Date();
      
      const currentExpiry = currentTenant.subscriptionEndsAt || currentTenant.trialEndsAt;
      
      if (currentExpiry && currentExpiry > now) {
        newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
      } else {
        newExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      await db.update(tenants)
        .set({
          subscriptionStatus: "active",
          subscriptionEndsAt: newExpiry,
          updatedAt: now,
        })
        .where(eq(tenants.id, tenantId));

      console.log(`[SUBSCRIPTION] Tenant ${tenantId} renewed until ${newExpiry.toISOString()}`);
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[WEBHOOK ERROR]", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
