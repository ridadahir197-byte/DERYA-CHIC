import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchProducts, fetchCategories } from "@/lib/products";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DERYA Chic — Luxury Fashion" },
      { name: "description", content: "Wearable architecture. Discover the DERYA Chic collection." },
    ],
  }),
  component: HomePage,
});

type Banner = Tables<"banners">;
type SfyRow = Tables<"special_for_you"> & {
  product:
    | (Pick<Tables<"products">, "id" | "name" | "image_url" | "price" | "category"> & {
        original_price: number | null;
        discount_percentage: number | null;
      })
    | null;
};

async function fetchBanners(): Promise<Banner[]> {
  const { data } = await supabase
    .from("banners")
    .select("*")
    .eq("active", true)
    .order("position", { ascending: true });
  return data ?? [];
}
async function fetchSpecial(): Promise<SfyRow[]> {
  const { data } = await supabase
    .from("special_for_you")
    .select("*, product:products(id,name,image_url,price,category,original_price,discount_percentage)")
    .eq("active", true)
    .order("position", { ascending: true });
  return (data as any) ?? [];
}

function HomePage() {
  const { data: products, isLoading } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const { data: banners } = useQuery({ queryKey: ["banners-active"], queryFn: fetchBanners });
  const { data: special } = useQuery({ queryKey: ["special-active"], queryFn: fetchSpecial });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const [cat, setCat] = useState<string>("All");
  const list = products ?? [];
  const filtered = cat === "All" ? list : list.filter((p) => p.category === cat);
  const filterChips = ["All", ...(categories ?? []).map((c) => c.name)];

  const hero = banners?.[0];

  return (
    <div className="px-5 lg:px-10 pt-6 lg:pt-12">
      {/* ===== Hero — banner-driven, cinematic ===== */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[28px] border border-border bg-secondary"
      >
        {hero ? (
          <div className="relative aspect-[16/10] md:aspect-[21/9]">
            <picture>
              {hero.mobile_image_url && (
                <source media="(max-width: 768px)" srcSet={hero.mobile_image_url} />
              )}
              <img
                src={hero.image_url}
                alt={hero.title ?? "DERYA Chic"}
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
              />
            </picture>
            <div className="absolute inset-0 banner-overlay" />
            <div className="absolute inset-x-0 bottom-0 p-7 md:p-14 max-w-2xl text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
              {hero.subtitle && (
                <p className="text-[11px] uppercase tracking-[0.32em] text-white/85 mb-4">{hero.subtitle}</p>
              )}
              <h1 className="font-display text-4xl md:text-6xl leading-[1.02] font-semibold tracking-tight text-white">
                {hero.title}
              </h1>
              {hero.cta_text && (
                <Link
                  to={hero.link ?? "/shop"}
                  className="mt-7 inline-flex items-center gap-2 bg-white text-black rounded-[14px] py-3.5 px-6 text-sm font-medium hover:bg-white/90 transition"
                >
                  {hero.cta_text} <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-0 lg:gap-8 items-center">
            <div className="px-7 py-12 lg:px-14 lg:py-20">
              <p className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground mb-5">Drop 03 · AW</p>
              <h1 className="font-display text-[44px] lg:text-[72px] leading-[1] font-semibold tracking-tight">
                Wearable<br /><span className="italic font-normal">architecture.</span>
              </h1>
              <p className="text-sm lg:text-base text-muted-foreground mt-6 max-w-md leading-relaxed">
                A meditation on form, fabric and silence.
              </p>
              <Link
                to="/shop"
                className="mt-8 inline-flex items-center gap-2 bg-foreground text-background rounded-[14px] py-3.5 px-6 font-medium text-sm hover:opacity-90 transition"
              >
                Shop the drop <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="relative hidden lg:block aspect-[4/5] m-6 rounded-[20px] overflow-hidden bg-foreground">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,oklch(0.92_0.27_130_/_0.35),transparent_60%)]" />
            </div>
          </div>
        )}
      </motion.section>

      {/* ===== Recommended For You — cinematic snap carousel ===== */}
      {special && special.length > 0 && (
        <RecommendedCarousel items={special} />
      )}

      {/* ===== New arrivals ===== */}
      <section className="mt-16 lg:mt-24">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Collection</p>
            <h2 className="font-display text-2xl lg:text-4xl font-semibold mt-2">New arrivals</h2>
          </div>
          <Link to="/shop" className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
            See all
          </Link>
        </div>

        <div className="flex gap-2 overflow-x-auto carousel-x scrollbar-hide -mx-5 px-5 lg:mx-0 lg:px-0">
          {filterChips.map((c) => {
            const active = c === cat;
            return (
              <motion.button
                key={c}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCat(c)}
                className={`px-5 py-2.5 rounded-full text-[11px] uppercase tracking-[0.2em] font-medium whitespace-nowrap transition-all border ${
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
                }`}
              >
                {c}
              </motion.button>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-5 pb-8">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      <SocialConnect />
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 21l1.65-4.5A8.5 8.5 0 1 1 7.5 19.5L3 21z" />
      <path d="M8.5 9.5c.3 1.5 1.2 2.9 2.5 3.9 1.3 1 2.8 1.6 4.3 1.7.4 0 .8-.2 1-.5l.6-.9c.2-.3.1-.7-.2-.9l-1.5-1c-.3-.2-.7-.2-1 0l-.5.4a6 6 0 0 1-2.8-2.8l.4-.5c.2-.3.2-.7 0-1l-1-1.5c-.2-.3-.6-.4-.9-.2l-.9.6c-.3.2-.5.6-.5 1z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export const SOCIAL_LINKS = {
  whatsapp: "https://wa.me/212615624760",
  instagram: "https://www.instagram.com/derya_chic2?igsh=MWJjMHd5MjZ0bzh0Zw==",
};

function SocialConnect() {
  return (
    <section className="mt-20 lg:mt-28 pb-12">
      <div className="glass rounded-[24px] border border-border/60 px-6 py-10 md:py-12 flex flex-col items-center text-center">
        <p className="text-[10px] uppercase tracking-[0.42em] text-muted-foreground">
          Rejoignez-nous
        </p>
        <div className="mt-6 flex items-center justify-center gap-5">
          <a
            href={SOCIAL_LINKS.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="w-12 h-12 rounded-full border border-border/60 flex items-center justify-center text-foreground/80 hover:text-foreground hover:scale-105 transition-all duration-300"
          >
            <WhatsAppIcon className="w-5 h-5" />
          </a>
          <a
            href={SOCIAL_LINKS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="w-12 h-12 rounded-full border border-border/60 flex items-center justify-center text-foreground/80 hover:text-foreground hover:scale-105 transition-all duration-300"
          >
            <InstagramIcon className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  );
}

function RecommendedCarousel({ items }: { items: SfyRow[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-rec-card]");
    const w = card?.offsetWidth ?? el.clientWidth * 0.85;
    el.scrollBy({ left: (w + 20) * dir, behavior: "smooth" });
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const card = el.querySelector<HTMLElement>("[data-rec-card]");
        const step = (card?.offsetWidth ?? el.clientWidth * 0.85) + 20;
        const idx = Math.round(el.scrollLeft / step);
        setActive(Math.max(0, Math.min(items.length - 1, idx)));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [items.length]);

  const scrollToIdx = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-rec-card]");
    const step = (card?.offsetWidth ?? el.clientWidth * 0.85) + 20;
    el.scrollTo({ left: step * i, behavior: "smooth" });
  };

  return (
    <section className="mt-16 lg:mt-24">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Editorial</p>
          <h2 className="font-display text-2xl lg:text-4xl font-semibold mt-2">Recommended for you</h2>
        </div>
        <div className="hidden md:flex gap-2">
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Previous"
            className="w-11 h-11 rounded-full border border-border hover:bg-foreground hover:text-background transition flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            aria-label="Next"
            className="w-11 h-11 rounded-full border border-border hover:bg-foreground hover:text-background transition flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={ref}
        className="flex gap-4 lg:gap-5 overflow-x-auto carousel-x scrollbar-hide snap-x snap-proximity -mx-5 px-5 lg:mx-0 lg:px-0 pb-2"
        style={{ scrollPaddingLeft: "1.25rem" }}
      >
        {items.map((it, i) => {
          const p = it.product;
          if (!p) return null;
          const finalPrice = Number(p.price);
          const discount = p.discount_percentage ?? 0;
          const hasDiscount = discount > 0;
          const originalPrice =
            p.original_price && Number(p.original_price) > finalPrice
              ? Number(p.original_price)
              : hasDiscount
              ? Math.round((finalPrice / (1 - discount / 100)) * 100) / 100
              : null;
          return (
            <motion.div
              key={it.id}
              data-rec-card
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.6, delay: Math.min(i * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
              className="snap-start shrink-0 w-[88%] sm:w-[70%] md:w-[62%] lg:w-[56%]"
            >
              <Link
                to="/product/$id"
                params={{ id: p.id }}
                className="group relative block aspect-[16/10] md:aspect-[21/10] overflow-hidden rounded-[22px] border border-border bg-muted"
              >
                <img
                  src={p.image_url}
                  alt={p.name}
                  loading={i < 2 ? "eager" : "lazy"}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 banner-overlay" />
                {hasDiscount && (
                  <span className="absolute top-4 left-4 md:top-5 md:left-5 px-3 py-1.5 rounded-full bg-white text-black text-[10px] font-semibold tracking-[0.18em] uppercase shadow-sm">
                    −{discount}% Off
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 text-white max-w-xl">
                  <p className="text-[10px] uppercase tracking-[0.32em] text-white/80">{p.category}</p>
                  <p className="font-display text-2xl md:text-4xl mt-2 leading-tight text-white">{p.name}</p>
                  <div className="mt-5 flex items-center gap-4 flex-wrap">
                    <span className="flex items-baseline gap-2">
                      <span className="text-sm text-white/95 tracking-wide font-medium">
                        {finalPrice.toLocaleString()} <span className="text-[11px] text-white/70">DH</span>
                      </span>
                      {originalPrice && (
                        <span className="text-[11px] text-white/55 line-through">
                          {originalPrice.toLocaleString()} DH
                        </span>
                      )}
                    </span>
                    <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-white px-4 py-2 rounded-full border border-white/40 backdrop-blur-md bg-white/5 hover:bg-white hover:text-black transition-all duration-300">
                      Discover <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination dots */}
      {items.length > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          {items.map((_, i) => {
            const isActive = i === active;
            return (
              <button
                key={i}
                onClick={() => scrollToIdx(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="group h-2 flex items-center"
              >
                <span
                  className={`block h-[3px] rounded-full transition-all duration-500 ease-out ${
                    isActive
                      ? "w-7 bg-foreground"
                      : "w-2 bg-foreground/25 group-hover:bg-foreground/50"
                  }`}
                />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
