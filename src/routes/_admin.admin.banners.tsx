import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Loader2, Upload, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/lib/admin-upload";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_admin/admin/banners")({
  head: () => ({ meta: [{ title: "Banners — DERYA Chic Admin" }] }),
  component: AdminBannersPage,
});

type Banner = Tables<"banners">;
type Draft = {
  id?: string;
  title: string;
  subtitle: string;
  cta_text: string;
  link: string;
  image_url: string;
  mobile_image_url: string | null;
  position: number;
  active: boolean;
};

const empty = (): Draft => ({
  title: "", subtitle: "", cta_text: "", link: "", image_url: "",
  mobile_image_url: null, position: 0, active: true,
});

function AdminBannersPage() {
  const [items, setItems] = useState<Banner[] | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);

  async function load() {
    const { data, error } = await supabase.from("banners").select("*").order("position", { ascending: true });
    if (error) toast.error(error.message); else setItems(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    if (!confirm("Delete this banner?")) return;
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  }

  async function toggleActive(b: Banner) {
    await supabase.from("banners").update({ active: !b.active }).eq("id", b.id);
    load();
  }

  async function reorder(idx: number, dir: -1 | 1) {
    if (!items) return;
    const t = idx + dir; if (t < 0 || t >= items.length) return;
    const a = items[idx], b = items[t];
    await Promise.all([
      supabase.from("banners").update({ position: b.position }).eq("id", a.id),
      supabase.from("banners").update({ position: a.position }).eq("id", b.id),
    ]);
    load();
  }

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Campaigns</p>
          <h1 className="font-display text-3xl md:text-4xl tracking-[0.04em] mt-2">Banners</h1>
        </div>
        <button
          onClick={() => setEditing({ ...empty(), position: items?.length ?? 0 })}
          className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-xs uppercase tracking-[0.22em] font-semibold"
        >
          <Plus className="w-3.5 h-3.5" /> New banner
        </button>
      </header>

      {items === null ? (
        <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
      ) : items.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center border border-border/60">
          <p className="font-display text-lg">No banners yet</p>
          <p className="text-sm text-muted-foreground mt-1">Cinematic hero campaigns appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((b, i) => (
            <motion.div key={b.id} layout className="glass rounded-2xl border border-border/60 overflow-hidden">
              <div className="grid md:grid-cols-[2fr,1fr] gap-0">
                <div className="aspect-[21/9] md:aspect-auto bg-muted relative">
                  {b.image_url && <img src={b.image_url} alt={b.title ?? ""} className="w-full h-full object-cover" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                    <div className="text-white">
                      {b.subtitle && <p className="text-[10px] uppercase tracking-[0.3em] opacity-80">{b.subtitle}</p>}
                      <h3 className="font-display text-2xl mt-1">{b.title}</h3>
                    </div>
                  </div>
                </div>
                <div className="p-5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${b.active ? "bg-neon" : "bg-muted-foreground"}`} />
                      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        {b.active ? "Live" : "Hidden"} · #{b.position}
                      </span>
                    </div>
                    {b.cta_text && <p className="text-xs"><span className="text-muted-foreground">CTA:</span> {b.cta_text}</p>}
                    {b.link && <p className="text-xs font-mono text-muted-foreground truncate">{b.link}</p>}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-4">
                    <div className="flex gap-1">
                      <button onClick={() => reorder(i, -1)} className="text-[10px] px-2 py-1 rounded border border-border/60">↑</button>
                      <button onClick={() => reorder(i, 1)} className="text-[10px] px-2 py-1 rounded border border-border/60">↓</button>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => toggleActive(b)} className="text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-border/60 hover:bg-muted">
                        {b.active ? "Hide" : "Show"}
                      </button>
                      <button onClick={() => setEditing({
                        id: b.id, title: b.title ?? "", subtitle: b.subtitle ?? "",
                        cta_text: (b as any).cta_text ?? "", link: b.link ?? "",
                        image_url: b.image_url, mobile_image_url: (b as any).mobile_image_url ?? null,
                        position: b.position, active: b.active,
                      })} className="p-1.5 rounded hover:bg-muted"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => remove(b.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editing && <BannerEditor draft={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      </AnimatePresence>
    </div>
  );
}

function BannerEditor({ draft, onClose, onSaved }: { draft: Draft; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<Draft>(draft);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"desktop" | "mobile" | null>(null);

  async function onFile(field: "image_url" | "mobile_image_url", e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(field === "image_url" ? "desktop" : "mobile");
    try {
      const url = await uploadImage(f, "banners");
      setD({ ...d, [field]: url } as Draft);
    } catch (err: any) { toast.error(err.message); }
    finally { setUploading(null); }
  }

  async function save() {
    if (!d.image_url) return toast.error("Desktop image required");
    setSaving(true);
    const payload: any = {
      title: d.title || null, subtitle: d.subtitle || null, cta_text: d.cta_text || null,
      link: d.link || null, image_url: d.image_url, mobile_image_url: d.mobile_image_url,
      position: d.position, active: d.active,
    };
    const { error } = d.id
      ? await supabase.from("banners").update(payload).eq("id", d.id)
      : await supabase.from("banners").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved"); onSaved();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-background border border-border rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl tracking-[0.06em]">{d.id ? "Edit" : "New"} Banner</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {(["image_url", "mobile_image_url"] as const).map((field) => {
              const isDesktop = field === "image_url";
              const val = d[field];
              return (
                <div key={field}>
                  <label className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {isDesktop ? "Desktop image *" : "Mobile image"}
                  </label>
                  <div className="mt-1.5 aspect-[16/9] bg-muted rounded-lg overflow-hidden relative">
                    {val ? <img src={val} alt="" className="w-full h-full object-cover" /> :
                      <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-6 h-6 text-muted-foreground" /></div>}
                  </div>
                  <label className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-[10px] uppercase tracking-[0.2em] cursor-pointer hover:bg-muted">
                    {uploading === (isDesktop ? "desktop" : "mobile") ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    Upload
                    <input type="file" accept="image/*" onChange={(e) => onFile(field, e)} className="hidden" />
                  </label>
                </div>
              );
            })}
          </div>
          {[
            { k: "subtitle", label: "Eyebrow", placeholder: "Spring 2026" },
            { k: "title", label: "Title", placeholder: "The Atelier Edit" },
            { k: "cta_text", label: "CTA Text", placeholder: "Discover" },
            { k: "link", label: "Link", placeholder: "/shop" },
          ].map((f) => (
            <div key={f.k}>
              <label className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{f.label}</label>
              <input value={(d as any)[f.k] ?? ""} onChange={(e) => setD({ ...d, [f.k]: e.target.value } as Draft)}
                placeholder={f.placeholder}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Position</label>
              <input type="number" value={d.position} onChange={(e) => setD({ ...d, position: Number(e.target.value) })}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <label className="flex items-end justify-between pb-2">
              <span className="text-sm">Active</span>
              <input type="checkbox" checked={d.active} onChange={(e) => setD({ ...d, active: e.target.checked })} className="w-4 h-4" />
            </label>
          </div>
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
