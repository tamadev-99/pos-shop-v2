"use client";

import { CartPanel, type CartItem } from "@/components/pos/cart-panel";
import { CategoryBar } from "@/components/pos/category-bar";
import { PaymentDialog } from "@/components/pos/payment-dialog";
import { ProductGrid } from "@/components/pos/product-grid";
import { VariantSelector } from "@/components/pos/variant-selector";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type Product, type ProductVariant } from "@/lib/types";
import { Search, ShoppingCart, Pause, Play } from "lucide-react";
import { useMemo, useState, useCallback, useTransition } from "react";
import { cn, formatRupiah } from "@/lib/utils";
import { createOrder, holdTransaction as holdTransactionAction, getHeldTransactions, deleteHeldTransaction } from "@/lib/actions/orders";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DBProduct {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  description: string | null;
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

function mapDBProductToProduct(dbProduct: DBProduct): Product {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    brand: dbProduct.brand,
    category: (dbProduct.category?.name ?? "Lainnya") as Product["category"],
    description: dbProduct.description ?? "",
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

interface POSClientProps {
  initialProducts: DBProduct[];
  customers: { id: string; name: string }[];
}

export default function POSClient({ initialProducts, customers }: POSClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Map DB products to the mock-data Product shape
  const products = useMemo(
    () => initialProducts.map(mapDBProductToProduct),
    [initialProducts]
  );

  // Build dynamic categories from actual product data
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
  const [heldTransactions, setHeldTransactions] = useState<HeldTransaction[]>([]);
  const [heldListOpen, setHeldListOpen] = useState(false);

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
  const tax = Math.round(subtotal * 0.11);
  const total = subtotal + tax + shippingFee;
  const cartItemCount = cart.reduce((sum, i) => sum + i.qty, 0);

  // Find DB product info for a cart item (to get costPrice for the order)
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

  const handlePaymentConfirm = async (paymentMethod: "tunai" | "debit" | "kredit" | "transfer" | "qris" | "ewallet") => {
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
        items: orderItems,
        subtotal,
        taxAmount: tax,
        shippingFee,
        total,
        paymentMethod,
      });

      setPaymentOpen(false);
      setCart([]);
      setCartOpen(false);
      setShippingFee(0);
      setSelectedCustomer("");

      toast.success(`Pesanan ${orderId} berhasil dibuat!`);
      router.refresh();
    } catch (error) {
      toast.error("Gagal membuat pesanan. Silakan coba lagi.");
      console.error("Order creation error:", error);
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
            {heldTransactions.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setHeldListOpen(true)}
                className="relative hidden sm:flex"
              >
                <Pause size={14} />
                Ditahan
                <span className="ml-1 flex items-center justify-center min-w-4 h-4 rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
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
              className="lg:hidden relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] backdrop-blur-xl cursor-pointer hover:bg-white/[0.08] transition-all"
            >
              <ShoppingCart size={18} className="text-accent" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-5 h-5 rounded-full bg-gradient-to-r from-accent to-accent-secondary px-1 text-[10px] font-bold text-white shadow-[0_0_12px_-2px_rgba(16,185,129,0.4)]">
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
          onCheckout={() => setPaymentOpen(true)}
          shippingFee={shippingFee}
          onShippingFeeChange={setShippingFee}
          selectedCustomer={selectedCustomer}
          onCustomerChange={setSelectedCustomer}
          customers={customers}
          onHold={holdTransaction}
          heldCount={heldTransactions.length}
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
          "bg-[#0a0b14]/90 backdrop-blur-2xl",
          "border-l border-white/[0.06]",
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
            setCartOpen(false);
            setPaymentOpen(true);
          }}
          onClose={() => setCartOpen(false)}
          shippingFee={shippingFee}
          onShippingFeeChange={setShippingFee}
          selectedCustomer={selectedCustomer}
          onCustomerChange={setSelectedCustomer}
          customers={customers}
          onHold={holdTransaction}
          heldCount={heldTransactions.length}
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
        onClose={() => setPaymentOpen(false)}
        total={total}
        subtotal={subtotal}
        tax={tax}
        shippingFee={shippingFee}
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
                  className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 hover:bg-white/[0.05] transition-all"
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
    </div>
  );
}
