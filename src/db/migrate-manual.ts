import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import postgres from "postgres";
import { readFileSync } from "fs";
import { join } from "path";

async function migrate() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false });

  console.log("🗄️  Running migration...");

  // Read the migration SQL
  const sqlFile = readFileSync(join(__dirname, "../../drizzle/0000_lying_daredevil.sql"), "utf-8");

  // Split by statement-breakpoint and process each statement
  const statements = sqlFile.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean);

  for (const stmt of statements) {
    try {
      if (stmt.startsWith("CREATE TYPE")) {
        // Make enum creation idempotent
        const typeName = stmt.match(/"public"\."([^"]+)"/)?.[1];
        if (typeName) {
          const cleanStmt = stmt.replace(/;$/, "");
          await client.unsafe(`DO $$ BEGIN ${cleanStmt}; EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
          console.log(`  ✅ Type ${typeName} (exists or created)`);
        }
      } else if (stmt.startsWith("CREATE TABLE")) {
        const tableName = stmt.match(/"([^"]+)"/)?.[1];
        await client.unsafe(stmt);
        console.log(`  ✅ Table ${tableName} created`);
      } else if (stmt.startsWith("ALTER TABLE")) {
        const match = stmt.match(/ADD CONSTRAINT "([^"]+)"/);
        try {
          await client.unsafe(stmt);
          console.log(`  ✅ Constraint ${match?.[1]} added`);
        } catch (e: unknown) {
          const err = e as { code?: string };
          if (err.code === "42710") {
            console.log(`  ⏭️  Constraint ${match?.[1]} already exists`);
          } else {
            throw e;
          }
        }
      } else {
        await client.unsafe(stmt);
        console.log(`  ✅ Statement executed`);
      }
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.code === "42P07") {
        // table already exists
        const tableName = stmt.match(/"([^"]+)"/)?.[1];
        console.log(`  ⏭️  Table ${tableName} already exists`);
      } else if (err.code === "42710") {
        console.log(`  ⏭️  Already exists, skipping`);
      } else {
        console.error(`  ❌ Error:`, err.message);
        throw e;
      }
    }
  }

  // Mark migration as applied in drizzle's migration tracker
  await client.unsafe(`
    CREATE SCHEMA IF NOT EXISTS drizzle;
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    );
  `);

  const existing = await client.unsafe(
    `SELECT hash FROM drizzle.__drizzle_migrations WHERE hash = '0000_lying_daredevil'`
  );
  if (existing.length === 0) {
    await client.unsafe(
      `INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('0000_lying_daredevil', ${Date.now()})`
    );
  }

  console.log("\n✨ Migration complete!");
  await client.end();
  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
