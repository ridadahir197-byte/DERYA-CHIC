import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Search, Package } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_admin/admin/orders")({
  head: () => ({ meta: [{ title: "Orders — DERYA Chic Admin" }] }),
  component: AdminOrdersPage,
});

type Order = Tables<"orders">;
type OrderItem = Tables<"order_items">;

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
type Status = typeof STATUSES[number];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  confirmed: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  shipped: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  delivered: "bg-neon/20 text-neon",
  cancelled: "bg-destructive/15 text-destructive",
};

function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [q, setQ] = useState("");
  const [opened, setOpened] = useState<Order | null>(null);

  async function load() {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setOrders(data ?? []);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (payload.eventType === "INSERT") {
          toast.success(`New order from ${(payload.new as any).customer_name}`, { duration: 6000 });
        }
        load();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = useMemo(() => {
    if (!orders) return null;
    return orders.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (q && !o.customer_name.toLowerCase().includes(q.toLowerCase()) && !o.id.startsWith(q)) return false;
      return true;
    });
  }, [orders, filter, q]);

  async function updateStatus(id: string, status: Status) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Marked as ${status}`);
    if (opened?.id === id) setOpened({ ...opened, status });
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Operations</p>
        <h1 className="font-display text-3xl md:text-4xl tracking-[0.04em] mt-2">Orders</h1>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by customer or order id..."
            className="w-full pl-9 pr-3 py-2 rounded-full border border-border bg-background text-sm" />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {(["all", ...STATUSES] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s as any)}
              className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-[0.22em] whitespace-nowrap ${
                filter === s ? "bg-foreground text-background" : "border border-border/60 text-muted-foreground hover:text-foreground"
              }`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl border border-border/60 overflow-hidden">
        {filtered === null ? <div className="p-12 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div> :
          filtered.length === 0 ? <div className="p-16 text-center"><p className="font-display text-lg">No orders</p></div> : (
          <>
            {/* Mobile stacked cards */}
            <ul className="sm:hidden divide-y divide-border/40">
              {filtered.map((o) => (
                <li key={o.id} onClick={() => setOpened(o)} className="p-4 cursor-pointer hover:bg-muted/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[11px] text-muted-foreground">{o.id.slice(0, 8)}</p>
                      <p className="mt-0.5 text-sm font-medium truncate">{o.customer_name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{o.phone}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold whitespace-nowrap">{Number(o.total).toLocaleString("fr-MA")} DH</p>
                      <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-[9px] uppercase tracking-[0.18em] ${STATUS_STYLES[o.status] ?? "bg-muted"}`}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleString("fr-MA")}</p>
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  <tr className="border-b border-border/60">
                    <th className="text-left px-5 py-3 font-medium">Order</th>
                    <th className="text-left px-5 py-3 font-medium">Customer</th>
                    <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Date</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                    <th className="text-right px-5 py-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr key={o.id} onClick={() => setOpened(o)} className="border-b border-border/40 last:border-0 hover:bg-muted/30 cursor-pointer">
                      <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{o.id.slice(0, 8)}</td>
                      <td className="px-5 py-3.5">{o.customer_name}<br /><span className="text-xs text-muted-foreground">{o.phone}</span></td>
                      <td className="px-5 py-3.5 hidden md:table-cell text-muted-foreground text-xs">{new Date(o.created_at).toLocaleString("fr-MA")}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.18em] ${STATUS_STYLES[o.status] ?? "bg-muted"}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium">{Number(o.total).toLocaleString("fr-MA")} DH</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {opened && <OrderDrawer order={opened} onClose={() => setOpened(null)} onStatus={(s) => updateStatus(opened.id, s)} />}
      </AnimatePresence>
    </div>
  );
}

function OrderDrawer({ order, onClose, onStatus }: { order: Order; onClose: () => void; onStatus: (s: Status) => void }) {
  const [items, setItems] = useState<OrderItem[] | null>(null);
  useEffect(() => {
    supabase.from("order_items").select("*").eq("order_id", order.id).then(({ data }) => setItems(data ?? []));
  }, [order.id]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <motion.aside initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-background border-l border-border h-full overflow-auto">
        <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Order</p>
            <h2 className="font-display text-lg font-mono mt-0.5">{order.id.slice(0, 8)}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">Status</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map((s) => (
                <button key={s} onClick={() => onStatus(s)}
                  className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-[0.2em] ${
                    order.status === s ? "bg-foreground text-background" : "border border-border/60 hover:bg-muted"
                  }`}>{s}</button>
              ))}
            </div>
          </section>

          <section>
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">Customer</p>
            <div className="space-y-1 text-sm">
              <p>{order.customer_name}</p>
              <p className="text-muted-foreground">{order.phone}</p>
              <p className="text-muted-foreground">{order.address}, {order.city}</p>
              {order.notes && <p className="mt-2 italic text-muted-foreground text-xs">"{order.notes}"</p>}
            </div>
          </section>

          <section>
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">Items</p>
            {items === null ? <Loader2 className="w-4 h-4 animate-spin" /> :
              <div className="space-y-2">
                {items.map((it) => (
                  <div key={it.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{it.name}</p>
                      <p className="text-xs text-muted-foreground">{[it.size && `Size: ${it.size}`, (it as any).color && `Color: ${(it as any).color}`, `Qty: ${it.quantity}`].filter(Boolean).join(" • ")}</p>
                    </div>
                    <p className="text-sm font-medium">{Number(it.price * it.quantity).toLocaleString("fr-MA")} DH</p>
                  </div>
                ))}
              </div>
            }
          </section>

          <section className="border-t border-border/60 pt-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{Number(order.subtotal).toLocaleString("fr-MA")} DH</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Shipping ({order.shipping_method})</span><span>{Number(order.shipping_cost).toLocaleString("fr-MA")} DH</span></div>
            <div className="flex justify-between font-display text-lg pt-2 border-t border-border/40"><span>Total</span><span>{Number(order.total).toLocaleString("fr-MA")} DH</span></div>
          </section>
        </div>
      </motion.aside>
    </motion.div>
  );
}
