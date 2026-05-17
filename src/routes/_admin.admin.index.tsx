import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Package, Users, TrendingUp, ArrowUpRight, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — DERYA Chic Admin" }] }),
  component: AdminOverview,
});

type Stats = {
  orders: number;
  pending: number;
  revenue: number;
  products: number;
  customers: number;
};

type RecentOrder = {
  id: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
};

function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentOrder[] | null>(null);
  const [lowStock, setLowStock] = useState<{ id: string; name: string; size: string; stock: number }[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [
        { data: orders },
        { count: productsCount },
        { count: customersCount },
        { data: variants },
      ] = await Promise.all([
        supabase.from("orders").select("id,total,status,customer_name,created_at").order("created_at", { ascending: false }),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("product_variants").select("size,stock_quantity,product_id,products(id,name)").lte("stock_quantity", 2),
      ]);
      if (!active) return;
      const list = orders ?? [];
      const revenue = list.reduce((s, o: any) => s + Number(o.total ?? 0), 0);
      const pending = list.filter((o: any) => o.status === "pending").length;
      setStats({ orders: list.length, pending, revenue, products: productsCount ?? 0, customers: customersCount ?? 0 });
      setRecent(list.slice(0, 6) as any);
      setLowStock((variants ?? []).map((v: any) => ({
        id: v.product_id, name: v.products?.name ?? "—", size: v.size, stock: v.stock_quantity,
      })).slice(0, 8));
    })();
    return () => { active = false; };
  }, []);

  const cards = [
    { label: "Revenue", value: stats ? `${stats.revenue.toLocaleString("fr-MA")} DH` : "—", icon: TrendingUp },
    { label: "Orders", value: stats?.orders ?? "—", icon: ShoppingBag, sub: stats ? `${stats.pending} pending` : "" },
    { label: "Products", value: stats?.products ?? "—", icon: Package },
    { label: "Customers", value: stats?.customers ?? "—", icon: Users },
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Atelier</p>
          <h1 className="font-display text-3xl md:text-4xl tracking-[0.04em] mt-2">
            Bonjour, <span className="italic font-light">DERYA</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Live overview of the boutique.
          </p>
        </div>
        <Link
          to={"/admin/orders" as any}
          className="self-start md:self-auto inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-xs uppercase tracking-[0.22em] font-semibold hover:opacity-90 transition"
        >
          Manage orders <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Stat cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-5 border border-border/60"
            >
              <div className="flex items-start justify-between">
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">{c.label}</p>
                <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.6} />
              </div>
              <p className="mt-4 font-display text-2xl md:text-3xl tracking-tight">{c.value as any}</p>
              {"sub" in c && c.sub ? (
                <p className="mt-1 text-[11px] text-neon">{c.sub}</p>
              ) : null}
            </motion.div>
          );
        })}
      </section>

      {/* Recent orders */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg tracking-[0.06em]">Recent orders</h2>
          <Link to={"/admin/orders" as any} className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground hover:text-foreground">
            View all
          </Link>
        </div>
        <div className="glass rounded-2xl border border-border/60 overflow-hidden">
          {recent === null ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : recent.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-display text-lg">No orders yet</p>
              <p className="mt-1 text-sm text-muted-foreground">When clients place orders, they appear here.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                <tr className="border-b border-border/60">
                  <th className="text-left px-5 py-3 font-medium">Customer</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Order</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-right px-5 py-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition">
                    <td className="px-5 py-3.5">{o.customer_name}</td>
                    <td className="px-5 py-3.5 hidden md:table-cell font-mono text-xs text-muted-foreground">
                      {o.id.slice(0, 8)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.18em] bg-muted">
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium">
                      {Number(o.total).toLocaleString("fr-MA")} DH
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg tracking-[0.06em] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" strokeWidth={1.8} /> Low stock
            </h2>
            <Link to={"/admin/products" as any} className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground hover:text-foreground">
              Manage
            </Link>
          </div>
          <div className="glass rounded-2xl border border-border/60 divide-y divide-border/40">
            {lowStock.map((v, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center justify-between text-sm">
                <span className="truncate">{v.name}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Size {v.size}</span>
                  <span className={`text-xs font-medium ${v.stock === 0 ? "text-destructive" : "text-amber-600 dark:text-amber-400"}`}>
                    {v.stock === 0 ? "Sold out" : `${v.stock} left`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
