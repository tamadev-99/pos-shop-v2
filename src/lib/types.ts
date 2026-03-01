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
  basePrice: number;
  baseCost: number;
  status: "aktif" | "nonaktif";
  variants: ProductVariant[];
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
