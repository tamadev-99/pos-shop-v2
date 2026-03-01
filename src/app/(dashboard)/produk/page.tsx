import { getProducts, getCategories } from "@/lib/actions/products";
import ProdukClient from "./produk-client";

export default async function ProdukPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return <ProdukClient initialProducts={products} categories={categories} />;
}
