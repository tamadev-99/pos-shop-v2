import "dotenv/config";
import { db } from "./index";
import { sql } from "drizzle-orm";

async function clearDatabase() {
  console.log("🧹 Clearing all database tables...");

  try {
    // This SQL will truncate all tables in the public schema except migrations
    await db.execute(sql`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
                  AND tablename != '_prisma_migrations' 
                  AND tablename != '__drizzle_migrations') LOOP
          EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
        END LOOP;
      END $$;
    `);

    console.log("✅ Database cleared successfully!");
  } catch (error) {
    console.error("❌ Error clearing database:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

clearDatabase();
