export interface ProductVariant {
  id: string;
  sku: string;
  barcode: string;
  color: string;
  size: string;
  stock: number;
  minStock: number;
  buyPrice: number;
  sellPrice: number;
  status: "aktif" | "nonaktif";
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  imageUrl: string | null;
  basePrice: number;
  baseCost: number;
  status: "aktif" | "nonaktif";
  variants: ProductVariant[];
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  color: string;
  size: string;
  price: number;
  originalPrice?: number;
  qty: number;
}

export interface Promotion {
  id: string;
  name: string;
  type: "percentage" | "fixed" | "buy_x_get_y" | "bundle";
  value: number;
  minPurchase: number;
  buyQty: number | null;
  getQty: number | null;
  freeProductId: string | null;
  appliesTo: "all" | "category" | "product";
  targetIds: string[] | null;
}

export function getUniqueColors(product: Product): string[] {
  const colors = product.variants.map((v) => v.color).filter(Boolean);
  return Array.from(new Set(colors));
}

export function getUniqueSizes(product: Product): string[] {
  const sizes = product.variants.map((v) => v.size).filter(Boolean);
  return Array.from(new Set(sizes));
}

export function getVariantByColorSize(
  product: Product,
  color: string,
  size: string
): ProductVariant | undefined {
  return product.variants.find(
    (v) => v.color === color && v.size === size
  );
}
