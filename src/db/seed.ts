import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client, { schema });

async function seed() {
  console.log("🌱 Seeding database...");

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
  console.log("  ✅ Categories seeded");

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
      id: p.id,
      name: p.name,
      brand: p.brand,
      categoryId: categoryMap[p.category],
      description: "",
      basePrice: p.basePrice,
      baseCost: p.baseCost,
    }).onConflictDoNothing();

    for (const v of p.variants) {
      await db.insert(schema.productVariants).values({
        id: v.id,
        productId: p.id,
        sku: v.sku,
        barcode: v.barcode,
        color: v.color,
        size: v.size,
        stock: v.stock,
        minStock: v.minStock,
        buyPrice: v.buyPrice,
        sellPrice: v.sellPrice,
      }).onConflictDoNothing();
    }
  }
  console.log("  ✅ Products & variants seeded");

  // --- Suppliers ---
  const suppliersData = [
    { id: "SUP001", name: "CV Textile Jaya", contactPerson: "Hendra Wijaya", phone: "081234567890", email: "hendra@textilejaya.co.id", address: "Jl. Industri No. 45, Bandung", cats: ["cat-pria", "cat-wanita"], joinDate: "2024-06-15" },
    { id: "SUP002", name: "PT Hijab Collection", contactPerson: "Sari Indah", phone: "082345678901", email: "sari@hijabcollection.id", address: "Jl. Fashion Raya No. 12, Jakarta Selatan", cats: ["cat-hijab", "cat-wanita"], joinDate: "2024-08-20" },
    { id: "SUP003", name: "UD Sepatu Nusantara", contactPerson: "Bambang Suryadi", phone: "083456789012", email: "bambang@sepatunusantara.com", address: "Jl. Cibaduyut No. 78, Bandung", cats: ["cat-sepatu"], joinDate: "2024-09-10" },
    { id: "SUP004", name: "PT Aksesoris Indo", contactPerson: "Linda Hartono", phone: "084567890123", email: "linda@aksesorisindo.id", address: "Jl. Tanah Abang No. 33, Jakarta Pusat", cats: ["cat-aksesoris", "cat-tas"], joinDate: "2025-01-05" },
    { id: "SUP005", name: "CV Tas Kreatif", contactPerson: "Rina Susanto", phone: "085678901234", email: "rina@taskriya.com", address: "Jl. Industri Kecil No. 56, Surabaya", cats: ["cat-tas"], joinDate: "2025-03-18" },
  ];

  for (const s of suppliersData) {
    await db.insert(schema.suppliers).values({
      id: s.id,
      name: s.name,
      contactPerson: s.contactPerson,
      phone: s.phone,
      email: s.email,
      address: s.address,
      joinDate: s.joinDate,
    }).onConflictDoNothing();

    for (const catId of s.cats) {
      await db.insert(schema.supplierCategories).values({
        supplierId: s.id,
        categoryId: catId,
      }).onConflictDoNothing();
    }
  }
  console.log("  ✅ Suppliers seeded");

  // --- Customers ---
  const customersData = [
    { id: "C-001", name: "Aisyah Putri", phone: "081234567891", email: "aisyah@email.com", address: "Jl. Sudirman No. 10, Jakarta", birthDate: "1995-03-15", totalSpent: 4850000, points: 4850, tier: "Gold" as const, joinDate: "2025-01-10", lastPurchase: "2026-02-28" },
    { id: "C-002", name: "Budi Santoso", phone: "082345678902", email: "budi.s@email.com", address: "Jl. Gatot Subroto No. 25, Bandung", birthDate: "1990-07-22", totalSpent: 3200000, points: 3200, tier: "Silver" as const, joinDate: "2025-03-05", lastPurchase: "2026-02-27" },
    { id: "C-003", name: "Dewi Lestari", phone: "083456789013", email: "dewi.l@email.com", address: "Jl. Asia Afrika No. 5, Bandung", birthDate: "1988-11-08", totalSpent: 8750000, points: 8750, tier: "Platinum" as const, joinDate: "2024-09-15", lastPurchase: "2026-02-26" },
    { id: "C-004", name: "Rini Wulandari", phone: "084567890124", email: "rini.w@email.com", address: "Jl. Braga No. 18, Bandung", birthDate: "1992-05-30", totalSpent: 2100000, points: 2100, tier: "Silver" as const, joinDate: "2025-06-20", lastPurchase: "2026-02-25" },
    { id: "C-005", name: "Ahmad Fauzi", phone: "085678901235", email: "ahmad.f@email.com", address: "Jl. Dago No. 42, Bandung", birthDate: "1993-12-01", totalSpent: 1450000, points: 1450, tier: "Bronze" as const, joinDate: "2025-09-12", lastPurchase: "2026-02-24" },
    { id: "C-006", name: "Siti Rahayu", phone: "086789012346", email: "siti.r@email.com", address: "Jl. Merdeka No. 7, Jakarta", birthDate: "1997-08-19", totalSpent: 5600000, points: 5600, tier: "Gold" as const, joinDate: "2025-02-14", lastPurchase: "2026-02-23" },
    { id: "C-007", name: "Rizky Hidayat", phone: "087890123457", email: "rizky.h@email.com", address: "Jl. Setiabudi No. 33, Bandung", birthDate: "1991-04-25", totalSpent: 980000, points: 980, tier: "Bronze" as const, joinDate: "2025-11-08", lastPurchase: "2026-02-22" },
    { id: "C-008", name: "Nurul Aini", phone: "088901234568", email: "nurul.a@email.com", address: "Jl. Cihampelas No. 60, Bandung", birthDate: "1996-01-14", totalSpent: 3800000, points: 3800, tier: "Silver" as const, joinDate: "2025-04-30", lastPurchase: "2026-02-20" },
  ];

  for (const c of customersData) {
    await db.insert(schema.customers).values(c).onConflictDoNothing();
  }
  console.log("  ✅ Customers seeded");

  // --- Default Store Settings ---
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
  console.log("  ✅ Store settings seeded");

  console.log("\n✨ Seeding complete!");
  console.log("\n📝 Note: Users are created via better-auth signup.");
  console.log("   Use the app's signup or create users manually via the API.");
  console.log("   Default test credentials can be created by calling:");
  console.log("   POST /api/auth/sign-up/email with { name, email, password }");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
