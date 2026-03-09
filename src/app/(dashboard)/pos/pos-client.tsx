"use client";

import { CartPanel } from "@/components/pos/cart-panel";
import { CategoryBar } from "@/components/pos/category-bar";
import { PaymentDialog } from "@/components/pos/payment-dialog";
import { ProductGrid } from "@/components/pos/product-grid";
import { VariantSelector } from "@/components/pos/variant-selector";
import { ReceiptDialog } from "@/components/pos/receipt-dialog";
import { BarcodeScannerDialog } from "@/components/pos/barcode-scanner";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type Product, type ProductVariant, type CartItem, type Promotion } from "@/lib/types";
import { Search, ShoppingCart, Pause, Play, ScanBarcode } from "lucide-react";
import { useMemo, useState, useCallback, useTransition, useEffect } from "react";
import { cn, formatRupiah } from "@/lib/utils";
import { createOrder, holdTransaction as holdTransactionAction, getHeldTransactions, deleteHeldTransaction } from "@/lib/actions/orders";
import { redeemPoints } from "@/lib/actions/customers";
import { useAuth } from "@/components/providers/auth-provider";
import { getCurrentShift } from "@/lib/actions/shifts";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DBProduct {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  description: string | null;
  imageUrl: string | null;
  basePrice: number;
  baseCost: number;
  status: "aktif" | "nonaktif";
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    createdAt: Date;
  } | null;
  variants: {
    id: string;
    productId: string;
    sku: string;
    barcode: string;
    color: string;
    size: string;
    stock: number;
    minStock: number;
    buyPrice: number;
    sellPrice: number;
    status: "aktif" | "nonaktif";
    createdAt: Date;
  }[];
}

interface HeldTransaction {
  id: string;
  items: CartItem[];
  customer: string;
  shippingFee: number;
  note: string;
  timestamp: string;
}


interface CustomerData {
  id: string;
  name: string;
  phone: string;
  points: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  totalSpent: number;
}

const TIER_DISCOUNTS: Record<string, number> = {
  Bronze: 0,
  Silver: 2,
  Gold: 5,
  Platinum: 10,
};

function mapDBProductToProduct(dbProduct: DBProduct): Product {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    brand: dbProduct.brand,
    category: (dbProduct.category?.name ?? "Lainnya") as Product["category"],
    description: dbProduct.description ?? "",
    imageUrl: dbProduct.imageUrl ?? null,
    basePrice: dbProduct.basePrice,
    baseCost: dbProduct.baseCost,
    status: dbProduct.status,
    variants: dbProduct.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      barcode: v.barcode,
      color: v.color,
      size: v.size,
      stock: v.stock,
      minStock: v.minStock,
      buyPrice: v.buyPrice,
      sellPrice: v.sellPrice,
      status: v.status,
    })),
  };
}

interface StoreSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  taxRate: number;
  taxIncluded: string;
  receiptHeader: string;
  receiptFooter: string;
  [key: string]: any;
}

interface POSClientProps {
  initialProducts: DBProduct[];
  customers: CustomerData[];
  promotions: Promotion[];
  printerConfig?: { type: string; target: string; paperWidth: string };
  storeSettings?: StoreSettings;
  initialHeldTransactions?: HeldTransaction[];
}

