import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Package, Truck, Home, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/orders/$id")({
  head: () => ({ meta: [{ title: "Order — DERYA Chic" }] }),
  component: OrderPage,
});

const STATUS_STEPS = [
  { key: "pending", label: "Received", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Home },
];

function OrderPage() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<Tables<"orders"> | null>(null);
  const [items, setItems] = useState<Tables<"order_items">[]>([]);

  useEffect(() => {
    supabase.from("orders").select("*").eq("id", id).maybeSingle().then(({ data }) => setOrder(data));
    supabase.from("order_items").select("*").eq("order_id", id).then(({ data }) => setItems(data ?? []));

    const ch = supabase
      .channel(`order:${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` }, (p) => {
        setOrder(p.new as any);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  if (!order) return <div className="px-5 pt-10 text-sm text-muted-foreground">Loading…</div>;

  const stepIndex = Math.max(0, STATUS_STEPS.findIndex((s) => s.key === order.status));

  return (
    <div className="px-5 lg:px-10 pt-6 max-w-2xl mx-auto pb-24">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="mx-auto w-20 h-20 rounded-full bg-neon/15 flex items-center justify-center"
      >
        <CheckCircle2 className="w-10 h-10 text-neon" strokeWidth={1.5} />
      </motion.div>
      <h1 className="mt-6 font-display text-4xl text-center tracking-[0.04em]">Thank you</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Order <span className="font-mono text-foreground">#{order.id.slice(0, 8).toUpperCase()}</span> has been placed.
      </p>

      {/* Status timeline */}
      <div className="mt-10 glass rounded-[20px] p-6">
        <div className="flex items-center justify-between">
          {STATUS_STEPS.map((s, i) => {
            const reached = i <= stepIndex;
            return (
              <div key={s.key} className="flex flex-col items-center flex-1 relative">
                {i > 0 && (
                  <div className={`absolute right-1/2 top-5 h-px w-full ${i <= stepIndex ? "bg-neon" : "bg-border"}`} />
                )}
                <div className={`relative w-10 h-10 rounded-full flex items-center justify-center ${reached ? "bg-neon text-neon-foreground" : "bg-muted text-muted-foreground"}`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <span className={`mt-2 text-[10px] uppercase tracking-[0.18em] ${reached ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 glass rounded-[20px] p-5">
        <h2 className="font-display text-lg mb-4">Items</h2>
        <div className="space-y-3">
          {items.map((i) => (
            <div key={i.id} className="flex justify-between text-sm">
              <span className="truncate pr-2">{i.name} <span className="text-muted-foreground text-xs">· {[i.size && `Size: ${i.size}`, (i as any).color && `Color: ${(i as any).color}`, `Qty: ${i.quantity}`].filter(Boolean).join(" • ")}</span></span>
              <span className="font-semibold whitespace-nowrap">{(Number(i.price) * i.quantity).toFixed(0)} <span className="text-[10px] text-muted-foreground">DH</span></span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border text-sm space-y-1">
          <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{Number(order.subtotal).toFixed(0)} DH</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Shipping ({order.shipping_method})</span><span>{Number(order.shipping_cost).toFixed(0)} DH</span></div>
          <div className="flex justify-between font-semibold pt-2 border-t border-border mt-2"><span>Total</span><span>{Number(order.total).toFixed(0)} DH</span></div>
        </div>
      </div>

      <div className="mt-6 glass rounded-[20px] p-5 text-sm">
        <h2 className="font-display text-lg mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-neon" /> Delivery</h2>
        <p>{order.customer_name} · {order.phone}</p>
        <p className="text-muted-foreground mt-1">{order.address}, {order.city}</p>
        <p className="mt-2 text-xs text-muted-foreground">Payment: Cash on Delivery</p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Link to="/orders" className="glass-strong rounded-[14px] py-3.5 text-center text-sm font-medium">My orders</Link>
        <Link to="/shop" className="bg-foreground text-background rounded-[14px] py-3.5 text-center text-sm font-semibold">Continue</Link>
      </div>
    </div>
  );
}
