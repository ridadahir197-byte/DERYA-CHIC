import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Loader2, Upload, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/lib/admin-upload";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_admin/admin/categories")({
  head: () => ({ meta: [{ title: "Categories — DERYA Chic Admin" }] }),
  component: AdminCategoriesPage,
});

type Category = Tables<"categories">;
type Draft = { id?: string; name: string; slug: string; image_url: string | null; active: boolean; position: number };

const empty = (): Draft => ({ name: "", slug: "", image_url: null, active: true, position: 0 });

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
}

function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[] | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);

  async function load() {
    const { data, error } = await supabase.from("categories").select("*").order("position", { ascending: true });
    if (error) toast.error(error.message);
    else setItems(data ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    if (!confirm("Delete this category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Category deleted");
    load();
  }

  async function reorder(idx: number, dir: -1 | 1) {
    if (!items) return;
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const a = items[idx],
      b = items[target];
    await Promise.all([
      supabase.from("categories").update({ position: b.position }).eq("id", a.id),
      supabase.from("categories").update({ position: a.position }).eq("id", b.id),
    ]);
    load();
  }

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Atelier</p>
          <h1 className="font-display text-3xl md:text-4xl tracking-[0.04em] mt-2">Categories</h1>
        </div>
        <button
          onClick={() => setEditing({ ...empty(), position: (items?.length ?? 0) })}
          className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-xs uppercase tracking-[0.22em] font-semibold hover:opacity-90"
        >
          <Plus className="w-3.5 h-3.5" /> New
        </button>
      </header>

      {items === null ? (
        <div className="py-16 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center border border-border/60">
          <p className="font-display text-lg">No categories yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first category to organize the boutique.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((c, i) => (
            <motion.div
              key={c.id}
              layout
              className="glass rounded-2xl border border-border/60 overflow-hidden group"
            >
              <div className="aspect-[4/5] bg-muted relative">
                {c.image_url ? (
                  <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-8 h-8" strokeWidth={1.4} />
                  </div>
                )}
                {!c.active && (
                  <span className="absolute top-2 left-2 text-[10px] uppercase tracking-[0.2em] bg-background/80 px-2 py-1 rounded-full">
                    Hidden
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-display text-sm tracking-[0.08em] uppercase truncate">{c.name}</h3>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{c.slug}</p>
                <div className="flex items-center justify-between gap-2 mt-3">
                  <div className="flex gap-1">
                    <button onClick={() => reorder(i, -1)} className="text-[10px] px-2 py-1 rounded border border-border/60 hover:bg-muted">↑</button>
                    <button onClick={() => reorder(i, 1)} className="text-[10px] px-2 py-1 rounded border border-border/60 hover:bg-muted">↓</button>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditing({ id: c.id, name: c.name, slug: c.slug, image_url: c.image_url, active: c.active, position: c.position })}
                      className="p-1.5 rounded hover:bg-muted"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => remove(c.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive">
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
        {editing && <CategoryEditor draft={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      </AnimatePresence>
    </div>
  );
}

function CategoryEditor({ draft, onClose, onSaved }: { draft: Draft; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<Draft>(draft);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const url = await uploadImage(f, "categories");
      setD({ ...d, image_url: url });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!d.name.trim()) return toast.error("Name required");
    const slug = d.slug || slugify(d.name);
    setSaving(true);
    const payload = { name: d.name.trim(), slug, image_url: d.image_url, active: d.active, position: d.position };
    const { error } = d.id
      ? await supabase.from("categories").update(payload).eq("id", d.id)
      : await supabase.from("categories").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(d.id ? "Updated" : "Created");
    onSaved();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-background border border-border rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl tracking-[0.06em]">{d.id ? "Edit" : "New"} Category</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Name</label>
            <input
              value={d.name}
              onChange={(e) => setD({ ...d, name: e.target.value, slug: d.slug || slugify(e.target.value) })}
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Slug</label>
            <input
              value={d.slug}
              onChange={(e) => setD({ ...d, slug: slugify(e.target.value) })}
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Image</label>
            <div className="mt-1.5 flex items-center gap-3">
              <div className="w-24 h-28 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                {d.image_url ? (
                  <img src={d.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <label className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-xs uppercase tracking-[0.2em] cursor-pointer hover:bg-muted">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploading ? "Uploading..." : "Upload"}
                <input type="file" accept="image/*" onChange={onFile} className="hidden" />
              </label>
            </div>
          </div>
          <label className="flex items-center justify-between py-2">
            <span className="text-sm">Active</span>
            <input
              type="checkbox"
              checked={d.active}
              onChange={(e) => setD({ ...d, active: e.target.checked })}
              className="w-4 h-4"
            />
          </label>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 rounded-full border border-border px-4 py-2.5 text-xs uppercase tracking-[0.22em]">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 rounded-full bg-foreground text-background px-4 py-2.5 text-xs uppercase tracking-[0.22em] font-semibold disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "Save"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
