import { db } from "@/db";
import { tenants, subscriptionTransactions, subscriptionPlans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import crypto from "node:crypto";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    
    // Webhook Signature Verification
    const signature = req.headers.get("x-mayar-signature");
    const webhookSecret = process.env.MAYAR_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const hmac = crypto.createHmac("sha256", webhookSecret);
      const digest = hmac.update(rawBody).digest("hex");
      
      if (digest !== signature) {
        console.warn("[WEBHOOK] Invalid signature detected");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const { status, payload, event } = body;
    
    // Mayar Invoices usually send 'invoice.paid' or similar events
    // or status 'PAID' in the generic webhook
    const isPaid = status === "PAID" || event === "invoice.paid";
    
    const tenantId = payload?.metadata?.tenantId;
    const planId = payload?.metadata?.planId;

    if (isPaid && tenantId) {
      console.log(`[WEBHOOK] Processing payment for Tenant: ${tenantId}`);

      const currentTenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, tenantId),
      });

      if (!currentTenant) {
        console.error(`[WEBHOOK] Tenant ${tenantId} not found in database`);
        return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
      }

      // Record transaction
      try {
        await db.insert(subscriptionTransactions).values({
          tenantId,
          planId: planId || currentTenant.planId || "default-pro", // Fallback if metadata missing
          amount: payload?.amount?.toString() || "111000",
          status: "paid",
          mayarInvoiceId: payload?.id,
          paymentMethod: payload?.payment_method,
          paidAt: new Date(),
        });
      } catch (err) {
        console.error("[WEBHOOK] Failed to record transaction:", err);
        // We continue anyway to ensure the tenant gets their subscription activated
      }

      const now = new Date();
      let newExpiry = new Date();
      
      const currentExpiry = currentTenant.subscriptionEndsAt || currentTenant.trialEndsAt;
      
      // Extend 30 days
      if (currentExpiry && currentExpiry > now) {
        newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
      } else {
        newExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      await db.update(tenants)
        .set({
          subscriptionStatus: "active",
          subscriptionEndsAt: newExpiry,
          planId: planId || currentTenant.planId,
          updatedAt: now,
        })
        .where(eq(tenants.id, tenantId));

      console.log(`[SUBSCRIPTION SUCCESS] Tenant ${tenantId} renewed until ${newExpiry.toISOString()}`);
      
      return NextResponse.json({ success: true, message: "Subscription updated and transaction recorded" });
    }

    return NextResponse.json({ received: true, event: event || "unknown" });
  } catch (error) {
    console.error("[WEBHOOK ERROR]", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}


