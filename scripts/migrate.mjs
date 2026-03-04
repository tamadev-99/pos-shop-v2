import { config } from "dotenv";
import { resolve } from "path";
import fs from "fs";
import postgres from "postgres";

config({ path: resolve(process.cwd(), ".env") });

async function runMigration() {
    console.log("Connecting to Database via postgres.js...");
    const sqlConnection = postgres(process.env.DATABASE_URL);

    try {
        const fileContent = fs.readFileSync("drizzle/0004_safe_true_believers.sql", "utf-8");
        const queries = fileContent.split("--> statement-breakpoint").map(q => q.trim()).filter(q => q.length > 0);

        for (const q of queries) {
            console.log("Executing:", q.substring(0, 50) + "...");
            await sqlConnection.unsafe(q);
        }
        console.log("Migration Successful!");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await sqlConnection.end();
    }
}

runMigration();
