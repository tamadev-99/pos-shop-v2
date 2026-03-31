import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { hashPassword as betterHashPassword } from "better-auth/crypto";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client, { schema });

// Hashing helpers for PIN (Bcrypt)
const hashPin = async (pin: string) => {
  return await bcrypt.hash(pin, 10);
};

function uuid() {
  return crypto.randomUUID();
}

// Date helpers
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function dateStr(daysBack: number): string {
  return daysAgo(daysBack).toISOString().split("T")[0];
}

function timestamp(daysBack: number): Date {
  return daysAgo(daysBack);
}

// Order ID: ORD-YYMMDD-XXXX
function orderId(daysBack: number, seq: number): string {
  const d = daysAgo(daysBack);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `ORD-${yy}${mm}${dd}-${String(seq).padStart(4, "0")}`;
}

async function seedMock() {
  console.log("🌱 Seeding comprehensive mock data for ALL features...\n");

  // --- Stage 0: Auth & Org Context ---
  console.log("📦 Stage 0: Creating Auth & Store Context...");
  
  // Create Users & Accounts
  const password = "password123";
  const hashedPassword = await betterHashPassword(password);

  const [ownerUser] = await db.insert(schema.users).values({
    id: "user-owner-001",
    name: "Tama (Owner)",
    email: "owner@noru.com",
    role: "owner",
    emailVerified: true,
  }).onConflictDoUpdate({
    target: schema.users.id,
    set: { name: "Tama (Owner)", email: "owner@noru.com" }
  }).returning();

  await db.insert(schema.accounts).values({
    id: uuid(),
    userId: ownerUser.id,
    accountId: ownerUser.email,
    providerId: "credential",
    password: hashedPassword,
  }).onConflictDoNothing();

  const [adminUser] = await db.insert(schema.users).values({
    id: "user-admin-001",
    name: "Noru Super Admin",
    email: "admin@noru.com",
    role: "saas-admin",
    emailVerified: true,
  }).onConflictDoUpdate({
    target: schema.users.id,
    set: { name: "Noru Super Admin", email: "admin@noru.com", role: "saas-admin" }
  }).returning();

  await db.insert(schema.accounts).values({
    id: uuid(),
    userId: adminUser.id,
    accountId: adminUser.email,
    providerId: "credential",
    password: hashedPassword,
  }).onConflictDoNothing();

  // Create Tenant
  const [tenant] = await db.insert(schema.tenants).values({
    id: "tenant-mock-001",
    name: "Noru POS Enterprise",
    ownerId: ownerUser.id,
    subscriptionStatus: "trial",
    trialEndsAt: daysAgo(-14), // Ends in 14 days
  }).onConflictDoUpdate({
    target: schema.tenants.id,
    set: { name: "Noru POS Enterprise", trialEndsAt: daysAgo(-14) }
  }).returning();

  // Create Store
  const [store] = await db.insert(schema.stores).values({
    id: "store-mock-001",
    name: "Noru Boutique Bandung",
    type: "clothing",
    address: "Jl. Riau No. 123, Bandung",
    tenantId: tenant.id,
  }).onConflictDoUpdate({
    target: schema.stores.id,
    set: { name: "Noru Boutique Bandung", address: "Jl. Riau No. 123, Bandung" }
  }).returning();

  const storeId = store.id;

  // Create Employee Profiles
  const [ownerProfile] = await db.insert(schema.employeeProfiles).values({
    id: "prof-owner-001",
    name: "Tama",
    storeId,
    role: "owner",
    pinHash: await hashPin("123456"), 
  }).onConflictDoNothing().returning();

  const [managerProfile] = await db.insert(schema.employeeProfiles).values({
    id: "prof-manager-001",
    name: "Andi",
    storeId,
    role: "manager",
    pinHash: await hashPin("111111"),
  }).onConflictDoNothing().returning();

  const [cashierProfile] = await db.insert(schema.employeeProfiles).values({
    id: "prof-cashier-001",
    name: "Sarah",
    storeId,
    role: "cashier",
    pinHash: await hashPin("000000"),
  }).onConflictDoNothing().returning();

  const ownerProfileId = "prof-owner-001";
  const managerProfileId = "prof-manager-001";
  const cashierProfileId = "prof-cashier-001";

  console.log("  ✅ Auth & Store Context Ready");

  // --- Step 1: Inventory ---
  console.log("\n📦 Step 1: Seeding Inventory (Categories, Products, Variants)...");

  const categories = [
    { id: "cat-men", name: "Pakaian Pria", slug: "pakaian-pria", storeId },
    { id: "cat-women", name: "Pakaian Wanita", slug: "pakaian-wanita", storeId },
    { id: "cat-acc", name: "Aksesoris", slug: "aksesoris", storeId },
    { id: "cat-shoes", name: "Sepatu", slug: "sepatu", storeId },
  ];
  await db.insert(schema.categories).values(categories).onConflictDoNothing();

  const products = [
    { id: "prod-001", name: "Kemeja Flanel Basic", brand: "Noru Basic", categoryId: "cat-men", basePrice: 199000, baseCost: 100000, storeId },
    { id: "prod-002", name: "Dress Satin Premium", brand: "Noru Luxe", categoryId: "cat-women", basePrice: 450000, baseCost: 250000, storeId },
    { id: "prod-003", name: "Sepatu Sneakers Urban", brand: "Noru Step", categoryId: "cat-shoes", basePrice: 799000, baseCost: 400000, storeId },
    { id: "prod-004", name: "Topi Baseball Noru", brand: "Noru Acc", categoryId: "cat-acc", basePrice: 125000, baseCost: 50000, storeId },
  ];
  await db.insert(schema.products).values(products).onConflictDoNothing();

  const variants = [
    { id: "var-001", productId: "prod-001", sku: "KFB-RED-M", barcode: "899001001", color: "Merah", size: "M", stock: 25, minStock: 5, buyPrice: 100000, sellPrice: 199000, storeId },
    { id: "var-002", productId: "prod-001", sku: "KFB-RED-L", barcode: "899001002", color: "Merah", size: "L", stock: 30, minStock: 5, buyPrice: 100000, sellPrice: 199000, storeId },
    { id: "var-003", productId: "prod-002", sku: "DSP-BLU-S", barcode: "899002001", color: "Biru", size: "S", stock: 10, minStock: 2, buyPrice: 250000, sellPrice: 450000, storeId },
    { id: "var-004", productId: "prod-003", sku: "SSU-WHT-42", barcode: "899003001", color: "Putih", size: "42", stock: 8, minStock: 3, buyPrice: 400000, sellPrice: 799000, storeId },
  ];
  await db.insert(schema.productVariants).values(variants).onConflictDoNothing();

  console.log("  ✅ Inventory Ready");

  // --- Step 2: Partners ---
  console.log("\n📦 Step 2: Seeding Partners (Suppliers, Customers)...");

  const [supplier] = await db.insert(schema.suppliers).values({
    id: "sup-001",
    name: "Supplier Textileindo",
    contactPerson: "Budi",
    phone: "08123456789",
    email: "budi@textileindo.com",
    address: "Kawasan Industri Jababeka",
    joinDate: dateStr(365),
    storeId,
  }).onConflictDoNothing().returning();

  const supplierId = "sup-001";

  await db.insert(schema.supplierCategories).values({
    supplierId: supplierId,
    categoryId: "cat-men",
  }).onConflictDoNothing();

  const customers = [
    { id: "cust-001", name: "Aisyah", phone: "08987654321", tier: "Gold" as const, points: 1500, totalSpent: 2500000, joinDate: dateStr(180), storeId },
    { id: "cust-002", name: "Rizky", phone: "087711223344", tier: "Silver" as const, points: 500, totalSpent: 800000, joinDate: dateStr(90), storeId },
  ];
  await db.insert(schema.customers).values(customers).onConflictDoNothing();

  console.log("  ✅ Partners Ready");

  // --- Step 3: Configuration ---
  console.log("\n📦 Step 3: Seeding Config (Settings, Expense Cats)...");

  const settings = [
    { storeId, key: "taxRate", value: { rate: 11 } },
    { storeId, key: "receiptHeader", value: { text: "Noru Boutique Bandung" } },
  ];
  for (const s of settings) {
    await db.insert(schema.storeSettings).values({
      storeId: s.storeId,
      key: s.key,
      value: s.value as any,
    }).onConflictDoNothing();
  }

  const expenseCats = [
    { id: "excat-001", name: "Sewa Gedung", type: "keluar" as const, isDefault: true, storeId },
    { id: "excat-002", name: "Gaji Karyawan", type: "keluar" as const, isDefault: true, storeId },
    { id: "excat-003", name: "Listrik & Air", type: "keluar" as const, isDefault: true, storeId },
  ];
  await db.insert(schema.expenseCategories).values(expenseCats).onConflictDoNothing();

  console.log("  ✅ Config Ready");

  // --- Step 4: Operations (Shifts, Orders) ---
  console.log("\n📦 Step 4: Seeding Operations (Shifts, Orders)...");

  // Shifts for last 7 days
  for (let i = 7; i >= 1; i--) {
    const sid = `shift-202603-${31-i}`;
    await db.insert(schema.shifts).values({
      id: sid,
      employeeProfileId: cashierProfileId,
      openedAt: timestamp(i + 0.1),
      closedAt: timestamp(i),
      openingBalance: 500000,
      actualClosing: 2500000,
      totalSales: 2000000,
      status: "closed",
      storeId,
    }).onConflictDoNothing();

    // 2 orders per shift
    for (let j = 1; j <= 2; j++) {
      const oid = orderId(i, j);
      const isCash = j % 2 === 0;
      await db.insert(schema.orders).values({
        id: oid,
        customerId: j === 1 ? "cust-001" : null,
        customerName: j === 1 ? "Aisyah" : "Walk-in Customer",
        date: timestamp(i + 0.05),
        subtotal: 199000,
        taxAmount: 21890,
        total: 220890,
        cashPaid: isCash ? 250000 : 220890,
        changeAmount: isCash ? 29110 : 0,
        status: "selesai",
        paymentMethod: isCash ? "tunai" : "qris",
        employeeProfileId: cashierProfileId,
        storeId,
        shiftId: sid,
      }).onConflictDoNothing();

      await db.insert(schema.orderItems).values({
        id: uuid(),
        orderId: oid,
        variantId: "var-001",
        productName: "Kemeja Flanel Basic",
        variantInfo: "Merah, M",
        qty: 1,
        unitPrice: 199000,
        costPrice: 100000,
        subtotal: 199000,
        storeId,
      }).onConflictDoNothing();
    }
  }

  // Active shift for today
  await db.insert(schema.shifts).values({
    id: "shift-today",
    employeeProfileId: cashierProfileId,
    openedAt: timestamp(0.1),
    openingBalance: 500000,
    status: "active",
    storeId,
  }).onConflictDoNothing();

  console.log("  ✅ Operations Ready");

  // --- Step 5: Finance & Procurement ---
  console.log("\n📦 Step 5: Seeding Finance, Procurement, Audit...");

  // Financial Transactions
  await db.insert(schema.financialTransactions).values([
    { id: uuid(), date: dateStr(1), type: "keluar" as const, category: "Sewa Gedung", description: "Sewa Maret", amount: 5000000, storeId, employeeProfileId: ownerProfileId },
    { id: uuid(), date: dateStr(0), type: "keluar" as const, category: "Gaji Karyawan", description: "Gaji Sarah", amount: 3000000, storeId, employeeProfileId: managerProfileId },
  ]).onConflictDoNothing();

  // Purchase Order
  const poId = "PO-202603-01";
  await db.insert(schema.purchaseOrders).values({
    id: poId,
    storeId,
    supplierId: supplierId,
    date: dateStr(5),
    status: "diterima",
    total: 2500000,
    paymentStatus: "lunas",
    employeeProfileId: managerProfileId,
  }).onConflictDoNothing();

  await db.insert(schema.purchaseOrderItems).values({
    id: uuid(),
    storeId,
    purchaseOrderId: poId,
    variantId: "var-001",
    productName: "Kemeja Flanel Basic",
    variantInfo: "Merah, M",
    qty: 25,
    unitCost: 100000,
    subtotal: 2500000,
  }).onConflictDoNothing();

  // Return
  await db.insert(schema.returns).values({
    id: "RTN-202603-01",
    storeId,
    orderId: orderId(1, 1),
    date: dateStr(0),
    reason: "Ukuran tidak pas",
    status: "selesai",
    refundAmount: 220890,
    employeeProfileId: managerProfileId,
  }).onConflictDoNothing();

  // Promotion
  await db.insert(schema.promotions).values({
    id: "promo-ramadan",
    name: "Promo Ramadan",
    type: "percentage",
    value: 10,
    startDate: dateStr(30),
    endDate: dateStr(-30),
    isActive: true,
    storeId,
  }).onConflictDoNothing();

  // Notifications
  await db.insert(schema.notifications).values([
    { id: uuid(), storeId, type: "stok_rendah", title: "Stok Menipis!", message: " Sneakers Urban tinggal 8 unit.", priority: "high", createdAt: timestamp(0) },
  ]).onConflictDoNothing();

  // Audit Logs
  await db.insert(schema.auditLogs).values([
    { id: uuid(), storeId, userName: "Andi", employeeProfileId: managerProfileId, action: "stok", detail: "Update stok var-001 +25", createdAt: timestamp(5) },
  ]).onConflictDoNothing();

  // Stock Opname
  const soId = "SO-202603-01";
  await db.insert(schema.stockOpnames).values({
    id: soId,
    storeId,
    code: "SO-MARCH",
    status: "completed",
    createdByName: "Andi",
    employeeProfileId: managerProfileId,
    completedAt: timestamp(2),
  }).onConflictDoNothing();

  await db.insert(schema.stockOpnameItems).values({
    id: uuid(),
    storeId,
    opnameId: soId,
    variantId: "var-004",
    systemStock: 10,
    actualStock: 8,
    difference: -2,
    note: "Barang cacat",
  }).onConflictDoNothing();

  // Recurring & Reconcile
  await db.insert(schema.recurringExpenses).values({
    id: uuid(),
    description: "Internet Bulanan",
    category: "Operasional",
    amount: 350000,
    frequency: "bulanan",
    nextDueDate: dateStr(-1),
    storeId,
  }).onConflictDoNothing();

  await db.insert(schema.dailyReconciliations).values({
    id: uuid(),
    date: dateStr(1),
    calculatedIncome: 4000000,
    calculatedExpense: 5000000,
    actualCashInHand: 4000000,
    difference: 0,
    status: "completed",
    employeeProfileId: managerProfileId,
    storeId,
  }).onConflictDoNothing();

  console.log("  ✅ Finance & Advanced Features Ready");

  console.log("\n" + "=".repeat(50));
  console.log("✨ All features mock data seeding complete!");
  console.log("=".repeat(50));

  process.exit(0);
}

seedMock().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