export default function POSClient({ initialProducts, customers, promotions, printerConfig, storeSettings, initialHeldTransactions = [] }: POSClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [activeShiftId, setActiveShiftId] = useState<string | null>(null);

  // Fetch active shift for current user
  useEffect(() => {
    if (user?.id) {
      getCurrentShift(user.id).then((shift) => {
        setActiveShiftId(shift?.id || null);
      });
    }
  }, [user?.id]);

  const products = useMemo(
    () => initialProducts.map(mapDBProductToProduct),
    [initialProducts]
  );

  const categoryOptions = useMemo(() => {
    const uniqueCategories = [
      ...new Set(initialProducts.map((p) => p.category?.name).filter(Boolean)),
    ] as string[];
    return [
      { id: "all", label: "Semua" },
      ...uniqueCategories.map((name) => ({ id: name, label: name })),
    ];
  }, [initialProducts]);

  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variantOpen, setVariantOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [shippingFee, setShippingFee] = useState(0);
  const [heldTransactions, setHeldTransactions] = useState<HeldTransaction[]>(initialHeldTransactions);
  const [heldListOpen, setHeldListOpen] = useState(false);

  // Barcode scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);

  // Promotion & discount state
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  // Receipt state
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    items: { name: string; variantInfo: string; qty: number; price: number }[];
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    shippingFee: number;
    total: number;
    paymentMethod: string;
    customerName: string;
    customerPhone?: string;
    cashPaid?: number;
    changeAmount?: number;
  } | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = category === "all" || p.category === category;
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch && p.status === "aktif";
    });
  }, [products, category, search]);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setVariantOpen(true);
  };

  const addToCart = (product: Product, variant: ProductVariant) => {
    const cartItemId = `${product.id}-${variant.id}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItemId ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          productId: product.id,
          variantId: variant.id,
          name: product.name,
          color: variant.color,
          size: variant.size,
          price: variant.sellPrice,
          qty: 1,
        },
      ];
    });
    setVariantOpen(false);
  };

  // Barcode/SKU lookup and auto-add-to-cart
  const handleBarcodeScan = useCallback((barcode: string) => {
    // Search all products for matching SKU or barcode
    for (const product of products) {
      for (const variant of product.variants) {
        if (
          (variant.barcode && variant.barcode.toLowerCase() === barcode.toLowerCase()) ||
          (variant.sku && variant.sku.toLowerCase() === barcode.toLowerCase())
        ) {
          if (variant.status !== "aktif" || variant.stock <= 0) {
            const msg = `${product.name} (${variant.color}/${variant.size}) — stok habis`;
            setScanResult({ success: false, message: msg });
            toast.error(msg);
            return;
          }
          addToCart(product, variant);
          const msg = `${product.name} (${variant.color}/${variant.size}) ditambahkan`;
          setScanResult({ success: true, message: msg });
          toast.success(msg);
          return;
        }
      }
    }
    // Not found
    setScanResult({ success: false, message: `Barcode "${barcode}" tidak ditemukan` });
    toast.error(`Barcode "${barcode}" tidak ditemukan`);
  }, [products, addToCart]);

  // USB/Bluetooth barcode scanner keyboard hook — always active on POS page
  useBarcodeScanner(handleBarcodeScan);

  const updateQty = (id: string, qty: number) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, qty } : item))
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const findDBVariant = useCallback(
    (variantId: string) => {
      for (const p of initialProducts) {
        const v = p.variants.find((v) => v.id === variantId);
        if (v) return { product: p, variant: v };
      }
      return null;
    },
    [initialProducts]
  );

  // Discount calculations
  const selectedCustomerData = customers.find((c) => c.id === selectedCustomer);

  const tierDiscountPct = selectedCustomerData ? (TIER_DISCOUNTS[selectedCustomerData.tier] || 0) : 0;
  const tierDiscount = Math.round(subtotal * (tierDiscountPct / 100));

  function calcPromoDiscount(promo: Promotion): number {
    if (subtotal < (promo.minPurchase || 0)) return 0;

    // Filter items by appliesTo scope
    let eligibleItems = cart;
    if (promo.appliesTo === "category" && promo.targetIds && promo.targetIds.length > 0) {
      eligibleItems = cart.filter((item) => {
        const dbData = findDBVariant(item.variantId);
        return dbData && promo.targetIds!.includes(dbData.product.categoryId);
      });
    } else if (promo.appliesTo === "product" && promo.targetIds && promo.targetIds.length > 0) {
      eligibleItems = cart.filter((item) => promo.targetIds!.includes(item.productId));
    }

    if (eligibleItems.length === 0) return 0;
    const eligibleSubtotal = eligibleItems.reduce((sum, i) => sum + i.price * i.qty, 0);

    switch (promo.type) {
      case "percentage":
        return Math.round(eligibleSubtotal * (promo.value / 100));
      case "fixed":
        return Math.min(promo.value, eligibleSubtotal);
      case "buy_x_get_y": {
        if (!promo.buyQty || !promo.getQty) return 0;
        const totalQty = eligibleItems.reduce((s, i) => s + i.qty, 0);
        if (totalQty === 0) return 0;
        const sets = Math.floor(totalQty / (promo.buyQty + promo.getQty));
        const avgPrice = eligibleSubtotal / totalQty;
        return Math.round(sets * promo.getQty * avgPrice);
      }
      case "bundle":
        return Math.min(promo.value, eligibleSubtotal);
      default:
        return 0;
    }
  }

  // Auto-apply: pick the best promo automatically
  const autoAppliedPromo = useMemo(() => {
    if (cart.length === 0 || promotions.length === 0) return null;
    let best: Promotion | null = null;
    let bestDisc = 0;
    for (const promo of promotions) {
      const disc = calcPromoDiscount(promo);
      if (disc > bestDisc) {
        bestDisc = disc;
        best = promo;
      }
    }
    return best;
  }, [cart, promotions, subtotal]);

  // Use manual selection if set, otherwise auto-apply
  const effectivePromo = selectedPromo || autoAppliedPromo;
  const isAutoPromo = !selectedPromo && !!autoAppliedPromo;
  const promoDiscount = effectivePromo ? calcPromoDiscount(effectivePromo) : 0;

  // Points: 1 point = Rp 1, cannot exceed subtotal
  const maxRedeemable = Math.min(selectedCustomerData?.points || 0, subtotal);
  const pointsDiscount = Math.min(pointsToRedeem, maxRedeemable);

  // Best of tier vs promo (don't stack), plus points
  const bestBaseDiscount = Math.max(tierDiscount, promoDiscount);
  const discountAmount = bestBaseDiscount + pointsDiscount;

  const taxRate = storeSettings?.taxRate ?? 11;
  const taxMode = storeSettings?.taxIncluded ?? "no";

  // Calculate raw subtotal minus discounts
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);

  let tax = 0;
  let total = discountedSubtotal + shippingFee;

  if (taxMode === "exclude") {
    // Pajak Ditambahkan (di luar harga normal)
    tax = Math.round(discountedSubtotal * (taxRate / 100));
    total += tax;
  } else if (taxMode === "include") {
    // Pajak Sudah Termasuk (harga barang = DPP + PPn)
    // DPP = Harga / (1 + Rate)
    // Tax = Harga - DPP
    const dpp = discountedSubtotal / (1 + (taxRate / 100));
    tax = Math.round(discountedSubtotal - dpp);
    // Total remains discountedSubtotal + shippingFee (since tax is inside)
  }
  // If 'no', tax is 0 and total is just discountedSubtotal + shippingFee

  const cartItemCount = cart.reduce((sum, i) => sum + i.qty, 0);

  // Bug Fix #6: Block checkout without active shift
  const tryCheckout = useCallback(() => {
    if (!activeShiftId) {
      toast.error("Anda harus membuka shift terlebih dahulu sebelum melakukan transaksi.", {
        description: "Buka shift di halaman Manajemen Shift.",
        duration: 5000,
      });
      return;
    }
    return true;
  }, [activeShiftId]);

  const handlePaymentConfirm = async (paymentMethod: "tunai" | "debit" | "kredit" | "transfer" | "qris" | "ewallet", cashPaid?: number, changeAmount?: number, splitNote?: string) => {
    try {
      const orderItems = cart.map((item) => {
        const found = findDBVariant(item.variantId);
        return {
          variantId: item.variantId,
          productName: item.name,
          variantInfo: `${item.color} - ${item.size}`,
          qty: item.qty,
          unitPrice: item.price,
          costPrice: found?.variant.buyPrice ?? 0,
        };
      });

      const orderId = await createOrder({
        customerId: selectedCustomer || undefined,
        customerName: selectedCustomerData?.name || "Pelanggan Umum",
        items: orderItems,
        subtotal,
        discountAmount,
        taxAmount: tax,
        shippingFee,
        total,
        paymentMethod,
        cashierId: user?.id,
        shiftId: activeShiftId || undefined,
        notes: splitNote || undefined,
      });

      // Redeem points if used
      if (selectedCustomer && pointsToRedeem > 0) {
        await redeemPoints(selectedCustomer, pointsToRedeem);
      }

      setLastOrderId(orderId);

      // Show receipt
      setReceiptData({
        items: cart.map((item) => ({
          name: item.name,
          variantInfo: `${item.color} - ${item.size}`,
          qty: item.qty,
          price: item.price,
        })),
        subtotal,
        discountAmount,
        taxAmount: tax,
        shippingFee,
        total,
        paymentMethod,
        customerName: selectedCustomerData?.name || "Pelanggan Umum",
        customerPhone: selectedCustomerData?.phone,
        cashPaid,
        changeAmount,
      });
      setReceiptOpen(true);
      setPaymentOpen(false);

      toast.success(`Pesanan ${orderId} berhasil dibuat!`);
      router.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Gagal membuat pesanan. Silakan coba lagi.";
      toast.error(message);
      console.error("Order creation error:", error);
    }
  };

  const handlePaymentClose = () => {
    setPaymentOpen(false);
    if (lastOrderId) {
      // Reset all state after payment success
      setCart([]);
      setCartOpen(false);
      setShippingFee(0);
      setSelectedCustomer("");
      setSelectedPromo(null);
      setPointsToRedeem(0);
      setLastOrderId(null);
    }
  };

  const holdTransaction = async () => {
    if (cart.length === 0) return;

    try {
      const heldId = await holdTransactionAction({
        customerName: selectedCustomer ? undefined : "Pelanggan Umum",
        customerId: selectedCustomer || undefined,
        items: cart,
        shippingFee,
      });

      const held: HeldTransaction = {
        id: heldId,
        items: [...cart],
        customer: selectedCustomer,
        shippingFee,
        note: "",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      };
      setHeldTransactions((prev) => [...prev, held]);
      setCart([]);
      setShippingFee(0);
      setSelectedCustomer("");
      setSelectedPromo(null);
      setPointsToRedeem(0);
      toast.success("Transaksi berhasil ditahan");
    } catch (error) {
      toast.error("Gagal menahan transaksi");
      console.error("Hold transaction error:", error);
    }
  };

  const resumeTransaction = async (held: HeldTransaction) => {
    try {
      await deleteHeldTransaction(held.id);
      setCart(held.items);
      setSelectedCustomer(held.customer);
      setShippingFee(held.shippingFee);
      setHeldTransactions((prev) => prev.filter((h) => h.id !== held.id));
      setHeldListOpen(false);
      toast.success("Transaksi dilanjutkan");
    } catch (error) {
      toast.error("Gagal melanjutkan transaksi");
      console.error("Resume transaction error:", error);
    }
  };

  // Build receipt data for the payment dialog
  const paymentReceiptData = lastOrderId
    ? {
      items: cart.map((item) => ({ name: `${item.name} (${item.color}/${item.size})`, qty: item.qty, price: item.price })),
      customerName: selectedCustomerData?.name || "Pelanggan Umum",
      subtotal,
      discountAmount,
      tax,
      shippingFee,
      total,
      paymentMethod: "",
      storeName: storeSettings?.storeName || "Toko Fashion",
      storeAddress: storeSettings?.receiptAddress || storeSettings?.storeAddress || "",
      storePhone: storeSettings?.storePhone || "",
      receiptHeader: storeSettings?.receiptHeader || storeSettings?.storeName || "Toko Fashion",
      receiptFooter: storeSettings?.receiptFooter || "Terima kasih atas kunjungan Anda!",
    }
    : null;

  return (
    <div className="flex h-screen relative">
      {/* Left — Products */}
      <div className="flex-1 flex flex-col p-3 md:p-4 gap-3 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 animate-fade-up">
          <Input
            placeholder="Cari produk atau brand..."
            icon={<Search size={15} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setScanResult(null); setScannerOpen(true); }}
              className="flex px-2.5 sm:px-3"
              title="Barcode Scanner"
            >
              <ScanBarcode size={16} />
              <span className="hidden sm:inline">Scan</span>
            </Button>
            {heldTransactions.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setHeldListOpen(true)}
                className="relative flex px-2.5 sm:px-3"
              >
                <Pause size={14} />
                <span className="hidden sm:inline">Ditahan</span>
                <span className="absolute -top-1.5 -right-1.5 sm:static sm:ml-1 flex items-center justify-center min-w-4 h-4 rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white shadow-[0_0_12px_-2px_rgba(245,158,11,0.4)] sm:shadow-none">
                  {heldTransactions.length}
                </span>
              </Button>
            )}
            <span className="text-[11px] text-muted-dim font-num hidden sm:block">
              {filteredProducts.length} produk
            </span>
            {/* Mobile cart toggle */}
            <button
              onClick={() => setCartOpen(true)}
              className="lg:hidden relative flex items-center justify-center w-10 h-10 rounded-xl bg-surface border border-border backdrop-blur-xl cursor-pointer hover:bg-surface-hover transition-all"
            >
              <ShoppingCart size={18} className="text-accent" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-5 h-5 rounded-full bg-gradient-to-r from-accent to-accent-hover px-1 text-[10px] font-bold text-white shadow-[0_0_12px_-2px_rgba(16,185,129,0.4)]">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
          <CategoryBar active={category} onChange={setCategory} categories={categoryOptions} />
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto pr-1 animate-fade-in" style={{ animationDelay: "120ms" }}>
          <ProductGrid products={filteredProducts} onSelectProduct={handleSelectProduct} />
        </div>
      </div>

      {/* Right — Cart (Desktop) */}
      <div className="hidden lg:block w-[340px] shrink-0">
        <CartPanel
          items={cart}
          onUpdateQty={updateQty}
          onRemove={removeItem}
          onClear={clearCart}
          onCheckout={() => { if (tryCheckout()) setPaymentOpen(true); }}
          shippingFee={shippingFee}
          onShippingFeeChange={setShippingFee}
          selectedCustomer={selectedCustomer}
          onCustomerChange={(id) => {
            setSelectedCustomer(id);
            setPointsToRedeem(0);
          }}
          customers={customers}
          onHold={holdTransaction}
          heldCount={heldTransactions.length}
          promotions={promotions}
          selectedPromo={effectivePromo}
          onPromoChange={setSelectedPromo}
          customerTier={selectedCustomerData?.tier}
          tierDiscountPct={tierDiscountPct}
          customerPoints={selectedCustomerData?.points}
          pointsToRedeem={pointsToRedeem}
          onPointsRedeemChange={setPointsToRedeem}
          discountAmount={discountAmount}
          taxAmount={tax}
          taxMode={taxMode}
          calculatedSubtotal={discountedSubtotal}
          calculatedTotal={total}
          isAutoPromo={isAutoPromo}
        />
      </div>

      {/* Mobile cart overlay */}
      {cartOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-md animate-fade-in"
          onClick={() => setCartOpen(false)}
        />
      )}

      {/* Mobile cart drawer */}
      <div
        className={cn(
          "lg:hidden fixed top-0 right-0 bottom-0 z-50 w-[320px] max-w-[85vw]",
          "bg-background-secondary/90 backdrop-blur-2xl",
          "border-l border-border",
          "shadow-[-4px_0_32px_-4px_rgba(0,0,0,0.4)]",
          "transition-transform duration-300 ease-out",
          cartOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <CartPanel
          items={cart}
          onUpdateQty={updateQty}
          onRemove={removeItem}
          onClear={clearCart}
          onCheckout={() => {
            if (tryCheckout()) {
              setCartOpen(false);
              setPaymentOpen(true);
            }
          }}
          onClose={() => setCartOpen(false)}
          shippingFee={shippingFee}
          onShippingFeeChange={setShippingFee}
          selectedCustomer={selectedCustomer}
          onCustomerChange={(id) => {
            setSelectedCustomer(id);
            setPointsToRedeem(0);
          }}
          customers={customers}
          onHold={holdTransaction}
          heldCount={heldTransactions.length}
          promotions={promotions}
          selectedPromo={effectivePromo}
          onPromoChange={setSelectedPromo}
          customerTier={selectedCustomerData?.tier}
          tierDiscountPct={tierDiscountPct}
          customerPoints={selectedCustomerData?.points}
          pointsToRedeem={pointsToRedeem}
          onPointsRedeemChange={setPointsToRedeem}
          discountAmount={discountAmount}
          taxAmount={tax}
          taxMode={taxMode}
          calculatedSubtotal={discountedSubtotal}
          calculatedTotal={total}
          isAutoPromo={isAutoPromo}
        />
      </div>

      {/* Variant Selector */}
      <VariantSelector
        open={variantOpen}
        onClose={() => setVariantOpen(false)}
        product={selectedProduct}
        onAddToCart={addToCart}
      />

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentOpen}
        onClose={handlePaymentClose}
        total={total}
        subtotal={discountedSubtotal}
        tax={tax}
        shippingFee={shippingFee}
        discountAmount={discountAmount}
        taxMode={taxMode}
        onConfirm={handlePaymentConfirm}
      />

      {/* Held Transactions Dialog */}
      <Dialog open={heldListOpen} onClose={() => setHeldListOpen(false)} className="max-w-md">
        <DialogClose onClose={() => setHeldListOpen(false)} />
        <DialogHeader>
          <DialogTitle>Transaksi Ditahan ({heldTransactions.length})</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {heldTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Pause size={28} className="mx-auto mb-2 text-muted-dim/30" />
              <p className="text-xs text-muted-foreground">Tidak ada transaksi ditahan</p>
            </div>
          ) : (
            heldTransactions.map((held) => {
              const heldTotal = held.items.reduce((sum, i) => sum + i.price * i.qty, 0);
              return (
                <div
                  key={held.id}
                  className="flex items-center justify-between rounded-xl bg-surface border border-border p-3 hover:bg-surface transition-all"
                >
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {held.items.length} item • {formatRupiah(heldTotal)}
                    </p>
                    <p className="text-[10px] text-muted-dim mt-0.5">
                      Ditahan pukul {held.timestamp}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => resumeTransaction(held)}
                  >
                    <Play size={12} />
                    Lanjutkan
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </Dialog>

      {/* Barcode Scanner Dialog */}
      <BarcodeScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScan}
        lastResult={scanResult}
      />

      {/* Receipt Dialog */}
      {lastOrderId && receiptData && (
        <ReceiptDialog
          open={receiptOpen}
          onClose={() => {
            setReceiptOpen(false);
            // Reset cart after viewing receipt
            setCart([]);
            setCartOpen(false);
            setShippingFee(0);
            setSelectedCustomer("");
            setSelectedPromo(null);
            setPointsToRedeem(0);
            setLastOrderId(null);
            setReceiptData(null);
          }}
          orderId={lastOrderId}
          items={receiptData.items}
          subtotal={receiptData.subtotal}
          discountAmount={receiptData.discountAmount}
          taxAmount={receiptData.taxAmount}
          shippingFee={receiptData.shippingFee}
          total={receiptData.total}
          paymentMethod={receiptData.paymentMethod}
          customerName={receiptData.customerName}
          customerPhone={receiptData.customerPhone}
          cashPaid={receiptData.cashPaid}
          changeAmount={receiptData.changeAmount}
          cashierName={user?.name || "Kasir"}
          storeName={storeSettings?.storeName}
          storeAddress={storeSettings?.receiptAddress}
          storePhone={storeSettings?.storePhone}
          receiptHeader={storeSettings?.receiptHeader}
          receiptFooter={storeSettings?.receiptFooter}
          printerType={storeSettings?.printerType}
          printerTarget={storeSettings?.printerTarget}
          receiptWidth={storeSettings?.receiptWidth}
          taxName={storeSettings?.taxName || "PPN"}
        />
      )}
    </div>
  );
}
