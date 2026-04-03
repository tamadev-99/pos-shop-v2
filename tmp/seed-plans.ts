import "dotenv/config";
import { db } from "../src/db";
import { subscriptionPlans } from "../src/db/schema/auth";
import { eq } from "drizzle-orm";

async function seedPlans() {
  console.log("Seeding subscription plans...");
  
  const existingPro = await db.query.subscriptionPlans.findFirst({
    where: eq(subscriptionPlans.name, "Noru Pro"),
  });

  if (!existingPro) {
    await db.insert(subscriptionPlans).values({
      name: "Noru Pro",
      description: "Akses penuh ke semua fitur F&B dan Retail Noru POS.",
      price: "100000",
      billingCycle: "monthly",
      isActive: true,
    });
    console.log("Noru Pro plan created.");
  } else {
    console.log("Noru Pro plan already exists.");
  }

  process.exit(0);
}

seedPlans().catch(console.error);
