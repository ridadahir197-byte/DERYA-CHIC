import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, X, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_admin/admin/special")({
  head: () => ({ meta: [{ title: "Special For You — DERYA Chic Admin" }] }),
  component: AdminSpecialPage,
});

type Row = Tables<"special_for_you"> & { product?: Pick<Tables<"products">, "id" | "name" | "image_url" | "price"> | null };
type Product = Tables<"products">;

function AdminSpecialPage() {
  const [items, setItems] = useState<Row[] | null>(null);
  const [picker, setPicker] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from("special_for_you")
      .select("*, product:products(id,name,image_url,price)")
      .order("position", { ascending: true });
    if (error) toast.error(error.message);
    else setItems((data as any) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    if (!confirm("Remove from curated selection?")) return;
    await supabase.from("special_for_you").delete().eq("id", id);
    load();
  }
  async function toggle(r: Row) {
    await supabase.from("special_for_you").update({ active: !r.active }).eq("id", r.id);
    load();
  }
  async function reorder(idx: number, dir: -1 | 1) {
    if (!items) return; const t = idx + dir; if (t < 0 || t >= items.length) return;
    const a = items[idx], b = items[t];
    await Promise.all([
      supabase.from("special_for_you").update({ position: b.position }).eq("id", a.id),
      supabase.from("special_for_you").update({ position: a.position }).eq("id", b.id),
    ]);
    load();
  }

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Curation</p>
          <h1 className="font-display text-3xl md:text-4xl tracking-[0.04em] mt-2">Special For You</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">Editorial selections shown on the homepage carousel.</p>
        </div>
        <button onClick={() => setPicker(true)} className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-xs uppercase tracking-[0.22em] font-semibold">
          <Plus className="w-3.5 h-3.5" /> Add product
        </button>
      </header>

      {items === null ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /> :
        items.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center border border-border/60">
            <Sparkles className="w-6 h-6 mx-auto text-muted-foreground" strokeWidth={1.4} />
            <p className="font-display text-lg mt-3">Nothing curated yet</p>
            <p className="text-sm text-muted-foreground mt-1">Pick standout pieces to feature.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((r, i) => (
              <motion.div key={r.id} layout className="glass rounded-2xl border border-border/60 p-4 flex gap-4">
                <div className="w-24 h-32 bg-muted rounded-lg overflow-hidden shrink-0">
                  {r.product?.image_url && <img src={r.product.image_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display text-sm truncate">{r.product?.name ?? "(deleted)"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.product ? `${r.product.price} DH` : ""}</p>
                    </div>
                    <span className={`text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${r.active ? "bg-neon/20 text-neon" : "bg-muted text-muted-foreground"}`}>
                      {r.active ? "Live" : "Hidden"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-3">
                    <div className="flex gap-1">
                      <button onClick={() => reorder(i, -1)} className="text-[10px] px-2 py-1 rounded border border-border/60">↑</button>
                      <button onClick={() => reorder(i, 1)} className="text-[10px] px-2 py-1 rounded border border-border/60">↓</button>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => toggle(r)} className="text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-border/60">
                        {r.active ? "Hide" : "Show"}
                      </button>
                      <button onClick={() => remove(r.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      <AnimatePresence>
        {picker && <ProductPicker existingIds={(items ?? []).map((i) => i.product_id)} nextPos={items?.length ?? 0}
          onClose={() => setPicker(false)} onAdded={() => { setPicker(false); load(); }} />}
      </AnimatePresence>
    </div>
  );
}

function ProductPicker({ existingIds, nextPos, onClose, onAdded }: { existingIds: string[]; nextPos: number; onClose: () => void; onAdded: () => void }) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [q, setQ] = useState("");
  useEffect(() => {
    supabase.from("products").select("*").order("created_at", { ascending: false }).then(({ data }) => setProducts(data ?? []));
  }, []);
  const filtered = (products ?? []).filter((p) => !existingIds.includes(p.id) && p.name.toLowerCase().includes(q.toLowerCase()));

  async function add(p: Product) {
    const { error } = await supabase.from("special_for_you").insert({ product_id: p.id, position: nextPos, active: true });
    if (error) return toast.error(error.message);
    toast.success("Added"); onAdded();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={(e) => e.stopPropagation()}
        className="bg-background border border-border rounded-2xl w-full max-w-xl p-6 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">Add product</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm mb-4" />
        <div className="flex-1 overflow-auto space-y-2">
          {products === null ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> :
            filtered.length === 0 ? <p className="text-center text-sm text-muted-foreground py-8">No products</p> :
            filtered.map((p) => (
              <button key={p.id} onClick={() => add(p)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted text-left">
                <div className="w-12 h-14 bg-muted rounded overflow-hidden shrink-0">
                  {p.image_url && <img src={p.image_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.price} DH</p>
                </div>
                <Plus className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
