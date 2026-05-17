import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  Upload,
  Star,
  ImageIcon,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SIZE_OPTIONS, type Product, type ProductVariant } from "@/lib/products";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_admin/admin/products")({
  head: () => ({ meta: [{ title: "Products — DERYA Chic Admin" }] }),
  component: AdminProductsPage,
});

type Category = Tables<"categories">;

type VariantRow = {
  id?: string;
  size: string;        // "" when product has no sizes
  color: string;       // "" when product has no colors
  stock_quantity: number;
};

type Draft = {
  id?: string;
  name: string;
  description: string;
  price: string;
  original_price: string;
  discount_percentage: string;
  category: string;
  category_id: string | null;
  image_url: string;
  images: string[];
  featured: boolean;
  active: boolean;
  has_sizes: boolean;
  colors: string[];
  variants: VariantRow[];
};

const vKey = (size: string, color: string) => `${color}::${size}`;


const emptyDraft = (): Draft => ({
  name: "",
  description: "",
  price: "",
  original_price: "",
  discount_percentage: "",
  category: "",
  category_id: null,
  image_url: "",
  images: [],
  featured: false,
  active: true,
  has_sizes: true,
  colors: [],
  variants: [],
});

function AdminProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Draft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

  const load = async () => {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("position"),
    ]);
    setProducts(prods ?? []);
    setCategories(cats ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!products) return null;
    if (!q.trim()) return products;
    const s = q.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(s) || p.category.toLowerCase().includes(s),
    );
  }, [products, q]);

  const openNew = () => setEditing(emptyDraft());

  const openEdit = async (p: Product) => {
    const { data: vs } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", p.id)
      .order("size");
    setEditing({
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      price: String(p.price),
      original_price:
        (p as any).original_price != null ? String((p as any).original_price) : "",
      discount_percentage:
        (p as any).discount_percentage != null && (p as any).discount_percentage !== 0
          ? String((p as any).discount_percentage)
          : "",
      category: p.category,
      category_id: p.category_id,
      image_url: p.image_url,
      images: (p as any).images ?? [],
      featured: (p as any).featured ?? false,
      active: (p as any).active ?? true,
      has_sizes: (p as any).has_sizes !== false,
      colors: ((p as any).colors as string[]) ?? [],
      variants: (vs ?? []).map((v: any) => ({
        id: v.id,
        size: v.size ?? "",
        color: v.color ?? "",
        stock_quantity: v.stock_quantity,
      })),
    });
  };

  const handleDelete = async (p: Product) => {
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Product deleted");
    setConfirmDelete(null);
    load();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Catalog</p>
          <h1 className="font-display text-3xl md:text-4xl tracking-[0.04em] mt-2">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {products ? `${products.length} pieces in the boutique` : "Loading…"}
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-xs uppercase tracking-[0.22em] font-semibold hover:opacity-90 transition self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> New product
        </button>
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or category…"
          className="w-full bg-secondary border border-border rounded-full pl-11 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition"
        />
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-border/60 overflow-hidden">
        {filtered === null ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto" strokeWidth={1.4} />
            <p className="mt-4 font-display text-lg">No products yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first piece to the boutique.
            </p>
            <button
              onClick={openNew}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2 text-xs uppercase tracking-[0.22em] font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Create product
            </button>
          </div>
        ) : (
          <>
            {/* Mobile stacked cards */}
            <ul className="sm:hidden divide-y divide-border/40">
              {filtered.map((p) => (
                <li key={p.id} className="p-3 flex items-center gap-3">
                  <img src={p.image_url} alt="" className="w-14 h-16 rounded-md object-cover bg-muted shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate flex items-center gap-1.5">
                      {p.name}
                      {(p as any).featured && <Star className="w-3 h-3 fill-neon text-neon shrink-0" />}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{p.category}</p>
                    <p className="text-sm font-semibold mt-1 whitespace-nowrap">{Number(p.price).toLocaleString("fr-MA")} DH</p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => openEdit(p)} aria-label="Edit" className="p-2 rounded-full hover:bg-muted transition">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setConfirmDelete(p)} aria-label="Delete" className="p-2 rounded-full hover:bg-destructive/10 hover:text-destructive transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  <tr className="border-b border-border/60">
                    <th className="text-left px-5 py-3 font-medium">Product</th>
                    <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Category</th>
                    <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Status</th>
                    <th className="text-right px-5 py-3 font-medium">Price</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image_url}
                            alt=""
                            className="w-12 h-14 rounded-md object-cover bg-muted"
                          />
                          <div className="min-w-0">
                            <p className="font-medium truncate flex items-center gap-1.5">
                              {p.name}
                              {(p as any).featured && (
                                <Star className="w-3 h-3 fill-neon text-neon" />
                              )}
                            </p>
                            <p className="text-[11px] text-muted-foreground sm:hidden">
                              {p.category}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell text-muted-foreground">
                        {p.category}
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.18em] ${
                            (p as any).active === false
                              ? "bg-muted text-muted-foreground"
                              : "bg-foreground/10 text-foreground"
                          }`}
                        >
                          {(p as any).active === false ? "Hidden" : "Live"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-medium whitespace-nowrap">
                        {Number(p.price).toLocaleString("fr-MA")} DH
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-2 rounded-full hover:bg-muted transition"
                            aria-label="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(p)}
                            className="p-2 rounded-full hover:bg-destructive/10 hover:text-destructive transition"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {editing && (
          <ProductEditor
            draft={editing}
            categories={categories}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              load();
            }}
          />
        )}
        {confirmDelete && (
          <ConfirmDialog
            title="Delete product"
            message={`Remove “${confirmDelete.name}” from the boutique? This cannot be undone.`}
            onCancel={() => setConfirmDelete(null)}
            onConfirm={() => handleDelete(confirmDelete)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────────────────── Editor ───────────────────────── */

function ProductEditor({
  draft,
  categories,
  onClose,
  onSaved,
}: {
  draft: Draft;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [d, setD] = useState<Draft>(draft);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const setF = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from("product-images")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw error;
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      setD((p) => ({
        ...p,
        images: [...p.images, ...uploaded],
        image_url: p.image_url || uploaded[0],
      }));
      toast.success(`${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded`);
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url: string) => {
    setD((p) => ({
      ...p,
      images: p.images.filter((i) => i !== url),
      image_url: p.image_url === url ? p.images.find((i) => i !== url) ?? "" : p.image_url,
    }));
  };

  // Derived list of size strings that currently exist as variants (ignoring color)
  const activeSizes = useMemo(
    () => Array.from(new Set(d.variants.map((v) => v.size).filter((s) => s !== ""))),
    [d.variants]
  );

  // Build a stock lookup map for fast access in the matrix UI
  const stockMap = useMemo(() => {
    const m = new Map<string, number>();
    d.variants.forEach((v) => m.set(vKey(v.size, v.color), v.stock_quantity));
    return m;
  }, [d.variants]);

  const setVariantStock = (size: string, color: string, n: number) => {
    setD((p) => {
      const key = vKey(size, color);
      const exists = p.variants.find((v) => vKey(v.size, v.color) === key);
      const next = Math.max(0, isNaN(n) ? 0 : n);
      if (exists) {
        return {
          ...p,
          variants: p.variants.map((v) =>
            vKey(v.size, v.color) === key ? { ...v, stock_quantity: next } : v
          ),
        };
      }
      return { ...p, variants: [...p.variants, { size, color, stock_quantity: next }] };
    });
  };

  const toggleSize = (size: string) => {
    setD((p) => {
      const has = p.variants.some((v) => v.size === size);
      if (has) {
        return { ...p, variants: p.variants.filter((v) => v.size !== size) };
      }
      // Add a variant per color (or a single one if no colors)
      const colors = p.colors.length > 0 ? p.colors : [""];
      const additions = colors.map((c) => ({ size, color: c, stock_quantity: 10 }));
      return { ...p, variants: [...p.variants, ...additions] };
    });
  };

  const addColor = (c: string) => {
    setD((p) => {
      if (p.colors.includes(c)) return p;
      const sizes = p.has_sizes
        ? Array.from(new Set(p.variants.map((v) => v.size).filter((s) => s !== "")))
        : [];
      const additions: VariantRow[] =
        sizes.length > 0
          ? sizes.map((s) => ({ size: s, color: c, stock_quantity: 10 }))
          : [{ size: "", color: c, stock_quantity: 10 }];
      return { ...p, colors: [...p.colors, c], variants: [...p.variants, ...additions] };
    });
  };

  const removeColor = (c: string) => {
    setD((p) => ({
      ...p,
      colors: p.colors.filter((x) => x !== c),
      variants: p.variants.filter((v) => v.color !== c),
    }));
  };


  const save = async () => {
    if (!d.name.trim()) return toast.error("Name is required");
    if (!d.price || isNaN(Number(d.price))) return toast.error("Valid price is required");
    if (!d.image_url) return toast.error("At least one image is required");
    if (!d.category.trim()) return toast.error("Category is required");

    setBusy(true);
    try {
      const payload = {
        name: d.name.trim(),
        description: d.description.trim() || null,
        price: Number(d.price),
        original_price: d.original_price ? Number(d.original_price) : null,
        discount_percentage: d.discount_percentage ? Number(d.discount_percentage) : 0,
        category: d.category.trim(),
        category_id: d.category_id,
        image_url: d.image_url,
        images: d.images,
        featured: d.featured,
        active: d.active,
        has_sizes: d.has_sizes,
        colors: d.colors,
      };

      let productId = d.id;
      if (productId) {
        const { error } = await supabase.from("products").update(payload).eq("id", productId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        productId = data.id;
      }

      // Replace variants atomically (delete + insert).
      // A "useful" variant must encode at least a size OR a color, depending on the product mode.
      await supabase.from("product_variants").delete().eq("product_id", productId!);
      const usefulVariants = d.variants.filter((v) => {
        if (d.has_sizes && d.colors.length > 0) return v.size !== "" && v.color !== "";
        if (d.has_sizes) return v.size !== "";
        if (d.colors.length > 0) return v.color !== "";
        return false;
      });
      // Dedupe on the composite key (product_id, size, COALESCE(color,'')) — last write wins
      const dedupMap = new Map<string, { size: string; color: string; stock_quantity: number; position: number }>();
      usefulVariants.forEach((v, i) => {
        const size = v.size || "";
        const color = (v.color || "").trim();
        dedupMap.set(`${size}::${color}`, { size, color, stock_quantity: v.stock_quantity, position: i });
      });
      const rows = Array.from(dedupMap.values()).map((r) => ({
        product_id: productId!,
        size: r.size,
        color: r.color === "" ? null : r.color,
        stock_quantity: r.stock_quantity,
        position: r.position,
      }));
      if (rows.length > 0) {
        const { error: vErr } = await supabase.from("product_variants").insert(rows as any);
        if (vErr) throw vErr;
      }

      toast.success(d.id ? "Product updated" : "Product created");
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? "Could not save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-stretch md:items-center justify-center md:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="bg-background w-full md:max-w-3xl mx-auto md:rounded-3xl border border-border shadow-elevated overflow-hidden flex flex-col max-h-screen md:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              {d.id ? "Edit" : "New"}
            </p>
            <h2 className="font-display text-xl tracking-[0.04em] mt-0.5">
              {d.id ? d.name || "Product" : "Create product"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-6 space-y-7 min-w-0">
          {/* Images */}
          <section className="min-w-0">
            <Label>Images</Label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                uploadFiles(e.dataTransfer.files);
              }}
              className="mt-2 flex gap-3 overflow-x-auto scroll-smooth scrollbar-hide carousel-x snap-x"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {d.images.map((url) => (
                <div
                  key={url}
                  className="relative w-32 sm:w-36 aspect-[3/4] rounded-xl overflow-hidden bg-muted border border-border shrink-0 snap-start"
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {/* Delete — top-left */}
                  <button
                    onClick={() => removeImage(url)}
                    className="absolute top-1.5 left-1.5 w-7 h-7 inline-flex items-center justify-center rounded-full bg-black/70 text-white hover:bg-black transition shadow-md"
                    aria-label="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {/* Edit / set cover — top-right */}
                  <button
                    onClick={() => setF("image_url", url)}
                    className={`absolute top-1.5 right-1.5 w-7 h-7 inline-flex items-center justify-center rounded-full transition shadow-md ${
                      d.image_url === url
                        ? "bg-foreground text-background"
                        : "bg-black/70 text-white hover:bg-black"
                    }`}
                    aria-label={d.image_url === url ? "Cover image" : "Set as cover"}
                    title={d.image_url === url ? "Cover" : "Set as cover"}
                  >
                    <Star className={`w-3.5 h-3.5 ${d.image_url === url ? "fill-current" : ""}`} />
                  </button>
                  {d.image_url === url && (
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] uppercase tracking-[0.18em] px-2 py-0.5 rounded-full bg-foreground text-background">
                      Cover
                    </span>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-32 sm:w-36 aspect-[3/4] rounded-xl border-2 border-dashed border-border hover:border-foreground/60 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground transition group shrink-0 snap-start"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5 group-hover:scale-110 transition" />
                )}
                <span className="text-[10px] uppercase tracking-[0.2em]">
                  {uploading ? "Uploading" : "Add photos"}
                </span>
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*"
              hidden
              onChange={(e) => {
                uploadFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <p className="mt-2 text-[11px] text-muted-foreground">
              Swipe to browse. Tap the star to set the cover image.
            </p>
          </section>

          {/* Basics */}
          <section className="grid sm:grid-cols-2 gap-4">
            <Field label="Name">
              <input
                value={d.name}
                onChange={(e) => setF("name", e.target.value)}
                className={inputCls}
                placeholder="Silk Slip Dress"
              />
            </Field>
            <Field label="Price (DH)">
              <input
                value={d.price}
                onChange={(e) => setF("price", e.target.value)}
                inputMode="decimal"
                className={inputCls}
                placeholder="1290"
              />
            </Field>
            <Field label="Category">
              <select
                value={d.category_id ?? ""}
                onChange={(e) => {
                  const cat = categories.find((c) => c.id === e.target.value);
                  setD((p) => ({
                    ...p,
                    category_id: cat?.id ?? null,
                    category: cat?.name ?? p.category,
                  }));
                }}
                className={inputCls}
              >
                <option value="">— Select —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <input
                  value={d.category}
                  onChange={(e) => setF("category", e.target.value)}
                  className={`${inputCls} mt-2`}
                  placeholder="Or type a category name"
                />
              )}
            </Field>
            <Field label="Visibility">
              <div className="flex gap-2">
                <Toggle on={d.active} onChange={(v) => setF("active", v)} label="Live" />
                <Toggle on={d.featured} onChange={(v) => setF("featured", v)} label="Featured" />
              </div>
            </Field>
          </section>

          {/* Pricing & discount */}
          <section className="grid sm:grid-cols-2 gap-4">
            <Field label="Original price (DH) — optional">
              <input
                value={d.original_price}
                onChange={(e) => setF("original_price", e.target.value)}
                inputMode="decimal"
                className={inputCls}
                placeholder="e.g. 1990"
              />
            </Field>
            <Field label="Discount %">
              <input
                value={d.discount_percentage}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, "");
                  setF("discount_percentage", v === "" ? "" : String(Math.min(99, Math.max(0, Number(v)))));
                }}
                inputMode="numeric"
                className={inputCls}
                placeholder="e.g. 30"
              />
            </Field>
          </section>

          <Field label="Description">
            <textarea
              value={d.description}
              onChange={(e) => setF("description", e.target.value)}
              rows={4}
              className={inputCls}
              placeholder="Editorial description of the piece…"
            />
          </Field>

          {/* Colors */}
          <section>
            <div className="flex items-baseline justify-between">
              <Label>Available colors</Label>
              <span className="text-[11px] text-muted-foreground">{d.colors.length} added</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              {d.colors.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-full border border-border bg-muted/40"
                >
                  <span
                    className="w-5 h-5 rounded-full border border-border"
                    style={{ backgroundColor: c }}
                  />
                  <span className="text-xs">{c}</span>
                  <button
                    type="button"
                    onClick={() => removeColor(c)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Remove ${c}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <ColorAdder onAdd={addColor} />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Use a CSS color name (e.g. <em>black</em>, <em>beige</em>) or a hex value (e.g. <em>#c9a24a</em>).
            </p>

            {/* Color-only stock list (no sizes) */}
            {!d.has_sizes && d.colors.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {d.colors.map((c) => (
                  <div
                    key={`stock-${c}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border"
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-border shrink-0"
                      style={{ backgroundColor: c }}
                    />
                    <span className="text-xs flex-1 truncate">{c}</span>
                    <input
                      type="number"
                      min={0}
                      value={stockMap.get(vKey("", c)) ?? 0}
                      onChange={(e) => setVariantStock("", c, parseInt(e.target.value) || 0)}
                      className="w-16 bg-transparent text-sm outline-none border-b border-transparent focus:border-foreground/40 transition text-right"
                    />
                    <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      stock
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Sizes */}
          <section>
            <div className="flex items-baseline justify-between">
              <Label>Size system</Label>
              <Toggle on={d.has_sizes} onChange={(v) => setF("has_sizes", v)} label={d.has_sizes ? "Enabled" : "Disabled"} />
            </div>
            {d.has_sizes && (
              <>
                <div className="flex items-baseline justify-between mt-5">
                  <Label>Available sizes (EU)</Label>
                  <span className="text-[11px] text-muted-foreground">
                    {activeSizes.length} selected
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SIZE_OPTIONS.map((s) => {
                    const active = activeSizes.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSize(s)}
                        className={`min-w-[48px] h-11 px-3 rounded-full text-sm font-semibold border transition ${
                          active
                            ? "bg-foreground text-background border-foreground"
                            : "border-border text-muted-foreground hover:border-foreground/60 hover:text-foreground"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>

                {/* Inventory: matrix when colors+sizes, simple list when only sizes */}
                {activeSizes.length > 0 && d.colors.length === 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {activeSizes
                      .slice()
                      .sort((a, b) => Number(a) - Number(b))
                      .map((s) => (
                        <div
                          key={s}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border"
                        >
                          <GripVertical className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm font-semibold w-8">{s}</span>
                          <input
                            type="number"
                            min={0}
                            value={stockMap.get(vKey(s, "")) ?? 0}
                            onChange={(e) => setVariantStock(s, "", parseInt(e.target.value) || 0)}
                            className="flex-1 bg-transparent text-sm outline-none border-b border-transparent focus:border-foreground/40 transition"
                          />
                          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            stock
                          </span>
                        </div>
                      ))}
                  </div>
                )}

                {activeSizes.length > 0 && d.colors.length > 0 && (
                  <div className="mt-5">
                    <Label>Inventory matrix (color × size)</Label>
                    <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-muted/20">
                      <table className="w-full text-xs min-w-[420px]">
                        <thead>
                          <tr className="border-b border-border/60">
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground uppercase tracking-[0.18em]">
                              Color
                            </th>
                            {activeSizes
                              .slice()
                              .sort((a, b) => Number(a) - Number(b))
                              .map((s) => (
                                <th
                                  key={s}
                                  className="px-2 py-2 font-medium text-muted-foreground text-center w-14"
                                >
                                  {s}
                                </th>
                              ))}
                          </tr>
                        </thead>
                        <tbody>
                          {d.colors.map((c) => (
                            <tr key={c} className="border-b border-border/40 last:border-0">
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-border shrink-0"
                                    style={{ backgroundColor: c }}
                                  />
                                  <span className="text-xs truncate max-w-[100px]">{c}</span>
                                </div>
                              </td>
                              {activeSizes
                                .slice()
                                .sort((a, b) => Number(a) - Number(b))
                                .map((s) => (
                                  <td key={s} className="px-1.5 py-1.5 text-center">
                                    <input
                                      type="number"
                                      min={0}
                                      value={stockMap.get(vKey(s, c)) ?? 0}
                                      onChange={(e) =>
                                        setVariantStock(s, c, parseInt(e.target.value) || 0)
                                      }
                                      className="w-12 bg-background border border-border rounded-md px-1.5 py-1 text-xs text-center outline-none focus:border-foreground/50 transition"
                                    />
                                  </td>
                                ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Set the exact stock for each color × size combination.
                    </p>
                  </div>
                )}
              </>
            )}
            {!d.has_sizes && (
              <p className="mt-3 text-sm text-muted-foreground italic">
                This product does not use sizes (e.g. bags, accessories).
              </p>
            )}
          </section>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground transition"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-foreground text-background text-xs uppercase tracking-[0.22em] font-semibold disabled:opacity-50"
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {d.id ? "Save changes" : "Create product"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ───────────────────────── Helpers ───────────────────────── */

const inputCls =
  "w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-foreground/50 transition";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">{children}</p>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`flex-1 px-4 py-2.5 rounded-xl border text-xs uppercase tracking-[0.2em] transition ${
        on
          ? "bg-foreground text-background border-foreground"
          : "border-border text-muted-foreground hover:border-foreground/40"
      }`}
    >
      {label}
    </button>
  );
}

function ConfirmDialog({
  title,
  message,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-background rounded-2xl border border-border w-full max-w-sm p-6 shadow-elevated"
      >
        <h3 className="font-display text-xl">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-6 flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-full text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-full bg-destructive text-destructive-foreground text-xs uppercase tracking-[0.22em] font-semibold"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ColorAdder({ onAdd }: { onAdd: (c: string) => void }) {
  const [val, setVal] = useState("");
  const submit = () => {
    const v = val.trim();
    if (!v) return;
    onAdd(v);
    setVal("");
  };
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-1">
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="add color"
        className="bg-transparent text-xs outline-none w-24 placeholder:text-muted-foreground"
      />
      <button
        type="button"
        onClick={submit}
        className="text-muted-foreground hover:text-foreground"
        aria-label="Add color"
      >
        <Plus className="w-3 h-3" />
      </button>
    </span>
  );
}
