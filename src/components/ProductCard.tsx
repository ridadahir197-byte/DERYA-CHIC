import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useCart } from "@/store/cart";
import type { Product } from "@/lib/products";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { favorites, toggleFav } = useCart();
  const isFav = favorites.includes(product.id);

  const discount = (product as any).discount_percentage as number | null;
  const original = (product as any).original_price as number | null;
  const hasDiscount = !!discount && discount > 0;
  const finalPrice = Number(product.price);
  const originalPrice =
    original && original > finalPrice
      ? Number(original)
      : hasDiscount
      ? Math.round((finalPrice / (1 - discount! / 100)) * 100) / 100
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="group"
    >
      <Link to="/product/$id" params={{ id: product.id }} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-muted">
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
          />
          {hasDiscount && (
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-foreground text-background text-[10px] font-semibold tracking-[0.18em] uppercase">
              −{discount}%
            </span>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleFav(product.id);
            }}
            className="absolute top-3 right-3 w-9 h-9 rounded-full glass-strong flex items-center justify-center transition-all hover:scale-110"
            aria-label="Favorite"
          >
            <motion.span
              key={String(isFav)}
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
              className="inline-flex"
            >
              <Heart
                className={`w-[15px] h-[15px] transition-colors ${
                  isFav ? "fill-neon text-neon" : "text-foreground"
                }`}
                strokeWidth={1.8}
              />
            </motion.span>
          </button>
        </div>
        <div className="mt-3 px-1 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-[13px] font-medium tracking-tight truncate">{product.name}</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.18em] mt-1">
              {product.category}
            </p>
          </div>
          <div className="flex flex-col items-end leading-tight whitespace-nowrap">
            <span className="text-[13px] font-semibold">
              {finalPrice.toFixed(0)}
              <span className="text-[10px] font-medium text-muted-foreground ml-1 tracking-wider">DH</span>
            </span>
            {originalPrice && (
              <span className="text-[10px] text-muted-foreground line-through mt-0.5">
                {originalPrice.toFixed(0)} DH
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] rounded-[20px] bg-muted" />
      <div className="mt-3 h-3 w-2/3 bg-muted rounded" />
      <div className="mt-2 h-3 w-1/3 bg-muted rounded" />
    </div>
  );
}
