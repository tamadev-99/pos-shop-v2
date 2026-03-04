import { config } from "dotenv";
config({ path: ".env.local" });

import { getSettings, updateSetting } from "./src/lib/actions/settings";
import { db } from "./src/db";
import { storeSettings } from "./src/db/schema";

async function main() {
    console.log("Current settings:");
    const current = await getSettings();
    console.log(current);

    // Directly check the DB rows without mapping format
    const raw = await db.select().from(storeSettings);
    console.log("Raw from DB:", raw);

    process.exit(0);
}

main().catch(console.error);
