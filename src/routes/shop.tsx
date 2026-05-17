import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { fetchProducts, fetchCategories } from "@/lib/products";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — DERYA Chic" },
      { name: "description", content: "Browse the full DERYA Chic collection." },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const { data, isLoading } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const chips = ["All", ...(categories ?? []).map((c) => c.name)];

  const filtered = useMemo(() => {
    let list = data ?? [];
    if (cat !== "All") list = list.filter((p) => p.category === cat);
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    return list;
  }, [data, cat, q]);

  return (
    <div className="px-5 lg:px-10 pt-6 lg:pt-12">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Collection</p>
          <h1 className="font-display text-3xl lg:text-5xl font-semibold mt-2">Shop</h1>
        </div>
        <p className="text-xs text-muted-foreground">{data?.length ?? 0} pieces</p>
      </div>

      <div className="mt-6 relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search DERYA Chic…"
          className="w-full bg-secondary border border-border rounded-full pl-11 pr-4 py-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors"
        />
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 lg:mx-0 lg:px-0">
        {chips.map((c) => {
          const active = c === cat;
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-5 py-2.5 rounded-full text-[11px] uppercase tracking-[0.2em] font-medium whitespace-nowrap transition-all border ${
                active
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      <div className="mt-7 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-5 pb-8">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
      </div>

      {!isLoading && filtered.length === 0 && (
        <div className="mt-20 text-center text-muted-foreground">
          <p className="text-sm">No pieces match your search.</p>
        </div>
      )}
    </div>
  );
}
