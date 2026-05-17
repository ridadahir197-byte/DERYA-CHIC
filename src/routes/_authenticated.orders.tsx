import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [{ title: "My orders — DERYA Chic" }] }),
  component: OrdersList,
});

function OrdersList() {
  const [orders, setOrders] = useState<Tables<"orders">[]>([]);
  useEffect(() => {
    supabase.from("orders").select("*").order("created_at", { ascending: false }).then(({ data }) => setOrders(data ?? []));
  }, []);
  return (
    <div className="px-5 lg:px-10 pt-6 max-w-3xl mx-auto pb-24">
      <h1 className="font-display text-3xl tracking-[0.04em]">My orders</h1>
      {orders.length === 0 ? (
        <div className="mt-10 text-center">
          <Package className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="mt-3 text-sm text-muted-foreground">No orders yet.</p>
          <Link to="/shop" className="mt-4 inline-block text-sm underline">Discover the collection</Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              to="/orders/$id"
              params={{ id: o.id }}
              className="block glass rounded-[18px] p-5 hover:border-foreground/40 border border-border transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="mt-1 font-medium">{Number(o.total).toFixed(0)} DH</p>
                </div>
                <span className="text-[10px] uppercase tracking-[0.22em] px-3 py-1 rounded-full bg-muted">{o.status}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
