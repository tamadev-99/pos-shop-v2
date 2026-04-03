import "dotenv/config";
import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function executeManualSchema() {
  console.log("Executing manual schema updates...");
  
  try {
    // 1. Create subscription_plans table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "subscription_plans" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "description" text,
        "price" text DEFAULT '100000' NOT NULL,
        "billing_cycle" text DEFAULT 'monthly' NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("✓ Table subscription_plans created/verified");

    // 2. Add plan_id to tenants table
    try {
      await db.execute(sql`
        ALTER TABLE "tenants" ADD COLUMN "plan_id" text REFERENCES "subscription_plans"("id");
      `);
      console.log("✓ Column plan_id added to tenants");
    } catch (e) {
      console.log("- Column plan_id may already exist or error adding it");
    }

    // 3. Create subscription_transactions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "subscription_transactions" (
        "id" text PRIMARY KEY NOT NULL,
        "tenant_id" text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "plan_id" text NOT NULL REFERENCES "subscription_plans"("id"),
        "amount" text NOT NULL,
        "status" text DEFAULT 'pending' NOT NULL,
        "mayar_invoice_id" text,
        "payment_method" text,
        "paid_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("✓ Table subscription_transactions created/verified");

    // 4. Seed initial plan
    const planId = crypto.randomUUID();
    await db.execute(sql`
      INSERT INTO "subscription_plans" ("id", "name", "description", "price", "billing_cycle", "is_active")
      VALUES (${planId}, 'Noru Pro', 'Akses penuh ke semua fitur F&B dan Retail Noru POS.', '100000', 'monthly', true)
      ON CONFLICT DO NOTHING;
    `);
    console.log("✓ Initial Noru Pro plan seeded");

  } catch (err) {
    console.error("Error executing manual schema:", err);
  }

  process.exit(0);
}

executeManualSchema().catch(console.error);
