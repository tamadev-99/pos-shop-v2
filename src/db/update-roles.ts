import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "./schema/auth";
import { eq } from "drizzle-orm";

async function updateRoles() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false });
  const db = drizzle(client);

  await db.update(users).set({ role: "owner" }).where(eq(users.email, "owner@noru.com"));
  console.log("✅ owner@noru.com → role: owner");

  await db.update(users).set({ role: "saas-admin" }).where(eq(users.email, "admin@noru.com"));
  console.log("✅ admin@noru.com → role: saas-admin");

  await client.end();
  process.exit(0);
}

updateRoles();
