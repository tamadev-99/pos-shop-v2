import { db } from "./index";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Starting database wipe (preserving users and auth tables)...");

    try {
        console.log("Truncating transactional and inventory tables...");

        await db.execute(sql`
      TRUNCATE TABLE 
        "order_items", "orders", "held_transactions",
        "purchase_order_items", "purchase_orders", "purchase_order_timeline",
        "return_items", "returns",
        "financial_transactions", "shifts", "expense_categories", "recurring_expenses", "daily_reconciliations",
        "product_variants", "products", "categories",
        "customers", "suppliers", "supplier_categories", "promotions", "notifications", "audit_logs", "store_settings"
      CASCADE;
    `);

        console.log("✅ Database wiped successfully! (Users and roles preserved)");
        process.exit(0);
    } catch (error) {
        console.error("❌ Failed to wipe database:", error);
        process.exit(1);
    }
}

main();
