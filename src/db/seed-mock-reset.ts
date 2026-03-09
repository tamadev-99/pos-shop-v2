import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { sql } from "drizzle-orm";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client, { schema });

async function resetMockData() {
  console.log("🗑️  Menghapus semua mock data...\n");

  // Delete in order respecting foreign key constraints (children first)

  // 1. Return-related (must delete before orders)
  console.log("  Menghapus return items...");
  await db.delete(schema.returnItems);
  console.log("  Menghapus returns...");
  await db.delete(schema.returns);

  // 2. Order-related
  console.log("  Menghapus order items...");
  await db.delete(schema.orderItems);
  console.log("  Menghapus held transactions...");
  await db.delete(schema.heldTransactions);
  console.log("  Menghapus orders...");
  await db.delete(schema.orders);

  // 3. Purchase-related
  console.log("  Menghapus purchase order items...");
  await db.delete(schema.purchaseOrderItems);
  console.log("  Menghapus purchase order timelines...");
  await db.delete(schema.purchaseOrderTimeline);
  console.log("  Menghapus purchase orders...");
  await db.delete(schema.purchaseOrders);

  // 4. Stock opname
  console.log("  Menghapus stock opname items...");
  await db.delete(schema.stockOpnameItems);
  console.log("  Menghapus stock opnames...");
  await db.delete(schema.stockOpnames);

  // 5. Finance
  console.log("  Menghapus financial transactions...");
  await db.delete(schema.financialTransactions);
  console.log("  Menghapus daily reconciliations...");
  await db.delete(schema.dailyReconciliations);
  console.log("  Menghapus recurring expenses...");
  await db.delete(schema.recurringExpenses);
  console.log("  Menghapus expense categories...");
  await db.delete(schema.expenseCategories);
  console.log("  Menghapus shifts...");
  await db.delete(schema.shifts);

  // 6. Promotions
  console.log("  Menghapus promotions...");
  await db.delete(schema.promotions);

  // 7. Notifications & audit
  console.log("  Menghapus notifications...");
  await db.delete(schema.notifications);
  console.log("  Menghapus audit logs...");
  await db.delete(schema.auditLogs);

  // 8. Products (variants first, then bundle items, then products)
  console.log("  Menghapus bundle items...");
  await db.delete(schema.bundleItems);
  console.log("  Menghapus product variants...");
  await db.delete(schema.productVariants);
  console.log("  Menghapus products...");
  await db.delete(schema.products);
  console.log("  Menghapus categories...");
  await db.delete(schema.categories);

  // 9. Suppliers
  console.log("  Menghapus supplier categories...");
  await db.delete(schema.supplierCategories);
  console.log("  Menghapus suppliers...");
  await db.delete(schema.suppliers);

  // 10. Customers
  console.log("  Menghapus customers...");
  await db.delete(schema.customers);

  // 11. Store settings
  console.log("  Menghapus store settings...");
  await db.delete(schema.storeSettings);

  // NOTE: Users, sessions, accounts, verifications are NOT deleted
  // to preserve login credentials

  console.log("\n" + "=".repeat(50));
  console.log("✨ Semua mock data berhasil dihapus!");
  console.log("=".repeat(50));
  console.log("\n📝 Catatan: Data user/login TIDAK dihapus.");
  console.log("   Jalankan 'npm run db:seed-mock' untuk mengisi ulang.");

  process.exit(0);
}

resetMockData().catch((err) => {
  console.error("❌ Reset failed:", err);
  process.exit(1);
});
