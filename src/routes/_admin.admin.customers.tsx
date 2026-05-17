import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Search, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_admin/admin/customers")({
  head: () => ({ meta: [{ title: "Customers — DERYA Chic Admin" }] }),
  component: AdminCustomersPage,
});

type Profile = Tables<"profiles"> & { order_count?: number; total_spent?: number };

function AdminCustomersPage() {
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: profs }, { data: orders }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("user_id,total"),
      ]);
      const stats = new Map<string, { c: number; t: number }>();
      (orders ?? []).forEach((o: any) => {
        if (!o.user_id) return;
        const cur = stats.get(o.user_id) ?? { c: 0, t: 0 };
        cur.c += 1; cur.t += Number(o.total ?? 0);
        stats.set(o.user_id, cur);
      });
      setProfiles((profs ?? []).map((p) => ({ ...p, order_count: stats.get(p.id)?.c ?? 0, total_spent: stats.get(p.id)?.t ?? 0 })));
    })();
  }, []);

  const filtered = (profiles ?? []).filter((p) =>
    !q || p.full_name?.toLowerCase().includes(q.toLowerCase()) || p.email?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Clientele</p>
        <h1 className="font-display text-3xl md:text-4xl tracking-[0.04em] mt-2">Customers</h1>
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email..."
          className="w-full pl-9 pr-3 py-2 rounded-full border border-border bg-background text-sm" />
      </div>

      <div className="glass rounded-2xl border border-border/60 overflow-hidden">
        {profiles === null ? <div className="p-12 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div> :
          filtered.length === 0 ? <div className="p-16 text-center"><p className="font-display text-lg">No customers</p></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                <tr className="border-b border-border/60">
                  <th className="text-left px-5 py-3 font-medium">Name</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Email</th>
                  <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Phone</th>
                  <th className="text-right px-5 py-3 font-medium">Orders</th>
                  <th className="text-right px-5 py-3 font-medium">Spent</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-3.5 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"><User className="w-3.5 h-3.5" /></span>
                      {p.full_name ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-muted-foreground">{p.email ?? "—"}</td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-muted-foreground">{p.phone ?? "—"}</td>
                    <td className="px-5 py-3.5 text-right">{p.order_count}</td>
                    <td className="px-5 py-3.5 text-right font-medium">{(p.total_spent ?? 0).toLocaleString("fr-MA")} DH</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
