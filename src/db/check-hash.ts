import "dotenv/config";
import { db } from "./index";
import * as schema from "./schema";

async function checkHash() {
  const accounts = await db.select().from(schema.accounts);
  console.log(JSON.stringify(accounts, null, 2));
  process.exit(0);
}

checkHash();
