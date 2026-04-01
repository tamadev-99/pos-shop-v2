import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const BASE_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000";

async function createUsers() {
  console.log("👤 Creating users...\n");

  const users = [
    { name: "Owner", email: "owner@noru.com", password: "owner123", role: "owner" },
    { name: "SaaS Admin", email: "admin@noru.com", password: "admin123", role: "saas-admin" },
  ];

  for (const user of users) {
    try {
      // Sign up via better-auth API
      const res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Origin": BASE_URL },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          password: user.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.log(`  ⚠️  ${user.email}: ${data?.message || JSON.stringify(data)}`);
        continue;
      }

      console.log(`  ✅ ${user.email} created (id: ${data?.user?.id || data?.id})`);

      // Update role directly in DB
      const { drizzle } = await import("drizzle-orm/postgres-js");
      const postgres = (await import("postgres")).default;
      const { users: usersTable } = await import("./schema/auth");
      const { eq } = await import("drizzle-orm");

      const client = postgres(process.env.DATABASE_URL!, { prepare: false });
      const db = drizzle(client);

      const userId = data?.user?.id || data?.id;
      if (userId) {
        await db.update(usersTable).set({ role: user.role as "owner" | "saas-admin" }).where(eq(usersTable.id, userId));
        console.log(`  ✅ ${user.email} role set to: ${user.role}`);
      }

      await client.end();
    } catch (err: unknown) {
      const error = err as Error;
      console.log(`  ❌ ${user.email}: ${error.message}`);
    }
  }

  console.log("\n✨ Done!");
  console.log("\n📋 Login credentials:");
  console.log("   Owner:       owner@noru.com / owner123");
  console.log("   SaaS Admin:  admin@noru.com / admin123");
  process.exit(0);
}

createUsers();
