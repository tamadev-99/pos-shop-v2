import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "./schema/auth";
import { eq } from "drizzle-orm";

async function updateRoles() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false });
  const db = drizzle(client);

  await db.update(users).set({ role: "owner" }).where(eq(users.email, "owner@kasirpro.com"));
  console.log("✅ owner@kasirpro.com → role: owner");

  await db.update(users).set({ role: "cashier" }).where(eq(users.email, "kasir@kasirpro.com"));
  console.log("✅ kasir@kasirpro.com → role: cashier");

  await client.end();
  process.exit(0);
}

updateRoles();
