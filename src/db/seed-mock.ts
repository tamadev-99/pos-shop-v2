import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import crypto from "crypto";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client, { schema });

function uuid() {
  return crypto.randomUUID();
}

function hashPassword(password: string): string {
  // better-auth uses scrypt-like hashing, but for seeding we'll use a simple hash
  // This won't work for login - users should be created via the API
  // We'll skip password-based user creation and rely on existing users
  return password;
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

function poId(daysBack: number, seq: number): string {
  const d = daysAgo(daysBack);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `PO-${yy}${mm}${dd}-${String(seq).padStart(2, "0")}`;
}

function rtnId(daysBack: number, seq: number): string {
  const d = daysAgo(daysBack);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `RTN-${yy}${mm}${dd}-${String(seq).padStart(2, "0")}`;
}

function soCode(daysBack: number, seq: number): string {
  const d = daysAgo(daysBack);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `SO-${yy}${mm}${dd}-${String(seq).padStart(4, "0")}`;
}

async function seedMock() {
  console.log("🌱 Seeding comprehensive mock data...\n");

  // First run the base seed
  console.log("📦 Step 1: Seeding base data (categories, products, suppliers, customers, settings)...");

  // --- Categories ---
  const categoryData = [
    { id: "cat-pria", name: "Pakaian Pria", slug: "pakaian-pria" },
    { id: "cat-wanita", name: "Pakaian Wanita", slug: "pakaian-wanita" },
    { id: "cat-hijab", name: "Hijab", slug: "hijab" },
    { id: "cat-sepatu", name: "Sepatu", slug: "sepatu" },
    { id: "cat-tas", name: "Tas", slug: "tas" },
    { id: "cat-aksesoris", name: "Aksesoris", slug: "aksesoris" },
  ];
  await db.insert(schema.categories).values(categoryData).onConflictDoNothing();
  console.log("  ✅ Categories");

  // --- Products & Variants ---
  const categoryMap: Record<string, string> = {
    "Pakaian Pria": "cat-pria",
    "Pakaian Wanita": "cat-wanita",
    Hijab: "cat-hijab",
    Sepatu: "cat-sepatu",
    Tas: "cat-tas",
    Aksesoris: "cat-aksesoris",
  };

  const productsData = [
    { id: "P001", name: "Kaos Polos Basic", brand: "BasicWear", category: "Pakaian Pria", basePrice: 89000, baseCost: 45000, variants: [
      { id: "V001", sku: "KPB-HIT-S", barcode: "8901001001001", color: "Hitam", size: "S", stock: 25, minStock: 5, buyPrice: 45000, sellPrice: 89000 },
      { id: "V002", sku: "KPB-HIT-M", barcode: "8901001001002", color: "Hitam", size: "M", stock: 30, minStock: 5, buyPrice: 45000, sellPrice: 89000 },
      { id: "V003", sku: "KPB-HIT-L", barcode: "8901001001003", color: "Hitam", size: "L", stock: 20, minStock: 5, buyPrice: 45000, sellPrice: 89000 },
      { id: "V004", sku: "KPB-HIT-XL", barcode: "8901001001004", color: "Hitam", size: "XL", stock: 15, minStock: 5, buyPrice: 45000, sellPrice: 89000 },
      { id: "V005", sku: "KPB-PUT-S", barcode: "8901001002001", color: "Putih", size: "S", stock: 20, minStock: 5, buyPrice: 45000, sellPrice: 89000 },
      { id: "V006", sku: "KPB-PUT-M", barcode: "8901001002002", color: "Putih", size: "M", stock: 28, minStock: 5, buyPrice: 45000, sellPrice: 89000 },
      { id: "V007", sku: "KPB-PUT-L", barcode: "8901001002003", color: "Putih", size: "L", stock: 18, minStock: 5, buyPrice: 45000, sellPrice: 89000 },
      { id: "V008", sku: "KPB-PUT-XL", barcode: "8901001002004", color: "Putih", size: "XL", stock: 12, minStock: 5, buyPrice: 45000, sellPrice: 89000 },
      { id: "V009", sku: "KPB-NVY-M", barcode: "8901001003002", color: "Navy", size: "M", stock: 22, minStock: 5, buyPrice: 45000, sellPrice: 89000 },
      { id: "V010", sku: "KPB-NVY-L", barcode: "8901001003003", color: "Navy", size: "L", stock: 16, minStock: 5, buyPrice: 45000, sellPrice: 89000 },
    ]},
    { id: "P002", name: "Kemeja Flannel", brand: "UrbanEdge", category: "Pakaian Pria", basePrice: 189000, baseCost: 95000, variants: [
      { id: "V011", sku: "KFL-MRH-M", barcode: "8901002001002", color: "Merah", size: "M", stock: 15, minStock: 5, buyPrice: 95000, sellPrice: 189000 },
      { id: "V012", sku: "KFL-MRH-L", barcode: "8901002001003", color: "Merah", size: "L", stock: 12, minStock: 5, buyPrice: 95000, sellPrice: 189000 },
      { id: "V013", sku: "KFL-MRH-XL", barcode: "8901002001004", color: "Merah", size: "XL", stock: 8, minStock: 5, buyPrice: 95000, sellPrice: 189000 },
      { id: "V014", sku: "KFL-HJU-M", barcode: "8901002002002", color: "Hijau", size: "M", stock: 10, minStock: 5, buyPrice: 95000, sellPrice: 189000 },
      { id: "V015", sku: "KFL-HJU-L", barcode: "8901002002003", color: "Hijau", size: "L", stock: 14, minStock: 5, buyPrice: 95000, sellPrice: 189000 },
    ]},
    { id: "P003", name: "Hijab Pashmina Premium", brand: "HijabKu", category: "Hijab", basePrice: 75000, baseCost: 35000, variants: [
      { id: "V016", sku: "HPP-HIT", barcode: "8901003001001", color: "Hitam", size: "All Size", stock: 40, minStock: 10, buyPrice: 35000, sellPrice: 75000 },
      { id: "V017", sku: "HPP-CRM", barcode: "8901003002001", color: "Cream", size: "All Size", stock: 35, minStock: 10, buyPrice: 35000, sellPrice: 75000 },
      { id: "V018", sku: "HPP-MRN", barcode: "8901003003001", color: "Maroon", size: "All Size", stock: 28, minStock: 10, buyPrice: 35000, sellPrice: 75000 },
      { id: "V019", sku: "HPP-AGM", barcode: "8901003004001", color: "Army Green", size: "All Size", stock: 22, minStock: 10, buyPrice: 35000, sellPrice: 75000 },
      { id: "V020", sku: "HPP-DSP", barcode: "8901003005001", color: "Dusty Pink", size: "All Size", stock: 30, minStock: 10, buyPrice: 35000, sellPrice: 75000 },
      { id: "V021", sku: "HPP-NVY", barcode: "8901003006001", color: "Navy", size: "All Size", stock: 25, minStock: 10, buyPrice: 35000, sellPrice: 75000 },
    ]},
    { id: "P004", name: "Hijab Segi Empat", brand: "HijabKu", category: "Hijab", basePrice: 55000, baseCost: 25000, variants: [
      { id: "V022", sku: "HSE-HIT", barcode: "8901004001001", color: "Hitam", size: "All Size", stock: 50, minStock: 10, buyPrice: 25000, sellPrice: 55000 },
      { id: "V023", sku: "HSE-PUT", barcode: "8901004002001", color: "Putih", size: "All Size", stock: 45, minStock: 10, buyPrice: 25000, sellPrice: 55000 },
      { id: "V024", sku: "HSE-MCA", barcode: "8901004003001", color: "Mocca", size: "All Size", stock: 38, minStock: 10, buyPrice: 25000, sellPrice: 55000 },
      { id: "V025", sku: "HSE-SGE", barcode: "8901004004001", color: "Sage", size: "All Size", stock: 32, minStock: 10, buyPrice: 25000, sellPrice: 55000 },
    ]},
    { id: "P005", name: "Sneakers Urban", brand: "StepUp", category: "Sepatu", basePrice: 349000, baseCost: 175000, variants: [
      { id: "V026", sku: "SNU-HIT-39", barcode: "8901005001039", color: "Hitam", size: "39", stock: 8, minStock: 3, buyPrice: 175000, sellPrice: 349000 },
      { id: "V027", sku: "SNU-HIT-40", barcode: "8901005001040", color: "Hitam", size: "40", stock: 10, minStock: 3, buyPrice: 175000, sellPrice: 349000 },
      { id: "V028", sku: "SNU-HIT-41", barcode: "8901005001041", color: "Hitam", size: "41", stock: 12, minStock: 3, buyPrice: 175000, sellPrice: 349000 },
      { id: "V029", sku: "SNU-HIT-42", barcode: "8901005001042", color: "Hitam", size: "42", stock: 10, minStock: 3, buyPrice: 175000, sellPrice: 349000 },
      { id: "V030", sku: "SNU-HIT-43", barcode: "8901005001043", color: "Hitam", size: "43", stock: 7, minStock: 3, buyPrice: 175000, sellPrice: 349000 },
      { id: "V031", sku: "SNU-PUT-40", barcode: "8901005002040", color: "Putih", size: "40", stock: 8, minStock: 3, buyPrice: 175000, sellPrice: 349000 },
      { id: "V032", sku: "SNU-PUT-41", barcode: "8901005002041", color: "Putih", size: "41", stock: 6, minStock: 3, buyPrice: 175000, sellPrice: 349000 },
      { id: "V033", sku: "SNU-PUT-42", barcode: "8901005002042", color: "Putih", size: "42", stock: 9, minStock: 3, buyPrice: 175000, sellPrice: 349000 },
    ]},
    { id: "P006", name: "Sepatu Formal", brand: "GentleStep", category: "Sepatu", basePrice: 450000, baseCost: 220000, variants: [
      { id: "V034", sku: "SFR-HIT-39", barcode: "8901006001039", color: "Hitam", size: "39", stock: 5, minStock: 3, buyPrice: 220000, sellPrice: 450000 },
      { id: "V035", sku: "SFR-HIT-40", barcode: "8901006001040", color: "Hitam", size: "40", stock: 7, minStock: 3, buyPrice: 220000, sellPrice: 450000 },
      { id: "V036", sku: "SFR-HIT-41", barcode: "8901006001041", color: "Hitam", size: "41", stock: 9, minStock: 3, buyPrice: 220000, sellPrice: 450000 },
      { id: "V037", sku: "SFR-HIT-42", barcode: "8901006001042", color: "Hitam", size: "42", stock: 6, minStock: 3, buyPrice: 220000, sellPrice: 450000 },
      { id: "V038", sku: "SFR-COK-40", barcode: "8901006002040", color: "Coklat", size: "40", stock: 4, minStock: 3, buyPrice: 220000, sellPrice: 450000 },
      { id: "V039", sku: "SFR-COK-41", barcode: "8901006002041", color: "Coklat", size: "41", stock: 6, minStock: 3, buyPrice: 220000, sellPrice: 450000 },
      { id: "V040", sku: "SFR-COK-42", barcode: "8901006002042", color: "Coklat", size: "42", stock: 3, minStock: 3, buyPrice: 220000, sellPrice: 450000 },
    ]},
    { id: "P007", name: "Tas Tote Canvas", brand: "CarryOn", category: "Tas", basePrice: 125000, baseCost: 55000, variants: [
      { id: "V041", sku: "TTC-HIT", barcode: "8901007001001", color: "Hitam", size: "All Size", stock: 20, minStock: 5, buyPrice: 55000, sellPrice: 125000 },
      { id: "V042", sku: "TTC-CRM", barcode: "8901007002001", color: "Cream", size: "All Size", stock: 18, minStock: 5, buyPrice: 55000, sellPrice: 125000 },
      { id: "V043", sku: "TTC-NVY", barcode: "8901007003001", color: "Navy", size: "All Size", stock: 15, minStock: 5, buyPrice: 55000, sellPrice: 125000 },
    ]},
    { id: "P008", name: "Gelang Mutiara", brand: "GlowAccessories", category: "Aksesoris", basePrice: 45000, baseCost: 15000, variants: [
      { id: "V044", sku: "GMP-PUT", barcode: "8901008001001", color: "Putih", size: "All Size", stock: 30, minStock: 10, buyPrice: 15000, sellPrice: 45000 },
      { id: "V045", sku: "GMP-GLD", barcode: "8901008002001", color: "Gold", size: "All Size", stock: 25, minStock: 10, buyPrice: 15000, sellPrice: 45000 },
      { id: "V046", sku: "GMP-RSG", barcode: "8901008003001", color: "Rose Gold", size: "All Size", stock: 20, minStock: 10, buyPrice: 15000, sellPrice: 45000 },
    ]},
    { id: "P009", name: "Gamis Syari Premium", brand: "ModestWear", category: "Pakaian Wanita", basePrice: 275000, baseCost: 135000, variants: [
      { id: "V047", sku: "GSP-HIT-M", barcode: "8901009001002", color: "Hitam", size: "M", stock: 12, minStock: 5, buyPrice: 135000, sellPrice: 275000 },
      { id: "V048", sku: "GSP-HIT-L", barcode: "8901009001003", color: "Hitam", size: "L", stock: 15, minStock: 5, buyPrice: 135000, sellPrice: 275000 },
      { id: "V049", sku: "GSP-HIT-XL", barcode: "8901009001004", color: "Hitam", size: "XL", stock: 10, minStock: 5, buyPrice: 135000, sellPrice: 275000 },
      { id: "V050", sku: "GSP-MRN-M", barcode: "8901009002002", color: "Maroon", size: "M", stock: 8, minStock: 5, buyPrice: 135000, sellPrice: 275000 },
      { id: "V051", sku: "GSP-MRN-L", barcode: "8901009002003", color: "Maroon", size: "L", stock: 11, minStock: 5, buyPrice: 135000, sellPrice: 275000 },
      { id: "V052", sku: "GSP-NVY-L", barcode: "8901009003003", color: "Navy", size: "L", stock: 9, minStock: 5, buyPrice: 135000, sellPrice: 275000 },
    ]},
    { id: "P010", name: "Celana Chino Slim", brand: "UrbanEdge", category: "Pakaian Pria", basePrice: 199000, baseCost: 98000, variants: [
      { id: "V053", sku: "CCS-HIT-30", barcode: "8901010001030", color: "Hitam", size: "30", stock: 10, minStock: 5, buyPrice: 98000, sellPrice: 199000 },
      { id: "V054", sku: "CCS-HIT-32", barcode: "8901010001032", color: "Hitam", size: "32", stock: 14, minStock: 5, buyPrice: 98000, sellPrice: 199000 },
      { id: "V055", sku: "CCS-HIT-34", barcode: "8901010001034", color: "Hitam", size: "34", stock: 8, minStock: 5, buyPrice: 98000, sellPrice: 199000 },
      { id: "V056", sku: "CCS-KHK-30", barcode: "8901010002030", color: "Khaki", size: "30", stock: 7, minStock: 5, buyPrice: 98000, sellPrice: 199000 },
      { id: "V057", sku: "CCS-KHK-32", barcode: "8901010002032", color: "Khaki", size: "32", stock: 11, minStock: 5, buyPrice: 98000, sellPrice: 199000 },
    ]},
    { id: "P011", name: "Tas Ransel Laptop", brand: "CarryOn", category: "Tas", basePrice: 285000, baseCost: 140000, variants: [
      { id: "V058", sku: "TRL-HIT", barcode: "8901011001001", color: "Hitam", size: "All Size", stock: 15, minStock: 5, buyPrice: 140000, sellPrice: 285000 },
      { id: "V059", sku: "TRL-ABU", barcode: "8901011002001", color: "Abu-Abu", size: "All Size", stock: 12, minStock: 5, buyPrice: 140000, sellPrice: 285000 },
    ]},
    { id: "P012", name: "Kalung Choker", brand: "GlowAccessories", category: "Aksesoris", basePrice: 35000, baseCost: 12000, variants: [
      { id: "V060", sku: "KCH-GLD", barcode: "8901012001001", color: "Gold", size: "All Size", stock: 35, minStock: 10, buyPrice: 12000, sellPrice: 35000 },
      { id: "V061", sku: "KCH-SLV", barcode: "8901012002001", color: "Silver", size: "All Size", stock: 28, minStock: 10, buyPrice: 12000, sellPrice: 35000 },
    ]},
  ];

  for (const p of productsData) {
    await db.insert(schema.products).values({
      id: p.id, name: p.name, brand: p.brand,
      categoryId: categoryMap[p.category], description: "",
      basePrice: p.basePrice, baseCost: p.baseCost,
    }).onConflictDoNothing();
    for (const v of p.variants) {
      await db.insert(schema.productVariants).values({
        id: v.id, productId: p.id, sku: v.sku, barcode: v.barcode,
        color: v.color, size: v.size, stock: v.stock, minStock: v.minStock,
        buyPrice: v.buyPrice, sellPrice: v.sellPrice,
      }).onConflictDoNothing();
    }
  }
  console.log("  ✅ Products & variants");

  // --- Suppliers ---
  const suppliersData = [
    { id: "SUP001", name: "CV Textile Jaya", contactPerson: "Hendra Wijaya", phone: "081234567890", email: "hendra@textilejaya.co.id", address: "Jl. Industri No. 45, Bandung", cats: ["cat-pria", "cat-wanita"], joinDate: "2024-06-15", totalOrders: 8, totalSpent: 12500000 },
    { id: "SUP002", name: "PT Hijab Collection", contactPerson: "Sari Indah", phone: "082345678901", email: "sari@hijabcollection.id", address: "Jl. Fashion Raya No. 12, Jakarta Selatan", cats: ["cat-hijab", "cat-wanita"], joinDate: "2024-08-20", totalOrders: 5, totalSpent: 7800000 },
    { id: "SUP003", name: "UD Sepatu Nusantara", contactPerson: "Bambang Suryadi", phone: "083456789012", email: "bambang@sepatunusantara.com", address: "Jl. Cibaduyut No. 78, Bandung", cats: ["cat-sepatu"], joinDate: "2024-09-10", totalOrders: 4, totalSpent: 15200000 },
    { id: "SUP004", name: "PT Aksesoris Indo", contactPerson: "Linda Hartono", phone: "084567890123", email: "linda@aksesorisindo.id", address: "Jl. Tanah Abang No. 33, Jakarta Pusat", cats: ["cat-aksesoris", "cat-tas"], joinDate: "2025-01-05", totalOrders: 3, totalSpent: 4500000 },
    { id: "SUP005", name: "CV Tas Kreatif", contactPerson: "Rina Susanto", phone: "085678901234", email: "rina@taskriya.com", address: "Jl. Industri Kecil No. 56, Surabaya", cats: ["cat-tas"], joinDate: "2025-03-18", totalOrders: 2, totalSpent: 3200000 },
  ];

  for (const s of suppliersData) {
    await db.insert(schema.suppliers).values({
      id: s.id, name: s.name, contactPerson: s.contactPerson,
      phone: s.phone, email: s.email, address: s.address,
      joinDate: s.joinDate, totalOrders: s.totalOrders, totalSpent: s.totalSpent,
    }).onConflictDoNothing();
    for (const catId of s.cats) {
      await db.insert(schema.supplierCategories).values({
        supplierId: s.id, categoryId: catId,
      }).onConflictDoNothing();
    }
  }
  console.log("  ✅ Suppliers");

  // --- Customers ---
  const customersData = [
    { id: "C-001", name: "Aisyah Putri", phone: "081234567891", email: "aisyah@email.com", address: "Jl. Sudirman No. 10, Jakarta", birthDate: "1995-03-15", totalSpent: 4850000, points: 4850, tier: "Gold" as const, joinDate: "2025-01-10", lastPurchase: "2026-03-08" },
    { id: "C-002", name: "Budi Santoso", phone: "082345678902", email: "budi.s@email.com", address: "Jl. Gatot Subroto No. 25, Bandung", birthDate: "1990-07-22", totalSpent: 3200000, points: 3200, tier: "Silver" as const, joinDate: "2025-03-05", lastPurchase: "2026-03-07" },
    { id: "C-003", name: "Dewi Lestari", phone: "083456789013", email: "dewi.l@email.com", address: "Jl. Asia Afrika No. 5, Bandung", birthDate: "1988-11-08", totalSpent: 8750000, points: 8750, tier: "Platinum" as const, joinDate: "2024-09-15", lastPurchase: "2026-03-06" },
    { id: "C-004", name: "Rini Wulandari", phone: "084567890124", email: "rini.w@email.com", address: "Jl. Braga No. 18, Bandung", birthDate: "1992-05-30", totalSpent: 2100000, points: 2100, tier: "Silver" as const, joinDate: "2025-06-20", lastPurchase: "2026-03-05" },
    { id: "C-005", name: "Ahmad Fauzi", phone: "085678901235", email: "ahmad.f@email.com", address: "Jl. Dago No. 42, Bandung", birthDate: "1993-12-01", totalSpent: 1450000, points: 1450, tier: "Bronze" as const, joinDate: "2025-09-12", lastPurchase: "2026-03-04" },
    { id: "C-006", name: "Siti Rahayu", phone: "086789012346", email: "siti.r@email.com", address: "Jl. Merdeka No. 7, Jakarta", birthDate: "1997-08-19", totalSpent: 5600000, points: 5600, tier: "Gold" as const, joinDate: "2025-02-14", lastPurchase: "2026-03-03" },
    { id: "C-007", name: "Rizky Hidayat", phone: "087890123457", email: "rizky.h@email.com", address: "Jl. Setiabudi No. 33, Bandung", birthDate: "1991-04-25", totalSpent: 980000, points: 980, tier: "Bronze" as const, joinDate: "2025-11-08", lastPurchase: "2026-03-02" },
    { id: "C-008", name: "Nurul Aini", phone: "088901234568", email: "nurul.a@email.com", address: "Jl. Cihampelas No. 60, Bandung", birthDate: "1996-01-14", totalSpent: 3800000, points: 3800, tier: "Silver" as const, joinDate: "2025-04-30", lastPurchase: "2026-03-01" },
  ];
  for (const c of customersData) {
    await db.insert(schema.customers).values(c).onConflictDoNothing();
  }
  console.log("  ✅ Customers");

  // --- Store Settings ---
  const defaultSettings = [
    { key: "storeName", value: "KasirPro Fashion Store" },
    { key: "storeAddress", value: "Jl. Fashion No. 1, Bandung" },
    { key: "storePhone", value: "022-12345678" },
    { key: "storeEmail", value: "" },
    { key: "taxName", value: "PPN" },
    { key: "taxRate", value: "11" },
    { key: "taxIncluded", value: "no" },
    { key: "receiptHeader", value: "KasirPro Fashion Store" },
    { key: "receiptAddress", value: "Jl. Fashion No. 1, Bandung" },
    { key: "receiptFooter", value: "Terima kasih atas kunjungan Anda!" },
    { key: "receiptWidth", value: "58" },
    { key: "receiptLogo", value: "no" },
    { key: "printerType", value: "usb" },
    { key: "printerTarget", value: "POS-58 Thermal Printer" },
    { key: "currency", value: "IDR" },
    { key: "loyaltyPointsRate", value: 1000 },
    { key: "memberTiers", value: JSON.stringify([
      { name: "Bronze", minPoints: 0, discount: 0, benefit: "Member dasar" },
      { name: "Silver", minPoints: 500, discount: 2, benefit: "Diskon 2% untuk semua produk" },
      { name: "Gold", minPoints: 1000, discount: 5, benefit: "Diskon 5% untuk semua produk" },
      { name: "Platinum", minPoints: 2000, discount: 10, benefit: "Diskon 10% untuk semua produk" },
    ]) },
  ];
  for (const s of defaultSettings) {
    await db.insert(schema.storeSettings).values({
      key: s.key,
      value: s.value as unknown as Record<string, unknown>,
    }).onConflictDoNothing();
  }
  console.log("  ✅ Store settings");

  // =============================================
  // Step 2: Check for existing users
  // =============================================
  console.log("\n👤 Step 2: Checking for users...");

  const existingUsers = await db.select().from(schema.users);
  let ownerId: string;
  let ownerName: string;
  let cashierId: string;
  let cashierName: string;
  let managerId: string | null = null;
  let managerName: string | null = null;

  if (existingUsers.length === 0) {
    console.log("  ⚠️  No users found! Creating test users via direct DB insert...");
    console.log("  ⚠️  NOTE: These users won't have passwords. Use the app's signup to create real users.");

    ownerId = "user-owner-001";
    ownerName = "Tama (Owner)";
    cashierId = "user-cashier-001";
    cashierName = "Sarah (Kasir)";
    managerId = "user-manager-001";
    managerName = "Andi (Manager)";

    await db.insert(schema.users).values([
      { id: ownerId, name: ownerName, email: "owner@kasirpro.test", role: "owner", emailVerified: true },
      { id: managerId, name: managerName, email: "manager@kasirpro.test", role: "manager", emailVerified: true },
      { id: cashierId, name: cashierName, email: "kasir@kasirpro.test", role: "cashier", emailVerified: true },
    ]).onConflictDoNothing();
    console.log("  ✅ Test users created (owner, manager, cashier)");
  } else {
    // Use existing users
    const owner = existingUsers.find(u => u.role === "owner") || existingUsers[0];
    const cashier = existingUsers.find(u => u.role === "cashier") || existingUsers[0];
    const manager = existingUsers.find(u => u.role === "manager");
    ownerId = owner.id;
    ownerName = owner.name;
    cashierId = cashier.id;
    cashierName = cashier.name;
    if (manager) {
      managerId = manager.id;
      managerName = manager.name;
    }
    console.log(`  ✅ Using existing users: owner=${ownerName}, cashier=${cashierName}`);
  }

  // =============================================
  // Step 3: Expense Categories
  // =============================================
  console.log("\n💰 Step 3: Expense categories...");

  const expenseCats = [
    { id: "ec-001", name: "Penjualan", type: "masuk" as const, isDefault: true },
    { id: "ec-002", name: "Sewa Toko", type: "keluar" as const, isDefault: true },
    { id: "ec-003", name: "Listrik & Air", type: "keluar" as const, isDefault: true },
    { id: "ec-004", name: "Gaji Karyawan", type: "keluar" as const, isDefault: true },
    { id: "ec-005", name: "Pembelian Stok", type: "keluar" as const, isDefault: true },
    { id: "ec-006", name: "Transport & Logistik", type: "keluar" as const, isDefault: false },
    { id: "ec-007", name: "Perlengkapan Toko", type: "keluar" as const, isDefault: false },
    { id: "ec-008", name: "Marketing & Promosi", type: "keluar" as const, isDefault: false },
    { id: "ec-009", name: "Pendapatan Lain", type: "masuk" as const, isDefault: false },
    { id: "ec-010", name: "Retur Penjualan", type: "keluar" as const, isDefault: false },
  ];
  await db.insert(schema.expenseCategories).values(expenseCats).onConflictDoNothing();
  console.log("  ✅ Expense categories");

  // =============================================
  // Step 4: Shifts (past 7 days)
  // =============================================
  console.log("\n🕐 Step 4: Shifts...");

  const shifts = [
    // Closed shifts (past days)
    { id: "shift-001", cashierId, openedAt: timestamp(7), closedAt: timestamp(6.7), openingBalance: 500000, expectedClosing: 2850000, actualClosing: 2840000, difference: -10000, totalSales: 3200000, totalCashSales: 2350000, totalNonCashSales: 850000, totalTransactions: 12, status: "closed" as const, notes: "Selisih kecil, mungkin kembalian" },
    { id: "shift-002", cashierId, openedAt: timestamp(6), closedAt: timestamp(5.7), openingBalance: 500000, expectedClosing: 3100000, actualClosing: 3100000, difference: 0, totalSales: 4150000, totalCashSales: 2600000, totalNonCashSales: 1550000, totalTransactions: 15, status: "closed" as const, notes: null },
    { id: "shift-003", cashierId, openedAt: timestamp(5), closedAt: timestamp(4.7), openingBalance: 500000, expectedClosing: 2200000, actualClosing: 2195000, difference: -5000, totalSales: 2800000, totalCashSales: 1700000, totalNonCashSales: 1100000, totalTransactions: 10, status: "closed" as const, notes: null },
    { id: "shift-004", cashierId, openedAt: timestamp(4), closedAt: timestamp(3.7), openingBalance: 500000, expectedClosing: 3500000, actualClosing: 3500000, difference: 0, totalSales: 5200000, totalCashSales: 3000000, totalNonCashSales: 2200000, totalTransactions: 18, status: "closed" as const, notes: "Hari ramai, weekend" },
    { id: "shift-005", cashierId, openedAt: timestamp(3), closedAt: timestamp(2.7), openingBalance: 500000, expectedClosing: 2600000, actualClosing: 2600000, difference: 0, totalSales: 3400000, totalCashSales: 2100000, totalNonCashSales: 1300000, totalTransactions: 13, status: "closed" as const, notes: null },
    { id: "shift-006", cashierId, openedAt: timestamp(2), closedAt: timestamp(1.7), openingBalance: 500000, expectedClosing: 2900000, actualClosing: 2895000, difference: -5000, totalSales: 3800000, totalCashSales: 2400000, totalNonCashSales: 1400000, totalTransactions: 14, status: "closed" as const, notes: null },
    { id: "shift-007", cashierId, openedAt: timestamp(1), closedAt: timestamp(0.7), openingBalance: 500000, expectedClosing: 3300000, actualClosing: 3300000, difference: 0, totalSales: 4500000, totalCashSales: 2800000, totalNonCashSales: 1700000, totalTransactions: 16, status: "closed" as const, notes: null },
    // Active shift (today)
    { id: "shift-008", cashierId, openedAt: timestamp(0.1), closedAt: null, openingBalance: 500000, expectedClosing: null, actualClosing: null, difference: null, totalSales: 1250000, totalCashSales: 750000, totalNonCashSales: 500000, totalTransactions: 5, status: "active" as const, notes: null },
  ];

  for (const s of shifts) {
    await db.insert(schema.shifts).values(s).onConflictDoNothing();
  }
  console.log("  ✅ 8 shifts (7 closed + 1 active)");

  // =============================================
  // Step 5: Orders (spread over 7 days, various payment methods & customers)
  // =============================================
  console.log("\n🛒 Step 5: Orders & order items...");

  const paymentMethods = ["tunai", "debit", "kredit", "transfer", "qris", "ewallet"] as const;
  const customerIds = ["C-001", "C-002", "C-003", "C-004", "C-005", "C-006", "C-007", "C-008", null, null, null]; // null = walk-in

  // Build a large set of realistic orders
  const ordersToInsert: Array<{
    order: typeof schema.orders.$inferInsert;
    items: Array<typeof schema.orderItems.$inferInsert>;
  }> = [];

  // Helper to pick variant info
  const variantMap: Record<string, { name: string; color: string; size: string; sellPrice: number; costPrice: number }> = {};
  for (const p of productsData) {
    for (const v of p.variants) {
      variantMap[v.id] = { name: p.name, color: v.color, size: v.size, sellPrice: v.sellPrice, costPrice: v.buyPrice };
    }
  }

  // Day 7 orders (shift-001)
  const day7Orders = [
    { day: 7, seq: 1, custIdx: 0, payment: "tunai" as const, items: [{ vid: "V002", qty: 2 }, { vid: "V016", qty: 1 }] },
    { day: 7, seq: 2, custIdx: null, payment: "qris" as const, items: [{ vid: "V022", qty: 3 }] },
    { day: 7, seq: 3, custIdx: 2, payment: "tunai" as const, items: [{ vid: "V028", qty: 1 }, { vid: "V044", qty: 2 }] },
    { day: 7, seq: 4, custIdx: null, payment: "debit" as const, items: [{ vid: "V047", qty: 1 }] },
    { day: 7, seq: 5, custIdx: 3, payment: "tunai" as const, items: [{ vid: "V011", qty: 1 }, { vid: "V017", qty: 2 }] },
    { day: 7, seq: 6, custIdx: null, payment: "transfer" as const, items: [{ vid: "V041", qty: 1 }] },
    { day: 7, seq: 7, custIdx: 5, payment: "tunai" as const, items: [{ vid: "V053", qty: 1 }, { vid: "V060", qty: 1 }] },
    { day: 7, seq: 8, custIdx: null, payment: "ewallet" as const, items: [{ vid: "V018", qty: 1 }, { vid: "V023", qty: 1 }] },
    { day: 7, seq: 9, custIdx: 1, payment: "tunai" as const, items: [{ vid: "V035", qty: 1 }] },
    { day: 7, seq: 10, custIdx: null, payment: "tunai" as const, items: [{ vid: "V005", qty: 1 }, { vid: "V045", qty: 1 }] },
    { day: 7, seq: 11, custIdx: 6, payment: "kredit" as const, items: [{ vid: "V058", qty: 1 }] },
    { day: 7, seq: 12, custIdx: null, payment: "tunai" as const, items: [{ vid: "V009", qty: 2 }] },
  ];

  // Day 6 orders (shift-002)
  const day6Orders = [
    { day: 6, seq: 1, custIdx: 2, payment: "tunai" as const, items: [{ vid: "V047", qty: 1 }, { vid: "V016", qty: 2 }] },
    { day: 6, seq: 2, custIdx: null, payment: "qris" as const, items: [{ vid: "V027", qty: 1 }] },
    { day: 6, seq: 3, custIdx: 0, payment: "tunai" as const, items: [{ vid: "V054", qty: 1 }, { vid: "V011", qty: 1 }] },
    { day: 6, seq: 4, custIdx: null, payment: "debit" as const, items: [{ vid: "V042", qty: 2 }, { vid: "V060", qty: 3 }] },
    { day: 6, seq: 5, custIdx: 4, payment: "tunai" as const, items: [{ vid: "V036", qty: 1 }] },
    { day: 6, seq: 6, custIdx: null, payment: "tunai" as const, items: [{ vid: "V003", qty: 3 }, { vid: "V020", qty: 2 }] },
    { day: 6, seq: 7, custIdx: 7, payment: "transfer" as const, items: [{ vid: "V048", qty: 1 }, { vid: "V019", qty: 1 }] },
    { day: 6, seq: 8, custIdx: null, payment: "ewallet" as const, items: [{ vid: "V025", qty: 2 }] },
    { day: 6, seq: 9, custIdx: 1, payment: "tunai" as const, items: [{ vid: "V034", qty: 1 }, { vid: "V044", qty: 1 }] },
    { day: 6, seq: 10, custIdx: null, payment: "qris" as const, items: [{ vid: "V057", qty: 1 }] },
    { day: 6, seq: 11, custIdx: 3, payment: "tunai" as const, items: [{ vid: "V058", qty: 1 }, { vid: "V046", qty: 2 }] },
    { day: 6, seq: 12, custIdx: null, payment: "tunai" as const, items: [{ vid: "V002", qty: 2 }, { vid: "V061", qty: 1 }] },
    { day: 6, seq: 13, custIdx: 5, payment: "debit" as const, items: [{ vid: "V029", qty: 1 }] },
    { day: 6, seq: 14, custIdx: null, payment: "tunai" as const, items: [{ vid: "V017", qty: 3 }] },
    { day: 6, seq: 15, custIdx: 6, payment: "kredit" as const, items: [{ vid: "V039", qty: 1 }] },
  ];

  // Day 5 (shift-003)
  const day5Orders = [
    { day: 5, seq: 1, custIdx: null, payment: "tunai" as const, items: [{ vid: "V001", qty: 2 }, { vid: "V022", qty: 1 }] },
    { day: 5, seq: 2, custIdx: 0, payment: "qris" as const, items: [{ vid: "V050", qty: 1 }] },
    { day: 5, seq: 3, custIdx: null, payment: "tunai" as const, items: [{ vid: "V031", qty: 1 }] },
    { day: 5, seq: 4, custIdx: 2, payment: "transfer" as const, items: [{ vid: "V041", qty: 1 }, { vid: "V043", qty: 1 }] },
    { day: 5, seq: 5, custIdx: null, payment: "tunai" as const, items: [{ vid: "V014", qty: 1 }, { vid: "V024", qty: 2 }] },
    { day: 5, seq: 6, custIdx: 4, payment: "debit" as const, items: [{ vid: "V055", qty: 1 }] },
    { day: 5, seq: 7, custIdx: null, payment: "tunai" as const, items: [{ vid: "V016", qty: 2 }] },
    { day: 5, seq: 8, custIdx: 7, payment: "ewallet" as const, items: [{ vid: "V059", qty: 1 }] },
    { day: 5, seq: 9, custIdx: null, payment: "tunai" as const, items: [{ vid: "V006", qty: 1 }, { vid: "V045", qty: 2 }] },
    { day: 5, seq: 10, custIdx: 1, payment: "tunai" as const, items: [{ vid: "V037", qty: 1 }] },
  ];

  // Day 4 (shift-004 - weekend, busier)
  const day4Orders = [
    { day: 4, seq: 1, custIdx: 0, payment: "tunai" as const, items: [{ vid: "V002", qty: 2 }, { vid: "V016", qty: 3 }] },
    { day: 4, seq: 2, custIdx: null, payment: "qris" as const, items: [{ vid: "V028", qty: 1 }, { vid: "V044", qty: 1 }] },
    { day: 4, seq: 3, custIdx: 2, payment: "tunai" as const, items: [{ vid: "V047", qty: 1 }, { vid: "V017", qty: 2 }] },
    { day: 4, seq: 4, custIdx: null, payment: "debit" as const, items: [{ vid: "V054", qty: 2 }] },
    { day: 4, seq: 5, custIdx: 3, payment: "tunai" as const, items: [{ vid: "V036", qty: 1 }, { vid: "V022", qty: 2 }] },
    { day: 4, seq: 6, custIdx: null, payment: "transfer" as const, items: [{ vid: "V058", qty: 1 }, { vid: "V060", qty: 2 }] },
    { day: 4, seq: 7, custIdx: 5, payment: "tunai" as const, items: [{ vid: "V011", qty: 2 }] },
    { day: 4, seq: 8, custIdx: null, payment: "ewallet" as const, items: [{ vid: "V041", qty: 1 }, { vid: "V042", qty: 1 }] },
    { day: 4, seq: 9, custIdx: 1, payment: "tunai" as const, items: [{ vid: "V029", qty: 1 }] },
    { day: 4, seq: 10, custIdx: null, payment: "tunai" as const, items: [{ vid: "V018", qty: 2 }, { vid: "V023", qty: 1 }] },
    { day: 4, seq: 11, custIdx: 4, payment: "kredit" as const, items: [{ vid: "V035", qty: 1 }, { vid: "V046", qty: 1 }] },
    { day: 4, seq: 12, custIdx: null, payment: "tunai" as const, items: [{ vid: "V007", qty: 2 }] },
    { day: 4, seq: 13, custIdx: 7, payment: "qris" as const, items: [{ vid: "V051", qty: 1 }] },
    { day: 4, seq: 14, custIdx: null, payment: "tunai" as const, items: [{ vid: "V053", qty: 1 }, { vid: "V061", qty: 2 }] },
    { day: 4, seq: 15, custIdx: 6, payment: "debit" as const, items: [{ vid: "V027", qty: 1 }] },
    { day: 4, seq: 16, custIdx: null, payment: "tunai" as const, items: [{ vid: "V020", qty: 3 }] },
    { day: 4, seq: 17, custIdx: 0, payment: "transfer" as const, items: [{ vid: "V049", qty: 1 }] },
    { day: 4, seq: 18, custIdx: null, payment: "tunai" as const, items: [{ vid: "V004", qty: 1 }, { vid: "V019", qty: 1 }] },
  ];

  // Day 3 (shift-005)
  const day3Orders = [
    { day: 3, seq: 1, custIdx: null, payment: "tunai" as const, items: [{ vid: "V003", qty: 2 }] },
    { day: 3, seq: 2, custIdx: 2, payment: "qris" as const, items: [{ vid: "V047", qty: 1 }, { vid: "V021", qty: 1 }] },
    { day: 3, seq: 3, custIdx: null, payment: "tunai" as const, items: [{ vid: "V032", qty: 1 }] },
    { day: 3, seq: 4, custIdx: 0, payment: "debit" as const, items: [{ vid: "V056", qty: 1 }, { vid: "V044", qty: 2 }] },
    { day: 3, seq: 5, custIdx: null, payment: "tunai" as const, items: [{ vid: "V012", qty: 1 }, { vid: "V025", qty: 1 }] },
    { day: 3, seq: 6, custIdx: 3, payment: "transfer" as const, items: [{ vid: "V059", qty: 1 }] },
    { day: 3, seq: 7, custIdx: null, payment: "tunai" as const, items: [{ vid: "V008", qty: 1 }, { vid: "V016", qty: 1 }] },
    { day: 3, seq: 8, custIdx: 5, payment: "ewallet" as const, items: [{ vid: "V038", qty: 1 }] },
    { day: 3, seq: 9, custIdx: null, payment: "tunai" as const, items: [{ vid: "V010", qty: 2 }] },
    { day: 3, seq: 10, custIdx: 1, payment: "tunai" as const, items: [{ vid: "V041", qty: 1 }, { vid: "V045", qty: 1 }] },
    { day: 3, seq: 11, custIdx: null, payment: "qris" as const, items: [{ vid: "V030", qty: 1 }] },
    { day: 3, seq: 12, custIdx: 7, payment: "tunai" as const, items: [{ vid: "V050", qty: 1 }] },
    { day: 3, seq: 13, custIdx: null, payment: "tunai" as const, items: [{ vid: "V023", qty: 2 }] },
  ];

  // Day 2 (shift-006)
  const day2Orders = [
    { day: 2, seq: 1, custIdx: 0, payment: "tunai" as const, items: [{ vid: "V002", qty: 3 }] },
    { day: 2, seq: 2, custIdx: null, payment: "debit" as const, items: [{ vid: "V028", qty: 1 }, { vid: "V060", qty: 2 }] },
    { day: 2, seq: 3, custIdx: 2, payment: "tunai" as const, items: [{ vid: "V048", qty: 1 }, { vid: "V018", qty: 1 }] },
    { day: 2, seq: 4, custIdx: null, payment: "qris" as const, items: [{ vid: "V022", qty: 2 }] },
    { day: 2, seq: 5, custIdx: 4, payment: "tunai" as const, items: [{ vid: "V054", qty: 1 }] },
    { day: 2, seq: 6, custIdx: null, payment: "transfer" as const, items: [{ vid: "V042", qty: 1 }, { vid: "V046", qty: 1 }] },
    { day: 2, seq: 7, custIdx: 3, payment: "tunai" as const, items: [{ vid: "V013", qty: 1 }] },
    { day: 2, seq: 8, custIdx: null, payment: "tunai" as const, items: [{ vid: "V005", qty: 2 }, { vid: "V017", qty: 1 }] },
    { day: 2, seq: 9, custIdx: 6, payment: "ewallet" as const, items: [{ vid: "V036", qty: 1 }] },
    { day: 2, seq: 10, custIdx: null, payment: "tunai" as const, items: [{ vid: "V024", qty: 2 }] },
    { day: 2, seq: 11, custIdx: 5, payment: "debit" as const, items: [{ vid: "V058", qty: 1 }] },
    { day: 2, seq: 12, custIdx: null, payment: "tunai" as const, items: [{ vid: "V001", qty: 2 }, { vid: "V061", qty: 1 }] },
    { day: 2, seq: 13, custIdx: 1, payment: "kredit" as const, items: [{ vid: "V040", qty: 1 }] },
    { day: 2, seq: 14, custIdx: null, payment: "tunai" as const, items: [{ vid: "V019", qty: 2 }] },
  ];

  // Day 1 (shift-007)
  const day1Orders = [
    { day: 1, seq: 1, custIdx: null, payment: "tunai" as const, items: [{ vid: "V003", qty: 2 }, { vid: "V022", qty: 2 }] },
    { day: 1, seq: 2, custIdx: 0, payment: "qris" as const, items: [{ vid: "V047", qty: 1 }] },
    { day: 1, seq: 3, custIdx: null, payment: "tunai" as const, items: [{ vid: "V027", qty: 1 }, { vid: "V045", qty: 1 }] },
    { day: 1, seq: 4, custIdx: 2, payment: "debit" as const, items: [{ vid: "V051", qty: 1 }, { vid: "V020", qty: 2 }] },
    { day: 1, seq: 5, custIdx: null, payment: "tunai" as const, items: [{ vid: "V014", qty: 1 }] },
    { day: 1, seq: 6, custIdx: 3, payment: "transfer" as const, items: [{ vid: "V035", qty: 1 }, { vid: "V044", qty: 2 }] },
    { day: 1, seq: 7, custIdx: null, payment: "tunai" as const, items: [{ vid: "V009", qty: 2 }, { vid: "V016", qty: 1 }] },
    { day: 1, seq: 8, custIdx: 5, payment: "ewallet" as const, items: [{ vid: "V059", qty: 1 }] },
    { day: 1, seq: 9, custIdx: null, payment: "tunai" as const, items: [{ vid: "V053", qty: 1 }] },
    { day: 1, seq: 10, custIdx: 7, payment: "tunai" as const, items: [{ vid: "V041", qty: 1 }, { vid: "V060", qty: 3 }] },
    { day: 1, seq: 11, custIdx: null, payment: "qris" as const, items: [{ vid: "V037", qty: 1 }] },
    { day: 1, seq: 12, custIdx: 4, payment: "tunai" as const, items: [{ vid: "V006", qty: 2 }] },
    { day: 1, seq: 13, custIdx: null, payment: "debit" as const, items: [{ vid: "V048", qty: 1 }] },
    { day: 1, seq: 14, custIdx: 1, payment: "tunai" as const, items: [{ vid: "V012", qty: 1 }, { vid: "V025", qty: 1 }] },
    { day: 1, seq: 15, custIdx: null, payment: "tunai" as const, items: [{ vid: "V033", qty: 1 }] },
    { day: 1, seq: 16, custIdx: 6, payment: "kredit" as const, items: [{ vid: "V057", qty: 1 }] },
  ];

  // Today orders (shift-008 - active)
  const day0Orders = [
    { day: 0, seq: 1, custIdx: 0, payment: "tunai" as const, items: [{ vid: "V002", qty: 1 }, { vid: "V017", qty: 1 }] },
    { day: 0, seq: 2, custIdx: null, payment: "qris" as const, items: [{ vid: "V022", qty: 2 }] },
    { day: 0, seq: 3, custIdx: 2, payment: "tunai" as const, items: [{ vid: "V029", qty: 1 }] },
    { day: 0, seq: 4, custIdx: null, payment: "debit" as const, items: [{ vid: "V044", qty: 2 }, { vid: "V061", qty: 1 }] },
    { day: 0, seq: 5, custIdx: 5, payment: "tunai" as const, items: [{ vid: "V041", qty: 1 }] },
  ];

  const allOrderDefs = [...day7Orders, ...day6Orders, ...day5Orders, ...day4Orders, ...day3Orders, ...day2Orders, ...day1Orders, ...day0Orders];
  const shiftMap: Record<number, string> = { 7: "shift-001", 6: "shift-002", 5: "shift-003", 4: "shift-004", 3: "shift-005", 2: "shift-006", 1: "shift-007", 0: "shift-008" };

  let orderCount = 0;
  for (const od of allOrderDefs) {
    const oid = orderId(od.day, od.seq);
    const custId = od.custIdx !== null ? customersData[od.custIdx].id : null;
    const custName = od.custIdx !== null ? customersData[od.custIdx].name : "Pelanggan Umum";

    let subtotal = 0;
    const items: Array<typeof schema.orderItems.$inferInsert> = [];
    for (const it of od.items) {
      const v = variantMap[it.vid];
      const itemSub = v.sellPrice * it.qty;
      subtotal += itemSub;
      items.push({
        id: uuid(),
        orderId: oid,
        variantId: it.vid,
        productName: v.name,
        variantInfo: `${v.color} - ${v.size}`,
        qty: it.qty,
        unitPrice: v.sellPrice,
        costPrice: v.costPrice,
        subtotal: itemSub,
      });
    }

    const taxAmount = Math.round(subtotal * 0.11);
    const total = subtotal + taxAmount;
    const cashPaid = od.payment === "tunai" ? Math.ceil(total / 10000) * 10000 : total;
    const changeAmount = od.payment === "tunai" ? cashPaid - total : 0;

    // Generate bankName/referenceNumber for card & ewallet payments
    const bankNames = ["BCA", "MANDIRI", "BRI", "BNI", "CIMB"];
    const ewalletNames = ["GoPay", "OVO", "DANA", "ShopeePay"];
    let bankName: string | null = null;
    let referenceNumber: string | null = null;
    if (od.payment === "debit" || od.payment === "kredit") {
      bankName = bankNames[od.seq % bankNames.length];
      referenceNumber = String(1000 + od.seq * 111 + od.day * 7).slice(-4);
    } else if (od.payment === "ewallet") {
      bankName = ewalletNames[od.seq % ewalletNames.length];
    }

    await db.insert(schema.orders).values({
      id: oid,
      customerId: custId,
      customerName: custName,
      date: timestamp(od.day),
      subtotal,
      discountAmount: 0,
      taxAmount,
      total,
      cashPaid,
      changeAmount,
      status: "selesai",
      paymentMethod: od.payment,
      bankName,
      referenceNumber,
      cashierId,
      shiftId: shiftMap[od.day],
      notes: null,
    }).onConflictDoNothing();

    for (const item of items) {
      await db.insert(schema.orderItems).values(item).onConflictDoNothing();
    }
    orderCount++;
  }
  console.log(`  ✅ ${orderCount} orders with items`);

  // Also add 1 cancelled order for testing
  const cancelledOid = orderId(5, 99);
  await db.insert(schema.orders).values({
    id: cancelledOid,
    customerId: null,
    customerName: "Pelanggan Umum",
    date: timestamp(5),
    subtotal: 178000,
    taxAmount: 19580,
    total: 197580,
    status: "dibatalkan",
    paymentMethod: "tunai",
    cashierId,
    shiftId: "shift-003",
    notes: "Pelanggan berubah pikiran",
  }).onConflictDoNothing();
  await db.insert(schema.orderItems).values({
    id: uuid(), orderId: cancelledOid, variantId: "V002",
    productName: "Kaos Polos Basic", variantInfo: "Hitam - M", qty: 2,
    unitPrice: 89000, costPrice: 45000, subtotal: 178000,
  }).onConflictDoNothing();
  console.log("  ✅ 1 cancelled order");

  // =============================================
  // Step 6: Financial Transactions
  // =============================================
  console.log("\n📊 Step 6: Financial transactions...");

  // Auto-generated from orders (income)
  let ftCount = 0;
  for (const od of allOrderDefs) {
    const oid = orderId(od.day, od.seq);
    let subtotal = 0;
    for (const it of od.items) {
      const v = variantMap[it.vid];
      subtotal += v.sellPrice * it.qty;
    }
    const taxAmount = Math.round(subtotal * 0.11);
    const total = subtotal + taxAmount;

    await db.insert(schema.financialTransactions).values({
      id: uuid(),
      date: dateStr(od.day),
      type: "masuk",
      category: "Penjualan",
      description: `Penjualan ${oid}`,
      amount: total,
      orderId: oid,
      createdBy: cashierId,
    }).onConflictDoNothing();
    ftCount++;
  }

  // Expense transactions
  const expenses = [
    { day: 7, cat: "Listrik & Air", desc: "Pembayaran listrik bulan Maret", amount: 850000 },
    { day: 6, cat: "Perlengkapan Toko", desc: "Beli kantong plastik & tissue", amount: 175000 },
    { day: 5, cat: "Transport & Logistik", desc: "Ongkir pengiriman ke pelanggan", amount: 95000 },
    { day: 4, cat: "Marketing & Promosi", desc: "Print banner promo weekend", amount: 250000 },
    { day: 3, cat: "Perlengkapan Toko", desc: "Beli kertas struk thermal", amount: 120000 },
    { day: 2, cat: "Transport & Logistik", desc: "Grab untuk ambil stok di supplier", amount: 65000 },
    { day: 1, cat: "Gaji Karyawan", desc: "Gaji part-time helper weekend", amount: 300000 },
    { day: 0, cat: "Perlengkapan Toko", desc: "Beli hanger display baru", amount: 180000 },
  ];

  for (const e of expenses) {
    await db.insert(schema.financialTransactions).values({
      id: uuid(),
      date: dateStr(e.day),
      type: "keluar",
      category: e.cat,
      description: e.desc,
      amount: e.amount,
      createdBy: ownerId,
    }).onConflictDoNothing();
    ftCount++;
  }
  console.log(`  ✅ ${ftCount} financial transactions`);

  // =============================================
  // Step 7: Purchase Orders
  // =============================================
  console.log("\n📦 Step 7: Purchase orders...");

  const purchaseOrders = [
    // Completed PO
    {
      id: poId(20, 1), supplierId: "SUP001", date: dateStr(20), expectedDate: dateStr(15),
      receivedDate: dateStr(14), status: "diterima" as const, total: 2250000,
      paidAmount: 2250000, paymentStatus: "lunas" as const,
      items: [
        { vid: "V001", name: "Kaos Polos Basic", info: "Hitam - S", qty: 20, cost: 45000 },
        { vid: "V006", name: "Kaos Polos Basic", info: "Putih - M", qty: 15, cost: 45000 },
        { vid: "V011", name: "Kemeja Flannel", info: "Merah - M", qty: 10, cost: 95000 },
      ],
    },
    // Completed PO from hijab supplier
    {
      id: poId(15, 1), supplierId: "SUP002", date: dateStr(15), expectedDate: dateStr(10),
      receivedDate: dateStr(10), status: "diterima" as const, total: 1800000,
      paidAmount: 1800000, paymentStatus: "lunas" as const,
      items: [
        { vid: "V016", name: "Hijab Pashmina Premium", info: "Hitam - All Size", qty: 20, cost: 35000 },
        { vid: "V022", name: "Hijab Segi Empat", info: "Hitam - All Size", qty: 30, cost: 25000 },
        { vid: "V017", name: "Hijab Pashmina Premium", info: "Cream - All Size", qty: 10, cost: 35000 },
      ],
    },
    // In-transit PO
    {
      id: poId(5, 1), supplierId: "SUP003", date: dateStr(5), expectedDate: dateStr(1),
      receivedDate: null, status: "dikirim" as const, total: 3500000,
      paidAmount: 1750000, paymentStatus: "sebagian" as const,
      items: [
        { vid: "V026", name: "Sneakers Urban", info: "Hitam - 39", qty: 10, cost: 175000 },
        { vid: "V034", name: "Sepatu Formal", info: "Hitam - 39", qty: 5, cost: 220000 },
        { vid: "V035", name: "Sepatu Formal", info: "Hitam - 40", qty: 5, cost: 220000 },
      ],
    },
    // Processing PO
    {
      id: poId(2, 1), supplierId: "SUP004", date: dateStr(2), expectedDate: dateStr(-3),
      receivedDate: null, status: "diproses" as const, total: 1950000,
      paidAmount: 0, paymentStatus: "belum_bayar" as const,
      items: [
        { vid: "V044", name: "Gelang Mutiara", info: "Putih - All Size", qty: 30, cost: 15000 },
        { vid: "V060", name: "Kalung Choker", info: "Gold - All Size", qty: 25, cost: 12000 },
        { vid: "V041", name: "Tas Tote Canvas", info: "Hitam - All Size", qty: 15, cost: 55000 },
      ],
    },
    // Cancelled PO
    {
      id: poId(10, 1), supplierId: "SUP005", date: dateStr(10), expectedDate: dateStr(5),
      receivedDate: null, status: "dibatalkan" as const, total: 1400000,
      paidAmount: 0, paymentStatus: "belum_bayar" as const,
      items: [
        { vid: "V058", name: "Tas Ransel Laptop", info: "Hitam - All Size", qty: 10, cost: 140000 },
      ],
    },
  ];

  for (const po of purchaseOrders) {
    await db.insert(schema.purchaseOrders).values({
      id: po.id, supplierId: po.supplierId, date: po.date,
      expectedDate: po.expectedDate, receivedDate: po.receivedDate,
      status: po.status, total: po.total, paidAmount: po.paidAmount,
      paymentStatus: po.paymentStatus, createdBy: managerId || ownerId,
    }).onConflictDoNothing();

    for (const item of po.items) {
      await db.insert(schema.purchaseOrderItems).values({
        id: uuid(), purchaseOrderId: po.id, variantId: item.vid,
        productName: item.name, variantInfo: item.info,
        qty: item.qty, unitCost: item.cost, subtotal: item.qty * item.cost,
      }).onConflictDoNothing();
    }
  }

  // PO Timelines
  const poTimelines = [
    { poId: poId(20, 1), entries: [
      { status: "diproses", note: "PO dibuat", date: dateStr(20) },
      { status: "dikirim", note: "Barang dikirim dari Bandung", date: dateStr(17) },
      { status: "diterima", note: "Barang diterima lengkap", date: dateStr(14) },
    ]},
    { poId: poId(15, 1), entries: [
      { status: "diproses", note: "PO dibuat", date: dateStr(15) },
      { status: "dikirim", note: "Dikirim via JNE", date: dateStr(12) },
      { status: "diterima", note: "Diterima, semua sesuai", date: dateStr(10) },
    ]},
    { poId: poId(5, 1), entries: [
      { status: "diproses", note: "PO dibuat", date: dateStr(5) },
      { status: "dikirim", note: "Dikirim dari Bandung", date: dateStr(3) },
    ]},
    { poId: poId(2, 1), entries: [
      { status: "diproses", note: "PO dibuat, menunggu konfirmasi supplier", date: dateStr(2) },
    ]},
    { poId: poId(10, 1), entries: [
      { status: "diproses", note: "PO dibuat", date: dateStr(10) },
      { status: "dibatalkan", note: "Dibatalkan karena stok supplier habis", date: dateStr(8) },
    ]},
  ];

  for (const tl of poTimelines) {
    for (const entry of tl.entries) {
      await db.insert(schema.purchaseOrderTimeline).values({
        id: uuid(), purchaseOrderId: tl.poId,
        status: entry.status, note: entry.note, date: entry.date,
      }).onConflictDoNothing();
    }
  }
  console.log(`  ✅ ${purchaseOrders.length} purchase orders with items & timelines`);

  // =============================================
  // Step 8: Returns
  // =============================================
  console.log("\n🔄 Step 8: Returns...");

  const returnsData = [
    // Completed return
    {
      id: rtnId(5, 1), orderId: orderId(7, 1), customerId: "C-001",
      date: dateStr(5), reason: "Ukuran tidak sesuai", status: "selesai" as const,
      refundMethod: "tunai" as const, refundAmount: 89000, processedBy: managerId || ownerId,
      items: [{ vid: "V002", name: "Kaos Polos Basic", info: "Hitam - M", qty: 1, price: 89000 }],
    },
    // Approved return
    {
      id: rtnId(3, 1), orderId: orderId(6, 1), customerId: "C-003",
      date: dateStr(3), reason: "Warna tidak sesuai ekspektasi", status: "disetujui" as const,
      refundMethod: "transfer" as const, refundAmount: 75000, processedBy: managerId || ownerId,
      items: [{ vid: "V016", name: "Hijab Pashmina Premium", info: "Hitam - All Size", qty: 1, price: 75000 }],
    },
    // Processing return
    {
      id: rtnId(1, 1), orderId: orderId(4, 2), customerId: null,
      date: dateStr(1), reason: "Barang cacat/rusak", status: "diproses" as const,
      refundMethod: null, refundAmount: 45000, processedBy: null,
      items: [{ vid: "V044", name: "Gelang Mutiara", info: "Putih - All Size", qty: 1, price: 45000 }],
    },
    // Rejected return
    {
      id: rtnId(4, 1), orderId: orderId(6, 3), customerId: "C-001",
      date: dateStr(4), reason: "Berubah pikiran", status: "ditolak" as const,
      refundMethod: null, refundAmount: 0, processedBy: managerId || ownerId,
      items: [{ vid: "V054", name: "Celana Chino Slim", info: "Hitam - 32", qty: 1, price: 199000 }],
    },
  ];

  for (const r of returnsData) {
    await db.insert(schema.returns).values({
      id: r.id, orderId: r.orderId, customerId: r.customerId,
      date: r.date, reason: r.reason, status: r.status,
      refundMethod: r.refundMethod, refundAmount: r.refundAmount,
      processedBy: r.processedBy,
    }).onConflictDoNothing();

    for (const item of r.items) {
      await db.insert(schema.returnItems).values({
        id: uuid(), returnId: r.id, variantId: item.vid,
        productName: item.name, variantInfo: item.info,
        qty: item.qty, unitPrice: item.price,
      }).onConflictDoNothing();
    }
  }
  console.log(`  ✅ ${returnsData.length} returns`);

  // =============================================
  // Step 9: Promotions
  // =============================================
  console.log("\n🎉 Step 9: Promotions...");

  const promos = [
    // Active promo — all products
    { id: "promo-001", name: "Diskon Weekend 10%", description: "Diskon 10% untuk semua produk di akhir pekan", type: "percentage" as const, value: 10, minPurchase: 100000, startDate: dateStr(7), endDate: dateStr(-7), isActive: true, appliesTo: "all" as const, targetIds: [] },
    // Active category promo — hijab only
    { id: "promo-002", name: "Promo Hijab Spesial", description: "Potongan Rp 15.000 untuk pembelian hijab", type: "fixed" as const, value: 15000, minPurchase: 50000, startDate: dateStr(14), endDate: dateStr(-14), isActive: true, appliesTo: "category" as const, targetIds: ["cat-hijab"] },
    // Buy X Get Y — buy 2 any items, get 1 Gelang Mutiara free
    { id: "promo-003", name: "Beli 2 Gratis 1 Gelang Mutiara", description: "Beli 2 item apapun, gratis 1 Gelang Mutiara", type: "buy_x_get_y" as const, value: 0, minPurchase: 0, buyQty: 2, getQty: 1, freeProductId: "P008", startDate: dateStr(10), endDate: dateStr(-5), isActive: true, appliesTo: "all" as const, targetIds: [] },
    // Expired promo
    { id: "promo-004", name: "Flash Sale Imlek", description: "Diskon 20% untuk merayakan Tahun Baru Imlek", type: "percentage" as const, value: 20, minPurchase: 200000, startDate: dateStr(45), endDate: dateStr(30), isActive: false, appliesTo: "all" as const, targetIds: [] },
    // Upcoming promo — specific products
    { id: "promo-005", name: "Promo Ramadhan", description: "Diskon 15% menyambut Ramadhan", type: "percentage" as const, value: 15, minPurchase: 150000, startDate: dateStr(-5), endDate: dateStr(-35), isActive: true, appliesTo: "product" as const, targetIds: ["P003", "P004", "P009"] },
  ];

  for (const p of promos) {
    await db.insert(schema.promotions).values({
      id: p.id, name: p.name, description: p.description, type: p.type,
      value: p.value, minPurchase: p.minPurchase, startDate: p.startDate,
      endDate: p.endDate, isActive: p.isActive, appliesTo: p.appliesTo,
      targetIds: p.targetIds as unknown as string[],
      buyQty: (p as { buyQty?: number }).buyQty,
      getQty: (p as { getQty?: number }).getQty,
      freeProductId: (p as { freeProductId?: string }).freeProductId,
    }).onConflictDoNothing();
  }
  console.log(`  ✅ ${promos.length} promotions`);

  // =============================================
  // Step 10: Notifications
  // =============================================
  console.log("\n🔔 Step 10: Notifications...");

  const notifications = [
    { type: "stok_rendah" as const, title: "Stok Rendah: Sepatu Formal Coklat 42", message: "Stok Sepatu Formal Coklat ukuran 42 tersisa 3 unit (minimum: 3)", priority: "high" as const, isRead: false, userId: ownerId, daysAgo: 1 },
    { type: "stok_rendah" as const, title: "Stok Rendah: Sepatu Formal Coklat 40", message: "Stok Sepatu Formal Coklat ukuran 40 tersisa 4 unit (minimum: 3)", priority: "normal" as const, isRead: false, userId: ownerId, daysAgo: 2 },
    { type: "pesanan_baru" as const, title: "Pesanan Baru #ORD Hari Ini", message: "5 pesanan baru sudah diproses hari ini", priority: "normal" as const, isRead: false, userId: cashierId, daysAgo: 0 },
    { type: "pembayaran" as const, title: "PO Belum Dibayar", message: `Purchase order ${poId(2, 1)} senilai Rp 1.950.000 belum dibayar`, priority: "high" as const, isRead: false, userId: ownerId, daysAgo: 0 },
    { type: "sistem" as const, title: "Shift Baru Dibuka", message: `${cashierName} membuka shift baru dengan saldo awal Rp 500.000`, priority: "low" as const, isRead: true, userId: ownerId, daysAgo: 0 },
    { type: "promo" as const, title: "Promo Weekend Aktif", message: "Diskon Weekend 10% sudah aktif untuk semua produk", priority: "normal" as const, isRead: true, userId: null, daysAgo: 7 },
    { type: "stok_rendah" as const, title: "Stok Rendah: Sneakers Urban Hitam 43", message: "Stok Sneakers Urban Hitam ukuran 43 tersisa 7 unit (minimum: 3)", priority: "normal" as const, isRead: true, userId: ownerId, daysAgo: 3 },
    { type: "pembayaran" as const, title: "Pembayaran PO Diterima", message: `Pembayaran parsial Rp 1.750.000 untuk ${poId(5, 1)} telah dikonfirmasi`, priority: "normal" as const, isRead: true, userId: ownerId, daysAgo: 4 },
    { type: "sistem" as const, title: "Rekonsiliasi Harian Selesai", message: "Rekonsiliasi harian untuk 2 hari terakhir berhasil diselesaikan", priority: "low" as const, isRead: true, userId: ownerId, daysAgo: 1 },
    { type: "stok_rendah" as const, title: "Stok Rendah: Sneakers Urban Putih 41", message: "Stok Sneakers Urban Putih ukuran 41 tersisa 6 unit (minimum: 3)", priority: "normal" as const, isRead: false, userId: ownerId, daysAgo: 1 },
  ];

  for (const n of notifications) {
    await db.insert(schema.notifications).values({
      id: uuid(), type: n.type, title: n.title, message: n.message,
      priority: n.priority, isRead: n.isRead, userId: n.userId,
      createdAt: timestamp(n.daysAgo),
    }).onConflictDoNothing();
  }
  console.log(`  ✅ ${notifications.length} notifications`);

  // =============================================
  // Step 11: Audit Logs
  // =============================================
  console.log("\n📋 Step 11: Audit logs...");

  const auditLogs = [
    { userId: ownerId, userName: ownerName, action: "login" as const, detail: "Login berhasil", daysAgo: 7 },
    { userId: cashierId, userName: cashierName, action: "login" as const, detail: "Login berhasil", daysAgo: 7 },
    { userId: cashierId, userName: cashierName, action: "transaksi" as const, detail: `Transaksi ${orderId(7, 1)} - Rp 253.000 (Tunai)`, metadata: { orderId: orderId(7, 1), total: 253000 }, daysAgo: 7 },
    { userId: cashierId, userName: cashierName, action: "transaksi" as const, detail: `12 transaksi selesai hari ini`, daysAgo: 7 },
    { userId: ownerId, userName: ownerName, action: "keuangan" as const, detail: "Menambah pengeluaran: Pembayaran listrik - Rp 850.000", daysAgo: 7 },
    { userId: managerId || ownerId, userName: managerName || ownerName, action: "supplier" as const, detail: `Membuat PO ${poId(20, 1)} ke CV Textile Jaya - Rp 2.250.000`, daysAgo: 20 },
    { userId: managerId || ownerId, userName: managerName || ownerName, action: "stok" as const, detail: `Menerima stok dari PO ${poId(20, 1)} - 45 unit`, daysAgo: 14 },
    { userId: cashierId, userName: cashierName, action: "transaksi" as const, detail: `15 transaksi selesai hari ini`, daysAgo: 6 },
    { userId: cashierId, userName: cashierName, action: "transaksi" as const, detail: `10 transaksi selesai hari ini`, daysAgo: 5 },
    { userId: cashierId, userName: cashierName, action: "transaksi" as const, detail: `18 transaksi selesai hari ini - WEEKEND RAMAI`, daysAgo: 4 },
    { userId: cashierId, userName: cashierName, action: "retur" as const, detail: `Membuat retur ${rtnId(5, 1)} untuk ${orderId(7, 1)}`, daysAgo: 5 },
    { userId: managerId || ownerId, userName: managerName || ownerName, action: "retur" as const, detail: `Menyetujui retur ${rtnId(3, 1)} - refund Rp 75.000`, daysAgo: 3 },
    { userId: ownerId, userName: ownerName, action: "produk" as const, detail: "Memperbarui harga produk Kaos Polos Basic", daysAgo: 10 },
    { userId: ownerId, userName: ownerName, action: "pelanggan" as const, detail: "Menambah pelanggan baru: Nurul Aini", daysAgo: 30 },
    { userId: ownerId, userName: ownerName, action: "sistem" as const, detail: "Memperbarui pengaturan pajak menjadi 11%", daysAgo: 60 },
    { userId: cashierId, userName: cashierName, action: "transaksi" as const, detail: `13 transaksi selesai hari ini`, daysAgo: 3 },
    { userId: cashierId, userName: cashierName, action: "transaksi" as const, detail: `14 transaksi selesai hari ini`, daysAgo: 2 },
    { userId: cashierId, userName: cashierName, action: "transaksi" as const, detail: `16 transaksi selesai hari ini`, daysAgo: 1 },
    { userId: cashierId, userName: cashierName, action: "transaksi" as const, detail: `5 transaksi selesai hari ini (ongoing)`, daysAgo: 0 },
    { userId: cashierId, userName: cashierName, action: "login" as const, detail: "Login berhasil", daysAgo: 0 },
  ];

  for (const log of auditLogs) {
    await db.insert(schema.auditLogs).values({
      id: uuid(),
      userId: log.userId,
      userName: log.userName,
      action: log.action,
      detail: log.detail,
      metadata: (log as { metadata?: Record<string, unknown> }).metadata || null,
      createdAt: timestamp(log.daysAgo),
    }).onConflictDoNothing();
  }
  console.log(`  ✅ ${auditLogs.length} audit logs`);

  // =============================================
  // Step 12: Stock Opname
  // =============================================
  console.log("\n📊 Step 12: Stock opname...");

  // Completed stock opname (from 10 days ago)
  const so1Id = "so-mock-001";
  await db.insert(schema.stockOpnames).values({
    id: so1Id, code: soCode(10, 1), note: "Stock opname bulanan - Januari",
    status: "completed", createdBy: cashierId, createdByName: cashierName,
    reviewedBy: ownerId, reviewedByName: ownerName, reviewNote: "Selisih minor, bisa diterima",
    completedAt: timestamp(8),
  }).onConflictDoNothing();

  const so1Items = [
    { vid: "V001", systemStock: 28, actualStock: 25 },
    { vid: "V002", systemStock: 32, actualStock: 30 },
    { vid: "V003", systemStock: 22, actualStock: 20 },
    { vid: "V016", systemStock: 42, actualStock: 40 },
    { vid: "V022", systemStock: 52, actualStock: 50 },
    { vid: "V027", systemStock: 11, actualStock: 10 },
    { vid: "V041", systemStock: 21, actualStock: 20 },
    { vid: "V044", systemStock: 33, actualStock: 30 },
  ];
  for (const item of so1Items) {
    await db.insert(schema.stockOpnameItems).values({
      id: uuid(), opnameId: so1Id, variantId: item.vid,
      systemStock: item.systemStock, actualStock: item.actualStock,
      difference: item.actualStock - item.systemStock,
      note: item.actualStock !== item.systemStock ? "Selisih ditemukan" : null,
    }).onConflictDoNothing();
  }

  // In-progress stock opname (from 2 days ago)
  const so2Id = "so-mock-002";
  await db.insert(schema.stockOpnames).values({
    id: so2Id, code: soCode(2, 1), note: "Stock opname kategori sepatu",
    status: "in_progress", createdBy: cashierId, createdByName: cashierName,
  }).onConflictDoNothing();

  const so2Items = [
    { vid: "V026", systemStock: 8, actualStock: 8 },
    { vid: "V027", systemStock: 10, actualStock: 10 },
    { vid: "V028", systemStock: 12, actualStock: null },
    { vid: "V029", systemStock: 10, actualStock: null },
    { vid: "V034", systemStock: 5, actualStock: 5 },
    { vid: "V035", systemStock: 7, actualStock: null },
  ];
  for (const item of so2Items) {
    await db.insert(schema.stockOpnameItems).values({
      id: uuid(), opnameId: so2Id, variantId: item.vid,
      systemStock: item.systemStock, actualStock: item.actualStock,
      difference: item.actualStock !== null ? item.actualStock - item.systemStock : null,
    }).onConflictDoNothing();
  }
  console.log("  ✅ 2 stock opnames (1 completed, 1 in-progress)");

  // =============================================
  // Step 13: Recurring Expenses
  // =============================================
  console.log("\n🔁 Step 13: Recurring expenses...");

  const recurringExpenses = [
    { id: uuid(), description: "Sewa toko bulanan", category: "Sewa Toko", amount: 5000000, frequency: "bulanan" as const, nextDueDate: dateStr(-22), isActive: true, createdBy: ownerId },
    { id: uuid(), description: "Listrik & air bulanan", category: "Listrik & Air", amount: 850000, frequency: "bulanan" as const, nextDueDate: dateStr(-25), isActive: true, createdBy: ownerId },
    { id: uuid(), description: "WiFi toko", category: "Listrik & Air", amount: 350000, frequency: "bulanan" as const, nextDueDate: dateStr(-20), isActive: true, createdBy: ownerId },
    { id: uuid(), description: "Pembersihan toko", category: "Perlengkapan Toko", amount: 150000, frequency: "mingguan" as const, nextDueDate: dateStr(-2), isActive: true, createdBy: ownerId },
  ];

  for (const re of recurringExpenses) {
    await db.insert(schema.recurringExpenses).values(re).onConflictDoNothing();
  }
  console.log(`  ✅ ${recurringExpenses.length} recurring expenses`);

  // =============================================
  // Step 14: Daily Reconciliations
  // =============================================
  console.log("\n🧮 Step 14: Daily reconciliations...");

  const reconciliations = [
    { id: uuid(), date: dateStr(7), calculatedIncome: 3200000, calculatedExpense: 850000, actualCashInHand: 2340000, difference: -10000, status: "completed" as const, reconciledBy: ownerId },
    { id: uuid(), date: dateStr(6), calculatedIncome: 4150000, calculatedExpense: 175000, actualCashInHand: 3100000, difference: 0, status: "completed" as const, reconciledBy: ownerId },
    { id: uuid(), date: dateStr(5), calculatedIncome: 2800000, calculatedExpense: 95000, actualCashInHand: 2195000, difference: -5000, notes: "Selisih kecil", status: "completed" as const, reconciledBy: ownerId },
    { id: uuid(), date: dateStr(4), calculatedIncome: 5200000, calculatedExpense: 250000, actualCashInHand: 3500000, difference: 0, notes: "Weekend - ramai", status: "completed" as const, reconciledBy: ownerId },
    { id: uuid(), date: dateStr(3), calculatedIncome: 3400000, calculatedExpense: 120000, actualCashInHand: 2600000, difference: 0, status: "completed" as const, reconciledBy: ownerId },
    { id: uuid(), date: dateStr(2), calculatedIncome: 3800000, calculatedExpense: 65000, actualCashInHand: 2895000, difference: -5000, status: "completed" as const, reconciledBy: ownerId },
    { id: uuid(), date: dateStr(1), calculatedIncome: 4500000, calculatedExpense: 300000, actualCashInHand: 3300000, difference: 0, status: "completed" as const, reconciledBy: ownerId },
  ];

  for (const r of reconciliations) {
    await db.insert(schema.dailyReconciliations).values(r).onConflictDoNothing();
  }
  console.log(`  ✅ ${reconciliations.length} daily reconciliations`);

  // =============================================
  // Step 15: Held Transactions (POS hold)
  // =============================================
  console.log("\n⏸️  Step 15: Held transactions...");

  const heldTx = [
    {
      id: uuid(), cashierId, customerName: "Aisyah Putri", customerId: "C-001",
      items: [
        { variantId: "V003", productName: "Kaos Polos Basic", variantInfo: "Hitam - L", qty: 2, unitPrice: 89000, subtotal: 178000 },
        { variantId: "V017", productName: "Hijab Pashmina Premium", variantInfo: "Cream - All Size", qty: 1, unitPrice: 75000, subtotal: 75000 },
      ],
      notes: "Pelanggan pergi ambil uang dulu",
    },
    {
      id: uuid(), cashierId, customerName: null, customerId: null,
      items: [
        { variantId: "V028", productName: "Sneakers Urban", variantInfo: "Hitam - 41", qty: 1, unitPrice: 349000, subtotal: 349000 },
      ],
      notes: "Menunggu konfirmasi ukuran",
    },
  ];

  for (const h of heldTx) {
    await db.insert(schema.heldTransactions).values({
      id: h.id, cashierId: h.cashierId, customerName: h.customerName,
      customerId: h.customerId, items: h.items, notes: h.notes,
    }).onConflictDoNothing();
  }
  console.log(`  ✅ ${heldTx.length} held transactions`);

  // =============================================
  // Done!
  // =============================================
  console.log("\n" + "=".repeat(50));
  console.log("✨ Mock data seeding complete!");
  console.log("=".repeat(50));
  console.log("\n📊 Summary:");
  console.log("  • 6 categories, 12 products, 61 variants");
  console.log("  • 5 suppliers with category links");
  console.log("  • 8 customers (Bronze → Platinum)");
  console.log(`  • ${orderCount + 1} orders (${orderCount} completed, 1 cancelled)`);
  console.log("  • 8 shifts (7 closed, 1 active today)");
  console.log(`  • ${ftCount} financial transactions`);
  console.log("  • 10 expense categories");
  console.log("  • 5 purchase orders (received, shipped, processing, cancelled)");
  console.log("  • 4 returns (all statuses)");
  console.log("  • 5 promotions (active, expired, upcoming)");
  console.log("  • 10 notifications");
  console.log("  • 20 audit logs");
  console.log("  • 2 stock opnames (completed + in-progress)");
  console.log("  • 4 recurring expenses");
  console.log("  • 7 daily reconciliations");
  console.log("  • 2 held transactions");
  console.log("\n📝 Note: If no users existed, test users were created.");
  console.log("   For proper login, create users via POST /api/auth/sign-up/email");

  process.exit(0);
}

seedMock().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
