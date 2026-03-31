import { config } from "dotenv";
import postgres from "postgres";
import fs from "fs";

config({ path: ".env" });
config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(connectionString, { max: 1 });

async function run() {
  console.log("Starting safe migration...");

  try {
    const rawSql = fs.readFileSync("drizzle/0008_quiet_hannibal_king.sql", "utf8");
    const statements = rawSql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Get the first store to use as default for existing records
    const fallbackStore = await sql`SELECT id FROM stores LIMIT 1`.catch(() => []);
    const defaultStoreId = fallbackStore[0]?.id || "fallback-store-id";
    console.log(`Using default Store ID for existing rows: ${defaultStoreId}`);
    
    // Get the first employee profile
    const fallbackEmp = await sql`SELECT id FROM employee_profiles LIMIT 1`.catch(() => []);
    const defaultEmpId = fallbackEmp[0]?.id || "fallback-emp-id";

    for (const stmt of statements) {
      // Analyze the statement
      if (stmt.match(/ALTER TABLE ".*" ADD COLUMN ".*" .+ NOT NULL;/i)) {
        // e.g. ALTER TABLE "categories" ADD COLUMN "store_id" text NOT NULL;
        // Transform this to perfectly handle existing rows
        const match = stmt.match(/ALTER TABLE "(.*?)" ADD COLUMN "(.*?)" (.*?) NOT NULL;/i);
        if (match) {
          const table = match[1];
          const column = match[2];
          const type = match[3];

          console.log(`Safely migrating column ${column} to table ${table}...`);
          
          try {
            await sql.unsafe(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${type};`);
            
            const defaultValue = column === "store_id" ? defaultStoreId 
                               : column === "employee_profile_id" ? defaultEmpId 
                               : "'default'";
                               
            await sql.unsafe(`UPDATE "${table}" SET "${column}" = '${defaultValue}' WHERE "${column}" IS NULL;`);
            await sql.unsafe(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET NOT NULL;`);
          } catch (err: any) {
            if (err.message && err.message.includes("already exists")) {
              console.log(`Column ${column} already exists on ${table}, skipping.`);
            } else {
              console.error(`Error safely migrating ${column} on ${table}:`, err.message);
            }
          }
          continue;
        }
      } 
      
      // Execute normally
      try {
        console.log(`Executing: ${stmt.substring(0, 60)}...`);
        await sql.unsafe(stmt);
      } catch (err: any) {
        if (err.message && (err.message.includes("already exists") || err.message.includes("does not exist"))) {
          console.log(`Skipping existing/missing element: ${err.message}`);
        } else {
          console.error(`Error executing: ${stmt}\n`, err.message);
        }
      }
    }

    console.log("Migration complete!");
  } catch (err) {
    console.error("Fatal error:", err);
  } finally {
    await sql.end();
  }
}

run();
