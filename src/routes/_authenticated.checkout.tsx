import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Truck, Zap, Banknote, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/store/cart";
import { formatVariation } from "@/lib/variation";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({ meta: [{ title: "Checkout — DERYA Chic" }] }),
  component: CheckoutPage,
});

const SHIPPING = [
  { id: "tetouan", label: "Livraison à Tétouan", desc: "24 hours", cost: 20, icon: Zap },
  { id: "tanger", label: "Livraison à Tanger", desc: "24–48 hours", cost: 35, icon: Truck },
  { id: "maroc", label: "Livraison dans toutes les villes", desc: "2–4 days", cost: 40, icon: Truck },
];

const infoSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required").max(120),
  phone: z.string().trim().min(8, "Valid phone required").max(20),
  address: z.string().trim().min(5, "Address required").max(200),
  city: z.string().trim().min(2, "City required").max(80),
  notes: z.string().trim().max(500).optional(),
});

function CheckoutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { items, total, clear, setQty, remove } = useCart();
  const [step, setStep] = useState(0);
  const [info, setInfo] = useState({ full_name: "", phone: "", address: "", city: "", notes: "" });
  const [shipping, setShipping] = useState("tetouan");
  const [busy, setBusy] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);

  // Prefill from profile
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setInfo((s) => ({
          ...s,
          full_name: data.full_name ?? s.full_name,
          phone: data.phone ?? s.phone,
          address: data.address ?? s.address,
          city: data.city ?? s.city,
        }));
      }
    });
  }, [user]);

  const subtotal = useMemo(() => total(), [items]);
  const shippingCost = SHIPPING.find((s) => s.id === shipping)?.cost ?? 0;
  const grand = subtotal + shippingCost;

  if (items.length === 0 && step < 3 && !successOrderId) {
    return (
      <div className="px-5 pt-10 text-center">
        <p className="text-sm text-muted-foreground">Your cart is empty.</p>
        <Link to="/shop" className="mt-4 inline-block text-sm underline">Browse the collection</Link>
      </div>
    );
  }

  const submitOrder = async () => {
    setBusy(true);
    try {
      // Pre-validate stock for every variant in cart
      const productIds = Array.from(new Set(items.map((i) => i.id)));
      const { data: vrows, error: vErr } = await supabase
        .from("product_variants")
        .select("product_id,size,color,stock_quantity")
        .in("product_id", productIds);
      if (vErr) throw vErr;

      const stockMap = new Map<string, number>();
      (vrows ?? []).forEach((v: any) => {
        stockMap.set(`${v.product_id}::${v.color ?? ""}::${v.size ?? ""}`, v.stock_quantity ?? 0);
      });

      let blocked = false;
      let capped = false;
      for (const i of items) {
        const hasVariantRows = (vrows ?? []).some((v: any) => v.product_id === i.id);
        if (!hasVariantRows) continue;
        const key = `${i.id}::${i.color ?? ""}::${i.size ?? ""}`;
        const available = stockMap.get(key) ?? 0;
        if (i.quantity > available) {
          blocked = true;
          if (available > 0) {
            capped = true;
            setQty(i.id, i.size, available, i.color);
          } else {
            remove(i.id, i.size, i.color);
          }
        }
      }
      if (blocked) {
        toast(capped ? "Quantité maximale disponible atteinte" : "Article épuisé — retiré du panier");
        setBusy(false);
        return;
      }

      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user!.id,
          customer_name: info.full_name,
          phone: info.phone,
          address: info.address,
          city: info.city,
          notes: info.notes || null,
          shipping_method: shipping,
          shipping_cost: shippingCost,
          subtotal,
          total: grand,
        })
        .select()
        .single();
      if (error) throw error;

      const lineItems = items.map((i) => ({
        order_id: order.id,
        product_id: i.id,
        name: i.name,
        price: i.price,
        size: i.size || null,
        color: i.color || null,
        quantity: i.quantity,
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(lineItems);
      if (itemsErr) throw itemsErr;

      // Persist updated profile
      await supabase.from("profiles").upsert({
        id: user!.id,
        email: user!.email,
        full_name: info.full_name,
        phone: info.phone,
        address: info.address,
        city: info.city,
      });

      clear();
      setSuccessOrderId(order.id);
      // Hold overlay then redirect
      setTimeout(() => {
        navigate({ to: "/orders/$id", params: { id: order.id } });
      }, 2200);
    } catch (e: any) {
      toast.error(e.message ?? "Could not place order");
      setBusy(false);
    }
  };

  const next = () => {
    if (step === 0) {
      const r = infoSchema.safeParse(info);
      if (!r.success) {
        toast.error(r.error.issues[0].message);
        return;
      }
    }
    if (step === 2) return submitOrder();
    setStep((s) => s + 1);
  };

  return (
    <div className="px-5 lg:px-10 pt-6 max-w-3xl mx-auto pb-32">
      <div className="flex items-center gap-3">
        <Link to="/cart" className="glass rounded-full p-2.5"><ArrowLeft className="w-4 h-4" /></Link>
        <h1 className="font-display text-3xl tracking-[0.04em]">Checkout</h1>
      </div>

      {/* Stepper */}
      <div className="mt-8 flex items-center gap-2">
        {["Information", "Shipping", "Payment"].map((label, i) => (
          <div key={label} className="flex-1 flex items-center gap-2">
            <div
              className={`flex-1 h-1 rounded-full transition-colors ${
                i <= step ? "bg-foreground" : "bg-border"
              }`}
            />
            <span
              className={`text-[10px] uppercase tracking-[0.22em] ${
                i <= step ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25 }}
          className="mt-8 grid lg:grid-cols-[1fr_360px] gap-8"
        >
          <div>
            {step === 0 && (
              <div className="space-y-3">
                <h2 className="font-display text-xl mb-4">Customer information</h2>
                <Input label="Full name" value={info.full_name} onChange={(v) => setInfo({ ...info, full_name: v })} />
                <Input label="Phone" value={info.phone} onChange={(v) => setInfo({ ...info, phone: v })} />
                <Input label="Address" value={info.address} onChange={(v) => setInfo({ ...info, address: v })} />
                <Input label="City" value={info.city} onChange={(v) => setInfo({ ...info, city: v })} />
                <Input label="Notes (optional)" value={info.notes} onChange={(v) => setInfo({ ...info, notes: v })} multiline />
              </div>
            )}
            {step === 1 && (
              <div>
                <h2 className="font-display text-xl mb-4">Shipping method</h2>
                <div className="space-y-3">
                  {SHIPPING.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setShipping(s.id)}
                      className={`w-full glass rounded-[18px] p-5 flex items-center gap-4 text-left border transition ${
                        shipping === s.id ? "border-foreground" : "border-border hover:border-foreground/40"
                      }`}
                    >
                      <s.icon className="w-5 h-5 text-neon" />
                      <div className="flex-1">
                        <p className="font-medium">{s.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                      </div>
                      <span className="text-sm font-semibold">{s.cost} <span className="text-[10px] text-muted-foreground">DH</span></span>
                      {shipping === s.id && <Check className="w-4 h-4 text-neon" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step === 2 && (
              <div>
                <h2 className="font-display text-xl mb-4">Payment</h2>
                <div className="glass rounded-[18px] p-6 border border-foreground">
                  <div className="flex items-center gap-4">
                    <Banknote className="w-6 h-6 text-neon" />
                    <div className="flex-1">
                      <p className="font-medium">Cash on Delivery</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Pay in cash when your order is delivered. No advance payment needed.
                      </p>
                    </div>
                    <Check className="w-5 h-5 text-neon" />
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  By placing this order, you confirm the details above and agree to DERYA Chic terms.
                </p>
              </div>
            )}
          </div>

          {/* Summary */}
          <aside className="glass-strong rounded-[20px] p-5 h-fit lg:sticky lg:top-24">
            <h3 className="font-display text-lg mb-4">Order summary</h3>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {items.map((i) => (
                <div key={`${i.id}-${i.size}`} className="flex gap-3 text-sm">
                  <img src={i.image} alt={i.name} className="w-12 h-14 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{i.name}</p>
                    <p className="text-[11px] text-muted-foreground tracking-wide">
                      {[formatVariation(i.size, i.color), `×${i.quantity}`].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className="font-semibold whitespace-nowrap">{(i.price * i.quantity).toFixed(0)} <span className="text-[10px] text-muted-foreground">DH</span></span>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-5 border-t border-border space-y-2 text-sm">
              <Row label="Subtotal" value={subtotal} />
              <Row label="Shipping" value={shippingCost} />
              <div className="flex justify-between pt-3 border-t border-border items-baseline">
                <span>Total</span>
                <span className="text-2xl font-bold">{grand.toFixed(0)}<span className="text-xs text-muted-foreground ml-1">DH</span></span>
              </div>
            </div>

            <button
              onClick={next}
              disabled={busy}
              className="mt-5 w-full bg-foreground text-background rounded-[14px] py-3.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {step < 2 ? "Continue" : "Place order"}
            </button>
            {step > 0 && (
              <button onClick={() => setStep((s) => s - 1)} className="mt-2 w-full text-xs text-muted-foreground py-2 hover:text-foreground">
                ← Back
              </button>
            )}
          </aside>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {successOrderId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/70 backdrop-blur-md"
          >
            <motion.svg
              width="96"
              height="96"
              viewBox="0 0 96 96"
              fill="none"
              className="text-foreground"
            >
              <motion.circle
                cx="48"
                cy="48"
                r="45"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeOpacity="0.4"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
              <motion.path
                d="M30 49 L43 62 L67 36"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
              />
            </motion.svg>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1, ease: "easeOut" }}
              className="mt-8 text-[11px] uppercase tracking-[0.42em] text-muted-foreground"
            >
              Commande confirmée
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.4 }}
              className="mt-3 text-xs tracking-[0.18em] text-foreground/70"
            >
              Thank you for your order
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span>{value.toFixed(0)} <span className="text-[10px]">DH</span></span>
    </div>
  );
}

function Input({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const Cmp: any = multiline ? "textarea" : "input";
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</span>
      <Cmp
        value={value}
        rows={multiline ? 3 : undefined}
        onChange={(e: any) => onChange(e.target.value)}
        className="mt-1.5 w-full bg-background border border-border rounded-[12px] px-4 py-3 text-sm focus:border-foreground/50 outline-none transition"
      />
    </label>
  );
}
