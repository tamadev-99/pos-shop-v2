import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi"),
  brand: z.string().min(1, "Brand wajib diisi"),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  description: z.string().optional(),
  basePrice: z.number().min(0),
  baseCost: z.number().min(0),
  variants: z.array(z.object({
    sku: z.string().min(1),
    barcode: z.string().min(1),
    color: z.string().min(1),
    size: z.string().min(1),
    stock: z.number().min(0),
    minStock: z.number().min(0),
    buyPrice: z.number().min(0),
    sellPrice: z.number().min(0),
  })).optional(),
});

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Nama pelanggan wajib diisi"),
  phone: z.string().min(1, "Nomor telepon wajib diisi"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  birthDate: z.string().optional(),
});

export const createSupplierSchema = z.object({
  name: z.string().min(1, "Nama supplier wajib diisi"),
  contactPerson: z.string().min(1, "Contact person wajib diisi"),
  phone: z.string().min(1, "Nomor telepon wajib diisi"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
});

export const createOrderSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().default("Pelanggan Umum"),
  items: z.array(z.object({
    variantId: z.string(),
    productName: z.string(),
    variantInfo: z.string(),
    qty: z.number().min(1),
    unitPrice: z.number().min(0),
    costPrice: z.number().min(0),
  })).min(1, "Minimal 1 item"),
  subtotal: z.number(),
  discountAmount: z.number().default(0),
  taxAmount: z.number().default(0),
  shippingFee: z.number().default(0),
  total: z.number(),
  paymentMethod: z.enum(["tunai", "debit", "kredit", "transfer", "qris", "ewallet"]),
  notes: z.string().optional(),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1),
  expectedDate: z.string().optional(),
  items: z.array(z.object({
    variantId: z.string(),
    productName: z.string(),
    variantInfo: z.string(),
    qty: z.number().min(1),
    unitCost: z.number().min(0),
  })).min(1),
  notes: z.string().optional(),
});

export const createReturnSchema = z.object({
  orderId: z.string().min(1),
  customerId: z.string().optional(),
  reason: z.string().min(1, "Alasan retur wajib diisi"),
  refundMethod: z.enum(["tunai", "transfer", "poin"]).optional(),
  items: z.array(z.object({
    variantId: z.string(),
    productName: z.string(),
    variantInfo: z.string().optional(),
    qty: z.number().min(1),
    unitPrice: z.number().min(0),
  })).min(1),
});

export const createPromotionSchema = z.object({
  name: z.string().min(1, "Nama promosi wajib diisi"),
  description: z.string().optional(),
  type: z.enum(["percentage", "fixed", "buy_x_get_y", "bundle"]),
  value: z.number().min(0),
  minPurchase: z.number().min(0).optional(),
  buyQty: z.number().min(1).optional(),
  getQty: z.number().min(1).optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  appliesTo: z.enum(["all", "category", "product"]).default("all"),
  targetIds: z.array(z.string()).optional(),
});

export const createFinancialTransactionSchema = z.object({
  date: z.string().min(1),
  type: z.enum(["masuk", "keluar"]),
  category: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().min(0),
});
