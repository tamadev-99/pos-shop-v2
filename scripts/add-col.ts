import 'dotenv/config';
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL!);
async function run() {
    await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS description text DEFAULT ''`;
    console.log("Column added");
    process.exit(0);
}
run();
