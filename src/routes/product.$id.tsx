import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Heart, ShoppingBag, Check } from "lucide-react";
import { fetchProduct, fetchVariants } from "@/lib/products";
import { useCart } from "@/store/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="px-5 pt-10 text-center">
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <button
          className="mt-4 bg-neon text-neon-foreground rounded-[14px] px-5 py-3 text-sm font-bold"
          onClick={() => { router.invalidate(); reset(); }}
        >
          Retry
        </button>
      </div>
    );
  },
  notFoundComponent: () => <div className="px-5 pt-10">Not found</div>,
});

// Minimal named color → hex map for swatches; unknown values fall back to the string itself
const COLOR_HEX: Record<string, string> = {
  black: "#0a0a0a",
  white: "#fafafa",
  ivory: "#f5f1ea",
  cream: "#efe7d7",
  beige: "#d9c7a7",
  sand: "#c9b89a",
  camel: "#b08866",
  brown: "#6b4a2b",
  chocolate: "#3b2516",
  grey: "#9aa0a6",
  gray: "#9aa0a6",
  charcoal: "#2b2b2b",
  navy: "#15233f",
  blue: "#2a4d8f",
  denim: "#3c5a83",
  red: "#a3252b",
  burgundy: "#5b1c24",
  pink: "#e8b8c0",
  rose: "#c98a93",
  green: "#3f6b48",
  olive: "#5d6233",
  khaki: "#8a8147",
  gold: "#c9a24a",
  silver: "#c0c4c9",
};

function swatchColor(c: string): string {
  const key = c.trim().toLowerCase();
  if (COLOR_HEX[key]) return COLOR_HEX[key];
  return c;
}

