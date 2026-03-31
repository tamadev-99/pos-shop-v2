import { enforceRouteAccess } from '@/lib/actions/permissions';
import { getPromotions } from "@/lib/actions/promotions";
import { getCategories, getProducts } from "@/lib/actions/products";
import PromosiClient from "./promosi-client";

export default async function PromosiPage() {
  await enforceRouteAccess('/promosi');
  const [promotions, categories, products] = await Promise.all([
    getPromotions(),
    getCategories(),
    getProducts(),
  ]);

  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));
  const productOptions = products.data.map((p) => ({ id: p.id, name: p.name }));

  return (
    <PromosiClient
      initialPromotions={promotions}
      categories={categoryOptions}
      products={productOptions}
    />
  );
}
