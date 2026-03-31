import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env" });
config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(connectionString, { max: 1 });

async function run() {
  console.log("Running manual migration...");
  try {
    // Add reviewed_by_profile_id column
    await sql.unsafe(`ALTER TABLE "stock_opnames" ADD COLUMN IF NOT EXISTS "reviewed_by_profile_id" text;`);
    
    // Add foreign key constraint
    // Note: In Postgres, adding a constraint might fail if it already exists, so we check first or wrap in try-catch
    try {
      await sql.unsafe(`ALTER TABLE "stock_opnames" ADD CONSTRAINT "stock_opnames_reviewed_by_profile_id_employee_profiles_id_fk" FOREIGN KEY ("reviewed_by_profile_id") REFERENCES "employee_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;`);
      console.log("Foreign key constraint added.");
    } catch (err: any) {
      if (err.message.includes("already exists")) {
        console.log("Constraint already exists, skipping.");
      } else {
        throw err;
      }
    }

    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await sql.end();
  }
}

run();