function ProductPage() {
  const { id } = Route.useParams();
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
  });
  const { data: variants } = useQuery({
    queryKey: ["variants", id],
    queryFn: () => fetchVariants(id),
  });
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { add, favorites, toggleFav } = useCart();

  const hasSizes = product ? (product as any).has_sizes !== false : true;
  const colors: string[] = useMemo(
    () => (product ? (((product as any).colors as string[]) ?? []) : []),
    [product]
  );
  const discount = product ? ((product as any).discount_percentage as number | null) : null;
  const original = product ? ((product as any).original_price as number | null) : null;
  const finalPrice = product ? Number(product.price) : 0;
  const hasDiscount = !!discount && discount > 0;
  const originalPrice =
    original && original > finalPrice
      ? Number(original)
      : hasDiscount
      ? Math.round((finalPrice / (1 - discount! / 100)) * 100) / 100
      : null;

  // Build gallery: prefer images[], fall back to image_url. Dedup + filter empties.
  const galleryImages: string[] = useMemo(() => {
    if (!product) return [];
    const arr = (((product as any).images as string[] | undefined) ?? []).filter(Boolean);
    const base = arr.length > 0 ? arr : [product.image_url].filter(Boolean);
    return Array.from(new Set(base));
  }, [product]);

  // Color → image index mapping (admin upload order = color order)
  const colorImageIndex = (c: string) => {
    const idx = colors.indexOf(c);
    if (idx < 0) return 0;
    return Math.min(idx, Math.max(galleryImages.length - 1, 0));
  };

  const scrollToImage = (idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const child = el.children[idx] as HTMLElement | undefined;
    if (child) el.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
  };

  // Track active dot on scroll
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = el.clientWidth;
        if (w > 0) setActiveImage(Math.round(el.scrollLeft / w));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [galleryImages.length]);

  // When color changes, snap carousel to its image
  useEffect(() => {
    if (!color) return;
    const idx = colorImageIndex(color);
    scrollToImage(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color]);

  // Stock lookup: (color, size) -> stock_quantity — must be declared before any early return
  const stockMap = useMemo(() => {
    const m = new Map<string, number>();
    (variants ?? []).forEach((v: any) => {
      const key = `${v.color ?? ""}::${v.size ?? ""}`;
      m.set(key, v.stock_quantity ?? 0);
    });
    return m;
  }, [variants]);

  // Active stock for the current selection — depends only on primitives + stockMap
  const activeStock = useMemo(() => {
    const lookup = (c: string | null, s: string | null) =>
      stockMap.get(`${c ?? ""}::${s ?? ""}`) ?? 0;
    if (hasSizes && colors.length > 0) {
      if (!size || !color) return null;
      return lookup(color, size);
    }
    if (hasSizes) {
      if (!size) return null;
      return lookup("", size);
    }
    if (colors.length > 0) {
      if (!color) return null;
      return lookup(color, "");
    }
    return null;
  }, [hasSizes, colors.length, size, color, stockMap]);

  if (isLoading || !product) {
    return (
      <div className="px-5 pt-6 space-y-4">
        <div className="aspect-[4/5] rounded-[28px] bg-muted/40 animate-pulse" />
        <div className="h-6 w-2/3 rounded-md bg-muted/40 animate-pulse" />
        <div className="h-4 w-1/3 rounded-md bg-muted/40 animate-pulse" />
        <div className="h-24 w-full rounded-md bg-muted/30 animate-pulse" />
      </div>
    );
  }

  const isFav = favorites.includes(product.id);

  const stockFor = (c: string | null, s: string | null) =>
    stockMap.get(`${c ?? ""}::${s ?? ""}`) ?? 0;

  // Aggregated availability across the other axis
  const colorTotalStock = (c: string) => {
    if (!variants || variants.length === 0) return 0;
    return (variants as any[])
      .filter((v) => (v.color ?? "") === c)
      .reduce((n, v) => n + (v.stock_quantity ?? 0), 0);
  };

  const sizeTotalStock = (s: string) => {
    if (!variants) return 0;
    if (colors.length > 0 && color) {
      return stockFor(color, s);
    }
    return (variants as any[])
      .filter((v) => v.size === s)
      .reduce((n, v) => n + (v.stock_quantity ?? 0), 0);
  };

  const isOutOfStock = activeStock === 0;
  const selectionComplete =
    (!hasSizes || !!size) && (colors.length === 0 || !!color);

  const handleAdd = () => {
    if (hasSizes && (!variants || variants.length === 0)) {
      toast.error("No sizes available");
      return;
    }
    if (hasSizes && !size) {
      toast.error("Please select a size");
      return;
    }
    if (colors.length > 0 && !color) {
      toast.error("Please select a color");
      return;
    }
    if (activeStock !== null && activeStock <= 0) {
      toast.error("Out of stock");
      return;
    }
    add({
      id: product.id,
      name: product.name,
      price: finalPrice,
      image: product.image_url,
      size: hasSizes ? size! : "",
      color: color ?? undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div>
      {/* Image hero — horizontal swipe carousel */}
      <div className="relative">
        <div
          ref={scrollerRef}
          className="carousel-x scrollbar-hide flex w-full overflow-x-auto snap-x snap-mandatory"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {galleryImages.map((src, i) => (
            <div key={`${src}-${i}`} className="relative w-full shrink-0 snap-center aspect-[4/5]">
              <img
                src={src}
                alt={`${product.name} ${i + 1}`}
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover select-none"
              />
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-background" />

        {hasDiscount && (
          <span className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-foreground text-background text-[10px] font-semibold tracking-[0.22em] uppercase z-10">
            −{discount}% off
          </span>
        )}

        <Link
          to="/shop"
          className="absolute top-4 left-4 glass-strong rounded-full p-3 z-10"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <button
          onClick={() => toggleFav(product.id)}
          className="absolute top-4 right-4 glass-strong rounded-full p-3 z-10"
          style={{ marginRight: 56 }}
          aria-label="Favorite"
        >
          <Heart className={`w-4 h-4 ${isFav ? "fill-neon text-neon" : ""}`} />
        </button>
      </div>

      {/* Pagination dots */}
      {galleryImages.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {galleryImages.map((_, i) => {
            const active = i === activeImage;
            return (
              <button
                key={i}
                aria-label={`Go to image ${i + 1}`}
                onClick={() => scrollToImage(i)}
                className={`transition-all duration-300 rounded-full ${
                  active
                    ? "w-6 h-1.5 bg-foreground"
                    : "w-1.5 h-1.5 bg-foreground/25 hover:bg-foreground/50"
                }`}
              />
            );
          })}
        </div>
      )}

      {/* Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="px-5 -mt-6 relative z-10"
      >
        <p className="text-[10px] uppercase tracking-[0.3em] text-neon">{product.category}</p>
        <div className="flex items-start justify-between gap-4 mt-2">
          <h1 className="text-3xl font-bold leading-tight tracking-tight">{product.name}</h1>
          <div className="flex flex-col items-end whitespace-nowrap">
            <span className="text-2xl font-bold text-neon">
              {finalPrice.toFixed(0)}
              <span className="text-xs font-medium text-neon/70 ml-1.5 tracking-wider">DH</span>
            </span>
            {originalPrice && (
              <span className="text-sm text-muted-foreground line-through mt-0.5">
                {originalPrice.toFixed(0)} DH
              </span>
            )}
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          {product.description}
        </p>

        {/* Colors */}
        {colors.length > 0 && (
          <div className="mt-7">
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Color</p>
              <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {color ?? "Select"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {colors.map((c) => {
                const active = c === color;
                const total = colorTotalStock(c);
                const oos = total <= 0 && (variants?.length ?? 0) > 0;
                return (
                  <button
                    key={c}
                    onClick={() => !oos && setColor(c)}
                    disabled={oos}
                    title={oos ? `${c} — out of stock` : c}
                    aria-label={c}
                    className={`relative w-10 h-10 rounded-full border transition-all ${
                      active
                        ? "border-foreground ring-2 ring-foreground/20 ring-offset-2 ring-offset-background scale-105"
                        : oos
                        ? "border-border/40 opacity-40 cursor-not-allowed"
                        : "border-border hover:border-foreground/60"
                    }`}
                    style={{ backgroundColor: swatchColor(c) }}
                  >
                    {active && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white mix-blend-difference" />
                      </span>
                    )}
                    {oos && !active && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="block w-[120%] h-px bg-foreground/50 rotate-45" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sizes */}
        {hasSizes && (
          <div className="mt-7">
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">EU Size</p>
              <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {variants?.length ? `${variants.filter(v => v.stock_quantity > 0).length} available` : ""}
              </span>
            </div>
            {!variants ? (
              <div className="h-12 rounded-2xl bg-muted/40 animate-pulse" />
            ) : variants.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No sizes available yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {Array.from(new Set((variants ?? []).map((v: any) => v.size))).map((s) => {
                  const sizeStr = s as string;
                  const active = sizeStr === size;
                  const stock = sizeTotalStock(sizeStr);
                  const oos = stock <= 0;
                  return (
                    <motion.button
                      key={sizeStr}
                      whileTap={oos ? undefined : { scale: 0.92 }}
                      disabled={oos}
                      onClick={() => setSize(sizeStr)}
                      className={`min-w-[52px] h-12 px-3 rounded-full text-sm font-semibold border transition-all relative ${
                        active
                          ? "border-foreground bg-foreground text-background"
                          : oos
                          ? "border-border/50 text-muted-foreground/40 line-through cursor-not-allowed opacity-50"
                          : "border-border text-foreground hover:border-foreground/60"
                      }`}
                    >
                      {sizeStr}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Sticky CTA */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[92%] max-w-[420px] z-40">
        <motion.button
          whileTap={selectionComplete && !isOutOfStock ? { scale: 0.97 } : undefined}
          onClick={handleAdd}
          disabled={selectionComplete && isOutOfStock}
          className={`w-full rounded-[14px] py-4 px-6 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
            selectionComplete && isOutOfStock
              ? "bg-muted text-muted-foreground uppercase tracking-[0.32em] opacity-50 pointer-events-none"
              : added
              ? "bg-neon text-neon-foreground"
              : "bg-neon text-neon-foreground animate-pulse-glow"
          }`}
        >
          {selectionComplete && isOutOfStock ? (
            <>ÉPUISÉ · OUT OF STOCK</>
          ) : added ? (
            <>
              <Check className="w-4 h-4" /> Added to cart
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" /> Add to Cart · {finalPrice.toFixed(0)} DH
            </>
          )}
        </motion.button>
      </div>

      <div className="h-40" />
    </div>
  );
}
