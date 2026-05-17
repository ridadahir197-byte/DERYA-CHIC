import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useCart } from "@/store/cart";
import { formatVariation } from "@/lib/variation";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — DERYA Chic" }] }),
  component: CartPage,
});

const vKey = (productId: string, size?: string, color?: string) =>
  `${productId}::${color ?? ""}::${size ?? ""}`;

function CartPage() {
  const navigate = useNavigate();
  const { items, remove, setQty, total } = useCart();
  const [stockMap, setStockMap] = useState<Map<string, number>>(new Map());
  // Product ids that actually have any variant rows tracked
  const [trackedProducts, setTrackedProducts] = useState<Set<string>>(new Set());

  const refreshStock = useCallback(async () => {
    const productIds = Array.from(new Set(items.map((i) => i.id)));
    if (productIds.length === 0) {
      setStockMap(new Map());
      setTrackedProducts(new Set());
      return;
    }
    const { data, error } = await supabase
      .from("product_variants")
      .select("product_id,size,color,stock_quantity")
      .in("product_id", productIds);
    if (error) return;
    const next = new Map<string, number>();
    const tracked = new Set<string>();
    (data ?? []).forEach((v: any) => {
      tracked.add(v.product_id);
      next.set(vKey(v.product_id, v.size, v.color), v.stock_quantity ?? 0);
    });
    setStockMap(next);
    setTrackedProducts(tracked);
  }, [items]);

  useEffect(() => {
    refreshStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const getMax = (id: string, size: string, color?: string): number | null => {
    if (!trackedProducts.has(id)) return null; // untracked → no cap
    return stockMap.get(vKey(id, size, color)) ?? 0;
  };

  const handleInc = (id: string, size: string, qty: number, color?: string) => {
    const max = getMax(id, size, color);
    if (max !== null && qty + 1 > max) {
      toast("Quantité maximale disponible atteinte");
      return;
    }
    setQty(id, size, qty + 1, color);
  };

  const handleProceed = async () => {
    // Live re-validate
    await refreshStock();
    let capped = false;
    let blocked = false;
    items.forEach((i) => {
      const max = getMax(i.id, i.size, i.color);
      if (max === null) return;
      if (i.quantity > max) {
        blocked = true;
        if (max > 0) {
          capped = true;
          setQty(i.id, i.size, max, i.color);
        } else {
          remove(i.id, i.size, i.color);
        }
      }
    });
    if (blocked) {
      toast(capped ? "Quantité maximale disponible atteinte" : "Article épuisé — retiré du panier");
      return;
    }
    navigate({ to: "/checkout" });
  };

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="glass rounded-full p-2.5">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Cart</h1>
      </div>

      {items.length === 0 ? (
        <div className="mt-24 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full glass flex items-center justify-center mb-5">
            <ShoppingBag className="w-8 h-8 text-neon" />
          </div>
          <h3 className="text-xl font-semibold">An empty atelier</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">
            Your cart awaits its first piece. Curate something extraordinary.
          </p>
          <Link
            to="/shop"
            className="mt-6 bg-neon text-neon-foreground rounded-[14px] py-3 px-6 text-sm font-bold"
          >
            Discover the collection
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-3">
            <AnimatePresence>
              {items.map((item) => {
                const max = getMax(item.id, item.size, item.color);
                const atMax = max !== null && item.quantity >= max;
                return (
                <motion.div
                  key={`${item.id}-${item.size}-${item.color ?? ""}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  className="glass rounded-[20px] p-3 flex gap-3"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-24 rounded-[14px] object-cover"
                  />
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm truncate">{item.name}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5 tracking-wide">
                          {formatVariation(item.size, item.color)}
                        </p>
                        {max !== null && (
                          <p className="text-[10px] text-muted-foreground/70 mt-0.5 tracking-[0.14em] uppercase">
                            {max > 0 ? `${max} en stock` : "Épuisé"}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => remove(item.id, item.size, item.color)}
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-1 glass rounded-full px-1 py-1">
                        <button
                          onClick={() => setQty(item.id, item.size, item.quantity - 1, item.color)}
                          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleInc(item.id, item.size, item.quantity, item.color)}
                          disabled={atMax}
                          aria-disabled={atMax}
                          className={`w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 ${
                            atMax ? "opacity-40 pointer-events-none" : ""
                          }`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-neon">
                        {(item.price * item.quantity).toFixed(0)}
                        <span className="text-[10px] font-medium text-neon/70 ml-1 tracking-wider">DH</span>
                      </span>
                    </div>
                  </div>
                </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Totals */}
          <div className="mt-6 glass-strong rounded-[20px] p-5 space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>{total().toFixed(2)} <span className="text-xs">DH</span></span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Shipping</span>
              <span className="text-neon">Complimentary</span>
            </div>
            <div className="border-t border-border pt-3 mt-3 flex justify-between items-baseline">
              <span className="text-sm">Total</span>
              <span className="text-2xl font-bold text-neon">{total().toFixed(2)}<span className="text-sm font-medium text-neon/70 ml-1.5 tracking-wider">DH</span></span>
            </div>
            <button
              onClick={handleProceed}
              className="w-full mt-4 bg-neon text-neon-foreground rounded-[14px] py-4 font-bold text-sm animate-pulse-glow flex items-center justify-center"
            >
              Proceed to Checkout
            </button>
          </div>
          <div className="h-24" />
        </>
      )}
    </div>
  );
}
