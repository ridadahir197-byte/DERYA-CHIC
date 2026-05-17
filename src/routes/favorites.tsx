import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { fetchProducts } from "@/lib/products";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { useCart } from "@/store/cart";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [{ title: "Favorites — DERYA Chic" }],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const favorites = useCart((s) => s.favorites);
  const { data, isLoading } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const list = (data ?? []).filter((p) => favorites.includes(p.id));

  return (
    <div className="px-5 lg:px-10 pt-6 lg:pt-12">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Saved</p>
        <h1 className="font-display text-3xl lg:text-5xl font-semibold mt-2">Wishlist</h1>
      </div>

      {isLoading ? (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="mt-24 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-secondary border border-border flex items-center justify-center mb-5">
            <Heart className="w-7 h-7" strokeWidth={1.5} />
          </div>
          <h3 className="font-display text-2xl">A blank canvas</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">
            Tap the heart on a piece to start building your private collection.
          </p>
          <Link
            to="/shop"
            className="mt-6 bg-foreground text-background rounded-[14px] py-3 px-6 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Browse collection
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-5 pb-8">
          {list.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </div>
  );
}
