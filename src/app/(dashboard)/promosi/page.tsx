import { getPromotions } from "@/lib/actions/promotions";
import PromosiClient from "./promosi-client";

export default async function PromosiPage() {
  const promotions = await getPromotions();
  return <PromosiClient initialPromotions={promotions} />;
}
