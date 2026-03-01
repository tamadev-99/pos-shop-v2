import { getCategories, getProducts } from "@/lib/actions/products";
import KategoriClient from "./kategori-client";

export default async function KategoriPage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);

  // Count products per category
  const categoriesWithCount = categories.map((cat) => ({
    ...cat,
    productCount: products.filter((p) => p.categoryId === cat.id).length,
  }));

  return <KategoriClient categories={categoriesWithCount} />;
}
