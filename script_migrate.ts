import { config } from 'dotenv';
config({ path: '.env' });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

const client = postgres(process.env.DATABASE_URL!, {
    prepare: false,
});
const db = drizzle(client);

async function main() {
    try {
        await db.execute(sql`ALTER TABLE "shifts" ADD COLUMN IF NOT EXISTS "total_cash_sales" integer DEFAULT 0;`);
        await db.execute(sql`ALTER TABLE "shifts" ADD COLUMN IF NOT EXISTS "total_non_cash_sales" integer DEFAULT 0;`);
        console.log("Migration completed successfully.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        process.exit(0);
    }
}


main();
